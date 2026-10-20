import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'gowash',
    port: process.env.DB_PORT || 5432,
});

async function check() {
    try {
        const ride = await pool.query("SELECT * FROM information_schema.columns WHERE table_name = 'ride_assignments'");
        fs.writeFileSync('ride_assignments_cols.json', JSON.stringify(ride.rows, null, 2));
        console.log('Saved columns to ride_assignments_cols.json');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
check();
