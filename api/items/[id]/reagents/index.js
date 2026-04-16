import { getPool } from '../../../_db.js'
import { cors } from '../../../_helpers.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const pool = getPool()
  const itemId = req.query.id
  const { id, name = '', qty = 1, price = 0 } = req.body

  try {
    const { rowCount } = await pool.query('SELECT 1 FROM items WHERE id = $1', [itemId])
    if (rowCount === 0) return res.status(404).json({ error: 'Item not found' })

    const { rows } = await pool.query(
      `INSERT INTO reagents (id, item_id, name, qty, price, sort_order)
       VALUES ($1, $2, $3, $4, $5, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM reagents WHERE item_id = $2))
       RETURNING id, name, qty, price`,
      [id, itemId, name, qty, price]
    )
    const r = rows[0]
    res.status(201).json({
      id: r.id, name: r.name,
      qty: parseFloat(r.qty), price: parseFloat(r.price),
    })
  } catch (err) {
    console.error('POST reagent error:', err.message)
    res.status(500).json({ error: 'Failed to add reagent' })
  }
}
