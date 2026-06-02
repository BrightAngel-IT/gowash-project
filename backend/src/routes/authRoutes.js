import express from 'express';
import { login, register } from '../controllers/authController.js';
import { driverLogin } from '../controllers/driverAuthController.js';
import { driverRegister } from '../controllers/driverRegisterController.js';
import { forgotPassword, verifyOtp, resetPassword } from '../controllers/passwordController.js';
import { googleLogin, completeDriverProfile } from '../controllers/googleAuthController.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/driver/login', driverLogin);
router.post('/driver/register', driverRegister);

// Password recovery
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Google Auth
router.post('/google', googleLogin);
router.post('/complete-driver-profile', completeDriverProfile);

export default router;
