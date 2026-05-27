const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db.cjs');

const JWT_SECRET = process.env.JWT_SECRET || 'theresse-secret-2025';

// GET /api/users — all users from MySQL
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, is_admin, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[GET /api/users]', error.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users/register — insert into MySQL users table
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    await db.query(
      'INSERT INTO users (id, email, password, name, is_admin) VALUES (?, ?, ?, ?, false)',
      [id, email.toLowerCase(), hashedPassword, name]
    );

    const result = await db.query('SELECT id, email, name, is_admin, created_at FROM users WHERE id = ?', [id]);
    const user = result.rows[0];
    console.log(`[REGISTER] ${user.email} → saved to MySQL`);

    const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, isAdmin: !!user.is_admin }, token });
  } catch (error) {
    console.error('[REGISTER]', error.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/users/login — authenticate against MySQL
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const result = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'No account found with this email' });

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Incorrect password' });

    console.log(`[LOGIN] ${user.email} (${user.is_admin ? 'admin' : 'customer'})`);
    const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, isAdmin: !!user.is_admin }, token });
  } catch (error) {
    console.error('[LOGIN]', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// PUT /api/users/:id/admin — toggle admin
router.put('/:id/admin', async (req, res) => {
  try {
    await db.query('UPDATE users SET is_admin = ? WHERE id = ?', [req.body.is_admin, req.params.id]);
    const result = await db.query('SELECT id, email, name, is_admin, created_at FROM users WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    console.log(`[ADMIN TOGGLE] ${result.rows[0].email} → is_admin=${req.body.is_admin}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[ADMIN TOGGLE]', error.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const check = await db.query('SELECT email FROM users WHERE id = ?', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    console.log(`[DELETE USER] ${check.rows[0].email}`);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('[DELETE USER]', error.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
