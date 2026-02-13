import { Ship, Coordinate, GridRow, GridColumn, coordinateToString } from '../models/Ship.js';
import { Submission, SubmissionResult } from '../models/Submission.js';
import { AttackType } from '../models/AttackTypes.js';
import { randomUUID } from 'crypto';
import { gameDatabase } from './Database.js';

export interface GameConfig {
  num_ships: number;
  points_attack_type: number;  // NEW: Correct attack type identification
  points_partial: number;
  points_sink: number;
  points_first_global: number;
  points_incorrect: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  num_ships: 80,          // 80 ships total for 90-minute competition (8 per attack type)
  points_attack_type: 5,  // Correct attack type identification
  points_partial: 5,      // Correct location (row or column)
  points_sink: 15,        // Complete neutralization (correct location + correct attack type)
  points_first_global: 5, // First team to neutralize an attack globally
  points_incorrect: -2,   // Wrong guess (location or attack type)
};

export class GameState {
  team_id: string;
  team_name: string;
  ships: Ship[];
  score: number;
  ships_sunk: number;
  submissions: Submission[];
  config: GameConfig;
  created_at: Date;

  constructor(team_id: string, team_name: string, config: GameConfig = DEFAULT_CONFIG, loadFromDb: boolean = false) {
    this.team_id = team_id;
    this.team_name = team_name;
    this.ships = [];
    this.score = 0;
    this.ships_sunk = 0;
    this.submissions = [];
    this.config = config;
    this.created_at = new Date();
    
    if (loadFromDb) {
      // Load existing game from database
      this.loadFromDatabase();
    } else {
      // Initialize new game
      this.initializeShips();
      this.persistToDatabase();
    }
  }

  private loadFromDatabase(): void {
    const teamData = gameDatabase.getTeam(this.team_id);
    if (teamData) {
      this.team_name = teamData.team_name;
      this.score = teamData.score;
      this.ships_sunk = teamData.ships_sunk;
    }
    
    this.ships = gameDatabase.getShips(this.team_id);
    this.submissions = gameDatabase.getSubmissions(this.team_id);
  }

  private persistToDatabase(): void {
    gameDatabase.saveTeam(this.team_id, this.team_name, this.score, this.ships_sunk);
    gameDatabase.saveShips(this.team_id, this.ships);
  }

