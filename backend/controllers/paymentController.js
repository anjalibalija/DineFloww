const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../prisma/client');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// POST /api/payment/create-order
// Creates a Razorpay order before the user pays
exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required.' });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects paise (amount * 100)
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
};

// POST /api/payment/verify
// Verifies Razorpay payment signature and then creates the booking
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      // Booking details
      restaurantId, tableId, bookingDate, bookingTime, peopleCount, specialRequest
    } = req.body;

    // Step 1: Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    // Step 2: Check table is not already booked
    const parsedDate = new Date(bookingDate);
    const existingBooking = await prisma.booking.findFirst({
      where: { tableId, bookingDate: parsedDate, bookingTime }
    });

    if (existingBooking) {
      return res.status(400).json({ success: false, message: 'Table is already booked for this time slot.' });
    }

    // Step 3: Create booking after successful payment
    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        restaurantId,
        tableId,
        bookingDate: parsedDate,
        bookingTime,
        peopleCount: parseInt(peopleCount, 10),
        specialRequest: specialRequest || '',
        status: 'Confirmed',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      }
    });

    // Step 4: Update table booking count
    await prisma.restaurantTable.update({
      where: { id: tableId },
      data: { bookingCount: { increment: 1 }, isBestseller: true }
    });

    res.status(201).json({ success: true, data: booking, message: 'Payment verified and booking confirmed!' });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ success: false, message: err.message || 'Payment verification failed.' });
  }
};
