import { Server, Socket } from 'socket.io';
import { gameManager, addTeamConnection, removeTeamConnection, getTeamConnections } from '../controllers/teamController.js';
import { isValidRow, isValidColumn, Coordinate, GridRow, GridColumn } from '../models/Ship.js';
import { AttackType } from '../models/AttackTypes.js';
import { trafficManager } from '../index.js';

// Store socket to team mapping
const socketTeamMap = new Map<string, string>(); // socket_id -> team_id

export function setupGameSocket(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Team join via WebSocket
    socket.on('join_team', (data: { team_id: string; auto_rejoin?: boolean }) => {
      try {
        let { team_id, auto_rejoin } = data;

        if (!team_id) {
          socket.emit('error', { message: 'team_id is required' });
          return;
        }

        // Normalize team_id to uppercase for consistent matching
        team_id = team_id.trim().toUpperCase();

        const game = gameManager.getGame(team_id);
        if (!game) {
          console.warn(`Team not found: "${team_id}". Available teams: ${gameManager.getAllGames().map(g => g.team_id).join(', ')}`);
          // Silent error for auto-rejoin (don't show popup), loud error for manual join
          socket.emit('error', { 
            message: 'Team not found. Please check your team code or contact your facilitator.',
            silent: auto_rejoin === true
          });
          return;
        }

        // Leave previous team if any
        const previousTeam = socketTeamMap.get(socket.id);
        if (previousTeam) {
          socket.leave(previousTeam);
          removeTeamConnection(previousTeam, socket.id);
        }

        // Join new team room
        socket.join(team_id);
        socketTeamMap.set(socket.id, team_id);
        addTeamConnection(team_id, socket.id);

        console.log(`Socket ${socket.id} joined team ${team_id}. Total connections for team: ${getTeamConnections(team_id)}`);

        // Send team state to the new player
        socket.emit('team_joined', {
          team_id: game.team_id,
          team_name: game.team_name,
          score: game.score,
          ships_sunk: game.ships_sunk,
          ships: game.getVisibleShips(),
        });

        // Start traffic generation if competition is active
        if (gameManager.isCompetitionActive()) {
          trafficManager.startTrafficForTeam(team_id, game);
        }

        // Notify team about new player
        io.to(team_id).emit('player_joined', {
          message: 'A player joined the team',
          team_id,
        });
      } catch (error) {
        console.error('Error joining team:', error);
        socket.emit('error', { message: 'Failed to join team' });
      }
    });

    // Submit coordinate via WebSocket
    socket.on('submit_coordinate', async (data: { team_id: string; row?: string; column?: number; attack_type?: AttackType }) => {
      try {
        const { team_id, row, column, attack_type } = data;

        if (!team_id || (!row && !column)) {
          socket.emit('error', { message: 'team_id and at least one coordinate (row or column) are required' });
          return;
        }

        // Validate attack_type if provided
        const validAttackTypes: AttackType[] = [
          'sql_injection', 'xss', 'port_scan', 'brute_force', 'phishing',
          'ddos', 'mitm', 'command_injection', 'ransomware', 'session_hijacking'
        ];
        if (attack_type && !validAttackTypes.includes(attack_type)) {
          socket.emit('error', { message: 'Invalid attack type' });
          return;
        }

        // Validate row if provided
        if (row && !isValidRow(row)) {
          socket.emit('error', { message: 'Invalid row. Must be A-J.' });
          return;
        }

        // Validate column if provided
        if (column && !isValidColumn(column)) {
          socket.emit('error', { message: 'Invalid column. Must be 1-10.' });
          return;
        }

        // Construct coordinate object (row and/or column can be optional)
        const coord: Coordinate = {
          row: row as GridRow | undefined,
          column: column as GridColumn | undefined,
        };

        const game = gameManager.getGame(team_id);
        if (!game) {
          socket.emit('error', { message: 'Team not found' });
          return;
        }

        const result = await gameManager.submitCoordinate(team_id, coord, attack_type);

        let message = '';
        const coordStr = row && column ? `${row}${column}` : row || `column ${column}`;
        
        if (result.result === 'hit') {
          message = `🎯 THREAT NEUTRALIZED! You identified the attacker at ${coordStr}!`;
          if (result.correct_attack_type) {
            message += ` Correct attack type identified!`;
          }
        } else if (result.result === 'correct_type') {
          message = `✅ Correct attack type identified! Now pinpoint the exact location.`;
        } else if (result.result === 'partial_row') {
          message = `📍 Location clue: Row ${row} contains an attacker!`;
          if (result.correct_attack_type) {
            message += ` Attack type correct!`;
          }
        } else if (result.result === 'partial_column') {
          message = `📍 Location clue: Column ${column} contains an attacker!`;
          if (result.correct_attack_type) {
            message += ` Attack type correct!`;
          }
        } else if (result.result === 'duplicate') {
          message = `⚠️ Already submitted! Your team has already checked this coordinate.`;
        } else {
          message = `❌ Miss! No attacker at ${coordStr}.`;
        }

        if (result.first_global_sink) {
          message += ` 🏆 FIRST TEAM GLOBALLY! +${result.bonus_points} bonus points!`;
        }

        const totalPoints = result.points + result.bonus_points;
        message += ` | Points: ${totalPoints > 0 ? '+' : ''}${totalPoints}`;

        // Send result to the submitting player
        socket.emit('submission_result', {
          success: true,
          result: result.result,
          points_awarded: result.points + result.bonus_points,
          message,
          ship_sunk: result.result === 'hit',
          ship_id: result.ship_id,
        });

        // Broadcast updated state to all team members
        io.to(team_id).emit('state_update', {
          score: game.score,
          ships_sunk: game.ships_sunk,
          ships: game.getVisibleShips(),
        });

        // If new ship was activated due to performance, notify the team
        if (result.new_ship_activated) {
          io.to(team_id).emit('new_threat_detected', {
            message: '🚨 New threat detected on the network!',
            count: 1,
          });
        }
      } catch (error) {
        console.error('Error submitting coordinate:', error);
        socket.emit('error', { message: 'Failed to submit coordinate' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);

      const team_id = socketTeamMap.get(socket.id);
      if (team_id) {
        removeTeamConnection(team_id, socket.id);
        socketTeamMap.delete(socket.id);

        console.log(`Removed ${socket.id} from team ${team_id}. Remaining connections: ${getTeamConnections(team_id)}`);

        // Notify team about player leaving
        io.to(team_id).emit('player_left', {
          message: 'A player left the team',
          team_id,
        });
      }
    });
  });
}

export function getSocketTeam(socket_id: string): string | undefined {
  return socketTeamMap.get(socket_id);
}

export function emitToTeam(io: Server, team_id: string, event: string, data: any): void {
  io.to(team_id).emit(event, data);
}
