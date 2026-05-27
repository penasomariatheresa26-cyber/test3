const express = require('express');
const router = express.Router();
const db = require('../db.cjs');

// GET /api/orders — fetch orders with items from MySQL
router.get('/', async (req, res) => {
  try {
    const { user_id, is_admin } = req.query;

    let orderSql = 'SELECT * FROM orders';
    const orderParams = [];
    if (is_admin !== 'true' && user_id) {
      orderSql += ' WHERE user_id = ?';
      orderParams.push(user_id);
    }
    orderSql += ' ORDER BY created_at DESC';

    const ordersResult = await db.query(orderSql, orderParams);

    const orders = [];
    for (const row of ordersResult.rows) {
      const itemsResult = await db.query(
        `SELECT oi.id, oi.quantity, oi.price,
                m.id as m_id, m.name as m_name, m.description as m_description,
                m.price as m_price, m.image as m_image, m.category as m_category,
                m.available as m_available, m.featured as m_featured
         FROM order_items oi
         LEFT JOIN menu_items m ON oi.menu_item_id = m.id
         WHERE oi.order_id = ?`,
        [row.id]
      );

      const items = itemsResult.rows.map(i => ({
        menuItem: {
          id: i.m_id,
          name: i.m_name,
          description: i.m_description,
          price: parseFloat(i.m_price),
          image: i.m_image,
          category: i.m_category,
          available: !!i.m_available,
          featured: !!i.m_featured,
        },
        quantity: i.quantity,
        price: parseFloat(i.price),
      }));

      orders.push({
        id: row.id,
        customerName: row.customer_name,
        address: row.address,
        phone: row.phone,
        paymentMethod: row.payment_method,
        status: row.status,
        total: parseFloat(row.total),
        createdAt: row.created_at,
        items,
      });
    }

    res.json(orders);
  } catch (error) {
    console.error('[GET /api/orders]', error.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /api/orders — insert order + items (transaction)
router.post('/', async (req, res) => {
  const conn = await db.pool.connect();
  try {
    await conn.query('START TRANSACTION');

    const { id, user_id, customer_name, address, phone, payment_method, total, items } = req.body;
    const orderId = id || 'ORD-' + Date.now();

    // insert into orders table
    await conn.query(
      'INSERT INTO orders (id,user_id,customer_name,address,phone,payment_method,status,total,created_at) VALUES (?,?,?,?,?,?,?,?,NOW())',
      [
        orderId,
        user_id,
        customer_name,
        address,
        phone,
        payment_method || 'cash-on-delivery',
        'pending',
        parseFloat(total),
      ]
    );

    for (const item of items) {
      const itemId = 'OI-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      await conn.query(
        'INSERT INTO order_items (id,order_id,menu_item_id,quantity,price) VALUES (?,?,?,?,?)',
        [itemId, orderId, item.menuItem.id, item.quantity, parseFloat(item.menuItem.price)]
      );
    }

    await conn.query('COMMIT');
    console.log(`[NEW ORDER] ${orderId} → ₱${total} → ${items.length} items → MySQL`);

    // return full order object including items so frontend can update immediately
    res.status(201).json({
      id: orderId,
      user_id,
      customerName: customer_name,
      address,
      phone,
      paymentMethod: payment_method || 'cash-on-delivery',
      status: 'pending',
      total: parseFloat(total),
      createdAt: new Date().toISOString(),
      items: items.map(i => ({
        menuItem: i.menuItem,
        quantity: i.quantity,
        price: parseFloat(i.menuItem.price),
      })),
    });
  } catch (error) {
    await conn.query('ROLLBACK');
    console.error('[POST /api/orders]', error.message);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    conn.release();
  }
});

// PUT /api/orders/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    const result = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    console.log(`[ORDER STATUS] ${req.params.id} → ${status} → MySQL`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[PUT /api/orders/:id/status]', error.message);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
