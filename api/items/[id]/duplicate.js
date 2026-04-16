import { getPool } from '../../_db.js'
import { cors } from '../../_helpers.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const pool = getPool()
  const { id } = req.query
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { rows: [src] } = await client.query(
      'SELECT * FROM items WHERE id = $1', [id]
    )
    if (!src) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Item not found' })
    }

    const { newId } = req.body
    const { rows: [newItem] } = await client.query(
      `INSERT INTO items (id, name, sell, sort_order)
       VALUES ($1, $2, $3, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM items))
       RETURNING id, name, sell`,
      [newId, src.name + ' (copy)', src.sell]
    )

    const { rows: srcReagents } = await client.query(
      'SELECT * FROM reagents WHERE item_id = $1 ORDER BY sort_order', [id]
    )

    const reagentIds = [...(req.body.reagentIds || [])]
    const newReagents = []
    for (const r of srcReagents) {
      const reagentId = reagentIds.shift() || Math.random().toString(36).slice(2, 10)
      const { rows: [nr] } = await client.query(
        `INSERT INTO reagents (id, item_id, name, qty, price, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, qty, price`,
        [reagentId, newId, r.name, r.qty, r.price, r.sort_order]
      )
      newReagents.push({
        id: nr.id, name: nr.name,
        qty: parseFloat(nr.qty), price: parseFloat(nr.price),
      })
    }

    await client.query('COMMIT')
    res.status(201).json({
      id: newItem.id, name: newItem.name,
      sell: parseFloat(newItem.sell), reagents: newReagents,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('POST /api/items/:id/duplicate error:', err.message)
    res.status(500).json({ error: 'Failed to duplicate item' })
  } finally {
    client.release()
  }
}
