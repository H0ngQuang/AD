const express = require('express');
const { getDb } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all tickets for logged-in reader
router.get('/my-tickets', authenticateToken, requireRole('reader'), (req, res) => {
  const db = getDb();
  const userId = req.user.id;

  db.all(`
    SELECT 
      t.*,
      b.name as branch_name,
      COUNT(ti.id) as book_count
    FROM tickets t
    LEFT JOIN branches b ON t.branch_id = b.id
    LEFT JOIN ticket_items ti ON t.id = ti.ticket_id
    WHERE t.reader_id = ?
    GROUP BY t.id
    ORDER BY t.order_date DESC
  `, [userId], (err, tickets) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(tickets);
  });
});

// Get ticket details by code
router.get('/:ticketCode', authenticateToken, requireRole('reader'), (req, res) => {
  const db = getDb();
  const { ticketCode } = req.params;
  const userId = req.user.id;

  db.get(`
    SELECT 
      t.*,
      b.name as branch_name,
      u.full_name as reader_name,
      u.phone as reader_phone
    FROM tickets t
    LEFT JOIN branches b ON t.branch_id = b.id
    LEFT JOIN users u ON t.reader_id = u.id
    WHERE t.code = ? AND t.reader_id = ?
  `, [ticketCode, userId], (err, ticket) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Get ticket items
    db.all(`
      SELECT 
        ti.*,
        bk.code as book_code,
        bk.name as book_name,
        bk.price_per_day
      FROM ticket_items ti
      LEFT JOIN books bk ON ti.book_id = bk.id
      WHERE ti.ticket_id = ?
    `, [ticket.id], (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      ticket.items = items;
      res.json(ticket);
    });
  });
});

module.exports = router;

