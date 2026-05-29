const express = require('express');
const {
  getTablesByRestaurant,
  createTable,
  updateTable
} = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/auth');

// Merge parameters to access restaurantId from restaurant router if needed, though here we define it directly
const router = express.Router({ mergeParams: true });

// Note: The root of this router might be mounted differently depending on use.
// Usually /api/restaurants/:id/tables -> we handle it here or in server.js
// We'll export the router and mount it in server.js accordingly.

router
  .route('/')
  .get(getTablesByRestaurant)
  .post(protect, authorize('admin'), createTable);

// For /api/tables/:id
// We will create a separate export for the global table routes if needed, 
// or just handle everything here by splitting the mount path in server.js.
// Since the prompt asks for:
// GET /api/restaurants/:id/tables
// POST /api/restaurants/:id/tables
// PUT /api/tables/:id

module.exports = router;
