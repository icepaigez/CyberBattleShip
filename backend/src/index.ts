import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import teamRoutes from './routes/teamRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import competitionRoutes from './routes/competitionRoutes.js';
import { setupGameSocket } from './sockets/gameSocket.js';
import { TrafficManager } from './services/TrafficManager.js';
import { gameDatabase } from './services/Database.js';
import { gameManager } from './controllers/teamController.js';

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

// Serve static frontend (when deployed as single app)
const publicPath = path.join(__dirname, '../public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(publicPath, 'index.html'));
    } else {
      next();
    }
  });
}

// WebSocket setup
setupGameSocket(io);

// Export io for use in other modules
export { io };

// Async startup: initialize database and game state before accepting connections
async function start(): Promise<void> {
  await gameDatabase.initialize();
  await gameManager.initialize();

  // Restart traffic generation if competition is active
  if (gameManager.isCompetitionActive()) {
    const status = gameManager.getCompetitionStatus();
    if (status.start_time) {
      trafficManager.setCompetitionStart(status.start_time);
    }
    const games = gameManager.getAllGames();
    games.forEach(game => {
      trafficManager.startTrafficForTeam(game.team_id, game);
    });
    console.log('🔄 Resumed traffic generation for active competition');
  }

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
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Cleanup on shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  trafficManager.stopAllTraffic();
  process.exit(0);
});
