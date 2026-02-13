import { Router } from 'express';
import {
  setCompetitionDuration,
  startCompetition,
  endCompetition,
  getCompetitionStatus,
  getLeaderboard,
  getPublicTeams,
} from '../controllers/competitionController.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';

const router = Router();

// Public routes
router.get('/status', getCompetitionStatus);
router.get('/leaderboard', getLeaderboard);
router.get('/teams', getPublicTeams);

// Admin-only routes
router.post('/duration', requireAdminAuth, setCompetitionDuration);
router.post('/start', requireAdminAuth, startCompetition);
router.post('/end', requireAdminAuth, endCompetition);

export default router;
