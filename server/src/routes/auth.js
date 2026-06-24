import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db, createUser } from '../db.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, avatar } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Validate username
    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 2-20 characters' });
    }
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, _, -, .' });
    }

    // Check uniqueness (case-insensitive)
    if (db.usersByName.has(username.toLowerCase())) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();

    const user = createUser({ id, username, avatar: avatar || null, passwordHash });
    db.users.set(id, user);
    db.usersByName.set(username.toLowerCase(), id);
    db.notifications.set(id, []);

    const token = generateToken(id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        friends: user.friends,
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const userId = db.usersByName.get(username.toLowerCase());
    if (!userId) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = db.users.get(userId);
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(userId);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        friends: user.friends,
        notifications: db.notifications.get(userId) || [],
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get my profile
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { verifyToken } = req.app.locals;
  const payload = verifyToken(auth.slice(7));
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const user = db.users.get(payload.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    friends: user.friends,
    customQuestions: user.customQuestions,
    favoriteQuestions: user.favoriteQuestions,
    pinnedAnswers: user.pinnedAnswers,
    notifications: db.notifications.get(user.id) || [],
  });
});

// Update avatar
router.patch('/avatar', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const { verifyToken } = req.app.locals;
  const payload = verifyToken(auth.slice(7));
  if (!payload) return res.status(401).json({ error: 'Invalid' });

  const user = db.users.get(payload.userId);
  if (!user) return res.status(404).json({ error: 'Not found' });

  const { avatar } = req.body;
  user.avatar = avatar;
  res.json({ avatar: user.avatar });
});

export default router;
