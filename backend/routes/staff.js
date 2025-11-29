const express = require('express');
const { getDb } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Search ticket by code or barcode or ID
router.get('/search-ticket/:ticketIdentifier', authenticateToken, requireRole('staff'), (req, res) => {
  const db = getDb();
  const { ticketIdentifier } = req.params;
  const isNumeric = /^\d+$/.test(ticketIdentifier);

  const query = isNumeric 
    ? `SELECT 
        t.*,
        b.name as branch_name,
        u.full_name as reader_name,
        u.phone as reader_phone,
        u.address as reader_address,
        u.cccd as reader_cccd,
        u.points as reader_points
      FROM tickets t
      LEFT JOIN branches b ON t.branch_id = b.id
      LEFT JOIN users u ON t.reader_id = u.id
      WHERE t.id = ?`
    : `SELECT 
        t.*,
        b.name as branch_name,
        u.full_name as reader_name,
        u.phone as reader_phone,
        u.address as reader_address,
        u.cccd as reader_cccd,
        u.points as reader_points
      FROM tickets t
      LEFT JOIN branches b ON t.branch_id = b.id
      LEFT JOIN users u ON t.reader_id = u.id
      WHERE t.code = ? OR t.barcode = ?`;

  const params = isNumeric ? [ticketIdentifier] : [ticketIdentifier, ticketIdentifier];

  db.get(query, params, (err, ticket) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Get ticket items with book details
    db.all(`
      SELECT 
        ti.*,
        bk.code as book_code,
        bk.name as book_name,
        bk.price_per_day,
        bk.stock
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

// Get tickets by reader ID
router.get('/reader/:readerId/tickets', authenticateToken, requireRole('staff'), (req, res) => {
  const db = getDb();
  const { readerId } = req.params;

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
  `, [readerId], (err, tickets) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(tickets);
  });
});

// Get loyalty packages
router.get('/loyalty-packages', authenticateToken, requireRole('staff'), (req, res) => {
  const db = getDb();

  db.all('SELECT * FROM loyalty_packages ORDER BY required_points ASC', (err, packages) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(packages);
  });
});

// Apply loyalty package to ticket
router.post('/apply-loyalty/:ticketId', authenticateToken, requireRole('staff'), (req, res) => {
  const db = getDb();
  const { ticketId } = req.params;
  const { packageCode } = req.body;

  // Get ticket and reader info
  db.get(`
    SELECT t.*, u.points as reader_points
    FROM tickets t
    LEFT JOIN users u ON t.reader_id = u.id
    WHERE t.id = ?
  `, [ticketId], (err, ticket) => {
    if (err || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Get loyalty package
    db.get('SELECT * FROM loyalty_packages WHERE code = ?', [packageCode], (err, pkg) => {
      if (err || !pkg) {
        return res.status(404).json({ error: 'Loyalty package not found' });
      }

      // Check if reader has enough points
      if (ticket.reader_points < pkg.required_points) {
        return res.status(400).json({ error: 'Insufficient points' });
      }

      // Calculate discount (cannot exceed max_discount)
      const discount = Math.min(pkg.max_discount, ticket.total_rental_price + ticket.deposit);
      const finalAmount = ticket.total_rental_price + ticket.deposit - discount;

      // Update ticket
      db.run(`
        UPDATE tickets 
        SET discount = ?, final_amount = ?, loyalty_package_code = ?
        WHERE id = ?
      `, [discount, finalAmount, packageCode, ticketId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          discount,
          finalAmount,
          packageCode: pkg.code,
          packageName: pkg.name
        });
      });
    });
  });
});

// Confirm loan
router.post('/confirm-loan/:ticketId', authenticateToken, requireRole('staff'), (req, res) => {
  const db = getDb();
  const { ticketId } = req.params;
  const { items } = req.body; // Array of {bookId, quantityReceived}

  // Get ticket
  db.get('SELECT * FROM tickets WHERE id = ?', [ticketId], (err, ticket) => {
    if (err || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status !== 'pending') {
      return res.status(400).json({ error: 'Ticket is not in pending status' });
    }

    // Start transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Update ticket items with received quantities
      if (items && Array.isArray(items)) {
        items.forEach(({ bookId, quantityReceived }) => {
          db.run(`
            UPDATE ticket_items 
            SET quantity_received = ?
            WHERE ticket_id = ? AND book_id = ?
          `, [quantityReceived, ticketId, bookId]);
        });
      } else {
        // If no items specified, set all to ordered quantity
        db.run(`
          UPDATE ticket_items 
          SET quantity_received = quantity_ordered
          WHERE ticket_id = ?
        `, [ticketId]);
      }

      // Update ticket status and receive date
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      db.run(`
        UPDATE tickets 
        SET status = 'received', actual_receive_date = ?
        WHERE id = ?
      `, [now, ticketId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Database error' });
        }

        // Update book stock
        db.all('SELECT book_id, quantity_received FROM ticket_items WHERE ticket_id = ?', [ticketId], (err, ticketItems) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Database error' });
          }

          ticketItems.forEach(({ book_id, quantity_received }) => {
            db.run('UPDATE books SET stock = stock - ? WHERE id = ?', [quantity_received, book_id]);
          });

          // Deduct loyalty points if used
          if (ticket.loyalty_package_code) {
            db.get('SELECT required_points FROM loyalty_packages WHERE code = ?', [ticket.loyalty_package_code], (err, pkg) => {
              if (!err && pkg) {
                db.run('UPDATE users SET points = points - ? WHERE id = ?', [pkg.required_points, ticket.reader_id]);
              }
            });
          }

          db.run('COMMIT', (err) => {
            if (err) {
              return res.status(500).json({ error: 'Transaction error' });
            }

            // Get updated ticket
            db.get(`
              SELECT 
                t.*,
                b.name as branch_name,
                u.full_name as reader_name,
                u.phone as reader_phone
              FROM tickets t
              LEFT JOIN branches b ON t.branch_id = b.id
              LEFT JOIN users u ON t.reader_id = u.id
              WHERE t.id = ?
            `, [ticketId], (err, updatedTicket) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({ message: 'Loan confirmed successfully', ticket: updatedTicket });
            });
          });
        });
      });
    });
  });
});

// Cancel ticket
router.post('/cancel-ticket/:ticketId', authenticateToken, requireRole('staff'), (req, res) => {
  const db = getDb();
  const { ticketId } = req.params;

  db.get('SELECT * FROM tickets WHERE id = ?', [ticketId], (err, ticket) => {
    if (err || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending tickets can be cancelled' });
    }

    db.run('UPDATE tickets SET status = ? WHERE id = ?', ['cancelled', ticketId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ message: 'Ticket cancelled successfully' });
    });
  });
});

module.exports = router;

