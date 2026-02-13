import { Router } from 'express';
import {
  createTeam,
  createMultipleTeams,
  joinTeam,
  getAllTeams,
  getTeamStatus,
  clearAllTeams,
  deleteSelectedTeams,
  claimRandomTeam,
} from '../controllers/teamController.js';

const router = Router();

// Admin routes
router.post('/admin/teams/create', createTeam);
router.post('/admin/teams/create-multiple', createMultipleTeams);
router.delete('/admin/teams/clear', clearAllTeams);
router.delete('/admin/teams/delete-selected', deleteSelectedTeams);
router.get('/admin/teams', getAllTeams);

// Player routes
router.post('/teams/join', joinTeam);
router.get('/teams/:team_id', getTeamStatus);
router.post('/teams/claim-random', claimRandomTeam);

export default router;
