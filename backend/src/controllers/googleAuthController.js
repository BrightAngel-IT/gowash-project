import db from '../config/database.js';

export const googleLogin = async (req, res) => {
    const { email, name, googleId, photo, role = 'customer' } = req.body;

    if (!email || !googleId) {
        return res.status(400).json({ message: 'Email and Google ID are required' });
    }

    try {
        // 1. Check if user already exists
        const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        
        if (userRes.rows.length > 0) {
            const user = userRes.rows[0];
            
            // If user exists, check if they are a driver (role 'agent')
            if (user.role === 'agent') {
                const driverRes = await db.query('SELECT * FROM drivers WHERE user_id = $1', [user.id]);
                
                if (driverRes.rows.length === 0) {
                    // This is a Google user who registered as a driver but hasn't completed their profile
                    return res.json({
                        token: `google-jwt-token-partial-${user.id}`,
                        status: 'success',
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            isProfileIncomplete: true
                        }
                    });
                }
                
                const driver = driverRes.rows[0];
                return res.json({
                    token: `google-jwt-token-driver-${driver.id}`,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        driverId: driver.id,
                        vehicleNumber: driver.vehicle_number,
                        status: driver.status
                    }
                });
            }

            // Regular customer
            return res.json({
                token: `google-jwt-token-customer-${user.id}`,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        }

        // 2. If user doesn't exist, create initial record
        // Role depends on which app they are using (passed in body)
        const newUserRes = await db.query(
            'INSERT INTO users (name, email, role, password) VALUES ($1, $2, $3, $4) RETURNING *',
            [name || 'Google User', email.toLowerCase(), role, `google_${googleId}_nopass`]
        );

        const newUser = newUserRes.rows[0];

        if (role === 'agent') {
            return res.status(201).json({
                token: `google-jwt-token-partial-${newUser.id}`,
                status: 'success',
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    isProfileIncomplete: true
                }
            });
        }

        return res.status(201).json({
            token: `google-jwt-token-customer-${newUser.id}`,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const completeDriverProfile = async (req, res) => {
    const { userId, phone, vehicleNumber, vehicleType, nicNumber, licenseNumber, homeAddress } = req.body;

    if (!userId || !phone || !vehicleNumber || !nicNumber || !licenseNumber) {
        return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    try {
        // 1. Update user phone
        await db.query('UPDATE users SET phone = $1 WHERE id = $2', [phone, userId]);

        // 2. Create driver record
        const driverRes = await db.query(
            `INSERT INTO drivers (
                user_id, vehicle_number, vehicle_type, nic_number, license_number, home_address, status
            ) VALUES ($1, $2, $3, $4, $5, $6, 'pending_approval') RETURNING *`,
            [userId, vehicleNumber.toUpperCase(), vehicleType || 'Tuk Tuk', nicNumber, licenseNumber, homeAddress]
        );

        const driver = driverRes.rows[0];

        return res.json({
            message: 'Profile completed successfully! Your account is pending approval.',
            token: `google-jwt-token-driver-${driver.id}`,
            driver: {
                id: driver.id,
                userId: userId,
                vehicleNumber: driver.vehicle_number,
                status: driver.status,
                isProfileIncomplete: false
            }
        });
    } catch (error) {
        console.error('Complete driver profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
