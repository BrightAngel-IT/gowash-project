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
    try {
        const res = await pool.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN ('ride_assignments', 'orders', 'laundries', 'drivers') ORDER BY table_name, ordinal_position");
        const tables = {};
        res.rows.forEach(r => {
            if (!tables[r.table_name]) tables[r.table_name] = [];
            tables[r.table_name].push(r.column_name);
        });
        console.log(JSON.stringify(tables, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
