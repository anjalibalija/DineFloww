const express = require('express');
const {
  createBooking,
  getMyBookings,
  deleteBooking,
  getAllBookings
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All booking routes require authentication
router.use(protect);

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.delete('/:id', deleteBooking);

// Admin only route
router.get('/admin/all', authorize('admin'), getAllBookings);

module.exports = router;
