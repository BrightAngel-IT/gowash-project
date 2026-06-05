import pg from 'pg';
import dotenv from 'dotenv';

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

// Test connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ PostgreSQL Database connected successfully');
        client.release();
    } catch (error) {
        console.error('❌ PostgreSQL connection error:', error.message);
        console.error('Stack trace:', error.stack);
        console.log('Please check your .env file and ensure PostgreSQL is running.');
    }
};

testConnection();

// Wrapper for query to match mysql2 syntax [rows] or just results
export const query = (text, params) => pool.query(text, params);

export default pool;
