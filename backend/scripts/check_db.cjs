const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_lFiRg0GfLx6e@ep-restless-cake-aoophfrs.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
    try {
        const appleId = 'test_apple_id_' + Date.now();
        const userEmail = 'test_apple_' + Date.now() + '@privaterelay.appleid.com';
        const userName = 'Apple User';
        const role = 'customer';

        const newUserRes = await pool.query(
            'INSERT INTO users (name, email, role, password, apple_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userName, userEmail, role, `apple_${appleId}_nopass`, appleId]
        );
        console.log("Success! Inserted:", newUserRes.rows[0]);
    } catch(err) {
        console.error("Exact DB error:", err);
    } finally {
        await pool.end();
    }
}

run();
