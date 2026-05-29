const express = require('express');
const {
  createReview,
  getRestaurantReviews,
  getMyReviews,
  getAdminReviews
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/restaurant/:restaurantId')
  .get(getRestaurantReviews);

router.route('/')
  .post(protect, createReview);

router.route('/my')
  .get(protect, getMyReviews);

router.route('/admin')
  .get(protect, authorize('admin'), getAdminReviews);

module.exports = router;
