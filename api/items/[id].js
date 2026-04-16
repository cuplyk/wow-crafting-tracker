import { getPool } from '../_db.js'
import { cors } from '../_helpers.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  const pool = getPool()
  const { id } = req.query

  if (req.method === 'PUT') {
    const fields = req.body
    const sets = []
    const values = []
    let idx = 1

    if (fields.name !== undefined) {
      if (typeof fields.name !== 'string' || fields.name.trim().length === 0) {
        return res.status(400).json({ error: 'name must be a non-empty string' })
      }
      sets.push(`name = $${idx++}`)
      values.push(fields.name.trim())
    }
    if (fields.sell !== undefined) {
      if (typeof fields.sell !== 'number' || !isFinite(fields.sell)) {
        return res.status(400).json({ error: 'sell must be a finite number' })
      }
      sets.push(`sell = $${idx++}`)
      values.push(fields.sell)
    }

    if (sets.length === 0) return res.status(400).json({ error: 'No valid fields to update' })

    sets.push(`updated_at = NOW()`)
    values.push(id)

    try {
      const { rowCount } = await pool.query(
        `UPDATE items SET ${sets.join(', ')} WHERE id = $${idx}`,
        values
      )
      if (rowCount === 0) return res.status(404).json({ error: 'Item not found' })
      return res.json({ success: true })
    } catch (err) {
      console.error('PUT /api/items/:id error:', err.message)
      return res.status(500).json({ error: 'Failed to update item' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { rowCount } = await pool.query('DELETE FROM items WHERE id = $1', [id])
      if (rowCount === 0) return res.status(404).json({ error: 'Item not found' })
      return res.json({ success: true })
    } catch (err) {
      console.error('DELETE /api/items/:id error:', err.message)
      return res.status(500).json({ error: 'Failed to delete item' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
