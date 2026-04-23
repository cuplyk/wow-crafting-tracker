import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// ---------------------------------------------------------------------------
// GET /api/price-history — fetch price change history with optional filters
// Query params:
//   reagentName  — filter by reagent name (case-insensitive partial match)
//   itemId       — filter by item ID
//   from         — ISO date string lower bound
//   to           — ISO date string upper bound
//   limit        — max rows (default 500)
// ---------------------------------------------------------------------------

router.get('/', async (req, res) => {
  const { reagentName, itemId, from, to, limit = 500 } = req.query

  const conditions = []
  const values = []
  let idx = 1

  if (reagentName) {
    conditions.push(`LOWER(reagent_name) LIKE $${idx++}`)
    values.push(`%${reagentName.toLowerCase()}%`)
  }
  if (itemId) {
    conditions.push(`item_id = $${idx++}`)
    values.push(itemId)
  }
  if (from) {
    conditions.push(`changed_at >= $${idx++}`)
    values.push(from)
  }
  if (to) {
    conditions.push(`changed_at <= $${idx++}`)
    values.push(to)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 500, 1), 2000)

  try {
    const { rows } = await pool.query(
      `SELECT id, reagent_id, reagent_name, item_id, item_name,
              old_price, new_price, changed_at
       FROM reagent_price_history
       ${where}
       ORDER BY changed_at DESC
       LIMIT $${idx}`,
      [...values, safeLimit]
    )

    const result = rows.map(r => ({
      id: r.id,
      reagentId: r.reagent_id,
      reagentName: r.reagent_name,
      itemId: r.item_id,
      itemName: r.item_name,
      oldPrice: parseFloat(r.old_price),
      newPrice: parseFloat(r.new_price),
      changedAt: r.changed_at,
    }))

    res.json(result)
  } catch (err) {
    console.error('GET /api/price-history error:', err.message)
    res.status(500).json({ error: 'Failed to fetch price history' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/price-history/summary — per-reagent aggregated summary
// Returns each unique reagent name with: first price, latest price,
// min/max ever, number of changes, and last changed_at
// ---------------------------------------------------------------------------

router.get('/summary', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        reagent_name,
        COUNT(*)::int                                          AS change_count,
        MIN(old_price)                                         AS min_price,
        MAX(new_price)                                         AS max_price,
        (ARRAY_AGG(old_price ORDER BY changed_at ASC))[1]     AS first_price,
        (ARRAY_AGG(new_price ORDER BY changed_at DESC))[1]    AS latest_price,
        MAX(changed_at)                                        AS last_changed_at,
        MIN(changed_at)                                        AS first_changed_at
      FROM reagent_price_history
      GROUP BY reagent_name
      ORDER BY MAX(changed_at) DESC
    `)

    const result = rows.map(r => ({
      reagentName: r.reagent_name,
      changeCount: r.change_count,
      minPrice: parseFloat(r.min_price),
      maxPrice: parseFloat(r.max_price),
      firstPrice: parseFloat(r.first_price),
      latestPrice: parseFloat(r.latest_price),
      lastChangedAt: r.last_changed_at,
      firstChangedAt: r.first_changed_at,
    }))

    res.json(result)
  } catch (err) {
    console.error('GET /api/price-history/summary error:', err.message)
    res.status(500).json({ error: 'Failed to fetch price history summary' })
  }
})

export default router
