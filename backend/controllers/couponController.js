const prisma = require('../prisma/client');
const crypto = require('crypto');

// GET /api/coupons/my  — active, non-expired coupons for the logged-in user
exports.getMyCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { userId: req.user.id, isUsed: false, expiry: { gt: new Date() } },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/coupons/generate  — generate a queue-reward coupon for the logged-in user
// Called after the user solves the puzzle when queue length >= 5
exports.generateCoupon = async (req, res) => {
  try {
    const userId = req.user.id;

    // Prevent duplicate active coupons: check if user already has an unused, non-expired
    // queue-reward coupon (code starts with "QUEUE")
    const existing = await prisma.coupon.findFirst({
      where: {
        userId,
        isUsed: false,
        expiry: { gt: new Date() },
        code: { startsWith: 'QUEUE' }
      }
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        alreadyHad: true,
        data: existing,
        message: 'You already have an active queue-reward coupon!'
      });
    }

    // Random discount between 20% and 30%
    const discount = Math.floor(Math.random() * 11) + 20; // 20–30

    // Unique coupon code: QUEUE + 8 uppercase hex chars
    const code = 'QUEUE' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // Expires in 7 days
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const coupon = await prisma.coupon.create({
      data: { code, discount, userId, expiry }
    });

    res.status(201).json({
      success: true,
      data: coupon,
      message: `🎉 Coupon generated! Use code ${code} for ${discount}% off your booking.`
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/coupons/validate  — validate a coupon code at checkout (does NOT mark it used yet)
exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const coupon = await prisma.coupon.findFirst({
      where: { code: code.toUpperCase().trim(), userId: req.user.id }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found or does not belong to your account.' });
    }
    if (coupon.isUsed) {
      return res.status(400).json({ success: false, message: 'This coupon has already been redeemed.' });
    }
    if (coupon.expiry < new Date()) {
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    }

    res.status(200).json({
      success: true,
      data: { code: coupon.code, discount: coupon.discount, expiry: coupon.expiry },
      message: `Coupon valid! ${coupon.discount}% discount will be applied.`
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/coupons/redeem  — mark coupon as used after successful payment
exports.redeemCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const coupon = await prisma.coupon.findFirst({
      where: { code: code.toUpperCase().trim(), userId: req.user.id }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }
    if (coupon.isUsed) {
      return res.status(400).json({ success: false, message: 'Coupon already redeemed.' });
    }
    if (coupon.expiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon has expired.' });
    }

    const updated = await prisma.coupon.update({
      where: { id: coupon.id },
      data: { isUsed: true }
    });

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Coupon redeemed successfully!'
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
