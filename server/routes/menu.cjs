const express = require('express');
const router = express.Router();
const db = require('../db.cjs');

// get all menu items
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        name,
        description,
        price,
        image,
        category,
        available,
        featured,
        created_at,
        updated_at
      FROM menu_items
      WHERE available = TRUE
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('[GET /api/menu]', error.message);
    res.status(500).json({ error: 'failed to fetch menu items' });
  }
});

module.exports = router;
