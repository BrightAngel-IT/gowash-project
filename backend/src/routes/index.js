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

const router = express.Router();


// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
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
