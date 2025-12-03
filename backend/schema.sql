-- Users table for account system
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user', -- 'user', 'admin', 'brand', 'creator' later if you want
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
