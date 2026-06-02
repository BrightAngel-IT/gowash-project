import db from '../config/database.js';

// Driver Login - uses the users table with driver role, then joins drivers table
export const driverLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Find user account
        const userRes = await db.query(
            'SELECT * FROM users WHERE email = $1 AND password = $2',
            [email, password]
        );

        if (userRes.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = userRes.rows[0];

        // Check if this user has a driver record
        const driverRes = await db.query(
            `SELECT d.*, u.name, u.email, u.phone
             FROM drivers d 
             JOIN users u ON d.user_id = u.id
             WHERE d.user_id = $1`,
            [user.id]
        );

        if (driverRes.rows.length === 0) {
            return res.status(403).json({ message: 'No driver profile found for this account. Please contact support.' });
        }

        const driver = driverRes.rows[0];

        if (driver.status === 'pending_approval') {
            return res.status(403).json({
                message: 'Your application is still under review. We will notify you once your account is activated.',
                status: 'pending_approval'
            });
        }

        const { password: _, ...safeUser } = user;

        return res.json({
            token: `driver-jwt-token-${driver.id}`,
            driver: {
                id: driver.id,
                userId: user.id,
                name: driver.name,
                email: driver.email,
                phone: driver.phone,
                vehicleNumber: driver.vehicle_number,
                vehicleType: driver.vehicle_type,
                status: driver.status,
                rating: driver.rating,
                totalEarnings: driver.total_earnings,
            }
        });
    } catch (error) {
        console.error('Driver login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
