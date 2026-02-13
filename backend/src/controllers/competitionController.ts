import { Request, Response } from 'express';
import { gameManager } from './teamController.js';
import { trafficManager } from '../index.js';

// Set competition duration
export const setCompetitionDuration = (req: Request, res: Response): void => {
  try {
    const { duration_minutes } = req.body;
    
    if (!duration_minutes || duration_minutes < 1 || duration_minutes > 180) {
      res.status(400).json({ error: 'Duration must be between 1 and 180 minutes' });
      return;
    }
    
    gameManager.setCompetitionDuration(duration_minutes);
    
    res.json({
      success: true,
      message: `Competition duration set to ${duration_minutes} minutes`,
      duration_minutes,
    });
  } catch (error: any) {
    console.error('Error setting competition duration:', error);
    res.status(500).json({ error: error.message || 'Failed to set duration' });
  }
};

// Start competition
export const startCompetition = (req: Request, res: Response): void => {
  try {
    // Check if competition is already active
    if (gameManager.isCompetitionActive()) {
      res.status(400).json({ error: 'Competition is already active' });
      return;
    }

    gameManager.startCompetition();
    const status = gameManager.getCompetitionStatus();
    
    // Set competition start time for difficulty scaling
    if (status.start_time) {
      trafficManager.setCompetitionStart(status.start_time);
    }

    // Start traffic generation for all teams
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
export const endCompetition = (req: Request, res: Response): void => {
  try {
    gameManager.endCompetition();
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
export const getCompetitionStatus = (req: Request, res: Response): void => {
  try {
    const status = gameManager.getCompetitionStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting competition status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
};

// Get leaderboard
export const getLeaderboard = (req: Request, res: Response): void => {
  try {
    const leaderboard = gameManager.getLeaderboard();
    res.json({ leaderboard });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
};
