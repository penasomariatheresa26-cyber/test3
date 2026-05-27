const db = require('./db.cjs');

async function initDb() {
  try {
    console.log('initializing mysql database tables...');

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        wallet_balance DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        image VARCHAR(500) NOT NULL,
        category VARCHAR(50) NOT NULL,
        available BOOLEAN DEFAULT TRUE,
        featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        user_id INT NULL,
        customer_name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'cash-on-delivery',
        status VARCHAR(50) DEFAULT 'pending',
        total DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(50) PRIMARY KEY,
        order_id VARCHAR(50),
        menu_item_id VARCHAR(50),
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const admin = await db.query(
      'SELECT id FROM users WHERE email = ?',
      ['admin@restaurant.com']
    );

    if (admin.rows.length === 0) {
      await db.query(
        `
        INSERT INTO users 
        (name, email, password_hash, role, wallet_balance) 
        VALUES (?, ?, ?, ?, ?)
        `,
        ['Admin User', 'admin@restaurant.com', 'admin123', 'admin', 0.00]
      );
    }

    console.log('✅ mysql database ready');
  } catch (error) {
    console.error('❌ database init failed:', error.message);
  }
}

module.exports = initDb;
