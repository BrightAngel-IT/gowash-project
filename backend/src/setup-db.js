import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function setupDatabase() {
    const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/postgres`;
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('⏳ Creating database if not exists...');

        // Check if database exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [process.env.DB_NAME]);

        if (res.rowCount === 0) {
            // Create database (cannot be done with parameters)
            await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
            console.log(`✅ Database ${process.env.DB_NAME} created.`);
        } else {
            console.log(`ℹ️ Database ${process.env.DB_NAME} already exists.`);
        }
    } catch (error) {
        console.error('❌ Error creating database:', error.message);
    } finally {
        await client.end();
    }

    // Now connect to the new database and run schema
    const dbClient = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    });

    try {
        await dbClient.connect();
        console.log('⏳ Running schema migration...');
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        await dbClient.query(sql);
        console.log('✅ Schema migration completed successfully!');
    } catch (error) {
        console.error('❌ Error running migration:', error.message);
    } finally {
        await dbClient.end();
    }
}

setupDatabase();
