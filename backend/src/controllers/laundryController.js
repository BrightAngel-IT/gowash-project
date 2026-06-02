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

export const getAllLaundries = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM laundries ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getLaundryById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM laundries WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Laundry not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createLaundry = async (req, res) => {
    try {
        const { name, address, phone, email, manager_name, opening_time, closing_time, image_url, username, password } = req.body;
        const result = await pool.query(
            'INSERT INTO laundries (name, address, phone, email, manager_name, opening_time, closing_time, image_url, username, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [name, address, phone, email, manager_name, opening_time, closing_time, image_url, username, password]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateLaundry = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, phone, email, manager_name, opening_time, closing_time, image_url, status, username, password } = req.body;
        const result = await pool.query(
            'UPDATE laundries SET name = $1, address = $2, phone = $3, email = $4, manager_name = $5, opening_time = $6, closing_time = $7, image_url = $8, status = $9, username = $10, password = $11, updated_at = CURRENT_TIMESTAMP WHERE id = $12 RETURNING *',
            [name, address, phone, email, manager_name, opening_time, closing_time, image_url, status, username, password, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Laundry not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteLaundry = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM laundries WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Laundry not found' });
        }
        res.json({ message: 'Laundry deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
