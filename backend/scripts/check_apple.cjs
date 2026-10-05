require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const cols = await c.query("SELECT column_name, is_nullable, data_type, column_default FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position");
  console.table(cols.rows);
  try {
    await c.query('BEGIN');
    const r = await c.query(
      'INSERT INTO users (name, email, role, password, apple_id) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      ['T', 'apple_test_x@privaterelay.appleid.com', 'customer', 'x', 'test.apple.x']
    );
    console.log('Insert OK', r.rows);
  } catch (e) { console.error('Insert FAILED:', e.code, e.message); }
  await c.query('ROLLBACK');
  await c.end();
})();
