import { Router } from 'express';
import {
  setCompetitionDuration,
  startCompetition,
  endCompetition,
  getCompetitionStatus,
  getLeaderboard,
  getPublicTeams,
  fullReset,
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
router.post('/full-reset', requireAdminAuth, fullReset);

export default router;
