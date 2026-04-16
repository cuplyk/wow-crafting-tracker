import 'dotenv/config'
import pool from './db.js'

const schema = `
  CREATE TABLE IF NOT EXISTS sales (
    id          TEXT PRIMARY KEY,
    item_id     TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    qty         INTEGER NOT NULL DEFAULT 1,
    unit_price  NUMERIC(12,2) NOT NULL,
    notes       TEXT DEFAULT '',
    sold_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_sales_item_id  ON sales(item_id);
  CREATE INDEX IF NOT EXISTS idx_sales_sold_at  ON sales(sold_at);
`

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(schema)
    console.log('Sales migration completed successfully.')
  } catch (err) {
    console.error('Sales migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
