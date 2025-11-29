const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const { initDatabase } = require('./backend/database');
initDatabase();

// Routes
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/tickets', require('./backend/routes/tickets'));
app.use('/api/staff', require('./backend/routes/staff'));
app.use('/api/books', require('./backend/routes/books'));
app.use('/api/readers', require('./backend/routes/readers'));

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

