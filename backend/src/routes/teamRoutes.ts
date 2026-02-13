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
import { requireAdminAuth, login, logout } from '../middleware/adminAuth.js';

const router = Router();

// Admin auth (no protection)
router.post('/admin/login', login);
router.post('/admin/logout', logout);

// Admin routes (protected)
router.post('/admin/teams/create', requireAdminAuth, createTeam);
router.post('/admin/teams/create-multiple', requireAdminAuth, createMultipleTeams);
router.delete('/admin/teams/clear', requireAdminAuth, clearAllTeams);
router.delete('/admin/teams/delete-selected', requireAdminAuth, deleteSelectedTeams);
router.get('/admin/teams', requireAdminAuth, getAllTeams);

// Player routes
router.post('/teams/join', joinTeam);
router.get('/teams/:team_id', getTeamStatus);
router.post('/teams/claim-random', claimRandomTeam);

export default router;
