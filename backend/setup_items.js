import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

async function setup() {
    try {
        console.log('⏳ Creating tables...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS master_items (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                icon VARCHAR(100),
                category VARCHAR(100),
                base_price DECIMAL(10, 2)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS laundry_item_prices (
                id SERIAL PRIMARY KEY,
                laundry_id INT NOT NULL,
                item_id VARCHAR(100) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE CASCADE,
                FOREIGN KEY (item_id) REFERENCES master_items(id) ON DELETE CASCADE,
                UNIQUE(laundry_id, item_id)
            )
        `);

        const items = [
            { id: 'shirt', name: 'Shirt', icon: 'shirt-outline', basePrice: 150, category: 'Tops' },
            { id: 'tshirt', name: 'T-Shirt', icon: 'shirt', basePrice: 100, category: 'Tops' },
            { id: 'blouse', name: 'Blouse', icon: 'woman-outline', basePrice: 150, category: 'Tops' },
            { id: 'trouser', name: 'Trouser', icon: 'body-outline', basePrice: 150, category: 'Bottoms' },
            { id: 'jeans', name: 'Jeans', icon: 'body', basePrice: 200, category: 'Bottoms' },
            { id: 'shorts', name: 'Shorts', icon: 'browsers-outline', basePrice: 100, category: 'Bottoms' },
            { id: 'saree', name: 'Saree', icon: 'color-palette-outline', basePrice: 500, category: 'Dresses' },
            { id: 'dress', name: 'Dress', icon: 'woman-outline', basePrice: 350, category: 'Dresses' },
            { id: 'suit', name: 'Suit (2Pcs)', icon: 'briefcase-outline', basePrice: 800, category: 'Formal' },
            { id: 'jacket', name: 'Jacket', icon: 'snow-outline', basePrice: 600, category: 'Formal' },
            { id: 'bedsheet', name: 'Bed Sheet', icon: 'bed-outline', basePrice: 300, category: 'Household' },
            { id: 'towel', name: 'Towel', icon: 'layers-outline', basePrice: 150, category: 'Household' },
            { id: 'curtain', name: 'Curtain (m)', icon: 'browsers-outline', basePrice: 400, category: 'Premium' },
            { id: 'rug', name: 'Rug/Carpet', icon: 'grid-outline', basePrice: 1200, category: 'Premium' },
            { id: 'shoes', name: 'Shoes', icon: 'footsteps-outline', basePrice: 1500, category: 'Premium' },
            { id: 'suit_leather', name: 'Leather Jacket', icon: 'layers-outline', basePrice: 3000, category: 'Premium' },
            { id: 'underwear', name: 'Underwear', icon: 'shield-outline', basePrice: 50, category: 'Others' },
            { id: 'socks', name: 'Socks', icon: 'footsteps-outline', basePrice: 50, category: 'Others' }
        ];

        for (const item of items) {
            await pool.query(
                'INSERT INTO master_items (id, name, icon, category, base_price) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = $2, icon = $3, category = $4, base_price = $5',
                [item.id, item.name, item.icon, item.category, item.basePrice]
            );
        }

        console.log('✅ Tables created and master items populated successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error setting up tables:', err);
        process.exit(1);
    }
}

setup();
