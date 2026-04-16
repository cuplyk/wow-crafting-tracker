import { getPool } from '../_db.js'
import { cors } from '../_helpers.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const pool = getPool()
  try {
    const { rows: rankings } = await pool.query(`
      SELECT
        s.item_id, i.name AS item_name, i.sell AS item_sell,
        COUNT(*)::int AS sale_count,
        SUM(s.qty)::int AS total_qty,
        SUM(s.qty * s.unit_price)  AS total_revenue,
        AVG(s.unit_price)          AS avg_price,
        MIN(s.sold_at)             AS first_sale,
        MAX(s.sold_at)             AS last_sale
      FROM sales s JOIN items i ON i.id = s.item_id
      GROUP BY s.item_id, i.name, i.sell
      ORDER BY total_revenue DESC
    `)

    const { rows: trends } = await pool.query(`
      SELECT item_id,
        SUM(CASE WHEN sold_at >= NOW() - INTERVAL '30 days' THEN qty ELSE 0 END)::int AS recent_qty,
        SUM(CASE WHEN sold_at >= NOW() - INTERVAL '60 days'
                  AND sold_at < NOW() - INTERVAL '30 days' THEN qty ELSE 0 END)::int AS prior_qty,
        SUM(CASE WHEN sold_at >= NOW() - INTERVAL '30 days' THEN qty * unit_price ELSE 0 END) AS recent_revenue,
        SUM(CASE WHEN sold_at >= NOW() - INTERVAL '60 days'
                  AND sold_at < NOW() - INTERVAL '30 days' THEN qty * unit_price ELSE 0 END) AS prior_revenue
      FROM sales GROUP BY item_id
    `)

    const { rows: matCosts } = await pool.query(
      'SELECT item_id, SUM(qty * price) AS mat_cost FROM reagents GROUP BY item_id'
    )

    const { rows: dailyVolume } = await pool.query(`
      SELECT DATE(sold_at) AS day, SUM(qty)::int AS qty, SUM(qty * unit_price) AS revenue
      FROM sales WHERE sold_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(sold_at) ORDER BY day
    `)

    const { rows: [summary] } = await pool.query(`
      SELECT COUNT(*)::int AS total_sales, COALESCE(SUM(qty),0)::int AS total_units,
             COALESCE(SUM(qty * unit_price),0) AS total_revenue,
             COUNT(DISTINCT item_id)::int AS unique_items
      FROM sales
    `)

    const trendMap = {}
    for (const t of trends) {
      trendMap[t.item_id] = {
        recentQty: t.recent_qty, priorQty: t.prior_qty,
        recentRevenue: parseFloat(t.recent_revenue) || 0,
        priorRevenue: parseFloat(t.prior_revenue) || 0,
      }
    }
    const matCostMap = {}
    for (const m of matCosts) matCostMap[m.item_id] = parseFloat(m.mat_cost) || 0

    const rankedItems = rankings.map((r, i) => {
      const trend = trendMap[r.item_id] || { recentQty: 0, priorQty: 0, recentRevenue: 0, priorRevenue: 0 }
      const matCost = matCostMap[r.item_id] || 0
      const totalRevenue = parseFloat(r.total_revenue) || 0
      const totalProfit = totalRevenue - (matCost * r.total_qty)
      const profitMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0
      let trendPct = 0
      if (trend.priorQty > 0) trendPct = ((trend.recentQty - trend.priorQty) / trend.priorQty) * 100
      else if (trend.recentQty > 0) trendPct = 100

      return {
        rank: i + 1, itemId: r.item_id, itemName: r.item_name,
        itemSell: parseFloat(r.item_sell), saleCount: r.sale_count,
        totalQty: r.total_qty, totalRevenue, avgPrice: parseFloat(r.avg_price) || 0,
        matCost, totalProfit, profitMargin, trendPct,
        recentQty: trend.recentQty, priorQty: trend.priorQty,
        firstSale: r.first_sale, lastSale: r.last_sale,
      }
    })

    res.json({
      summary: {
        totalSales: summary.total_sales, totalUnits: summary.total_units,
        totalRevenue: parseFloat(summary.total_revenue) || 0, uniqueItems: summary.unique_items,
      },
      rankings: rankedItems,
      dailyVolume: dailyVolume.map(d => ({ day: d.day, qty: d.qty, revenue: parseFloat(d.revenue) || 0 })),
    })
  } catch (err) {
    console.error('GET /api/sales/analytics error:', err.message)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
}
