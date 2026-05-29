const express = require('express');
const { generateCoupon, getMyCoupons, getPuzzle, verifyPuzzle } = require('../controllers/couponController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/puzzle', getPuzzle);
router.post('/puzzle/verify', verifyPuzzle);

router.post('/coupons/generate', protect, generateCoupon);
router.get('/coupons/my', protect, getMyCoupons);

module.exports = router;
