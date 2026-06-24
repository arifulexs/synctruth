import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import { setupSocket } from './socket/socketHandler.js';
import { verifyToken } from './middleware/auth.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));

// Expose verifyToken to routes via app.locals
app.locals.verifyToken = verifyToken;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Serve client build in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = join(__dirname, '../../client/dist');
  app.use(express.static(clientPath));
  app.get('*', (_, res) => res.sendFile(join(clientPath, 'index.html')));
}

// Setup socket
setupSocket(io);

httpServer.listen(PORT, () => {
  console.log(`\n🚀 SyncTruth server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
