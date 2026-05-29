const express = require('express');
const { updateTable, deleteTable } = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.put('/:id', protect, authorize('admin'), updateTable);
router.delete('/:id', protect, authorize('admin'), deleteTable);

module.exports = router;
