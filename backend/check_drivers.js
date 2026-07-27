import db from './src/config/database.js';

async function checkDrivers() {
    try {
        console.log("Checking drivers table...");
        const result = await db.query("SELECT id, name, status, push_token FROM drivers");
        console.table(result.rows);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkDrivers();
