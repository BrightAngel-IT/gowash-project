import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function runFix() {
    const client = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    });

    try {
        await client.connect();

        console.log('--- Database Repair & Upgrade Mode ---');

        // 1. Drop constraints if they exist to avoid errors during modification
        console.log('Dropping existing constraints...');
        await client.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
        await client.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_laundry_id_fkey');
        await client.query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_laundry_id_fkey');
        await client.query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check');

        // 2. Create laundries table first (since others depend on it)
        console.log('Ensuring laundries table exists...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS laundries (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                address TEXT NOT NULL,
                phone VARCHAR(20),
                email VARCHAR(255),
                status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
                manager_name VARCHAR(255),
                opening_time VARCHAR(20),
                closing_time VARCHAR(20),
                image_url TEXT,
                username VARCHAR(100) UNIQUE,
                password VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Update laundries table if columns missing
        console.log('Upgrading laundries table...');
        const laundryCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'laundries'");
        const laundryColNames = laundryCols.rows.map(r => r.column_name);

        if (!laundryColNames.includes('username')) {
            await client.query('ALTER TABLE laundries ADD COLUMN username VARCHAR(100) UNIQUE');
        }
        if (!laundryColNames.includes('password')) {
            await client.query('ALTER TABLE laundries ADD COLUMN password VARCHAR(255)');
        }

        // 4. Update users table structure
        console.log('Upgrading users table...');
        const userCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        const userColNames = userCols.rows.map(r => r.column_name);

        if (!userColNames.includes('laundry_id')) {
            await client.query('ALTER TABLE users ADD COLUMN laundry_id INT');
        }

        await client.query("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin', 'agent', 'superadmin'))");
        await client.query('ALTER TABLE users ADD CONSTRAINT users_laundry_id_fkey FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE SET NULL');

        // 4. Update orders table structure
        console.log('Upgrading orders table...');
        const orderCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'");
        const orderColNames = orderCols.rows.map(r => r.column_name);

        if (!orderColNames.includes('laundry_id')) {
            await client.query('ALTER TABLE orders ADD COLUMN laundry_id INT');
        }

        await client.query("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('Pending', 'Confirmed', 'Pickup', 'Washing', 'Drying', 'Ready', 'Delivered', 'Cancelled'))");
        await client.query('ALTER TABLE orders ADD CONSTRAINT orders_laundry_id_fkey FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE SET NULL');

        // 5. Insert / Update Data
        console.log('Seeding initial data...');

        // Insert Laundries if empty
        const laundryCount = await client.query('SELECT COUNT(*) FROM laundries');
        if (parseInt(laundryCount.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO laundries (name, address, phone, email, manager_name, opening_time, closing_time, username, password) VALUES
                ('GoWash Central', '123 Main St, Colombo', '0112233445', 'central@gowash.com', 'Amal Perera', '08:00 AM', '08:00 PM', 'central', 'admin123'),
                ('GoWash Kandy', '45 Hill Rd, Kandy', '0812233445', 'kandy@gowash.com', 'Kasun Silva', '09:00 AM', '07:00 PM', 'kandy', 'admin123')
            `);
        }

        const firstLaundry = await client.query('SELECT id FROM laundries LIMIT 1');
        const laundryId = firstLaundry.rows[0].id;

        // Insert/Update Superadmin
        await client.query(`
            INSERT INTO users (name, email, password, phone, role) 
            VALUES ('Super Admin', 'superadmin@gowash.com', 'admin123', '0987654321', 'superadmin')
            ON CONFLICT (email) DO UPDATE SET role = 'superadmin'
        `);

        // Insert/Update Branch Admin and link to laundry
        await client.query(`
            INSERT INTO users (name, email, password, phone, role, laundry_id) 
            VALUES ('Admin User', 'admin@gowash.com', 'admin', '1122334455', 'admin', $1)
            ON CONFLICT (email) DO UPDATE SET role = 'admin', laundry_id = $1
        `, [laundryId]);

        // Link existing orders to the first laundry if they don't have one
        await client.query('UPDATE orders SET laundry_id = $1 WHERE laundry_id IS NULL', [laundryId]);

        console.log('✅ Entire system backend & DB fixed successfully!');
    } catch (error) {
        console.error('❌ Error during fix:', error.message);
    } finally {
        await client.end();
    }
}

runFix();
