import 'dotenv/config'
import pool from './db.js'

const schema = `
  CREATE TABLE IF NOT EXISTS reagent_price_history (
    id           TEXT PRIMARY KEY,
    reagent_id   TEXT NOT NULL,
    reagent_name TEXT NOT NULL,
    item_id      TEXT NOT NULL,
    item_name    TEXT NOT NULL,
    old_price    NUMERIC(12,2) NOT NULL,
    new_price    NUMERIC(12,2) NOT NULL,
    changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_rph_reagent_id   ON reagent_price_history(reagent_id);
  CREATE INDEX IF NOT EXISTS idx_rph_reagent_name ON reagent_price_history(reagent_name);
  CREATE INDEX IF NOT EXISTS idx_rph_changed_at   ON reagent_price_history(changed_at DESC);
  CREATE INDEX IF NOT EXISTS idx_rph_item_id      ON reagent_price_history(item_id);
`

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(schema)
    console.log('Price history migration completed successfully.')
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
