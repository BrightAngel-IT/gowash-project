import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'gowash',
    port: 5432,
});

async function clearUsers() {
    try {
        console.log('--- Clearing Test Users ---');
        // Delete from drivers first if exists due to FK
        await pool.query("DELETE FROM drivers WHERE user_id IN (SELECT id FROM users WHERE email IN ('lakshan@gmail.com', 'lakshanumayanha6789@gmail.com'))");
        const res = await pool.query("DELETE FROM users WHERE email IN ('lakshan@gmail.com', 'lakshanumayanha6789@gmail.com')");
        console.log(`Deleted ${res.rowCount} users.`);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

clearUsers();
