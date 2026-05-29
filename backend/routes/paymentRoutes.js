const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All payment routes require login
router.use(protect);

// POST /api/payment/create-order  → get Razorpay order id
router.post('/create-order', createOrder);

// POST /api/payment/verify  → verify signature + create booking
router.post('/verify', verifyPayment);

module.exports = router;
