import { Router } from 'express';
import {
  setCompetitionDuration,
  startCompetition,
  endCompetition,
  getCompetitionStatus,
  getLeaderboard,
} from '../controllers/competitionController.js';

const router = Router();

router.post('/duration', setCompetitionDuration);
router.post('/start', startCompetition);
router.post('/end', endCompetition);
router.get('/status', getCompetitionStatus);
router.get('/leaderboard', getLeaderboard);

export default router;
