// backend/src/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Helper: generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const normalizedEmail = email.toLowerCase();

  // Check if user exists
  const checkSql = 'SELECT id FROM users WHERE email = ?';
  db.get(checkSql, [normalizedEmail], async (err, row) => {
    if (err) {
      console.error('DB error (check user):', err);
      return res.status(500).json({ message: 'Internal server error.' });
    }

    if (row) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    try {
      const passwordHash = await bcrypt.hash(password, 10);

      const insertSql = `
        INSERT INTO users (name, email, password_hash)
        VALUES (?, ?, ?)
      `;
      db.run(insertSql, [name || null, normalizedEmail, passwordHash], function (insertErr) {
        if (insertErr) {
          console.error('DB error (insert user):', insertErr);
          return res.status(500).json({ message: 'Internal server error.' });
        }

        const newUser = {
          id: this.lastID,
          name: name || null,
          email: normalizedEmail,
          role: 'user'
        };

        const token = generateToken(newUser);

        res.status(201).json({
          token,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          }
        });
      });
    } catch (hashErr) {
      console.error('Hash error:', hashErr);
      res.status(500).json({ message: 'Internal server error.' });
    }
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.get(sql, [normalizedEmail], async (err, user) => {
    if (err) {
      console.error('DB error (login):', err);
      return res.status(500).json({ message: 'Internal server error.' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
});

module.exports = router;
