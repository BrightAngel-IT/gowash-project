import db from '../config/database.js';

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check users table
        const userRes = await db.query(
            'SELECT * FROM users WHERE email = $1 AND password = $2',
            [email, password]
        );

        if (userRes.rows.length > 0) {
            const user = userRes.rows[0];
            const { password: _, ...safeUser } = user;
            return res.json({
                token: "fake-jwt-token-" + user.id,
                user: safeUser
            });
        }

        // 2. Check laundries table for branch login (searching by email or username)
        const laundryRes = await db.query(
            'SELECT * FROM laundries WHERE (email = $1 OR username = $1) AND password = $2',
            [email, password]
        );

        if (laundryRes.rows.length > 0) {
            const laundry = laundryRes.rows[0];
            return res.json({
                token: "fake-jwt-token-laundry-" + laundry.id,
                user: {
                    id: `l-${laundry.id}`,
                    name: laundry.name,
                    email: laundry.email,
                    role: 'admin',
                    laundry_id: laundry.id,
                    is_direct_branch: true
                }
            });
        }

        res.status(401).json({ message: "Invalid credentials" });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Server error" });
    }
};

export const register = async (req, res) => {
    console.log('--- CUSTOMER REGISTER REQUEST ---');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    const { name, email, phone, password } = req.body;

    // Basic validation
    if (!name || !email || !phone || !password) {
        console.log('Validation failed: Missing fields');
        return res.status(400).json({ message: "All fields (name, email, phone, password) are required." });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);

        if (existing.rows.length > 0) {
            console.log(`Registration failed: User with email ${normalizedEmail} already exists`);
            return res.status(400).json({ message: "An account with this email already exists." });
        }

        // Insert new user and return the inserted row
        const result = await db.query(
            'INSERT INTO users (name, email, phone, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name.trim(), normalizedEmail, phone.trim(), password, 'customer']
        );

        const newUser = result.rows[0];
        const { password: _, ...safeUser } = newUser;

        console.log(`Registration successful for: ${normalizedEmail}`);
        res.status(201).json({
            message: "User registered successfully",
            user: safeUser
        });
    } catch (error) {
        console.error('Register error details:', error);

        if (error.code === '23505') {
            return res.status(400).json({ message: "Email or phone number already exists." });
        }

        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};
