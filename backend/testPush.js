import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;
const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' || process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_URL.includes('neon.tech')
            ? { rejectUnauthorized: false }
            : false
      })
    : new Pool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'gowash',
        port: process.env.DB_PORT || 5432,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

async function run() {
    try {
        const drivers = await pool.query('SELECT push_token FROM drivers WHERE push_token IS NOT NULL');
        console.log('Found drivers with tokens:', drivers.rows);
        
        if (drivers.rows.length === 0) {
            console.log('No drivers with tokens found.');
            return;
        }

        const tokens = drivers.rows.map(d => d.push_token);
        console.log('Tokens:', tokens);

        const messages = tokens.map(token => ({
            to: token,
            sound: 'default',
            title: 'Test Notification',
            body: 'Testing background push',
            priority: 'high',
            channelId: 'default',
        }));

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });

        const data = await response.json();
        console.log('Expo Response:', JSON.stringify(data, null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

run();
