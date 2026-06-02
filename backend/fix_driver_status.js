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

async function fixDriverStatus() {
    try {
        console.log('--- Updating Driver Status Constraint ---');

        await pool.query('ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_status_check');
        await pool.query(`ALTER TABLE drivers ADD CONSTRAINT drivers_status_check CHECK (status IN ('online', 'offline', 'busy', 'pending_approval', 'active', 'rejected'))`);

        console.log('--- Driver Status Constraint Updated ---');

    } catch (err) {
        console.error('Error during constraint update:', err);
    } finally {
        await pool.end();
    }
}

fixDriverStatus();
