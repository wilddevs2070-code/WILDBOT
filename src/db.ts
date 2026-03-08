import Database from 'better-sqlite3';

const db = new Database('wildstar.db');

// Ensure foreign keys are enabled for this connection
db.pragma('foreign_keys = ON');

// Initialize tables with explicit foreign key constraints
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    message_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    style TEXT NOT NULL,
    image_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Add missing columns if they don't exist
try {
  db.exec("ALTER TABLE users ADD COLUMN username TEXT;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN full_name TEXT;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN message_count INTEGER DEFAULT 0;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';");
} catch (e) {}

export default db;
