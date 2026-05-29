const express = require('express');
const {
  getRecommendations,
  getTableSuggestion,
  getCrowdPrediction,
  chat,
  digitizeMenu,
  optimizeLayout,
  geocodeAddress,
  reverseGeocode
} = require('../controllers/aiController');

const router = express.Router();

router.get('/recommendations', getRecommendations);
router.post('/table-suggestion', getTableSuggestion);
router.post('/crowd-prediction', getCrowdPrediction);
router.post('/chat', chat);
router.post('/digitize-menu', digitizeMenu);
router.post('/optimize-layout', optimizeLayout);
router.post('/geocode', geocodeAddress);
router.post('/reverse-geocode', reverseGeocode);

module.exports = router;
