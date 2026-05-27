const db = require('./db.cjs');
const bcrypt = require('bcryptjs');

async function initDb() {
  try {
    console.log('🔧 Initializing MySQL database tables...');

    // ========== USERS TABLE ==========
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ users table ready');

    // ========== MENU ITEMS TABLE ==========
    await db.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(500) NOT NULL,
        category VARCHAR(50) NOT NULL,
        available BOOLEAN DEFAULT TRUE,
        featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ menu_items table ready');

    // ========== ORDERS TABLE ==========
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(36),
        customer_name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'cash-on-delivery',
        status VARCHAR(50) DEFAULT 'pending',
        total DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('  ✓ orders table ready');

    // ========== ORDER ITEMS TABLE ==========
    await db.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        order_id VARCHAR(50),
        menu_item_id VARCHAR(50),
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
      )
    `);
    console.log('  ✓ order_items table ready');

    // ========== INDEXES ==========
    try { await db.query(`CREATE INDEX idx_users_email ON users(email)`); } catch(e) {}
    try { await db.query(`CREATE INDEX idx_menu_category ON menu_items(category)`); } catch(e) {}
    try { await db.query(`CREATE INDEX idx_orders_user ON orders(user_id)`); } catch(e) {}
    try { await db.query(`CREATE INDEX idx_orders_status ON orders(status)`); } catch(e) {}
    try { await db.query(`CREATE INDEX idx_oi_order ON order_items(order_id)`); } catch(e) {}
    console.log('  ✓ indexes ready');

    // ========== SEED ADMIN ==========
    const [adminRows] = await db.query("SELECT id FROM users WHERE email = ?", ['admin@theresse.com']).then(r => [r.rows]);
    if (adminRows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      const adminId = 'admin-' + Date.now();
      await db.query(
        `INSERT INTO users (id, email, password, name, is_admin) VALUES (?, ?, ?, ?, true)`,
        [adminId, 'admin@theresse.com', hash, 'Admin']
      );
      console.log('  ✓ admin account seeded (admin@theresse.com / admin123)');
    } else {
      console.log('  ✓ admin account exists');
    }

    // ========== SEED MENU ITEMS ==========
    const countResult = await db.query('SELECT COUNT(*) as c FROM menu_items');
    if (parseInt(countResult.rows[0].c) === 0) {
      const items = [
        ['1','Grilled Chicken Platter','Tender grilled chicken breast served with roasted vegetables, garlic mashed potatoes, and our signature herb sauce.',259,'/images/food-1.jpg','meals',true,true],
        ['2','Classic Beef Burger','Juicy beef patty with lettuce, tomato, pickles, and special sauce on a toasted brioche bun. Served with crispy fries.',199,'/images/food-2.jpg','meals',true,true],
        ['3','Pasta Pomodoro','Al dente spaghetti tossed in a rich tomato basil sauce with fresh parmesan cheese and aromatic Italian herbs.',175,'/images/food-3.jpg','meals',true,true],
        ['4','Chocolate Lava Cake','Warm chocolate cake with a molten center, topped with fresh berries and a dusting of powdered sugar.',145,'/images/food-4.jpg','desserts',true,true],
        ['5','Shrimp Salad','Fresh mixed greens with grilled shrimp, cherry tomatoes, and citrus vinaigrette dressing.',185,'/images/food-5.jpg','meals',true,false],
        ['6','Iced Coffee Frappe','Blended iced coffee with milk, caramel drizzle, and whipped cream.',85,'/images/food-6.jpg','drinks',true,false],
        ['7','Mango Smoothie','Fresh mango blended with yogurt, honey, and ice. Naturally sweet and refreshing.',75,'/images/food-6.jpg','drinks',true,false],
        ['8','Garlic Bread Basket','Warm garlic bread toasted to perfection with butter, garlic, and fresh parsley.',65,'/images/food-2.jpg','sides',true,false],
        ['9','Leche Flan','Classic Filipino custard dessert with caramelized sugar topping. Smooth and creamy.',95,'/images/food-4.jpg','desserts',true,false],
        ['10','Caesar Salad','Crisp romaine lettuce with parmesan cheese, croutons, and creamy Caesar dressing.',125,'/images/food-5.jpg','sides',true,false],
        ['11','Calamansi Juice','Freshly squeezed calamansi juice with a hint of honey. Served ice cold.',45,'/images/food-6.jpg','drinks',true,false],
        ['12','Pork BBQ Platter','Slow-cooked pork BBQ skewers glazed with house-made sweet BBQ sauce, served with java rice.',189,'/images/food-1.jpg','meals',true,false],
      ];
      for (const i of items) {
        await db.query(
          `INSERT IGNORE INTO menu_items (id,name,description,price,image,category,available,featured) VALUES (?,?,?,?,?,?,?,?)`, i
        );
      }
      console.log('  ✓ 12 menu items seeded');
    } else {
      console.log(`  ✓ ${countResult.rows[0].c} menu items exist`);
    }

    console.log('🎉 MySQL database ready!');
  } catch (error) {
    console.error('❌ Database init failed:', error.message);
    console.log('⚠️  App will run in offline/local mode');
  }
}

module.exports = initDb;
