import db from '../config/database.js';

// Register a new driver account
export const driverRegister = async (req, res) => {
    console.log('--- DRIVER REGISTER REQUEST ---');
    console.log('Body keys:', Object.keys(req.body));
    const {
        name, email, phone, password,
        vehicleNumber, vehicleType,
        nicNumber, licenseNumber, homeAddress,
        bankName, branchName, accountHolderName, accountNumber,
        profileImage, licenseFront, licenseBack, nicFront, nicBack,
        vehicleFront, vehicleBack, vehicleBook
    } = req.body;

    // --- Validation ---
    if (!name || !email || !phone || !password || !vehicleNumber || !nicNumber || !licenseNumber) {
        return res.status(400).json({ message: 'Essential verification fields are required.' });
    }

    // ... email/password checks remain same ...
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    try {
        // Check for duplicate email in users table
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        // Check for duplicate vehicle number
        const existingVehicle = await db.query('SELECT id FROM drivers WHERE vehicle_number = $1', [vehicleNumber.toUpperCase()]);
        if (existingVehicle.rows.length > 0) {
            return res.status(409).json({ message: 'This vehicle number is already registered.' });
        }

        // Check for duplicate NIC
        const existingNIC = await db.query('SELECT id FROM drivers WHERE nic_number = $1', [nicNumber]);
        if (existingNIC.rows.length > 0) {
            return res.status(409).json({ message: 'This NIC number is already registered.' });
        }

        // --- Create user record ---
        const userResult = await db.query(
            `INSERT INTO users (name, email, phone, password, role)
             VALUES ($1, $2, $3, $4, 'agent')
             RETURNING id, name, email, phone, role`,
            [name.trim(), email.trim().toLowerCase(), phone.trim(), password]
        );

        const newUser = userResult.rows[0];

        // --- Create driver record with extended details ---
        const driverResult = await db.query(
            `INSERT INTO drivers (
                user_id, vehicle_number, vehicle_type, nic_number, license_number, home_address,
                bank_name, branch_name, account_holder_name, account_number, status,
                profile_image_url, license_front_image_url, license_back_image_url,
                nic_front_image_url, nic_back_image_url, vehicle_front_image_url,
                vehicle_back_image_url, vehicle_book_image_url
            )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending_approval', $11, $12, $13, $14, $15, $16, $17, $18)
             RETURNING *`,
            [
                newUser.id,
                vehicleNumber.trim().toUpperCase(),
                vehicleType || 'Tuk Tuk',
                nicNumber.trim(),
                licenseNumber.trim(),
                homeAddress?.trim(),
                bankName?.trim(),
                branchName?.trim(),
                accountHolderName?.trim(),
                accountNumber?.trim(),
                profileImage,
                licenseFront,
                licenseBack,
                nicFront,
                nicBack,
                vehicleFront,
                vehicleBack,
                vehicleBook
            ]
        );

        const newDriver = driverResult.rows[0];

        return res.status(201).json({
            message: 'Registration submitted! Your account is pending approval.',
            driver: {
                id: newDriver.id,
                userId: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                vehicleNumber: newDriver.vehicle_number,
                vehicleType: newDriver.vehicle_type,
                status: newDriver.status,
            }
        });
    } catch (error) {
        console.error('Driver register error:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

