import db from './src/config/database.js';

async function addPiecesColumn() {
    try {
        console.log('Adding pieces column to order_items table...');
        await db.query('ALTER TABLE order_items ADD COLUMN IF NOT EXISTS pieces INT;');
        console.log('✅ Column added successfully or already exists.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding column:', error);
        process.exit(1);
    }
}

addPiecesColumn();
