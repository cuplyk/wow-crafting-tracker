import { getPool } from '../../../_db.js'
import { cors, validateReagent } from '../../../_helpers.js'

export default async function handler(req, res) {
  if (cors(req, res)) return
  const pool = getPool()
  const itemId = req.query.id
  const { reagentId } = req.query

  if (req.method === 'PUT') {
    const fields = req.body
    const errors = validateReagent(fields)
    if (errors.length) return res.status(400).json({ error: errors.join('; ') })

    const sets = []
    const values = []
    let idx = 1

    if (fields.name !== undefined)  { sets.push(`name = $${idx++}`);  values.push(fields.name) }
    if (fields.qty !== undefined)   { sets.push(`qty = $${idx++}`);   values.push(fields.qty) }
    if (fields.price !== undefined) { sets.push(`price = $${idx++}`); values.push(fields.price) }

    if (sets.length === 0) return res.status(400).json({ error: 'No valid fields to update' })

    sets.push(`updated_at = NOW()`)
    values.push(itemId, reagentId)

    try {
      const { rowCount } = await pool.query(
        `UPDATE reagents SET ${sets.join(', ')} WHERE item_id = $${idx} AND id = $${idx + 1}`,
        values
      )
      if (rowCount === 0) return res.status(404).json({ error: 'Reagent not found' })
      return res.json({ success: true })
    } catch (err) {
      console.error('PUT reagent error:', err.message)
      return res.status(500).json({ error: 'Failed to update reagent' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { rowCount } = await pool.query(
        'DELETE FROM reagents WHERE item_id = $1 AND id = $2',
        [itemId, reagentId]
      )
      if (rowCount === 0) return res.status(404).json({ error: 'Reagent not found' })
      return res.json({ success: true })
    } catch (err) {
      console.error('DELETE reagent error:', err.message)
      return res.status(500).json({ error: 'Failed to delete reagent' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
