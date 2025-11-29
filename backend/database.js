const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.sqlite');

let db;

function initDatabase() {
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('Connected to SQLite database');
      createTables();
      insertSampleData();
    }
  });
}

function createTables() {
  // Users table (readers and staff)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    cccd TEXT,
    birth_date TEXT,
    role TEXT NOT NULL CHECK(role IN ('reader', 'staff')),
    points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Branches table
  db.run(`CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Books table
  db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price_per_day INTEGER NOT NULL,
    stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tickets table
  db.run(`CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    barcode TEXT UNIQUE NOT NULL,
    reader_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    order_date TEXT NOT NULL,
    expected_receive_date TEXT NOT NULL,
    expected_return_date TEXT NOT NULL,
    actual_receive_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'received', 'borrowing', 'returned', 'cancelled')),
    total_rental_price INTEGER DEFAULT 0,
    deposit INTEGER DEFAULT 0,
    discount INTEGER DEFAULT 0,
    final_amount INTEGER DEFAULT 0,
    loyalty_package_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reader_id) REFERENCES users(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id)
  )`);

  // Ticket items table
  db.run(`CREATE TABLE IF NOT EXISTS ticket_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    quantity_ordered INTEGER NOT NULL DEFAULT 1,
    quantity_received INTEGER DEFAULT 0,
    rental_price INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
  )`);

  // Loyalty packages table
  db.run(`CREATE TABLE IF NOT EXISTS loyalty_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    required_points INTEGER NOT NULL,
    max_discount INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

