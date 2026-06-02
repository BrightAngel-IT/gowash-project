import db from '../config/database.js';

// Get driver dashboard data
export const getDashboard = async (req, res) => {
    const { driverId } = req.params;

    try {
        const driverRes = await db.query(
            'SELECT * FROM drivers WHERE id = $1',
            [driverId]
        );

        if (driverRes.rows.length === 0) {
            return res.status(404).json({ message: "Driver not found" });
        }

        const driver = driverRes.rows[0];

        // Fetch real stats
        // 1. Rides completed today
        const ridesRes = await db.query(`
            SELECT COUNT(*) FROM ride_assignments 
            WHERE driver_id = $1 AND status = 'delivered' 
            AND completed_at >= CURRENT_DATE
        `, [driverId]);

        // 2. Today's earnings
        const earningsRes = await db.query(`
            SELECT SUM(o.delivery_fee) as earnings 
            FROM ride_assignments ra
            JOIN orders o ON ra.order_id = o.id
            WHERE ra.driver_id = $1 AND ra.status = 'delivered'
            AND ra.completed_at >= CURRENT_DATE
        `, [driverId]);

        // 3. Active orders
        const activeOrdersRes = await db.query(`
            SELECT ra.*, o.id as order_id, o.address as pickup_address, o.customer_name, o.status as order_status,
                   o.customer_lat, o.customer_lng,
                   l.name as laundry_name, l.address as laundry_address, l.lat as laundry_lat, l.lng as laundry_lng
            FROM ride_assignments ra
            JOIN orders o ON ra.order_id = o.id
            JOIN laundries l ON o.laundry_id = l.id
            WHERE ra.driver_id = $1 AND ra.status NOT IN ('delivered', 'cancelled')
        `, [driverId]);

        const stats = {
            todayEarnings: parseFloat(earningsRes.rows[0].earnings || 0),
            ridesCompleted: parseInt(ridesRes.rows[0].count || 0),
            rating: parseFloat(driver.rating || 5.0),
            activeOrdersCount: activeOrdersRes.rows.length,
            activeOrders: activeOrdersRes.rows
        };

        res.json({
            driver,
            stats
        });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get available ride requests
export const getAvailableJobs = async (req, res) => {
    try {
        // Find orders with status 'Ready' or 'Pickup' that haven't been assigned to a driver yet
        const jobsRes = await db.query(`
            SELECT o.*, u.name as customer_name, s.name as service_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN services s ON o.service_id = s.id
            WHERE o.status IN ('Pending', 'Ready')
            AND o.id NOT IN (SELECT order_id FROM ride_assignments WHERE status NOT IN ('delivered', 'cancelled'))
            ORDER BY o.created_at DESC
        `);

        res.json(jobsRes.rows);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update driver status (online/offline)
export const updateStatus = async (req, res) => {
    const { driverId } = req.params;
    const { status } = req.body;

    try {
        await db.query(
            'UPDATE drivers SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [status, driverId]
        );
        res.json({ message: "Status updated successfully" });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Accept a ride/job request
export const acceptJob = async (req, res) => {
    const { driverId } = req.params;
    const { orderId } = req.body;

    try {
        // 1. Check if job is still available
        const orderCheck = await db.query(`
            SELECT status FROM orders 
            WHERE id = $1 
            AND id NOT IN (SELECT order_id FROM ride_assignments WHERE status NOT IN ('delivered', 'cancelled'))
        `, [orderId]);

        if (orderCheck.rows.length === 0) {
            return res.status(400).json({ message: "Job is no longer available" });
        }

        const currentStatus = orderCheck.rows[0].status;

        // 2. Create ride assignment
        await db.query(`
            INSERT INTO ride_assignments (order_id, driver_id, status)
            VALUES ($1, $2, 'assigned')
        `, [orderId, driverId]);

        // 3. Update order status if necessary
        // If it was Pending, it's now 'Pickup' (driver assigned to pick up)
        // If it was Ready, it's now 'Delivered'? No, maybe 'Confirmed' for delivery?
        // Let's use 'Confirmed' for assigned state generally if it fits the flow
        // 3. Update order status based on current job type
        let nextStatus = currentStatus;
        if (currentStatus === 'Pending') {
            nextStatus = 'Pickup'; // Driver is going to pick it up
        } else if (currentStatus === 'Ready') {
            // It's already ready at laundry, driver is picking it up for delivery
            // We could add an 'Out for Delivery' status, but for now let's keep it as stays 'Ready'
            // or we can use 'Delivered' later. Let's keep it 'Ready' for now.
        }

        await db.query('UPDATE orders SET status = $1 WHERE id = $2', [nextStatus, orderId]);

        // Notify other drivers that the job is taken
        const io = req.app.get('io');
        if (io) {
            io.emit('job_taken', { orderId, driverId: parseInt(driverId) });
            console.log(`📡 Emitted job_taken for order #${orderId} by driver #${driverId}`);

            // Notify the customer
            const orderUserRes = await db.query('SELECT user_id FROM orders WHERE id = $1', [orderId]);
            if (orderUserRes.rows.length > 0) {
                const { user_id } = orderUserRes.rows[0];

                // Get driver details
                const driverRes = await db.query(`
                    SELECT d.*, u.name, u.phone 
                    FROM drivers d 
                    JOIN users u ON d.user_id = u.id 
                    WHERE d.id = $1
                 `, [driverId]);

                if (driverRes.rows.length > 0) {
                    const driverDetails = driverRes.rows[0];
                    console.log(`📡 Emitting driver_assigned to room: user_${user_id}`);
                    io.to(`user_${user_id}`).emit('driver_assigned', {
                        orderId,
                        orderStatus: nextStatus,
                        driver: driverDetails
                    });

                    // Also notify customer about status update
                    io.to(`user_${user_id}`).emit('order_status_update', {
                        id: orderId,
                        status: nextStatus
                    });
                }
            }
        }

        res.json({ message: "Job accepted successfully", nextStatus });
    } catch (error) {
        console.error('Error accepting job:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update ride assignment status
export const updateRideStatus = async (req, res) => {
    const { driverId, assignmentId } = req.params;
    const { status } = req.body; // 'arrived', 'picked_up', 'delivered', 'cancelled'

    try {
        // 1. Check if assignment exists for this driver
        const assignRes = await db.query(
            'SELECT * FROM ride_assignments WHERE id = $1 AND driver_id = $2',
            [assignmentId, driverId]
        );

        if (assignRes.rows.length === 0) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        const assignment = assignRes.rows[0];
        const orderId = assignment.order_id;

        // 2. Update ride assignment
        let completedAt = null;
        if (status === 'delivered') completedAt = 'CURRENT_TIMESTAMP';

        const updateAssignQuery = completedAt
            ? `UPDATE ride_assignments SET status = $1, completed_at = ${completedAt} WHERE id = $2`
            : `UPDATE ride_assignments SET status = $1 WHERE id = $2`;

        await db.query(updateAssignQuery, [status, assignmentId]);

        // 3. Update order status based on ride status
        let nextOrderStatus = null;
        if (status === 'picked_up') {
            // If it was a pickup job, it's now at 'Confirmed' status (at laundry)
            // If it was a delivery job, it's now 'Delivered'? No, 'delivered' ride status handles that.
            // Let's check original order status
            const orderRes = await db.query('SELECT status FROM orders WHERE id = $1', [orderId]);
            const currentOrderStat = orderRes.rows[0].status;

            if (currentOrderStat === 'Pickup') nextOrderStatus = 'Confirmed';
        } else if (status === 'delivered') {
            nextOrderStatus = 'Delivered';
        }

        if (nextOrderStatus) {
            await db.query('UPDATE orders SET status = $1 WHERE id = $2', [nextOrderStatus, orderId]);
        }

        // 4. Notify customer
        const io = req.app.get('io');
        if (io) {
            const orderUserRes = await db.query('SELECT user_id FROM orders WHERE id = $1', [orderId]);
            if (orderUserRes.rows.length > 0) {
                const { user_id } = orderUserRes.rows[0];

                // Emit update
                const updatedOrder = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
                io.to(`user_${user_id}`).emit('order_status_update', updatedOrder.rows[0]);
                console.log(`📡 Emitted order_status_update to user_${user_id} for order #${orderId}`);
            }
        }

        res.json({ message: `Ride status updated to ${status}`, nextOrderStatus });
    } catch (error) {
        console.error('Error updating ride status:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get full driver profile details
export const getDriverHistory = async (req, res) => {
    const { driverId } = req.params;

    try {
        const historyRes = await db.query(`
            SELECT 
                ra.id as assignment_id,
                ra.status as ride_status,
                ra.completed_at,
                ra.assigned_at,
                o.id as order_id,
                o.address as pickup_address,
                o.total_price,
                o.delivery_fee,
                o.status as order_status,
                o.customer_name,
                l.name as laundry_name,
                l.address as laundry_address
            FROM ride_assignments ra
            JOIN orders o ON ra.order_id = o.id
            LEFT JOIN laundries l ON o.laundry_id = l.id
            WHERE ra.driver_id = $1
            ORDER BY ra.assigned_at DESC
        `, [driverId]);

        res.json(historyRes.rows);
    } catch (error) {
        console.error('Error fetching driver history:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get full driver profile details
export const getDriverProfile = async (req, res) => {
    const { driverId } = req.params;

    try {
        const profileRes = await db.query(`
            SELECT 
                d.*,
                u.name,
                u.email,
                u.phone
            FROM drivers d
            JOIN users u ON d.user_id = u.id
            WHERE d.id = $1
        `, [driverId]);

        if (profileRes.rows.length === 0) {
            return res.status(404).json({ message: "Driver not found" });
        }

        res.json(profileRes.rows[0]);
    } catch (error) {
        console.error('Error fetching driver profile:', error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all drivers (for Super Admin)
export const getAllDrivers = async (req, res) => {
    try {
        const drivers = await db.query(`
            SELECT 
                d.*,
                u.name,
                u.email,
                u.phone
            FROM drivers d
            JOIN users u ON d.user_id = u.id
            ORDER BY d.created_at DESC
        `);

        res.json(drivers.rows);
    } catch (error) {
        console.error('Error fetching all drivers:', error);
        res.status(500).json({ message: "Server error" });
    }
};
