const express = require('express');
const router = express.Router();
const db = require('../db.cjs');

// GET /api/menu
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM menu_items ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('[GET /api/menu]', error.message);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// GET /api/menu/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[GET /api/menu/:id]', error.message);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// POST /api/menu
router.post('/', async (req, res) => {
  try {
    const { id, name, description, price, image, category, available, featured } = req.body;
    await db.query(
      'INSERT INTO menu_items (id,name,description,price,image,category,available,featured) VALUES (?,?,?,?,?,?,?,?)',
      [id, name, description, price, image, category, available ?? true, featured ?? false]
    );
    const result = await db.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    console.log(`[ADD MENU] "${name}" ₱${price} → MySQL`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[POST /api/menu]', error.message);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT /api/menu/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, description, price, image, category, available, featured } = req.body;
    await db.query(
      'UPDATE menu_items SET name=?,description=?,price=?,image=?,category=?,available=?,featured=? WHERE id=?',
      [name, description, price, image, category, available, featured, req.params.id]
    );
    const result = await db.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    console.log(`[UPDATE MENU] "${name}" → MySQL`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[PUT /api/menu/:id]', error.message);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/menu/:id
router.delete('/:id', async (req, res) => {
  try {
    const check = await db.query('SELECT name FROM menu_items WHERE id = ?', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    await db.query('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
    console.log(`[DELETE MENU] "${check.rows[0].name}" → MySQL`);
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('[DELETE /api/menu/:id]', error.message);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
