const express = require('express');
const { toggleFavorite, getMyFavorites } = require('../controllers/favoriteController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getMyFavorites);

router.route('/:restaurantId')
  .post(toggleFavorite);

module.exports = router;
