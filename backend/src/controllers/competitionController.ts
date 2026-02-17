import { Request, Response } from 'express';
import { gameManager, getTeamConnections } from './teamController.js';
import { trafficManager, io } from '../index.js';

// Set competition duration
export const setCompetitionDuration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { duration_minutes } = req.body;
    
    if (!duration_minutes || duration_minutes < 1 || duration_minutes > 180) {
      res.status(400).json({ error: 'Duration must be between 1 and 180 minutes' });
      return;
    }
    
    await gameManager.setCompetitionDuration(duration_minutes);
    
    res.json({
      success: true,
      message: `Competition duration set to ${duration_minutes} minutes`,
      duration_minutes,
    });
  } catch (error: unknown) {
    console.error('Error setting competition duration:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to set duration' });
  }
};

// Start competition
export const startCompetition = async (_req: Request, res: Response): Promise<void> => {
  try {
    if (gameManager.isCompetitionActive()) {
      res.status(400).json({ error: 'Competition is already active' });
      return;
    }

    await gameManager.startCompetition();
    const status = gameManager.getCompetitionStatus();
    
    if (status.start_time) {
      trafficManager.setCompetitionStart(status.start_time);
    }

    const games = gameManager.getAllGames();
    games.forEach(game => {
      trafficManager.startTrafficForTeam(game.team_id, game);
    });

    // Notify all connected players that competition has started
    io.emit('competition_started', {
      message: '🚀 Competition has started! Good luck!',
      start_time: status.start_time,
      duration_minutes: status.duration_minutes,
    });

    res.json({
      success: true,
      message: 'Competition started',
      teams: games.length,
      status,
    });
  } catch (error) {
    console.error('Error starting competition:', error);
    res.status(500).json({ error: 'Failed to start competition' });
  }
};

// End competition
export const endCompetition = async (_req: Request, res: Response): Promise<void> => {
  try {
    await gameManager.endCompetition();
    trafficManager.stopAllTraffic();

    const status = gameManager.getCompetitionStatus();

    // Notify all connected players that competition has ended
    io.emit('competition_ended', {
      message: '🏁 Competition has ended! Final scores have been recorded.',
      end_time: status.end_time,
      duration_minutes: status.duration_minutes,
    });

    res.json({
      success: true,
      message: 'Competition ended',
      status,
    });
  } catch (error) {
    console.error('Error ending competition:', error);
    res.status(500).json({ error: 'Failed to end competition' });
  }
};

// Get competition status
export const getCompetitionStatus = (_req: Request, res: Response): void => {
  try {
    const status = gameManager.getCompetitionStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting competition status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
};

// Get leaderboard
export const getLeaderboard = (_req: Request, res: Response): void => {
  try {
    const leaderboard = gameManager.getLeaderboard();
    res.json({ leaderboard });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
};

// Public: Get teams for leaderboard (no auth required)
export const getPublicTeams = (_req: Request, res: Response): void => {
  try {
    const games = gameManager.getAllGames();
    const teams = games.map(game => {
      const active_players = getTeamConnections(game.team_id);
      return {
        team_id: game.team_id,
        team_name: game.team_name,
        score: game.score,
        ships_sunk: game.ships_sunk,
        active_players,
        game_complete: game.isGameComplete(),
      };
    });
    res.json({ teams, count: teams.length });
  } catch (error) {
    console.error('Error getting teams:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
};

// Admin: Full reset - clears everything including competition state and admin sessions
export const fullReset = async (_req: Request, res: Response): Promise<void> => {
  try {
    if (gameManager.isCompetitionActive()) {
      res.status(403).json({ error: 'Cannot perform full reset while competition is active. End competition first.' });
      return;
    }

    const teamCount = await gameManager.fullReset();
    trafficManager.stopAllTraffic();

    // Notify all connected clients
    io.emit('full_reset', {
      message: '🔄 System has been reset. Please refresh your page.',
    });

    res.json({
      success: true,
      message: `Full reset completed. Cleared ${teamCount} teams, competition state, and admin sessions.`,
      teams_cleared: teamCount,
    });
  } catch (error) {
    console.error('Error performing full reset:', error);
    res.status(500).json({ error: 'Failed to perform full reset' });
  }
};
