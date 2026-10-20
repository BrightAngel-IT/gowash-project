import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    port: process.env.DB_PORT || 5432,
};

async function initDatabase() {
    console.log('Connecting to PostgreSQL default database...');
    const poolDefault = new pg.Pool({ ...config, database: 'postgres' });
    
    try {
        const res = await poolDefault.query("SELECT 1 FROM pg_database WHERE datname = 'gowash'");
        if (res.rowCount === 0) {
            console.log('Creating database "gowash"...');
            await poolDefault.query('CREATE DATABASE gowash');
            console.log('✅ Database "gowash" created successfully.');
        } else {
            console.log('ℹ️ Database "gowash" already exists.');
        }
    } finally {
        await poolDefault.end();
    }

    console.log('Connecting to "gowash" database to run schema...');
    const poolGowash = new pg.Pool({ ...config, database: 'gowash' });
    try {
        const schemaSql = fs.readFileSync('./database/schema.sql', 'utf8');
        await poolGowash.query(schemaSql);
        console.log('✅ Database schema and seed data executed successfully.');
    } finally {
        await poolGowash.end();
    }
}

initDatabase().catch(err => {
    console.error('❌ Database initialization error:', err);
    process.exit(1);
});
