import { v4 as uuidv4 } from 'uuid';
import { db, createRoom } from '../db.js';
import { verifyToken } from '../middleware/auth.js';
import { getNextQuestion } from '../services/questionService.js';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function sanitizeRoom(room, viewerId) {
  const answersRevealed = room.phase === 'revealed' || room.phase === 'chat';
  return {
    code: room.code,
    players: room.players,
    playerNames: room.playerNames,
    playerAvatars: room.playerAvatars || {},
    categoryId: room.categoryId,
    phase: room.phase,
    currentQuestion: room.currentQuestion,
    roundNumber: room.roundNumber,
    chat: room.chat,
    answers: answersRevealed ? room.answers :
      Object.fromEntries(Object.keys(room.answers).map(k => [k, '***'])),
    hasMyAnswer: !!room.answers[viewerId],
    answeredCount: Object.keys(room.answers).length,
    createdAt: room.createdAt,
    pinnedMessages: room.pinnedMessages || [],
  };
}

export function setupSocket(io) {
  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    const payload = verifyToken(token);
    if (!payload) return next(new Error('Invalid token'));
    const user = db.users.get(payload.userId);
    if (!user) return next(new Error('User not found'));
    socket.userId = payload.userId;
    socket.user = user;
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    user.online = true;
    user.socketId = socket.id;
    console.log(`✅ ${user.username} connected`);

    // Notify friends that user came online
    for (const friendId of user.friends || []) {
      const friend = db.users.get(friendId);
      if (friend?.socketId) {
        io.to(friend.socketId).emit('friend:online', { userId: user.id, username: user.username });
      }
    }

    // Send pending notifications
    const notifs = db.notifications.get(user.id) || [];
    if (notifs.length > 0) {
      socket.emit('notifications:update', notifs);
    }

    // ─── ROOM EVENTS ───────────────────────────────────────────────

    socket.on('room:create', ({ categoryId }, cb) => {
      try {
        let code;
        do { code = generateRoomCode(); } while (db.rooms.has(code));

        const room = createRoom({ code, creatorId: user.id, categoryId: categoryId || 'friendship' });
        room.playerNames[user.id] = user.username;
        room.playerAvatars = { [user.id]: user.avatar };
        db.rooms.set(code, room);
        user.currentRoom = code;

        socket.join(code);
        cb?.({ success: true, room: sanitizeRoom(room, user.id) });
      } catch (err) {
        cb?.({ error: err.message });
      }
    });

    socket.on('room:join', ({ code }, cb) => {
      try {
        const roomCode = code?.toUpperCase();
        const room = db.rooms.get(roomCode);

        if (!room) return cb?.({ error: 'Room not found. Check the code and try again.' });
        if (room.players.length >= 2 && !room.players.includes(user.id)) {
          return cb?.({ error: 'This room is full. Rooms support only 2 players.' });
        }
        if (room.phase === 'ended') return cb?.({ error: 'This room has ended.' });

        // Add player if not already in
        if (!room.players.includes(user.id)) {
          room.players.push(user.id);
          room.playerNames[user.id] = user.username;
          room.playerAvatars = room.playerAvatars || {};
          room.playerAvatars[user.id] = user.avatar;
        }

        user.currentRoom = roomCode;
        socket.join(roomCode);
        room.lastActivity = Date.now();

        // Notify the other player
        socket.to(roomCode).emit('room:player_joined', {
          userId: user.id,
          username: user.username,
          avatar: user.avatar,
        });

        cb?.({ success: true, room: sanitizeRoom(room, user.id) });

        // If 2 players now, emit room ready
        if (room.players.length === 2) {
          io.to(roomCode).emit('room:ready', { playerNames: room.playerNames });
        }
      } catch (err) {
        cb?.({ error: err.message });
      }
    });

    socket.on('room:rejoin', ({ code }, cb) => {
      const roomCode = code?.toUpperCase();
      const room = db.rooms.get(roomCode);
      if (!room || !room.players.includes(user.id)) return cb?.({ error: 'Cannot rejoin' });
      socket.join(roomCode);
      user.currentRoom = roomCode;
      user.online = true;
      socket.to(roomCode).emit('room:player_reconnected', { userId: user.id, username: user.username });
      cb?.({ success: true, room: sanitizeRoom(room, user.id) });
    });

    socket.on('room:leave', ({ code }) => {
      const roomCode = code?.toUpperCase();
      const room = db.rooms.get(roomCode);
      if (!room) return;

      socket.leave(roomCode);
      socket.to(roomCode).emit('room:player_left', { userId: user.id, username: user.username });

      // Remove from room
      room.players = room.players.filter(p => p !== user.id);
      delete room.playerNames[user.id];
      if (room.playerAvatars) delete room.playerAvatars[user.id];

      if (room.players.length === 0) {
        db.rooms.delete(roomCode); // Clean up empty room
      }
      user.currentRoom = null;
    });

    socket.on('room:delete', ({ code }) => {
      const roomCode = code?.toUpperCase();
      const room = db.rooms.get(roomCode);
      if (!room || room.creatorId !== user.id) return;

      io.to(roomCode).emit('room:deleted', { message: 'The host deleted this room.' });
      // Remove all players
      for (const pid of room.players) {
        const p = db.users.get(pid);
        if (p) p.currentRoom = null;
      }
      db.rooms.delete(roomCode);
    });

    // ─── QUESTION EVENTS ────────────────────────────────────────────

    socket.on('question:next', ({ code }, cb) => {
      const roomCode = code?.toUpperCase();
      const room = db.rooms.get(roomCode);
      if (!room || room.creatorId !== user.id) return cb?.({ error: 'Only the host can advance questions' });
      if (room.players.length < 2) return cb?.({ error: 'Need 2 players to start' });

      const question = getNextQuestion(
        room.categoryId,
        room.questionHistory,
        [] // custom questions from room
      );

      if (!question) return cb?.({ error: 'No questions available' });

      room.currentQuestion = question;
      room.questionHistory.push(question.id);
      room.answers = {};
      room.phase = 'question';
      room.roundNumber = (room.roundNumber || 0) + 1;
      room.chat = []; // Fresh chat per round
      room.lastActivity = Date.now();

      io.to(roomCode).emit('question:new', {
        question,
        roundNumber: room.roundNumber,
        phase: 'question',
      });

      cb?.({ success: true });
    });

    socket.on('answer:submit', ({ code, answer }, cb) => {
      const roomCode = code?.toUpperCase();
      const room = db.rooms.get(roomCode);
      if (!room) return cb?.({ error: 'Room not found' });
      if (!room.players.includes(user.id)) return cb?.({ error: 'Not in room' });
      if (room.phase !== 'question') return cb?.({ error: 'Not in question phase' });
      if (!answer || answer.trim().length === 0) return cb?.({ error: 'Answer cannot be empty' });
      if (answer.trim().length > 500) return cb?.({ error: 'Answer too long (max 500 chars)' });

      // Save answer (hidden from others)
      room.answers[user.id] = answer.trim();
      room.lastActivity = Date.now();

      // Notify other player that someone answered (without revealing answer)
      socket.to(roomCode).emit('answer:submitted', { userId: user.id, username: user.username });

      // Check if both players answered
      const answered = Object.keys(room.answers).length;
      const total = room.players.length;

      io.to(roomCode).emit('answer:count', { answered, total });

      if (answered >= total && total === 2) {
        // Both answered — reveal!
        room.phase = 'revealed';

        setTimeout(() => {
          io.to(roomCode).emit('answers:reveal', {
            answers: room.answers,
            playerNames: room.playerNames,
            question: room.currentQuestion,
            phase: 'revealed',
          });

          // After 1s, unlock chat
          setTimeout(() => {
            room.phase = 'chat';
            io.to(roomCode).emit('chat:unlocked', { phase: 'chat' });
          }, 1000);
        }, 300);
      }

      cb?.({ success: true, myAnswer: answer.trim() });
    });

    // ─── CHAT EVENTS ────────────────────────────────────────────────

    socket.on('chat:message', ({ code, text, replyTo }, cb) => {
      const roomCode = code?.toUpperCase();
      const room = db.rooms.get(roomCode);
      if (!room) return cb?.({ error: 'Room not found' });
      if (!room.players.includes(user.id)) return cb?.({ error: 'Not in room' });
      if (room.phase !== 'chat') return cb?.({ error: 'Chat not unlocked yet' });
      if (!text || text.trim().length === 0) return cb?.({ error: 'Empty message' });
      if (text.trim().length > 1000) return cb?.({ error: 'Message too long' });

      const msg = {
        id: uuidv4(),
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        text: text.trim(),
        replyTo: replyTo || null,
        reactions: {},
        timestamp: Date.now(),
      };

      room.chat.push(msg);
      room.lastActivity = Date.now();

      io.to(roomCode).emit('chat:message', msg);
      cb?.({ success: true, message: msg });
    });

    socket.on('chat:react', ({ code, messageId, emoji }, cb) => {
      const roomCode = code?.toUpperCase();
      const room = db.rooms.get(roomCode);
      if (!room) return;

      const msg = room.chat.find(m => m.id === messageId);
      if (!msg) return;

      const allowed = ['❤️', '😂', '😮', '🔥', '👀', '💯', '🤔', '😭'];
      if (!allowed.includes(emoji)) return;

      if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
      const idx = msg.reactions[emoji].indexOf(user.id);
      if (idx > -1) {
        msg.reactions[emoji].splice(idx, 1); // toggle off
        if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
      } else {
        msg.reactions[emoji].push(user.id); // toggle on
      }

      io.to(roomCode).emit('chat:reactions_update', { messageId, reactions: msg.reactions });
      cb?.({ success: true });
    });

    socket.on('chat:pin_message', ({ code, messageId }) => {
      const roomCode = code?.toUpperCase();
      const room = db.rooms.get(roomCode);
      if (!room) return;
      const msg = room.chat.find(m => m.id === messageId);
      if (!msg) return;
      room.pinnedMessages = room.pinnedMessages || [];
      if (!room.pinnedMessages.find(m => m.id === messageId)) {
        room.pinnedMessages.push(msg);
        io.to(roomCode).emit('chat:message_pinned', msg);
      }
    });

    // ─── FRIEND EVENTS ──────────────────────────────────────────────

    socket.on('friend:search', ({ query }, cb) => {
      if (!query || query.length < 2) return cb?.({ users: [] });
      const results = [];
      for (const [, u] of db.users) {
        if (u.id !== user.id && u.username.toLowerCase().includes(query.toLowerCase())) {
          results.push({ id: u.id, username: u.username, avatar: u.avatar, online: u.online });
          if (results.length >= 10) break;
        }
      }
      cb?.({ users: results });
    });

    socket.on('friend:add', ({ targetId }, cb) => {
      const target = db.users.get(targetId);
      if (!target) return cb?.({ error: 'User not found' });
      if (user.friends.includes(targetId)) return cb?.({ error: 'Already friends' });

      user.friends.push(targetId);
      if (!target.friends.includes(user.id)) target.friends.push(user.id);

      // Notify target
      const notifs = db.notifications.get(targetId) || [];
      notifs.push({ id: uuidv4(), type: 'friend_added', from: user.username, fromId: user.id, createdAt: Date.now(), read: false });
      db.notifications.set(targetId, notifs);

      if (target.socketId) {
        io.to(target.socketId).emit('notifications:update', notifs);
        io.to(target.socketId).emit('friend:added', { id: user.id, username: user.username, avatar: user.avatar, online: true });
      }

      cb?.({ success: true });
    });

    socket.on('friend:invite_to_room', ({ targetId, roomCode }, cb) => {
      const target = db.users.get(targetId);
      if (!target) return cb?.({ error: 'User not found' });

      const notif = { id: uuidv4(), type: 'room_invite', roomCode, from: user.username, fromId: user.id, createdAt: Date.now(), read: false };
      const notifs = db.notifications.get(targetId) || [];
      notifs.push(notif);
      db.notifications.set(targetId, notifs);

      if (target.socketId) {
        io.to(target.socketId).emit('notifications:update', notifs);
        io.to(target.socketId).emit('room:invite_popup', { roomCode, from: user.username, notifId: notif.id });
      }

      cb?.({ success: true });
    });

    socket.on('notification:read', ({ notifId }, cb) => {
      const notifs = db.notifications.get(user.id) || [];
      const notif = notifs.find(n => n.id === notifId);
      if (notif) notif.read = true;
      db.notifications.set(user.id, notifs);
      cb?.({ success: true });
    });

    socket.on('notifications:clear', (cb) => {
      db.notifications.set(user.id, []);
      cb?.({ success: true });
    });

    // ─── TYPING ──────────────────────────────────────────────────────

    socket.on('typing:start', ({ code }) => {
      socket.to(code?.toUpperCase()).emit('typing:start', { userId: user.id, username: user.username });
    });

    socket.on('typing:stop', ({ code }) => {
      socket.to(code?.toUpperCase()).emit('typing:stop', { userId: user.id });
    });

    // ─── DISCONNECT ──────────────────────────────────────────────────

    socket.on('disconnect', () => {
      user.online = false;
      user.socketId = null;
      console.log(`❌ ${user.username} disconnected`);

      // Notify room
      if (user.currentRoom) {
        const room = db.rooms.get(user.currentRoom);
        if (room) {
          io.to(user.currentRoom).emit('room:player_disconnected', {
            userId: user.id,
            username: user.username,
          });
        }
      }

      // Notify friends
      for (const friendId of user.friends || []) {
        const friend = db.users.get(friendId);
        if (friend?.socketId) {
          io.to(friend.socketId).emit('friend:offline', { userId: user.id });
        }
      }
    });
  });
}
