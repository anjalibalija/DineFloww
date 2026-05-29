const express = require('express');
const {
  getRestaurants,
  getNearbyRestaurants,
  getRestaurant,
  getMyRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
} = require('../controllers/restaurantController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/nearby', getNearbyRestaurants);

// Admin: get only their own restaurants
router.get('/mine', protect, authorize('admin'), getMyRestaurants);

router
  .route('/')
  .get(getRestaurants)
  .post(protect, authorize('admin'), createRestaurant);

router
  .route('/:id')
  .get(getRestaurant)
  .put(protect, authorize('admin'), updateRestaurant)
  .delete(protect, authorize('admin'), deleteRestaurant);

module.exports = router;
