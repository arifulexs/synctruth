import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, createRoom } from '../db.js';
import { verifyToken } from '../middleware/auth.js';
import { getAllCategories } from '../services/questionService.js';

const router = Router();

function authUser(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const payload = verifyToken(auth.slice(7));
  if (!payload) return null;
  return db.users.get(payload.userId);
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Create room
router.post('/create', (req, res) => {
  const user = authUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { categoryId } = req.body;

  let code;
  do { code = generateRoomCode(); } while (db.rooms.has(code));

  const room = createRoom({ code, creatorId: user.id, categoryId });
  room.playerNames[user.id] = user.username;
  db.rooms.set(code, room);
  user.currentRoom = code;

  res.status(201).json({ code, room: sanitizeRoom(room, user.id) });
});

// Get room info
router.get('/:code', (req, res) => {
  const user = authUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const room = db.rooms.get(req.params.code.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found' });

  res.json({ room: sanitizeRoom(room, user.id) });
});

// Get categories
router.get('/meta/categories', (req, res) => {
  res.json({ categories: getAllCategories() });
});

// Invite friend to room
router.post('/:code/invite', (req, res) => {
  const user = authUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const room = db.rooms.get(req.params.code.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (!room.players.includes(user.id)) return res.status(403).json({ error: 'Not in room' });

  const { targetUsername } = req.body;
  const targetId = db.usersByName.get(targetUsername?.toLowerCase());
  if (!targetId) return res.status(404).json({ error: 'User not found' });

  const notifs = db.notifications.get(targetId) || [];
  const existing = notifs.find(n => n.type === 'room_invite' && n.roomCode === room.code);
  if (!existing) {
    notifs.push({
      id: uuidv4(),
      type: 'room_invite',
      roomCode: room.code,
      from: user.username,
      fromId: user.id,
      createdAt: Date.now(),
      read: false,
    });
    db.notifications.set(targetId, notifs);
  }

  res.json({ success: true });
});

// Pin an answer
router.post('/pin', (req, res) => {
  const user = authUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { question, myAnswer, theirAnswer, theirName, categoryId, roomCode } = req.body;
  const pin = {
    id: uuidv4(),
    question, myAnswer, theirAnswer, theirName,
    categoryId, roomCode,
    pinnedAt: Date.now(),
  };
  user.pinnedAnswers = [pin, ...(user.pinnedAnswers || [])].slice(0, 100);
  res.json({ pin });
});

// Get pinned answers
router.get('/pins/mine', (req, res) => {
  const user = authUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ pins: user.pinnedAnswers || [] });
});

// Save custom question
router.post('/questions/custom', (req, res) => {
  const user = authUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { text } = req.body;
  if (!text || text.trim().length < 5) return res.status(400).json({ error: 'Question too short' });
  if (text.trim().length > 300) return res.status(400).json({ error: 'Question too long' });

  const q = { id: `custom_${uuidv4().slice(0,8)}`, text: text.trim(), createdAt: Date.now() };
  user.customQuestions = [q, ...(user.customQuestions || [])].slice(0, 50);
  res.json({ question: q });
});

function sanitizeRoom(room, viewerId) {
  return {
    code: room.code,
    players: room.players,
    playerNames: room.playerNames,
    categoryId: room.categoryId,
    phase: room.phase,
    currentQuestion: room.currentQuestion,
    roundNumber: room.roundNumber,
    chat: room.chat,
    // Only show answers after reveal phase
    answers: room.phase === 'revealed' || room.phase === 'chat' ? room.answers : 
      Object.fromEntries(Object.keys(room.answers).map(k => [k, '***'])),
    hasMyAnswer: !!room.answers[viewerId],
    createdAt: room.createdAt,
  };
}

export default router;
