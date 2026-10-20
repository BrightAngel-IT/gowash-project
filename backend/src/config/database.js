import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust .env resolution for both local development and cPanel Phusion Passenger
const possibleEnvPaths = [
    path.resolve(__dirname, '../../.env'), // backend/.env or root of app on cPanel
    path.resolve(__dirname, '../.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend/.env'),
];

export const loadedEnvPaths = [];
for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath) && !loadedEnvPaths.includes(envPath)) {
        dotenv.config({ path: envPath });
        loadedEnvPaths.push(envPath);
    }
}
dotenv.config(); // fallback to standard dotenv

const { Pool } = pg;

// Parse and validate DATABASE_URL
const rawDbUrl = (process.env.DATABASE_URL || '').trim();
// A valid database URL that has credentials MUST contain '@' (e.g., postgres://user:pass@host:5432/db)
const hasValidDatabaseUrl = 
    (rawDbUrl.startsWith('postgres://') || rawDbUrl.startsWith('postgresql://')) && 
    rawDbUrl.includes('@');

const dbUser = (process.env.DB_USER && process.env.DB_USER.trim()) || 
               (process.env.PGUSER && process.env.PGUSER.trim()) || 
               'postgres';
const dbHost = (process.env.DB_HOST && process.env.DB_HOST.trim()) || 'localhost';
const dbName = (process.env.DB_NAME && process.env.DB_NAME.trim()) || 'gowash';
const dbPass = process.env.DB_PASSWORD || process.env.PGPASSWORD || '1234';
const dbPort = parseInt(process.env.DB_PORT, 10) || 5432;
const dbSsl = process.env.DB_SSL === 'true' || 
             (hasValidDatabaseUrl && (rawDbUrl.includes('supabase') || rawDbUrl.includes('neon.tech') || rawDbUrl.includes('pooler') || rawDbUrl.includes('sslmode=require')));

export const dbConfigSummary = {
    usingUrl: hasValidDatabaseUrl,
    urlLength: rawDbUrl.length,
    urlProtocol: rawDbUrl ? rawDbUrl.split('://')[0] : null,
    hasAtInUrl: rawDbUrl.includes('@'),
    host: hasValidDatabaseUrl ? 'from_url' : dbHost,
    user: hasValidDatabaseUrl ? 'from_url' : dbUser,
    database: hasValidDatabaseUrl ? 'from_url' : dbName,
    port: hasValidDatabaseUrl ? 'from_url' : dbPort,
    hasPassword: hasValidDatabaseUrl ? true : Boolean(dbPass),
    ssl: Boolean(dbSsl),
    loadedEnvPaths,
};

const pool = hasValidDatabaseUrl
    ? new Pool({
        connectionString: rawDbUrl,
        ssl: dbSsl ? { rejectUnauthorized: false } : false
      })
    : new Pool({
        host: dbHost,
        user: dbUser,
        password: dbPass,
        database: dbName,
        port: dbPort,
        ssl: dbSsl ? { rejectUnauthorized: false } : false
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
