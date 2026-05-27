const mysql = require('mysql2/promise');
require('dotenv').config();

// Aiven MySQL connection
// Format: mysql://user:password@host:port/database?ssl-mode=REQUIRED
let pool;

function getPool() {
  if (!pool) {
    const dbUrl = process.env.DATABASE_URL;

    if (dbUrl) {
      // Parse Aiven MySQL connection string
      const url = new URL(dbUrl);
      pool = mysql.createPool({
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.replace('/', ''),
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    } else if (process.env.DB_HOST) {
      // Individual env vars
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    } else {
      console.error('❌ No database configuration found');
      return null;
    }
  }
  return pool;
}

// Query wrapper — returns { rows } to keep same interface
async function query(sql, params) {
  const p = getPool();
  if (!p) throw new Error('Database not configured');
  const [rows] = await p.execute(sql, params || []);
  return { rows };
}

// Get raw pool for transactions
function getRawPool() {
  return getPool();
}

// Test connection
async function testConnection() {
  try {
    const p = getPool();
    if (!p) return false;
    const conn = await p.getConnection();
    console.log('✅ Connected to MySQL database');
    conn.release();
    return true;
  } catch (err) {
    console.error('❌ MySQL connection error:', err.message);
    return false;
  }
}

testConnection();

module.exports = { query, pool: { connect: async () => {
  const p = getPool();
  const conn = await p.getConnection();
  return {
    query: (sql, params) => conn.execute(sql, params || []),
    release: () => conn.release(),
  };
}}};
