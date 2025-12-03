// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./authRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // change if you serve front-end from a different port/file
  credentials: true
}));
app.use(express.json());

// Auth endpoints
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// (Optional) serve front-end from here later if you want
// app.use(express.static(path.join(__dirname, '..', '..')));

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
