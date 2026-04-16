import { getPool } from '../_db.js'
import { cors } from '../_helpers.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' })

  const pool = getPool()
  const { id } = req.query
  try {
    const { rowCount } = await pool.query('DELETE FROM sales WHERE id = $1', [id])
    if (rowCount === 0) return res.status(404).json({ error: 'Sale not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/sales/:id error:', err.message)
    res.status(500).json({ error: 'Failed to delete sale' })
  }
}
