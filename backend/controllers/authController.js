const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserDAO = require('../models/UserDAO');
const { JWT_SECRET } = require('../middleware/auth');

function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  UserDAO.findByUsername(username, (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: 'Authentication error' });
      if (!isMatch) return res.status(401).json({ error: 'Invalid username or password' });

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          phone: user.phone,
          address: user.address,
          cccd: user.cccd,
          birthDate: user.birth_date,
          role: user.role,
          points: user.points
        }
      });
    });
  });
}

module.exports = { login };
