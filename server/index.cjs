const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes → MySQL tables
app.use('/api/menu', require('./routes/menu.cjs'));
app.use('/api/orders', require('./routes/orders.cjs'));
app.use('/api/users', require('./routes/users.cjs'));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./db.cjs');
    const result = await db.query('SELECT NOW() as time');
    res.json({ status: 'ok', database: 'connected', serverTime: result.rows[0].time });
  } catch (error) {
    res.json({ status: 'ok', database: 'disconnected', error: error.message });
  }
});

// Init MySQL tables + seed data on startup
const initDb = require('./init-db.cjs');
initDb();

// Production: serve React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: MySQL ${process.env.DATABASE_URL ? '(Aiven)' : process.env.DB_HOST ? '(Custom)' : 'NOT CONFIGURED'}`);
});
