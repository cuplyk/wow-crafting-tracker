import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// ---------------------------------------------------------------------------
// GET /api/sales — all sales with item names, ordered newest first
// ---------------------------------------------------------------------------

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.item_id, s.qty, s.unit_price, s.notes, s.sold_at,
             i.name AS item_name, i.sell AS item_sell
      FROM sales s
      JOIN items i ON i.id = s.item_id
      ORDER BY s.sold_at DESC
      LIMIT 500
    `)
    res.json(rows.map(r => ({
      id: r.id, itemId: r.item_id, itemName: r.item_name,
      qty: r.qty, unitPrice: parseFloat(r.unit_price),
      itemSell: parseFloat(r.item_sell),
      notes: r.notes, soldAt: r.sold_at,
    })))
  } catch (err) {
    console.error('GET /api/sales error:', err.message)
    res.status(500).json({ error: 'Failed to fetch sales' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/sales/analytics — aggregated ranking + trend data
// ---------------------------------------------------------------------------

router.get('/analytics', async (req, res) => {
  try {
    // Overall rankings by item
    const { rows: rankings } = await pool.query(`
      SELECT
        s.item_id,
        i.name        AS item_name,
        i.sell        AS item_sell,
        COUNT(*)::int AS sale_count,
        SUM(s.qty)::int AS total_qty,
        SUM(s.qty * s.unit_price)  AS total_revenue,
        AVG(s.unit_price)          AS avg_price,
        MIN(s.sold_at)             AS first_sale,
        MAX(s.sold_at)             AS last_sale
      FROM sales s
      JOIN items i ON i.id = s.item_id
      GROUP BY s.item_id, i.name, i.sell
      ORDER BY total_revenue DESC
    `)

    // Recent 30-day vs prior 30-day for trend calculation
    const { rows: trends } = await pool.query(`
      WITH periods AS (
        SELECT
          s.item_id,
          SUM(CASE WHEN s.sold_at >= NOW() - INTERVAL '30 days' THEN s.qty ELSE 0 END)::int AS recent_qty,
          SUM(CASE WHEN s.sold_at >= NOW() - INTERVAL '60 days'
                    AND s.sold_at < NOW() - INTERVAL '30 days' THEN s.qty ELSE 0 END)::int AS prior_qty,
          SUM(CASE WHEN s.sold_at >= NOW() - INTERVAL '30 days' THEN s.qty * s.unit_price ELSE 0 END) AS recent_revenue,
          SUM(CASE WHEN s.sold_at >= NOW() - INTERVAL '60 days'
                    AND s.sold_at < NOW() - INTERVAL '30 days' THEN s.qty * s.unit_price ELSE 0 END) AS prior_revenue
        FROM sales s
        GROUP BY s.item_id
      )
      SELECT * FROM periods
    `)

    // Mat costs for profit calculation
    const { rows: matCosts } = await pool.query(`
      SELECT item_id, SUM(qty * price) AS mat_cost
      FROM reagents
      GROUP BY item_id
    `)

    // Daily sales volume for sparkline (last 30 days)
    const { rows: dailyVolume } = await pool.query(`
      SELECT
        DATE(sold_at) AS day,
        SUM(qty)::int AS qty,
        SUM(qty * unit_price) AS revenue
      FROM sales
      WHERE sold_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(sold_at)
      ORDER BY day
    `)

    // Top-level summary
    const { rows: [summary] } = await pool.query(`
      SELECT
        COUNT(*)::int           AS total_sales,
        COALESCE(SUM(qty), 0)::int AS total_units,
        COALESCE(SUM(qty * unit_price), 0) AS total_revenue,
        COUNT(DISTINCT item_id)::int AS unique_items
      FROM sales
    `)

    const trendMap = {}
    for (const t of trends) {
      trendMap[t.item_id] = {
        recentQty: t.recent_qty,
        priorQty: t.prior_qty,
        recentRevenue: parseFloat(t.recent_revenue) || 0,
        priorRevenue: parseFloat(t.prior_revenue) || 0,
      }
    }

    const matCostMap = {}
    for (const m of matCosts) {
      matCostMap[m.item_id] = parseFloat(m.mat_cost) || 0
    }

    const rankedItems = rankings.map((r, i) => {
      const trend = trendMap[r.item_id] || { recentQty: 0, priorQty: 0, recentRevenue: 0, priorRevenue: 0 }
      const matCost = matCostMap[r.item_id] || 0
      const totalRevenue = parseFloat(r.total_revenue) || 0
      const totalProfit = totalRevenue - (matCost * r.total_qty)
      const profitMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0

      // Trend: % change in quantity
      let trendPct = 0
      if (trend.priorQty > 0) {
        trendPct = ((trend.recentQty - trend.priorQty) / trend.priorQty) * 100
      } else if (trend.recentQty > 0) {
        trendPct = 100
      }

      return {
        rank: i + 1,
        itemId: r.item_id,
        itemName: r.item_name,
        itemSell: parseFloat(r.item_sell),
        saleCount: r.sale_count,
        totalQty: r.total_qty,
        totalRevenue,
        avgPrice: parseFloat(r.avg_price) || 0,
        matCost,
        totalProfit,
        profitMargin,
        trendPct,
        recentQty: trend.recentQty,
        priorQty: trend.priorQty,
        firstSale: r.first_sale,
        lastSale: r.last_sale,
      }
    })

    res.json({
      summary: {
        totalSales: summary.total_sales,
        totalUnits: summary.total_units,
        totalRevenue: parseFloat(summary.total_revenue) || 0,
        uniqueItems: summary.unique_items,
      },
      rankings: rankedItems,
      dailyVolume: dailyVolume.map(d => ({
        day: d.day,
        qty: d.qty,
        revenue: parseFloat(d.revenue) || 0,
      })),
    })
  } catch (err) {
    console.error('GET /api/sales/analytics error:', err.message)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/sales — record a sale
// ---------------------------------------------------------------------------

router.post('/', async (req, res) => {
  const { id, itemId, qty, unitPrice, notes = '', soldAt } = req.body

  if (!itemId) return res.status(400).json({ error: 'itemId is required' })
  if (!qty || qty < 1) return res.status(400).json({ error: 'qty must be at least 1' })
  if (unitPrice === undefined || unitPrice < 0) return res.status(400).json({ error: 'unitPrice must be non-negative' })

  try {
    const { rowCount } = await pool.query('SELECT 1 FROM items WHERE id = $1', [itemId])
    if (rowCount === 0) return res.status(404).json({ error: 'Item not found' })

    const { rows } = await pool.query(
      `INSERT INTO sales (id, item_id, qty, unit_price, notes, sold_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, item_id, qty, unit_price, notes, sold_at`,
      [id, itemId, qty, unitPrice, notes, soldAt || new Date().toISOString()]
    )
    const s = rows[0]
    res.status(201).json({
      id: s.id, itemId: s.item_id, qty: s.qty,
      unitPrice: parseFloat(s.unit_price), notes: s.notes, soldAt: s.sold_at,
    })
  } catch (err) {
    console.error('POST /api/sales error:', err.message)
    res.status(500).json({ error: 'Failed to record sale' })
  }
})

// ---------------------------------------------------------------------------
// DELETE /api/sales/:id — remove a sale record
// ---------------------------------------------------------------------------

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM sales WHERE id = $1', [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'Sale not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/sales/:id error:', err.message)
    res.status(500).json({ error: 'Failed to delete sale' })
  }
})

export default router
