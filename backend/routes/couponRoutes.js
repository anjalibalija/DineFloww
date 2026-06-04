const express = require('express');
const { generateCoupon, getMyCoupons, validateCoupon, redeemCoupon } = require('../controllers/couponController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/coupons/generate',  protect, generateCoupon);
router.get('/coupons/my',         protect, getMyCoupons);
router.post('/coupons/validate',  protect, validateCoupon);
router.post('/coupons/redeem',    protect, redeemCoupon);

module.exports = router;
