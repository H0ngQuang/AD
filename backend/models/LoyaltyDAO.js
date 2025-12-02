const { getDb } = require('../database');

function getAllPackages(callback) {
  const db = getDb();
  db.all('SELECT * FROM loyalty_packages ORDER BY required_points ASC', callback);
}

function getPackageByCode(code, callback) {
  const db = getDb();
  db.get('SELECT * FROM loyalty_packages WHERE code = ?', [code], callback);
}

module.exports = { getAllPackages, getPackageByCode };
