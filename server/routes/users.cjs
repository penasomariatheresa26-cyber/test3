const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db.cjs');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

// read users from mysql workbench table
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        name,
        email,
        role,
        wallet_balance,
        created_at,
        CASE WHEN role = 'admin' THEN true ELSE false END AS is_admin
      FROM users
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('[get /api/users]', error.message);
    res.status(500).json({ error: 'failed to fetch users' });
  }
});

// register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'all fields are required' });
    }

    const existing = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.query(
      `
      INSERT INTO users 
      (name, email, password, role, wallet_balance) 
      VALUES (?, ?, ?, 'user', 0.00)
      `,
      [name, email.toLowerCase(), passwordHash]
    );

    const created = await db.query(
      `
      SELECT 
        id,
        name,
        email,
        role,
        wallet_balance,
        created_at,
        CASE WHEN role = 'admin' THEN true ELSE false END AS is_admin
      FROM users
      WHERE email = ?
      `,
      [email.toLowerCase()]
    );

    const user = created.rows[0];

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        is_admin: !!user.is_admin,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: !!user.is_admin,
      },
      token,
    });
  } catch (error) {
    console.error('[post /api/users/register]', error.message);
    res.status(500).json({ error: 'registration failed' });
  }
});

// login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const result = await db.query(
      `
      SELECT 
        id,
        name,
        email,
        password,
        role,
        wallet_balance,
        created_at,
        CASE WHEN role = 'admin' THEN true ELSE false END AS is_admin
      FROM users
      WHERE email = ?
      `,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'no account found with this email' });
    }

    const user = result.rows[0];

    let isValidPassword = false;

    if (user.password && user.password.startsWith('$2')) {
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      // supports your current sample data like admin123/user123 in workbench
      isValidPassword = password === user.password;
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: 'incorrect password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        is_admin: !!user.is_admin,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: !!user.is_admin,
      },
      token,
    });
  } catch (error) {
    console.error('[post /api/users/login]', error.message);
    res.status(500).json({ error: 'login failed' });
  }
});

// update user role
router.put('/:id/admin', async (req, res) => {
  try {
    const role = req.body.is_admin ? 'admin' : 'user';

    await db.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, req.params.id]
    );

    const result = await db.query(
      `
      SELECT 
        id,
        name,
        email,
        role,
        wallet_balance,
        created_at,
        CASE WHEN role = 'admin' THEN true ELSE false END AS is_admin
      FROM users
      WHERE id = ?
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'user not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('[put /api/users/:id/admin]', error.message);
    res.status(500).json({ error: 'failed to update user' });
  }
});

// delete user
router.delete('/:id', async (req, res) => {
  try {
    const check = await db.query(
      'SELECT id FROM users WHERE id = ?',
      [req.params.id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'user not found' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);

    res.json({ message: 'user deleted' });
  } catch (error) {
    console.error('[delete /api/users/:id]', error.message);
    res.status(500).json({ error: 'failed to delete user' });
  }
});

module.exports = router;
