import { getPool } from '../_db.js'
import { cors } from '../_helpers.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  const pool = getPool()

  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query(`
        SELECT s.id, s.item_id, s.qty, s.unit_price, s.notes, s.sold_at,
               i.name AS item_name, i.sell AS item_sell
        FROM sales s
        JOIN items i ON i.id = s.item_id
        ORDER BY s.sold_at DESC
        LIMIT 500
      `)
      return res.json(rows.map(r => ({
        id: r.id, itemId: r.item_id, itemName: r.item_name,
        qty: r.qty, unitPrice: parseFloat(r.unit_price),
        itemSell: parseFloat(r.item_sell),
        notes: r.notes, soldAt: r.sold_at,
      })))
    } catch (err) {
      console.error('GET /api/sales error:', err.message)
      return res.status(500).json({ error: 'Failed to fetch sales' })
    }
  }

  if (req.method === 'POST') {
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
      return res.status(201).json({
        id: s.id, itemId: s.item_id, qty: s.qty,
        unitPrice: parseFloat(s.unit_price), notes: s.notes, soldAt: s.sold_at,
      })
    } catch (err) {
      console.error('POST /api/sales error:', err.message)
      return res.status(500).json({ error: 'Failed to record sale' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
