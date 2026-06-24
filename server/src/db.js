// In-memory database for SyncTruth
// For production, replace with Supabase (free tier), PlanetScale, or Turso

export const db = {
  users: new Map(),        // userId -> user object
  usersByName: new Map(),  // username -> userId
  rooms: new Map(),        // roomCode -> room object
  notifications: new Map(),// userId -> [notifications]
  friendRequests: new Map(),// userId -> [requests]
  pinnedAnswers: new Map(), // userId -> [pinned]
};

// User schema
export function createUser({ id, username, avatar, passwordHash }) {
  return {
    id,
    username,
    avatar: avatar || null,
    passwordHash,
    createdAt: Date.now(),
    online: false,
    currentRoom: null,
    customQuestions: [],
    favoriteQuestions: [],
    friends: [], // array of userIds
    pinnedAnswers: [],
    memoryCards: [],
  };
}

// Room schema
export function createRoom({ code, creatorId, categoryId }) {
  return {
    code,
    creatorId,
    players: [creatorId],
    playerNames: {},
    categoryId: categoryId || 'friendship',
    customCategories: [],
    phase: 'waiting',   // waiting | question | revealed | chat | ended
    currentQuestion: null,
    questionHistory: [],
    answers: {},        // userId -> answer
    chat: [],
    reactions: {},
    createdAt: Date.now(),
    lastActivity: Date.now(),
    roundNumber: 0,
    pinnedMessages: [],
  };
}

// Auto-cleanup rooms older than 24 hours
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [code, room] of db.rooms.entries()) {
    if (room.lastActivity < cutoff) {
      // Clean up players from this room
      for (const pid of room.players) {
        const user = db.users.get(pid);
        if (user && user.currentRoom === code) {
          user.currentRoom = null;
          user.online = false;
        }
      }
      db.rooms.delete(code);
    }
  }
}, 60 * 60 * 1000); // Every hour
