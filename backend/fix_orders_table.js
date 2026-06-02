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

async function fixDb() {
    try {
        console.log('--- Starting Database Fix ---');

        // 1. Fix orders table
        console.log('Checking orders table...');
        const orderCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'");
        const existingOrderCols = orderCols.rows.map(r => r.column_name);

        if (!existingOrderCols.includes('laundry_id')) {
            console.log('Adding laundry_id to orders...');
            await pool.query('ALTER TABLE orders ADD COLUMN laundry_id INT REFERENCES laundries(id) ON DELETE SET NULL');
        }

        if (!existingOrderCols.includes('delivery_fee')) {
            console.log('Adding delivery_fee to orders...');
            await pool.query('ALTER TABLE orders ADD COLUMN delivery_fee DECIMAL(10, 2) DEFAULT 0.00');
        }

        // 2. Fix drivers table status check
        console.log('Fixing drivers status constraint...');
        // Drop existing constraint if it exists to replace it with a more flexible one if needed, 
        // or just ensure the existing one is correct.
        // Actually, let's just make sure all expected statuses are supported.
        try {
            await pool.query('ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_status_check');
            await pool.query(`ALTER TABLE drivers ADD CONSTRAINT drivers_status_check CHECK (status IN ('online', 'offline', 'busy', 'pending_approval'))`);
            console.log('Drivers status constraint updated.');
        } catch (err) {
            console.warn('Could not update drivers status constraint:', err.message);
        }

        console.log('--- Database Fix Completed ---');

    } catch (err) {
        console.error('Error during database fix:', err);
    } finally {
        await pool.end();
    }
}

fixDb();
