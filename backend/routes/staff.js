const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const staffController = require('../controllers/staffController');

const router = express.Router();

router.get('/search-ticket/:ticketIdentifier', authenticateToken, requireRole('staff'), staffController.searchTicket);
router.get('/reader/:readerId/tickets', authenticateToken, requireRole('staff'), staffController.getTicketsByReader);
router.get('/loyalty-packages', authenticateToken, requireRole('staff'), staffController.getLoyaltyPackages);
router.post('/apply-loyalty/:ticketId', authenticateToken, requireRole('staff'), staffController.applyLoyalty);
router.post('/confirm-loan/:ticketId', authenticateToken, requireRole('staff'), staffController.confirmLoan);
router.post('/cancel-ticket/:ticketId', authenticateToken, requireRole('staff'), staffController.cancelTicket);

module.exports = router;

