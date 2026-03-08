import express from 'express';
import { createServer as createViteServer } from 'vite';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import db from './src/db';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'wildstar-secret-key-12345';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('project:join', (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined project ${projectId}`);
  });

  socket.on('object:moved', (data) => {
    socket.to(data.projectId).emit('object:moved', data);
  });

  socket.on('object:created', (data) => {
    socket.to(data.projectId).emit('object:created', data);
  });

  socket.on('object:updated', (data) => {
    socket.to(data.projectId).emit('object:updated', data);
  });

  socket.on('object:deleted', (data) => {
    socket.to(data.projectId).emit('object:deleted', data);
  });

  socket.on('message:created', (data) => {
    socket.to(data.projectId).emit('message:created', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)');
    const info = stmt.run(email, hashedPassword, 'user');
    
    const token = jwt.sign({ id: info.lastInsertRowid, email }, JWT_SECRET);
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
    res.json({ user: { id: info.lastInsertRowid, email, username: null, full_name: null, avatar_url: null, message_count: 0, role: 'user' } });
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
  res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ user: { id: user.id, email: user.email, username: user.username, full_name: user.full_name, avatar_url: user.avatar_url, message_count: user.message_count, role: user.role } });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  const user: any = db.prepare('SELECT id, email, username, full_name, avatar_url, message_count, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

app.patch('/api/auth/profile', authenticateToken, async (req: any, res) => {
  const { username, full_name, avatar_url, new_password } = req.body;
  
  try {
    if (new_password) {
      const hashedPassword = await bcrypt.hash(new_password, 10);
      db.prepare('UPDATE users SET username = ?, full_name = ?, avatar_url = ?, password = ? WHERE id = ?').run(username, full_name, avatar_url, hashedPassword, req.user.id);
    } else {
      db.prepare('UPDATE users SET username = ?, full_name = ?, avatar_url = ? WHERE id = ?').run(username, full_name, avatar_url, req.user.id);
    }
    const updatedUser: any = db.prepare('SELECT id, email, username, full_name, avatar_url, message_count, role FROM users WHERE id = ?').get(req.user.id);
    res.json({ user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.get('/api/leaderboard', authenticateToken, (req: any, res) => {
  const topUsers = db.prepare(`
    SELECT id, username, full_name, avatar_url, message_count 
    FROM users 
    ORDER BY message_count DESC 
    LIMIT 10
  `).all();
  res.json(topUsers);
});

// Session Routes
app.get('/api/sessions', authenticateToken, (req: any, res) => {
  const sessions = db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(sessions);
});

app.post('/api/sessions', authenticateToken, (req: any, res) => {
  const { title } = req.body;
  const stmt = db.prepare('INSERT INTO sessions (user_id, title) VALUES (?, ?)');
  const info = stmt.run(req.user.id, title || 'New Chat');
  res.json({ id: info.lastInsertRowid, title: title || 'New Chat' });
});

app.patch('/api/sessions/:id', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { title } = req.body;
  
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const session: any = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  db.prepare('UPDATE sessions SET title = ? WHERE id = ?').run(title, id);
  res.json({ success: true });
});

app.delete('/api/sessions/:id', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  
  // First, verify ownership and delete messages to avoid FK constraints if CASCADE is not active
  const session: any = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  // Use a transaction for safety
  const deleteTransaction = db.transaction(() => {
    db.prepare('DELETE FROM messages WHERE session_id = ?').run(id);
    db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  });

  deleteTransaction();
  res.json({ success: true });
});

// Chat History Routes
app.get('/api/sessions/:sessionId/messages', authenticateToken, (req: any, res) => {
  const { sessionId } = req.params;
  // Verify session ownership
  const session: any = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(sessionId, req.user.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const messages = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC').all(sessionId);
  res.json(messages);
});

app.post('/api/sessions/:sessionId/messages', authenticateToken, (req: any, res) => {
  const { sessionId } = req.params;
  const { role, content, timestamp } = req.body;
  
  // Verify session ownership
  const session: any = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(sessionId, req.user.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  // Use a transaction to ensure message is saved and count is incremented
  const saveMessageTransaction = db.transaction(() => {
    const stmt = db.prepare('INSERT INTO messages (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)');
    stmt.run(sessionId, role, content, timestamp);
    
    if (role === 'user') {
      db.prepare('UPDATE users SET message_count = message_count + 1 WHERE id = ?').run(req.user.id);
    }
  });

  saveMessageTransaction();
  res.json({ success: true });
});

// Asset Routes
app.get('/api/assets', authenticateToken, (req: any, res) => {
  const assets = db.prepare('SELECT * FROM assets WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(assets);
});

app.post('/api/assets', authenticateToken, (req: any, res) => {
  const { prompt, style, image_data } = req.body;
  if (!prompt || !image_data) return res.status(400).json({ error: 'Missing fields' });

  const stmt = db.prepare('INSERT INTO assets (user_id, prompt, style, image_data) VALUES (?, ?, ?, ?)');
  const info = stmt.run(req.user.id, prompt, style || 'pixel art', image_data);
  res.json({ id: info.lastInsertRowid, prompt, style, image_data });
});

app.delete('/api/assets/:id', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  
  const asset: any = db.prepare('SELECT * FROM assets WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  db.prepare('DELETE FROM assets WHERE id = ?').run(id);
  res.json({ success: true });
});

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    const fkStatus: any = db.pragma('foreign_keys', { simple: true });
    console.log(`SQLite Foreign Keys: ${fkStatus === 1 ? 'ENABLED' : 'DISABLED'}`);
  });
}

startServer();
