import { getPool } from '../_db.js'
import { cors, validateItem } from '../_helpers.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  const pool = getPool()

  if (req.method === 'GET') {
    try {
      const { rows: items } = await pool.query(
        'SELECT id, name, sell FROM items ORDER BY sort_order, created_at'
      )
      const { rows: reagents } = await pool.query(
        'SELECT id, item_id, name, qty, price FROM reagents ORDER BY sort_order, created_at'
      )

      const reagentMap = {}
      for (const r of reagents) {
        if (!reagentMap[r.item_id]) reagentMap[r.item_id] = []
        reagentMap[r.item_id].push({
          id: r.id,
          name: r.name,
          qty: parseFloat(r.qty),
          price: parseFloat(r.price),
        })
      }

      return res.json(items.map(item => ({
        id: item.id,
        name: item.name,
        sell: parseFloat(item.sell),
        reagents: reagentMap[item.id] || [],
      })))
    } catch (err) {
      console.error('GET /api/items error:', err.message)
      return res.status(500).json({ error: 'Failed to fetch items' })
    }
  }

  if (req.method === 'POST') {
    const errors = validateItem(req.body)
    if (errors.length) return res.status(400).json({ error: errors.join('; ') })

    const { id, name, sell = 0 } = req.body
    try {
      const { rows } = await pool.query(
        `INSERT INTO items (id, name, sell, sort_order)
         VALUES ($1, $2, $3, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM items))
         RETURNING id, name, sell`,
        [id, name.trim(), sell]
      )
      const item = rows[0]
      return res.status(201).json({ ...item, sell: parseFloat(item.sell), reagents: [] })
    } catch (err) {
      console.error('POST /api/items error:', err.message)
      return res.status(500).json({ error: 'Failed to create item' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
