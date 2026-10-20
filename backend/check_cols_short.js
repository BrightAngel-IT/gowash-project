import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'gowash',
    port: process.env.DB_PORT || 5432,
});

async function run() {
    const tables = ['ride_assignments', 'orders', 'laundries'];
    for (const t of tables) {
        const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${t}'`);
        console.log(`TABLE_${t}:`, res.rows.map(r => r.column_name).join('|'));
    }
    pool.end();
}
run();
