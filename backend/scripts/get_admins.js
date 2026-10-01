import pool from './src/config/database.js';

const getAdmins = async () => {
    try {
        const res = await pool.query("SELECT id, name, email, password, role FROM users WHERE role IN ('superadmin', 'admin')");
        console.log('--- ADMIN USERS ---');
        console.table(res.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
        process.exit();
    }
};

getAdmins();
