import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateItem(body) {
  const errors = []
  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push('name is required and must be a non-empty string')
  }
  if (body.name && body.name.length > 200) {
    errors.push('name must be 200 characters or less')
  }
  if (body.sell !== undefined && (typeof body.sell !== 'number' || !isFinite(body.sell))) {
    errors.push('sell must be a finite number')
  }
  return errors
}

function validateReagent(body) {
  const errors = []
  if (body.name !== undefined && typeof body.name !== 'string') {
    errors.push('name must be a string')
  }
  if (body.name && body.name.length > 200) {
    errors.push('name must be 200 characters or less')
  }
  if (body.qty !== undefined && (typeof body.qty !== 'number' || !isFinite(body.qty) || body.qty < 0)) {
    errors.push('qty must be a non-negative finite number')
  }
  if (body.price !== undefined && (typeof body.price !== 'number' || !isFinite(body.price))) {
    errors.push('price must be a finite number')
  }
  return errors
}

// ---------------------------------------------------------------------------
// GET /api/items — fetch all items with their reagents
// ---------------------------------------------------------------------------

router.get('/', async (_req, res) => {
  try {
    const { rows: items } = await pool.query(
      'SELECT id, name, sell FROM items ORDER BY sort_order, created_at'
    )
    const { rows: reagents } = await pool.query(
      'SELECT id, item_id, name, qty, price FROM reagents ORDER BY sort_order, created_at'
    )

    // Group reagents by item_id
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

    const result = items.map(item => ({
      id: item.id,
      name: item.name,
      sell: parseFloat(item.sell),
      reagents: reagentMap[item.id] || [],
    }))

    res.json(result)
  } catch (err) {
    console.error('GET /api/items error:', err.message)
    res.status(500).json({ error: 'Failed to fetch items' })
  }
})

// ---------------------------------------------------------------------------
// PUT /api/items/bulk — full sync (replaces all data)
// Must be before /:id routes to avoid matching "bulk" as an id
// ---------------------------------------------------------------------------

router.put('/bulk', async (req, res) => {
  const { items } = req.body
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' })

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
})

// ---------------------------------------------------------------------------
// POST /api/items — create a new item
// ---------------------------------------------------------------------------

router.post('/', async (req, res) => {
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
    res.status(201).json({ ...item, sell: parseFloat(item.sell), reagents: [] })
  } catch (err) {
    console.error('POST /api/items error:', err.message)
    res.status(500).json({ error: 'Failed to create item' })
  }
})

// ---------------------------------------------------------------------------
// PUT /api/items/:id — update an item
// ---------------------------------------------------------------------------

router.put('/:id', async (req, res) => {
  const { id } = req.params
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
    res.json({ success: true })
  } catch (err) {
    console.error('PUT /api/items/:id error:', err.message)
    res.status(500).json({ error: 'Failed to update item' })
  }
})

// ---------------------------------------------------------------------------
// DELETE /api/items/:id — delete an item (cascades to reagents)
// ---------------------------------------------------------------------------

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM items WHERE id = $1', [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'Item not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/items/:id error:', err.message)
    res.status(500).json({ error: 'Failed to delete item' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/items/:id/duplicate — duplicate an item with its reagents
// ---------------------------------------------------------------------------

router.post('/:id/duplicate', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [src] } = await client.query(
      'SELECT * FROM items WHERE id = $1', [req.params.id]
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
      'SELECT * FROM reagents WHERE item_id = $1 ORDER BY sort_order', [req.params.id]
    )

    const newReagents = []
    for (const r of srcReagents) {
      const reagentId = req.body.reagentIds?.shift() || crypto.randomUUID().slice(0, 8)
      const { rows: [nr] } = await client.query(
        `INSERT INTO reagents (id, item_id, name, qty, price, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, qty, price`,
        [reagentId, newId, r.name, r.qty, r.price, r.sort_order]
      )
      newReagents.push({
        id: nr.id,
        name: nr.name,
        qty: parseFloat(nr.qty),
        price: parseFloat(nr.price),
      })
    }

    await client.query('COMMIT')
    res.status(201).json({
      id: newItem.id,
      name: newItem.name,
      sell: parseFloat(newItem.sell),
      reagents: newReagents,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('POST /api/items/:id/duplicate error:', err.message)
    res.status(500).json({ error: 'Failed to duplicate item' })
  } finally {
    client.release()
  }
})

// ---------------------------------------------------------------------------
// POST /api/items/:itemId/reagents — add a reagent to an item
// ---------------------------------------------------------------------------

router.post('/:itemId/reagents', async (req, res) => {
  const { itemId } = req.params
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
      id: r.id,
      name: r.name,
      qty: parseFloat(r.qty),
      price: parseFloat(r.price),
    })
  } catch (err) {
    console.error('POST /api/items/:itemId/reagents error:', err.message)
    res.status(500).json({ error: 'Failed to add reagent' })
  }
})

// ---------------------------------------------------------------------------
// PUT /api/items/:itemId/reagents/:reagentId — update a reagent
// ---------------------------------------------------------------------------

router.put('/:itemId/reagents/:reagentId', async (req, res) => {
  const { itemId, reagentId } = req.params
  const fields = req.body
  const errors = validateReagent(fields)
  if (errors.length) return res.status(400).json({ error: errors.join('; ') })

  const sets = []
  const values = []
  let idx = 1

  if (fields.name !== undefined) { sets.push(`name = $${idx++}`); values.push(fields.name) }
  if (fields.qty !== undefined)  { sets.push(`qty = $${idx++}`);  values.push(fields.qty) }
  if (fields.price !== undefined){ sets.push(`price = $${idx++}`);values.push(fields.price) }

  if (sets.length === 0) return res.status(400).json({ error: 'No valid fields to update' })

  sets.push(`updated_at = NOW()`)
  values.push(itemId, reagentId)

  try {
    const { rowCount } = await pool.query(
      `UPDATE reagents SET ${sets.join(', ')} WHERE item_id = $${idx} AND id = $${idx + 1}`,
      values
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Reagent not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('PUT reagent error:', err.message)
    res.status(500).json({ error: 'Failed to update reagent' })
  }
})

// ---------------------------------------------------------------------------
// DELETE /api/items/:itemId/reagents/:reagentId — delete a reagent
// ---------------------------------------------------------------------------

router.delete('/:itemId/reagents/:reagentId', async (req, res) => {
  const { itemId, reagentId } = req.params
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM reagents WHERE item_id = $1 AND id = $2',
      [itemId, reagentId]
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Reagent not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE reagent error:', err.message)
    res.status(500).json({ error: 'Failed to delete reagent' })
  }
})

export default router
