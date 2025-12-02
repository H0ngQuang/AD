const { getDb } = require('../database');

function getTicketsByReader(readerId, callback) {
  const db = getDb();
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
  `, [readerId], callback);
}

function getTicketDetailsForReader(ticketCode, userId, callback) {
  const db = getDb();
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
    if (err) return callback(err);
    if (!ticket) return callback(null, null);
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
      if (err) return callback(err);
      ticket.items = items;
      callback(null, ticket);
    });
  });
}

function getTicketByIdentifier(identifier, callback) {
  const db = getDb();
  const isNumeric = /^\d+$/.test(identifier);
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

  const params = isNumeric ? [identifier] : [identifier, identifier];

  db.get(query, params, (err, ticket) => {
    if (err) return callback(err);
    if (!ticket) return callback(null, null);
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
      if (err) return callback(err);
      ticket.items = items;
      callback(null, ticket);
    });
  });
}

function getTicketsByReaderId(readerId, callback) {
  return getTicketsByReader(readerId, callback);
}

function applyLoyaltyToTicket(ticketId, packageCode, callback) {
  const db = getDb();
  db.get(`
    SELECT t.*, u.points as reader_points
    FROM tickets t
    LEFT JOIN users u ON t.reader_id = u.id
    WHERE t.id = ?
  `, [ticketId], (err, ticket) => {
    if (err || !ticket) return callback(err || new Error('Ticket not found'));

    db.get('SELECT * FROM loyalty_packages WHERE code = ?', [packageCode], (err, pkg) => {
      if (err || !pkg) return callback(err || new Error('Loyalty package not found'));

      if (ticket.reader_points < pkg.required_points) {
        return callback(new Error('Insufficient points'));
      }

      const discount = Math.min(pkg.max_discount, ticket.total_rental_price + ticket.deposit);
      const finalAmount = ticket.total_rental_price + ticket.deposit - discount;

      db.run(`
        UPDATE tickets 
        SET discount = ?, final_amount = ?, loyalty_package_code = ?
        WHERE id = ?
      `, [discount, finalAmount, packageCode, ticketId], (err) => {
        if (err) return callback(err);
        callback(null, { discount, finalAmount, packageCode: pkg.code, packageName: pkg.name });
      });
    });
  });
}

function confirmLoan(ticketId, items, callback) {
  const db = getDb();
  db.get('SELECT * FROM tickets WHERE id = ?', [ticketId], (err, ticket) => {
    if (err || !ticket) return callback(err || new Error('Ticket not found'));
    if (ticket.status !== 'pending') return callback(new Error('Ticket is not in pending status'));

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      if (items && Array.isArray(items)) {
        items.forEach(({ bookId, quantityReceived }) => {
          db.run(`
            UPDATE ticket_items 
            SET quantity_received = ?
            WHERE ticket_id = ? AND book_id = ?
          `, [quantityReceived, ticketId, bookId]);
        });
      } else {
        db.run(`
          UPDATE ticket_items 
          SET quantity_received = quantity_ordered
          WHERE ticket_id = ?
        `, [ticketId]);
      }

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      db.run(`
        UPDATE tickets 
        SET status = 'received', actual_receive_date = ?
        WHERE id = ?
      `, [now, ticketId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return callback(err);
        }

        db.all('SELECT book_id, quantity_received FROM ticket_items WHERE ticket_id = ?', [ticketId], (err, ticketItems) => {
          if (err) {
            db.run('ROLLBACK');
            return callback(err);
          }

          ticketItems.forEach(({ book_id, quantity_received }) => {
            db.run('UPDATE books SET stock = stock - ? WHERE id = ?', [quantity_received, book_id]);
          });

          if (ticket.loyalty_package_code) {
            db.get('SELECT required_points FROM loyalty_packages WHERE code = ?', [ticket.loyalty_package_code], (err, pkg) => {
              if (!err && pkg) {
                db.run('UPDATE users SET points = points - ? WHERE id = ?', [pkg.required_points, ticket.reader_id]);
              }
            });
          }

          db.run('COMMIT', (err) => {
            if (err) return callback(err);

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
              if (err) return callback(err);
              callback(null, { message: 'Loan confirmed successfully', ticket: updatedTicket });
            });
          });
        });
      });
    });
  });
}

function cancelTicket(ticketId, callback) {
  const db = getDb();
  db.get('SELECT * FROM tickets WHERE id = ?', [ticketId], (err, ticket) => {
    if (err || !ticket) return callback(err || new Error('Ticket not found'));
    if (ticket.status !== 'pending') return callback(new Error('Only pending tickets can be cancelled'));
    db.run('UPDATE tickets SET status = ? WHERE id = ?', ['cancelled', ticketId], (err) => {
      if (err) return callback(err);
      callback(null);
    });
  });
}

module.exports = {
  getTicketsByReader,
  getTicketDetailsForReader,
  getTicketByIdentifier,
  getTicketsByReaderId,
  applyLoyaltyToTicket,
  confirmLoan,
  cancelTicket
};
