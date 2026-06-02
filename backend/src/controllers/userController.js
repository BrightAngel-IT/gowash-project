import db from '../config/database.js';

// Get user profile
export const getUserProfile = async (req, res) => {
    const userId = parseInt(req.query.userId) || 1;

    try {
        const result = await db.query('SELECT id, name, email, phone, role, created_at as "createdAt" FROM users WHERE id = $1', [userId]);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
    const userId = parseInt(req.query.userId) || 1;
    const { name, email, phone } = req.body;

    try {
        // Check if email is already taken by another user
        if (email) {
            const existing = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
            if (existing.rows.length > 0) {
                return res.status(400).json({ message: "Email already in use" });
            }
        }

        // Build update query dynamically
        const updates = [];
        const params = [];
        let paramCount = 1;

        if (name) {
            updates.push(`name = $${paramCount++}`);
            params.push(name);
        }
        if (email) {
            updates.push(`email = $${paramCount++}`);
            params.push(email);
        }
        if (phone) {
            updates.push(`phone = $${paramCount++}`);
            params.push(phone);
        }

        if (updates.length > 0) {
            params.push(userId);
            await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`, params);
        }

        const result = await db.query('SELECT id, name, email, phone, role, created_at as "createdAt" FROM users WHERE id = $1', [userId]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
    const { laundryId, role } = req.query;

    try {
        let queryText;
        let params = [];
        let paramCount = 1;

        if (laundryId) {
            // Get customers who have ordered from this laundry
            queryText = `
                SELECT DISTINCT u.id, u.name, u.email, u.phone, u.role, u.created_at as "createdAt"
                FROM users u
                JOIN orders o ON u.id = o.user_id
                WHERE o.laundry_id = $1
            `;
            params.push(laundryId);
            paramCount++;

            if (role) {
                queryText += ` AND u.role = $${paramCount++}`;
                params.push(role);
            } else {
                queryText += ` AND u.role = 'customer'`;
            }
            
            queryText += ` ORDER BY u.created_at DESC`;
        } else {
            // Get all users, potentially filtered by role
            queryText = 'SELECT id, name, email, phone, role, created_at as "createdAt" FROM users';
            if (role) {
                queryText += ` WHERE role = $${paramCount++}`;
                params.push(role);
            }
            queryText += ' ORDER BY created_at DESC';
        }

        const result = await db.query(queryText, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get user statistics (admin only)
export const getUserStats = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) as "totalUsers",
                SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as customers,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
                SUM(CASE WHEN role = 'agent' THEN 1 ELSE 0 END) as agents
            FROM users
        `);

        res.json({
            totalUsers: parseInt(result.rows[0].totalUsers) || 0,
            customers: parseInt(result.rows[0].customers) || 0,
            admins: parseInt(result.rows[0].admins) || 0,
            agents: parseInt(result.rows[0].agents) || 0
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ message: "Server error" });
    }
};
