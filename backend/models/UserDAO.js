const { getDb } = require('../database');

function findByUsername(username, callback) {
  const db = getDb();
  db.get('SELECT * FROM users WHERE username = ?', [username], callback);
}

function getById(id, callback) {
  const db = getDb();
  db.get('SELECT * FROM users WHERE id = ?', [id], callback);
}

function searchReadersByName(name, callback) {
  const db = getDb();
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
  `, [`%${name}%`], callback);
}

function updatePoints(userId, points, callback) {
  const db = getDb();
  db.run('UPDATE users SET points = ? WHERE id = ?', [points, userId], callback);
}

module.exports = { findByUsername, getById, searchReadersByName, updatePoints };
