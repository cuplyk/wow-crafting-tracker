import { getPool } from '../_db.js'
import { cors } from '../_helpers.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })

  const { items } = req.body
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' })

  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM reagents')
    await client.query('DELETE FROM items')

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      await client.query(
        'INSERT INTO items (id, name, sell, sort_order) VALUES ($1, $2, $3, $4)',
        [item.id, item.name, item.sell, i]
      )
      for (let j = 0; j < (item.reagents || []).length; j++) {
        const r = item.reagents[j]
        await client.query(
          'INSERT INTO reagents (id, item_id, name, qty, price, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
          [r.id, item.id, r.name, r.qty, r.price, j]
        )
      }
    }

    await client.query('COMMIT')
    res.json({ success: true, count: items.length })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('PUT /api/items/bulk error:', err.message)
    res.status(500).json({ error: 'Failed to sync items' })
  } finally {
    client.release()
  }
}
