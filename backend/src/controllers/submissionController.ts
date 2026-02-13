import { Request, Response } from 'express';
import { gameManager } from './teamController.js';
import { parseCoordinate } from '../models/Ship.js';

export const submitCoordinate = (req: Request, res: Response): void => {
  try {
    const { team_id, row, column } = req.body;

    if (!team_id || !row || !column) {
      res.status(400).json({ error: 'team_id, row, and column are required' });
      return;
    }

    const coord = parseCoordinate(`${row}${column}`);
    if (!coord) {
      res.status(400).json({ error: 'Invalid coordinate format' });
      return;
    }

    const game = gameManager.getGame(team_id);
    if (!game) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const result = gameManager.submitCoordinate(team_id, coord);

    let message = '';
    if (result.result === 'hit') {
      message = `Direct hit! Ship sunk at ${row}${column}!`;
    } else if (result.result === 'partial_row') {
      message = `Partial match: Row ${row} contains a ship!`;
    } else if (result.result === 'partial_column') {
      message = `Partial match: Column ${column} contains a ship!`;
    } else {
      message = `Miss! No ship at ${row}${column}.`;
    }

    if (result.first_global_sink) {
      message += ` First team to sink this ship! +${result.bonus_points} bonus points!`;
    }

    res.json({
      success: true,
      result: result.result,
      points_awarded: result.points + result.bonus_points,
      message,
      ship_sunk: result.result === 'hit',
      ship_id: result.ship_id,
      score: game.score,
      ships_sunk: game.ships_sunk,
      ships: game.getVisibleShips(),
    });
  } catch (error) {
    console.error('Error submitting coordinate:', error);
    res.status(500).json({ error: 'Failed to submit coordinate' });
  }
};
