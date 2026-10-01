import pool from './src/config/database.js';

async function migrate() {
    try {
        console.log('Starting migration...');
        
        // Add columns to orders
        await pool.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS customer_lat DECIMAL(9, 6), 
            ADD COLUMN IF NOT EXISTS customer_lng DECIMAL(9, 6);
        `);
        console.log('Updated orders table.');

        // Add columns to laundries
        await pool.query(`
            ALTER TABLE laundries 
            ADD COLUMN IF NOT EXISTS lat DECIMAL(9, 6), 
            ADD COLUMN IF NOT EXISTS lng DECIMAL(9, 6);
        `);
        console.log('Updated laundries table.');

        // Set some dummy data for testing
        // Colombo locations
        await pool.query(`
            UPDATE laundries SET lat = 6.9147, lng = 79.8778 WHERE lat IS NULL;
            UPDATE orders SET customer_lat = 6.9271, customer_lng = 79.8612 WHERE customer_lat IS NULL;
        `);
        console.log('Set dummy location data.');
        
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
