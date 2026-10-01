import pool from './src/config/database.js';

const migrate = async () => {
    try {
        console.log('Adding wallet_balance to drivers...');
        await pool.query(`
            ALTER TABLE drivers 
            ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0;
        `);

        console.log('Creating driver_payouts table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS driver_payouts (
                id SERIAL PRIMARY KEY,
                driver_id INTEGER REFERENCES drivers(id),
                amount NUMERIC NOT NULL,
                notes TEXT,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
        process.exit();
    }
};

migrate();
