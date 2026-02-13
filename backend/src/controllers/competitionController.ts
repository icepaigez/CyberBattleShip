import { Request, Response } from 'express';
import { gameManager } from './teamController.js';
import { trafficManager } from '../index.js';

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

    res.json({
      success: true,
      message: 'Competition ended',
      status: gameManager.getCompetitionStatus(),
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
