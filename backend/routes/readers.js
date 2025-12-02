const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const readerController = require('../controllers/readerController');

const router = express.Router();

// Search readers by name
router.get('/search', authenticateToken, requireRole('staff'), readerController.searchReaders);

module.exports = router;

