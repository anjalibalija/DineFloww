const express = require('express');
const { signup, login, getMe, updateProfile, updatePassword, verifyOtp, verifyEmail, toggle2FA, verifyMyEmail, getBankAccount, updateBankAccount } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply IP rate limiting on sign-up and login routes to secure against brute-forcing
router.post('/signup', authRateLimiter, signup);
router.post('/login', authRateLimiter, login);
router.post('/verify-otp', authRateLimiter, verifyOtp);
router.get('/verify-email', verifyEmail);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/toggle-2fa', protect, toggle2FA);
router.post('/verify-mine', protect, verifyMyEmail);

router.get('/bank-account', protect, getBankAccount);
router.post('/bank-account', protect, updateBankAccount);

module.exports = router;
