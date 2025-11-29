const express = require('express');
const { getDb } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Search readers by name
router.get('/search', authenticateToken, requireRole('staff'), (req, res) => {
  const db = getDb();
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Name parameter is required' });
  }

  db.all(`
    SELECT 
      id,
      full_name,
      birth_date,
      cccd,
      phone,
      address,
      points
    FROM users
    WHERE role = 'reader' AND full_name LIKE ?
    ORDER BY full_name
  `, [`%${name}%`], (err, readers) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(readers);
  });
});

module.exports = router;

