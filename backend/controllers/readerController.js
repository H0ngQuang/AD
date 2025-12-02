const UserDAO = require('../models/UserDAO');

function searchReaders(req, res) {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Name parameter is required' });

  UserDAO.searchReadersByName(name, (err, readers) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(readers);
  });
}

module.exports = { searchReaders };
