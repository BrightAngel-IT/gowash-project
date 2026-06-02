import pool from '../config/database.js';

export const getTimeSlots = async (req, res) => {
    try {
        const { laundryId } = req.query;
        if (!laundryId) {
            return res.status(400).json({ message: "Laundry ID is required" });
        }
        const result = await pool.query(
            'SELECT * FROM laundry_time_slots WHERE laundry_id = $1 ORDER BY id ASC',
            [laundryId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get time slots error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createTimeSlot = async (req, res) => {
    try {
        const { laundry_id, label, price } = req.body;
        const result = await pool.query(
            'INSERT INTO laundry_time_slots (laundry_id, label, price) VALUES ($1, $2, $3) RETURNING *',
            [laundry_id, label, price]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create time slot error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateTimeSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const { label, price, is_active } = req.body;
        const result = await pool.query(
            'UPDATE laundry_time_slots SET label = $1, price = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
            [label, price, is_active, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Time slot not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update time slot error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteTimeSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM laundry_time_slots WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Time slot not found" });
        }
        res.json({ message: "Time slot deleted successfully" });
    } catch (error) {
        console.error('Delete time slot error:', error);
        res.status(500).json({ message: "Server error" });
    }
};
