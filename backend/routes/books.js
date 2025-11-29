const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all books
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  
  db.all('SELECT * FROM books ORDER BY code', (err, books) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(books);
  });
});

// Check book availability
router.get('/availability/:bookId', authenticateToken, (req, res) => {
  const db = getDb();
  const { bookId } = req.params;

  db.get('SELECT stock FROM books WHERE id = ?', [bookId], (err, book) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ stock: book.stock });
  });
});

module.exports = router;

