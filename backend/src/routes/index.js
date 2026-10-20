import express from 'express';
import { getAllServices, getServiceById, createService, updateService, deleteService } from '../controllers/serviceController.js';

import { createOrder, getUserOrders, getOrderById, updateOrderStatus, getOrderStats } from '../controllers/orderController.js';
import { getUserProfile, updateUserProfile, getAllUsers, getUserStats } from '../controllers/userController.js';
import { generateOrdersCSV, generateRevenueReport, generateCustomerReport } from '../controllers/reportController.js';
import { getDashboard, getAvailableJobs, updateStatus, acceptJob, getAllDrivers, getDriverProfile, getDriverHistory } from '../controllers/driverController.js';
import authRoutes from './authRoutes.js';
import laundryRoutes from './laundryRoutes.js';

import { getTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot } from '../controllers/timeSlotController.js';
import { getLaundryItemPrices, updateLaundryItemPrice } from '../controllers/itemPriceController.js';

import { query, dbConfigSummary } from '../config/database.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Diagnostic route for DB connection and server environment
router.get('/debug-db', async (req, res) => {
    let dbStatus = 'unknown';
    let dbError = null;
    let sampleResult = null;

    try {
        const result = await query('SELECT 1 as connected, NOW() as server_time');
        dbStatus = 'connected';
        sampleResult = result.rows[0];
    } catch (err) {
        dbStatus = 'error';
        dbError = {
            message: err.message,
            code: err.code,
            stack: err.stack ? err.stack.split('\n')[0] : null
        };
    }

    const isConnected = dbStatus === 'connected';

    res.status(isConnected ? 200 : 500).json({
        databaseConnected: isConnected,
        databaseStatus: isConnected ? 'CONNECTED' : 'DISCONNECTED (ERROR)',
        databaseError: dbError ? dbError.message : null,
        troubleshooting: isConnected ? 'Database is healthy and ready.' : 'Supabase rejected the connection: either the project ref is paused, or host/region/password in DATABASE_URL is wrong. Copy the fresh Connection Pooling URI from Supabase Dashboard > Settings > Database > Connect and update DATABASE_URL in cPanel.',
        database: {
            status: dbStatus,
            config: dbConfigSummary,
            error: dbError,
            sample: sampleResult
        },
        process: {
            uptimeSeconds: Math.floor(process.uptime()),
            startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
            pid: process.pid,
            nodeVersion: process.version,
            cwd: process.cwd()
        }
    });
});

// Auth Routes
router.use('/auth', authRoutes);

// Service Routes
router.get('/services', getAllServices);
router.get('/services/:id', getServiceById);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);


// Laundry Routes
router.use('/laundries', laundryRoutes);

// Order Routes
router.post('/orders', createOrder);
router.get('/orders', getUserOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/status', updateOrderStatus);
router.get('/stats/orders', getOrderStats);

// User Routes
router.get('/user/profile', getUserProfile);
router.put('/user/profile', updateUserProfile);
router.get('/users', getAllUsers);
router.get('/stats/users', getUserStats);

// Report Routes (Admin only)
router.get('/reports/orders', generateOrdersCSV);
router.get('/reports/revenue', generateRevenueReport);
router.get('/reports/customers', generateCustomerReport);

// Driver Routes
router.get('/drivers/:driverId/dashboard', getDashboard);
router.get('/drivers/:driverId/profile', getDriverProfile);
router.get('/drivers/:driverId/history', getDriverHistory);
router.get('/drivers/jobs/available', getAvailableJobs);
router.patch('/drivers/:driverId/status', updateStatus);
router.post('/drivers/:driverId/accept-job', acceptJob);
router.get('/admin/drivers', getAllDrivers);

// Time Slot Pricing Routes
router.get('/time-slots', getTimeSlots);
router.post('/time-slots', createTimeSlot);
router.put('/time-slots/:id', updateTimeSlot);
router.delete('/time-slots/:id', deleteTimeSlot);

// Item Pricing Routes
router.get('/item-prices', getLaundryItemPrices);
router.post('/item-prices', updateLaundryItemPrice);

export default router;
