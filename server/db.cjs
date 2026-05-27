const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

function createPoolConfig() {
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (dbUrl) {
    const url = new URL(dbUrl);

    return {
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace('/', ''),
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  }

  const host = process.env.DB_HOST || process.env.MYSQL_HOST;
  const port = process.env.DB_PORT || process.env.MYSQL_PORT;
  const user = process.env.DB_USER || process.env.MYSQL_USER;
  const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD;
  const database = process.env.DB_NAME || process.env.MYSQL_DATABASE;

  if (!host || !user || !password || !database) {
    console.error('❌ no database configuration found');
    return null;
  }

  return {
    host,
    port: Number(port || 3306),
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

function getPool() {
  if (!pool) {
    const config = createPoolConfig();

    if (!config) return null;

    pool = mysql.createPool(config);
  }

  return pool;
}

async function query(sql, params = []) {
  const p = getPool();

  if (!p) {
    throw new Error('database not configured');
  }

  const [rows] = await p.execute(sql, params);
  return { rows };
}

async function getConnection() {
  const p = getPool();

  if (!p) {
    throw new Error('database not configured');
  }

  return p.getConnection();
}

async function testConnection() {
  try {
    const p = getPool();

    if (!p) return false;

    const conn = await p.getConnection();
    await conn.ping();
    conn.release();

    console.log('✅ connected to mysql database');
    return true;
  } catch (error) {
    console.error('❌ mysql connection error:', error.message);
    return false;
  }
}

testConnection();

module.exports = {
  query,
  getPool,
  getConnection,
  pool: {
    connect: async () => {
      const conn = await getConnection();

      return {
        query: async (sql, params = []) => {
          const [rows] = await conn.query(sql, params);
          return { rows };
        },
        release: () => conn.release(),
      };
    },
  },
};
