import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import teamRoutes from './routes/teamRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import competitionRoutes from './routes/competitionRoutes.js';
import { setupGameSocket } from './sockets/gameSocket.js';
import { TrafficManager } from './services/TrafficManager.js';

const app = express();
const httpServer = createServer(app);

// CORS configuration for local network deployment
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin === '*' ? '*' : corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Initialize traffic manager
export const trafficManager = new TrafficManager(io);

// Middleware
app.use(cors({
  origin: corsOrigin === '*' ? '*' : corsOrigin,
  credentials: true,
}));
app.use(express.json());

// Routes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', teamRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/competition', competitionRoutes);

// WebSocket setup
setupGameSocket(io);

// Export io for use in other modules
export { io };

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://${HOST}:${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`📡 API routes available at http://${HOST}:${PORT}/api`);
  console.log(`🌐 CORS enabled for: ${corsOrigin}`);
  if (HOST !== 'localhost') {
    console.log(`\n📱 Students should connect to: http://${HOST}:5173`);
    console.log(`👨‍💼 Admin panel: http://${HOST}:5173/admin\n`);
  }
});

// Cleanup on shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  trafficManager.stopAllTraffic();
  process.exit(0);
});
