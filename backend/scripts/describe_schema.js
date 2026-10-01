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

async function describeSchema() {
    try {
        const tables = ['ride_assignments', 'orders', 'laundries', 'drivers'];
        for (const table of tables) {
            console.log(`\n--- Schema for table: ${table} ---`);
            const res = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [table]);
            if (res.rows.length === 0) {
                console.log(`Table ${table} does not exist!`);
            } else {
                res.rows.forEach(row => {
                    console.log(`${row.column_name}: ${row.data_type}`);
                });
            }
        }
    } catch (err) {
        console.error('Error describing schema:', err);
    } finally {
        await pool.end();
    }
}
describeSchema();
