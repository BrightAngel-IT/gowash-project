import db from '../config/database.js';

export const getAllServices = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM services ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getServiceById = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM services WHERE id = $1', [req.params.id]);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: "Service not found" });
        }
    } catch (error) {
        console.error('Get service error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createService = async (req, res) => {
    try {
        const { name, price, unit, description, icon, color } = req.body;
        const result = await db.query(
            'INSERT INTO services (name, price, unit, description, icon, color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, price, unit, description, icon, color]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, unit, description, icon, color, is_active } = req.body;
        const result = await db.query(
            'UPDATE services SET name = $1, price = $2, unit = $3, description = $4, icon = $5, color = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
            [name, price, unit, description, icon, color, is_active, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Service not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM services WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Service not found" });
        }
        res.json({ message: "Service deleted successfully" });
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({ message: "Server error" });
    }
};