function insertSampleData() {
  const hashedPassword = bcrypt.hashSync('password123', 10);
  const staffPassword = bcrypt.hashSync('1', 10);

  // Insert sample users
  db.run(`INSERT OR IGNORE INTO users (username, password, full_name, phone, address, cccd, birth_date, role, points) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['reader1', hashedPassword, 'Hồng Quang', '03456', 'Hà Nội', '12345', '2004-08-02', 'reader', 350]);

  db.run(`INSERT OR IGNORE INTO users (username, password, full_name, phone, address, cccd, birth_date, role, points) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['b', staffPassword, 'Trần Thị Hồng', '035648', 'Dương Nội, Hà Đông', '24512', '1990-01-01', 'staff', 0]);

  // Insert branch
  db.run(`INSERT OR IGNORE INTO branches (id, name, address) VALUES (?, ?, ?)`,
    [1, 'Chi nhánh Mỹ Đình – Thư viện Cơ sở 2', 'Mỹ Đình, Hà Nội']);

  // Insert books
  const books = [
    ['S001', 'Lập Trình Java Cơ Bản', 5000, 10],
    ['S036', 'Cấu Trúc Dữ Liệu & Giải Thuật', 6000, 8],
    ['S096', 'Thiết Kế Hệ Thống – System Design', 8000, 5],
    ['S666', 'Cơ sở dữ liệu', 7000, 7]
  ];

  books.forEach(([code, name, price, stock]) => {
    db.run(`INSERT OR IGNORE INTO books (code, name, price_per_day, stock) VALUES (?, ?, ?, ?)`,
      [code, name, price, stock]);
  });

  // Insert loyalty packages
  db.run(`INSERT OR IGNORE INTO loyalty_packages (code, name, required_points, max_discount) VALUES (?, ?, ?, ?)`,
    ['TD1', 'Gói tích điểm 1', 300, 20000]);
  db.run(`INSERT OR IGNORE INTO loyalty_packages (code, name, required_points, max_discount) VALUES (?, ?, ?, ?)`,
    ['TD2', 'Gói tích điểm 2', 50, 30000]);

  // Insert sample tickets
  db.get(`SELECT id FROM users WHERE username = 'reader1'`, (err, reader) => {
    if (err || !reader) return;

    const readerId = reader.id;

    // Helper function to get or create ticket
    function getOrCreateTicket(code, ticketData, callback) {
      db.get('SELECT id FROM tickets WHERE code = ?', [code], (err, existing) => {
        if (err) return callback(err, null);
        
        if (existing) {
          callback(null, existing.id);
        } else {
          db.run(`INSERT INTO tickets (code, barcode, reader_id, branch_id, order_date, expected_receive_date, expected_return_date, actual_receive_date, status, total_rental_price, deposit, final_amount) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ticketData, function(err) {
              if (err) return callback(err, null);
              callback(null, this.lastID);
            });
        }
      });
    }

    // PM01 - Đã nhận (2 sách)
    getOrCreateTicket('PM01', ['PM01', '123456789001', readerId, 1, '2025-11-10 10:00:00', '2025-11-19 09:00:00', '2025-12-10 17:00:00', '2025-11-19 09:00:00', 'received', 120000, 100000, 220000], (err, ticketId1) => {
      if (!err && ticketId1) {
        db.run(`INSERT OR IGNORE INTO ticket_items (ticket_id, book_id, quantity_ordered, quantity_received, rental_price, total_price) 
          VALUES (?, (SELECT id FROM books WHERE code = 'S001'), 1, 1, 5000, 35000)`, [ticketId1]);
        db.run(`INSERT OR IGNORE INTO ticket_items (ticket_id, book_id, quantity_ordered, quantity_received, rental_price, total_price) 
          VALUES (?, (SELECT id FROM books WHERE code = 'S036'), 1, 1, 6000, 42000)`, [ticketId1]);
      }
    });

    // PM36 - Chưa nhận (4 sách)
    getOrCreateTicket('PM36', ['PM36', '123456789036', readerId, 1, '2025-11-12 17:15:00', '2025-11-30 16:00:00', '2025-12-13 00:00:00', null, 'pending', 186000, 200000, 386000], (err, ticketId2) => {
      if (!err && ticketId2) {
        db.run(`INSERT OR IGNORE INTO ticket_items (ticket_id, book_id, quantity_ordered, rental_price, total_price) 
          VALUES (?, (SELECT id FROM books WHERE code = 'S001'), 1, 5000, 35000)`, [ticketId2]);
        db.run(`INSERT OR IGNORE INTO ticket_items (ticket_id, book_id, quantity_ordered, rental_price, total_price) 
          VALUES (?, (SELECT id FROM books WHERE code = 'S036'), 1, 6000, 42000)`, [ticketId2]);
        db.run(`INSERT OR IGNORE INTO ticket_items (ticket_id, book_id, quantity_ordered, rental_price, total_price) 
          VALUES (?, (SELECT id FROM books WHERE code = 'S096'), 1, 8000, 56000)`, [ticketId2]);
        db.run(`INSERT OR IGNORE INTO ticket_items (ticket_id, book_id, quantity_ordered, rental_price, total_price) 
          VALUES (?, (SELECT id FROM books WHERE code = 'S666'), 1, 7000, 49000)`, [ticketId2]);
      }
    });

    // PM99 - Chưa nhận (5 sách)
    getOrCreateTicket('PM99', ['PM99', '123456789099', readerId, 1, '2025-11-15 10:00:00', '2025-11-30 16:00:00', '2025-12-15 17:00:00', null, 'pending', 250000, 250000, 500000], (err, ticketId3) => {
      if (!err && ticketId3) {
        // Add 5 books to PM99
        const bookCodes = ['S001', 'S036', 'S096', 'S666', 'S001'];
        bookCodes.forEach((bookCode) => {
          db.run(`INSERT OR IGNORE INTO ticket_items (ticket_id, book_id, quantity_ordered, rental_price, total_price) 
            VALUES (?, (SELECT id FROM books WHERE code = ?), 1, 
              (SELECT price_per_day FROM books WHERE code = ?), 
              (SELECT price_per_day * 7 FROM books WHERE code = ?))`, 
            [ticketId3, bookCode, bookCode, bookCode]);
        });
      }
    });
  });
}

function getDb() {
  return db;
}

module.exports = { initDatabase, getDb };

