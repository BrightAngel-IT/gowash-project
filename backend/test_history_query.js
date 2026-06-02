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

async function testQuery() {
    const driverId = '4'; // Hardcoded for test
    try {
        console.log(`Testing history query for driverId: ${driverId}...`);
        const query = `
            SELECT 
                ra.id as assignment_id,
                ra.status as ride_status,
                ra.completed_at,
                ra.created_at as assigned_at,
                o.id as order_id,
                o.address as pickup_address,
                o.total_price,
                o.delivery_fee,
                o.status as order_status,
                o.customer_name,
                l.name as laundry_name,
                l.address as laundry_address
            FROM ride_assignments ra
            JOIN orders o ON ra.order_id = o.id
            LEFT JOIN laundries l ON o.laundry_id = l.id
            WHERE ra.driver_id = $1
            ORDER BY ra.created_at DESC
        `;
        const res = await pool.query(query, [driverId]);
        console.log('Query succeeded!');
        console.log('Results count:', res.rows.length);
    } catch (err) {
        console.error('QUERY FAILED!');
        console.error('Message:', err.message);
        console.error('Error Object:', JSON.stringify(err, null, 2));
    } finally {
        await pool.end();
    }
}
testQuery();