  private initializeShips(): void {
    const placed = new Set<string>();
    const rows: GridRow[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const columns: GridColumn[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    // All 10 attack types, distributed across 80 ships (8 ships per attack type)
    const attackTypes: AttackType[] = [
      'sql_injection', 'xss', 'port_scan', 'brute_force', 'phishing',
      'ddos', 'mitm', 'command_injection', 'ransomware', 'session_hijacking'
    ];

    for (let i = 0; i < this.config.num_ships; i++) {
      let coordinate: string;
      let row: GridRow;
      let column: GridColumn;

      // Keep trying until we find an unoccupied cell (max 100 cells in 10x10 grid)
      do {
        row = rows[Math.floor(Math.random() * rows.length)];
        column = columns[Math.floor(Math.random() * columns.length)];
        coordinate = coordinateToString({ row, column });
      } while (placed.has(coordinate));

      placed.add(coordinate);

      // Distribute attack types evenly: 8 ships per attack type (80 ships / 10 types)
      const attackType = attackTypes[i % attackTypes.length];

      this.ships.push({
        id: randomUUID(),
        row,
        column,
        status: 'hidden',
        revealed_row: false,
        revealed_column: false,
        attack_type: attackType,  // Assign attack type cyclically
        is_active: false,  // All ships start inactive, will be activated strategically
      });
    }
    
    // Activate initial ships with diverse attack types (ensure all 10 types represented in first 20 ships)
    // This way students see all attack types in Phase 1-2 before hints are removed in Phase 4
    const initialActiveCount = 2; // Phase 1 starts with 2 ships
    
    // Select one ship from each attack type for initial activation pool
    // This ensures diverse exposure from the start
    const activationPool: Ship[] = [];
    for (const attackType of attackTypes) {
      const shipsOfType = this.ships.filter(s => s.attack_type === attackType);
      if (shipsOfType.length > 0) {
        activationPool.push(shipsOfType[0]); // Add first ship of each type to pool
      }
    }
    
    // Shuffle the pool and activate first 2
    const shuffled = activationPool.sort(() => Math.random() - 0.5);
    for (let i = 0; i < initialActiveCount && i < shuffled.length; i++) {
      shuffled[i].is_active = true;
    }
  }

  submitCoordinate(coord: Coordinate, attack_type?: AttackType): { 
    result: SubmissionResult; 
    points: number; 
    ship_id?: string;
    correct_attack_type?: boolean;
    correct_location?: boolean;
  } {
    // Check if this exact coordinate has already been submitted by the team
    const alreadySubmitted = this.submissions.some(sub => {
      const sameRow = coord.row && sub.row === coord.row;
      const sameColumn = coord.column && sub.column === coord.column;
      
      // If submitting both row and column, check if exact coordinate was submitted
      if (coord.row && coord.column) {
        return sameRow && sameColumn;
      }
      // If submitting only row, check if row was submitted
      if (coord.row && !coord.column) {
        return sameRow;
      }
      // If submitting only column, check if column was submitted
      if (!coord.row && coord.column) {
        return sameColumn;
      }
      return false;
    });

    if (alreadySubmitted) {
      // Coordinate already submitted - no points, no penalty
      const submission: Submission = {
        team_id: this.team_id,
        row: coord.row,
        column: coord.column,
        attack_type,
        result: 'duplicate',
        timestamp: new Date(),
        points_awarded: 0,
        correct_attack_type: false,
      };
      
      this.submissions.push(submission);
      
      // Persist to database
      gameDatabase.saveSubmission(submission);

      return {
        result: 'duplicate',
        points: 0,
        correct_attack_type: false,
        correct_location: false
      };
    }

    let points = 0;
    let correct_attack_type = false;
    let correct_location = false;
    let matched_ship: Ship | null = null;

    // Check each ship for location match
    for (const ship of this.ships) {
      if (ship.status === 'sunk') continue;

      const row_match = coord.row ? ship.row === coord.row : false;
      const column_match = coord.column ? ship.column === coord.column : false;
      const location_match = row_match || column_match;

      if (location_match) {
        matched_ship = ship;
        correct_location = true;
        
        // Track if this is new information
        let is_new_row = row_match && !ship.revealed_row;
        let is_new_column = column_match && !ship.revealed_column;
        
        // Award points ONLY for NEW information
        if (is_new_row || is_new_column) {
          points += this.config.points_partial;
        }

        // Update ship status based on what was revealed
        if (is_new_row) {
          ship.revealed_row = true;
          if (ship.status === 'hidden') {
            ship.status = 'partial_row';
          }
        }
        if (is_new_column) {
          ship.revealed_column = true;
          if (ship.status === 'hidden') {
            ship.status = 'partial_column';
          } else if (ship.status === 'partial_row') {
            ship.status = 'partial_column';
          }
        }

        // Check if attack type was also guessed correctly
        if (attack_type && attack_type === ship.attack_type) {
          correct_attack_type = true;
          points += this.config.points_attack_type;

          // If BOTH location and attack type are correct, and both row/col revealed - SINK THE SHIP!
          if (row_match && column_match) {
            ship.status = 'sunk';
            ship.revealed_row = true;
            ship.revealed_column = true;
            ship.sunk_at = new Date();
            this.ships_sunk++;
            
            // Award sink bonus (total will be points_partial + points_attack_type + additional sink bonus)
            points = this.config.points_sink;
          }
        }

        break; // Found a match, stop checking other ships
      }
    }

    // If no location match, it's a miss
    if (!matched_ship) {
      points = this.config.points_incorrect; // Negative points
      this.score += points;

      const submission: Submission = {
        team_id: this.team_id,
        row: coord.row,
        column: coord.column,
        attack_type,
        result: 'miss',
        timestamp: new Date(),
        points_awarded: points,
        correct_attack_type: false,
      };
      
      this.submissions.push(submission);

      // Persist to database
      gameDatabase.saveSubmission(submission);
      gameDatabase.updateTeamScore(this.team_id, this.score, this.ships_sunk);

      return { 
        result: 'miss', 
        points,
        correct_attack_type: false,
        correct_location: false
      };
    }

    // Determine result type
    let result: SubmissionResult;
    if (matched_ship.status === 'sunk') {
      result = 'hit'; // Complete neutralization
    } else if (points === 0) {
      result = 'duplicate'; // Already revealed this coordinate
    } else if (correct_attack_type) {
      result = 'correct_type';
    } else if (coord.row && matched_ship.row === coord.row) {
      result = 'partial_row';
    } else if (coord.column && matched_ship.column === coord.column) {
      result = 'partial_column';
    } else {
      result = 'miss';
    }

    this.score += points;

    const submission: Submission = {
      team_id: this.team_id,
      row: coord.row,
      column: coord.column,
      attack_type,
      result,
      ship_id: matched_ship.id,
      timestamp: new Date(),
      points_awarded: points,
      correct_attack_type,
    };

    this.submissions.push(submission);

    // Persist to database
    gameDatabase.saveSubmission(submission);
    gameDatabase.updateTeamScore(this.team_id, this.score, this.ships_sunk);
    gameDatabase.saveShip(this.team_id, matched_ship);

    return { 
      result, 
      points, 
      ship_id: matched_ship.id,
      correct_attack_type,
      correct_location
    };
  }

  getVisibleShips(): Partial<Ship>[] {
    // Only return ships that are active (gradually revealed based on difficulty)
    return this.ships
      .filter(ship => ship.is_active)
      .map(ship => ({
        id: ship.id,
        status: ship.status,
        row: ship.revealed_row ? ship.row : undefined,
        column: ship.revealed_column ? ship.column : undefined,
        attack_type: ship.attack_type,
        is_active: ship.is_active,
      }));
  }

  getActiveShips(): Ship[] {
    return this.ships.filter(ship => ship.status !== 'sunk');
  }

  // Activate ships based on difficulty phase
  activateShips(targetCount: number): { activated: boolean; newShips: Ship[] } {
    let currentlyActive = this.ships.filter(s => s.is_active).length;
    
    if (currentlyActive >= targetCount) {
      return { activated: false, newShips: [] }; // Already have enough active
    }
    
    const newShips: Ship[] = [];
    const inactiveShips = this.ships.filter(s => !s.is_active);
    
    // Randomize which inactive ships to activate (ensures diverse attack types)
    const shuffled = inactiveShips.sort(() => Math.random() - 0.5);
    
    // Activate ships up to target count
    const toActivate = Math.min(targetCount - currentlyActive, shuffled.length);
    for (let i = 0; i < toActivate; i++) {
      shuffled[i].is_active = true;
      newShips.push(shuffled[i]);
    }
    
    // Persist activated ships to database
    if (newShips.length > 0) {
      gameDatabase.saveShips(this.team_id, newShips);
    }
    
    return { activated: newShips.length > 0, newShips };
  }

  getActiveShipCount(): number {
    return this.ships.filter(s => s.is_active).length;
  }

  getActiveSunkCount(): number {
    return this.ships.filter(s => s.is_active && s.status === 'sunk').length;
  }

  shouldActivateNewShip(): boolean {
    const activeShips = this.ships.filter(s => s.is_active);
    const activeSunk = activeShips.filter(s => s.status === 'sunk').length;
    
    // Activate new ship if all current active ships are sunk
    return activeSunk === activeShips.length && activeShips.length < this.ships.length;
  }

  isGameComplete(): boolean {
    // In endless mode, game is never "complete" - competition ends after 90 minutes
    return false;
  }
}
