import db from '../config/database.js';

export const appleLogin = async (req, res) => {
    const { email, name, appleId, role = 'customer' } = req.body;

    if (!appleId) {
        return res.status(400).json({ message: 'Apple ID is required' });
    }

    try {
        // 1. Check if user already exists by apple_id
        let userRes = await db.query('SELECT * FROM users WHERE apple_id = $1', [appleId]);
        
        // 2. If not found by apple_id but email is provided, check by email
        if (userRes.rows.length === 0 && email) {
            userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
            // Link the apple_id to this existing user if found
            if (userRes.rows.length > 0) {
                await db.query('UPDATE users SET apple_id = $1 WHERE id = $2', [appleId, userRes.rows[0].id]);
            }
        }

        if (userRes.rows.length > 0) {
            const user = userRes.rows[0];
            
            // Regular customer (assuming Apple login is only for customer app right now)
            return res.json({
                token: `apple-jwt-token-customer-${user.id}`,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        }

        // 3. If user doesn't exist, create initial record
        // Note: email might be null on subsequent logins if the user revoked it, 
        // but if it's the first time, email and name should be present.
        const userEmail = email ? email.toLowerCase() : `apple_${appleId}@privaterelay.appleid.com`;
        const userName = name || 'Apple User';

        const newUserRes = await db.query(
            'INSERT INTO users (name, email, role, password, apple_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userName, userEmail, role, `apple_${appleId}_nopass`, appleId]
        );

        const newUser = newUserRes.rows[0];

        return res.status(201).json({
            token: `apple-jwt-token-customer-${newUser.id}`,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Apple login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
