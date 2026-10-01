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

async function check() {
    try {
        console.log('--- Orders Table ---');
        const orders = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'");
        console.log(orders.rows.map(r => r.column_name).join(', '));

        console.log('\n--- Ride Assignments Table ---');
        const ride = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'ride_assignments'");
        console.log(ride.rows.map(r => r.column_name).join(', '));
        
        console.log('\n--- Drivers Table ---');
        const drivers = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'drivers'");
        console.log(drivers.rows.map(r => r.column_name).join(', '));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
check();
