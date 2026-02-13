import { Request, Response } from 'express';
import { GameManager } from '../services/GameManager.js';
import { randomBytes } from 'crypto';

// Singleton game manager instance
export const gameManager = new GameManager();

// Generate a team code
function generateTeamCode(): string {
  // Generate simple memorable codes like ALPHA, BRAVO, or TEAM-XXXX
  const words = [
    'ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT',
    'GOLF', 'HOTEL', 'INDIA', 'JULIET', 'KILO', 'LIMA',
    'MIKE', 'NOVEMBER', 'OSCAR', 'PAPA', 'QUEBEC', 'ROMEO',
    'SIERRA', 'TANGO', 'UNIFORM', 'VICTOR', 'WHISKEY', 'XRAY',
    'YANKEE', 'ZULU'
  ];
  
  // First try phonetic alphabet
  const availableWords = words.filter(word => !gameManager.getGame(word));
  if (availableWords.length > 0) {
    return availableWords[0];
  }
  
  // Fall back to random codes
  return `TEAM-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export interface TeamInfo {
  team_id: string;
  team_name: string;
  created: boolean;
  active_players: number;
}

// Store active connections per team
const teamConnections = new Map<string, Set<string>>(); // team_id -> socket_ids

export function addTeamConnection(team_id: string, socket_id: string): void {
  if (!teamConnections.has(team_id)) {
    teamConnections.set(team_id, new Set());
  }
  teamConnections.get(team_id)!.add(socket_id);
}

export function removeTeamConnection(team_id: string, socket_id: string): void {
  const connections = teamConnections.get(team_id);
  if (connections) {
    connections.delete(socket_id);
    if (connections.size === 0) {
      teamConnections.delete(team_id);
    }
  }
}

export function getTeamConnections(team_id: string): number {
  return teamConnections.get(team_id)?.size || 0;
}

// Admin: Create a team
export const createTeam = (_req: Request, res: Response): void => {
  try {
    const team_id = generateTeamCode();
    // Use team_id (code) as the team_name for display
    gameManager.createTeam(team_id, team_id);

    res.json({
      team_id,
      team_name: team_id,
      message: 'Team created successfully',
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
};

// Admin: Create multiple teams
export const createMultipleTeams = (req: Request, res: Response): void => {
  try {
    const { count } = req.body;

    if (!count || typeof count !== 'number' || count < 1 || count > 50) {
      res.status(400).json({ error: 'count must be between 1 and 50' });
      return;
    }

    const teams: TeamInfo[] = [];
    
    for (let i = 1; i <= count; i++) {
      const team_id = generateTeamCode();
      // Use team_id (code) as the team_name for display
      gameManager.createTeam(team_id, team_id);
      teams.push({
        team_id,
        team_name: team_id,
        created: true,
        active_players: 0,
      });
    }

    res.json({ teams, count: teams.length });
  } catch (error) {
    console.error('Error creating teams:', error);
    res.status(500).json({ error: 'Failed to create teams' });
  }
};

// Player: Join a team
export const joinTeam = (req: Request, res: Response): void => {
  try {
    const { team_id } = req.body;

    if (!team_id || typeof team_id !== 'string') {
      res.status(400).json({ error: 'team_id is required' });
      return;
    }

    const game = gameManager.getGame(team_id);
    if (!game) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const active_players = getTeamConnections(team_id);
    if (active_players >= 4) {
      res.status(403).json({ error: 'Team is full (maximum 4 players)' });
      return;
    }

    res.json({
      team_id: game.team_id,
      team_name: game.team_name,
      score: game.score,
      ships_sunk: game.ships_sunk,
      active_players,
      message: 'Joined team successfully',
    });
  } catch (error) {
    console.error('Error joining team:', error);
    res.status(500).json({ error: 'Failed to join team' });
  }
};

// Get all teams (admin)
export const getAllTeams = (_req: Request, res: Response): void => {
  try {
    const games = gameManager.getAllGames();
    const teams = games.map(game => ({
      team_id: game.team_id,
      team_name: game.team_name,
      score: game.score,
      ships_sunk: game.ships_sunk,
      active_players: getTeamConnections(game.team_id),
      game_complete: game.isGameComplete(),
    }));

    res.json({ teams, count: teams.length });
  } catch (error) {
    console.error('Error getting teams:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
};

// Get team status
export const getTeamStatus = (req: Request, res: Response): void => {
  try {
    const { team_id } = req.params;

    const game = gameManager.getGame(team_id);
    if (!game) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    res.json({
      team_id: game.team_id,
      team_name: game.team_name,
      score: game.score,
      ships_sunk: game.ships_sunk,
      ships: game.getVisibleShips(),
      game_complete: game.isGameComplete(),
      active_players: getTeamConnections(team_id),
    });
  } catch (error) {
    console.error('Error getting team status:', error);
    res.status(500).json({ error: 'Failed to get team status' });
  }
};

// Admin: Clear all teams (only allowed when competition is not active)
export const clearAllTeams = (_req: Request, res: Response): void => {
  try {
    // Check if competition is active
    if (gameManager.isCompetitionActive()) {
      res.status(403).json({ error: 'Cannot clear teams while competition is active' });
      return;
    }

    const count = gameManager.clearAllGames();
    teamConnections.clear(); // Clear all connection tracking

    res.json({ 
      message: `Successfully cleared ${count} teams`,
      count 
    });
  } catch (error) {
    console.error('Error clearing teams:', error);
    res.status(500).json({ error: 'Failed to clear teams' });
  }
};

// Admin: Delete selected teams (only allowed when competition is not active)
export const deleteSelectedTeams = (req: Request, res: Response): void => {
  try {
    if (gameManager.isCompetitionActive()) {
      res.status(403).json({ error: 'Cannot delete teams while competition is active' });
      return;
    }

    const { team_ids } = req.body;
    if (!team_ids || !Array.isArray(team_ids) || team_ids.length === 0) {
      res.status(400).json({ error: 'team_ids array is required' });
      return;
    }

    let deletedCount = 0;
    for (const teamId of team_ids) {
      if (gameManager.deleteGame(teamId)) {
        teamConnections.delete(teamId); // Clear connections for this team
        deletedCount++;
      }
    }
    
    res.json({ message: `Successfully deleted ${deletedCount} team(s)`, count: deletedCount });
  } catch (error) {
    console.error('Error deleting teams:', error);
    res.status(500).json({ error: 'Failed to delete teams' });
  }
};

// Player: Claim a random available team
export const claimRandomTeam = (_req: Request, res: Response): void => {
  try {
    const games = gameManager.getAllGames();
    
    if (games.length === 0) {
      res.status(404).json({ error: 'No teams available. Please contact your facilitator.' });
      return;
    }

    // Find teams with no active connections (unclaimed teams)
    const availableTeams = games.filter(game => {
      const connections = getTeamConnections(game.team_id);
      return connections === 0;
    });

    if (availableTeams.length === 0) {
      res.status(404).json({ error: 'All teams are currently in use. Please try again later.' });
      return;
    }

    // Randomly select one available team
    const randomIndex = Math.floor(Math.random() * availableTeams.length);
    const selectedTeam = availableTeams[randomIndex];

    res.json({
      team_id: selectedTeam.team_id,
      team_name: selectedTeam.team_name,
      message: 'Team claimed successfully',
    });
  } catch (error) {
    console.error('Error claiming team:', error);
    res.status(500).json({ error: 'Failed to claim team' });
  }
};
