# Cyber Battleships Platform 🎮

A **web-based cybersecurity competition** platform for 14-18 year olds that teaches core security concepts (information leakage, encoding/decoding, pattern recognition) through Battleship-style gameplay.

## ✨ Features

✅ **22 concurrent teams** (4 players each)  
✅ **Real-time traffic simulation** with encoded leaks (Base64, Hex, Layered)  
✅ **Auto-scaling difficulty** over 90 minutes (7 phases)  
✅ **Live leaderboard** with WebSocket updates  
✅ **4-panel student UI** (Grid, Traffic, Decoder, Submission)  
✅ **Admin dashboard** for competition control  
✅ **No setup required** for students—just join with team code  

## 🚀 Quick Start

### Development Mode (Single Machine)

```bash
# Install dependencies
npm install

# Run both servers
npm run dev
```

**Access Points:**
- **Student UI**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5173/admin
- **Backend API**: http://localhost:3000

### Local Network Deployment (Lab Competition)

```bash
# Automated setup (finds your IP and creates .env files)
./setup-local.sh          # macOS/Linux
setup-local.bat           # Windows

# Install and build
npm install
npm run build

# Start servers
npm run dev:local
```

**Students access:** `http://[YOUR-SERVER-IP]:5173`

See `LOCAL_DEPLOYMENT.md` for complete lab setup guide.

## 🎯 Competition Workflow

### 1. Admin Setup
Visit `/admin` and create teams:
```bash
curl -X POST http://localhost:3000/api/admin/teams/create-multiple \
  -H "Content-Type: application/json" \
  -d '{"count": 22}'
```

Teams get codes: ALPHA, BRAVO, CHARLIE, etc.

### 2. Students Join
- Open `http://localhost:5173`
- Enter team code (e.g., "ALPHA")
- See 4-panel game interface

### 3. Start Competition
In admin dashboard, click **"▶️ Start Competition"**
- Traffic generation begins
- Teams see encoded clues in traffic feed
- Decode → Submit coordinates → Earn points

### 4. Monitor Progress
- Live leaderboard updates every 10s
- Track team progress in admin dashboard
- Difficulty auto-scales based on time and performance

## 🏗️ Architecture

```
Student Browser (React)
    ↓ WebSocket + REST
Backend (Node.js/TypeScript)
    ├─ GameManager (in-memory state)
    ├─ TrafficManager (message generation)
    ├─ DifficultyScaler (auto-difficulty)
    └─ WebSocket (real-time updates)
```

## 📂 Project Structure

```
battleship/
├── backend/
│   └── src/
│       ├── models/           # Data models (Team, Ship, etc.)
│       ├── services/         # Game logic, Traffic, Difficulty
│       ├── controllers/      # API endpoints
│       ├── sockets/          # WebSocket handlers
│       └── __tests__/        # Unit tests (18 passing)
├── frontend/
│   └── src/
│       ├── components/       # UI components
│       ├── pages/            # Admin page
│       ├── hooks/            # useSocket
│       └── types/            # TypeScript types
└── docs/
    ├── prd.txt               # Product requirements
    └── DEPLOYMENT.md         # Full deployment guide
```

## 🎮 Gameplay

### Scoring
- **Partial hit** (row or column): +3 pts
- **Ship sunk**: +10 pts
- **First global sink**: +5 bonus
- **Incorrect submission**: -1 pt

### Difficulty Phases (90 min)
| Phase | Time | Ships | Encoding | Leak Rate |
|-------|------|-------|----------|-----------|
| Orientation | 0-10 | 1 | Base64 | 8s |
| Combine Clues | 10-20 | 2 | Base64 | 12s |
| Noise Filtering | 20-35 | 2 | Hex | 15s |
| Mixed Encodings | 35-50 | 3 | Hex | 18s |
| Split Clues | 50-65 | 3 | Layered | 20s |
| Layered Decoding | 65-80 | 4 | Layered | 25s |
| Pressure Round | 80-90 | 5 | Layered | 30s |

## 🧪 Testing

```bash
# Run backend tests (18 tests)
cd backend
npm test

# Test API
curl http://localhost:3000/health
```

## 📡 API Endpoints

### Team Management
- `POST /api/admin/teams/create-multiple` - Create N teams
- `POST /api/teams/join` - Join a team
- `GET /api/admin/teams` - List all teams

### Competition Control
- `POST /api/competition/start` - Start competition
- `POST /api/competition/end` - End competition
- `GET /api/competition/leaderboard` - Get leaderboard

### Game Actions
- `POST /api/game/submit` - Submit coordinate
- WebSocket: `join_team`, `submit_coordinate`

## 🛠️ Technology Stack

**Backend:**
- Node.js + TypeScript
- Express.js (REST)
- Socket.io (WebSocket)
- Vitest (testing)

**Frontend:**
- React + TypeScript
- Vite (build tool)
- React Router (routing)

## 📝 Development Notes

- **State Management**: In-memory (no database required)
- **Persistence**: Server restart clears data (acceptable per PRD)
- **Concurrency**: 22 teams × 4 players = 88 connections
- **Testing**: 18 passing unit tests
- **Build Time**: ~3 days of focused development

## 📖 Documentation

### For Instructors
- **PRD**: `docs/prd.txt` - Full product requirements
- **Local Network Deployment**: `LOCAL_DEPLOYMENT.md` - Complete guide for lab-based competitions
- **Competition Checklist**: `COMPETITION_CHECKLIST.md` - Day-of checklist
- **Cloud Deployment**: `DEPLOYMENT.md` - Production deployment guide

### For Students
- **Student Instructions**: `STUDENT_INSTRUCTIONS.md` - Quick start guide for participants

### Setup Scripts
- **Automated Setup** (macOS/Linux): `./setup-local.sh`
- **Automated Setup** (Windows): `setup-local.bat`

## 🎓 Educational Goals

Students learn:
- **Information leakage** detection
- **Base64 / Hex** encoding/decoding
- **Layered encoding** (Base64 → Hex)
- **Signal vs noise** filtering
- **Pattern recognition** in traffic
- **Team collaboration**

All through gameplay—**no Docker, Wireshark, or CLI required**.
