import { GameState, GameConfig, DEFAULT_CONFIG } from './GameState.js';
import { Coordinate } from '../models/Ship.js';
import { SubmissionResult } from '../models/Submission.js';
import { AttackType } from '../models/AttackTypes.js';
import { gameDatabase } from './Database.js';

export interface GlobalFirstSink {
  ship_id: string;
  team_id: string;
  timestamp: Date;
}

export class GameManager {
  private games: Map<string, GameState> = new Map();
  private first_sinks: Map<string, GlobalFirstSink> = new Map(); // ship_id -> first team
  private config: GameConfig;
  private competition_start?: Date;
  private competition_end?: Date;
  private competition_duration_minutes: number = 90; // Default 90 minutes
  private auto_end_timer?: NodeJS.Timeout;
  private is_starting: boolean = false; // Prevents race condition during start

  constructor(config: GameConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    const compState = await gameDatabase.getCompetitionState();
    if (compState) {
      // Only load competition times if competition is currently active
      // This prevents loading stale end_time from previous competitions
      if (compState.is_active && compState.start_time) {
        this.competition_start = new Date(compState.start_time);
        this.competition_end = undefined; // Clear any previous end time
        this.competition_duration_minutes = compState.duration_minutes;
        
        // Recreate auto-end timer based on remaining time
        const now = new Date();
        const elapsed_ms = now.getTime() - this.competition_start.getTime();
        const duration_ms = this.competition_duration_minutes * 60 * 1000;
        const remaining_ms = duration_ms - elapsed_ms;
        
        if (remaining_ms > 0) {
          this.auto_end_timer = setTimeout(() => {
            console.log(`⏰ Competition time (${this.competition_duration_minutes} minutes) has elapsed. Auto-ending...`);
            this.endCompetition();
          }, remaining_ms);
          
          const remaining_minutes = Math.floor(remaining_ms / 60000);
          console.log(`⏱️ Competition in progress: ${remaining_minutes} minutes remaining`);
        } else {
          // Competition time has already elapsed, end it immediately
          console.log('⏰ Competition time has elapsed. Ending now...');
          await this.endCompetition();
        }
      } else if (compState.end_time) {
        // Competition was ended, load both start and end times for historical data
        if (compState.start_time) {
          this.competition_start = new Date(compState.start_time);
        }
        this.competition_end = new Date(compState.end_time);
      }
      
      if (!compState.is_active) {
        this.competition_duration_minutes = compState.duration_minutes;
      }
    }

    const teams = await gameDatabase.getAllTeams();
    for (const team of teams) {
      const gameState = new GameState(team.team_id, team.team_name, this.config);
      await gameState.initialize(true);
      this.games.set(team.team_id, gameState);
    }

    const firstSinks = await gameDatabase.getAllFirstSinks();
    for (const sink of firstSinks) {
      this.first_sinks.set(sink.ship_key, {
        ship_id: sink.ship_key,
        team_id: sink.team_id,
        timestamp: new Date(sink.timestamp)
      });
    }

    console.log(`📦 Loaded ${teams.length} teams and ${firstSinks.length} first sinks from database`);
  }

  async createTeam(team_id: string, team_name: string): Promise<GameState> {
    const game = new GameState(team_id, team_name, this.config);
    await game.initialize(false);
    this.games.set(team_id, game);
    return game;
  }

  getGame(team_id: string): GameState | undefined {
    return this.games.get(team_id);
  }

  getAllGames(): GameState[] {
    return Array.from(this.games.values());
  }

  async submitCoordinate(team_id: string, coord: Coordinate, attack_type?: AttackType): Promise<{
    result: SubmissionResult;
    points: number;
    ship_id?: string;
    first_global_sink: boolean;
    bonus_points: number;
    correct_attack_type?: boolean;
    correct_location?: boolean;
    new_ship_activated?: boolean;
  }> {
    const game = this.games.get(team_id);
    if (!game) {
      throw new Error(`Team ${team_id} not found`);
    }

    const submission = await game.submitCoordinate(coord, attack_type);
    let bonus_points = 0;
    let first_global_sink = false;
    let new_ship_activated = false;

    // Check if this is a full sink and if it's the first globally
    if (submission.result === 'hit' && submission.ship_id) {
      // Get ship details to create a global key (position + attack type)
      const ship = game.ships.find(s => s.id === submission.ship_id);
      if (ship) {
        // Create a global key based on position and attack type (same across all teams)
        const global_ship_key = `${ship.row}${ship.column}_${ship.attack_type}`;
        
        if (!this.first_sinks.has(global_ship_key)) {
          // First team globally to sink a ship at this position with this attack type
          this.first_sinks.set(global_ship_key, {
            ship_id: submission.ship_id,
            team_id,
            timestamp: new Date(),
          });
          
          await gameDatabase.saveFirstSink(global_ship_key, team_id);
          bonus_points = this.config.points_first_global;
          game.score += bonus_points;
          await gameDatabase.updateTeamScore(team_id, game.score, game.ships_sunk);
          
          first_global_sink = true;
        }
      }

      if (game.shouldActivateNewShip()) {
        const currentActive = game.getActiveShipCount();
        const result = await game.activateShips(currentActive + 1);
        new_ship_activated = result.activated;
      }
    }

    return {
      ...submission,
      first_global_sink,
      bonus_points,
      new_ship_activated,
    };
  }


  getLeaderboard(): Array<{
    team_id: string;
    team_name: string;
    score: number;
    ships_sunk: number;
    incorrect_count: number;
  }> {
    const scores = this.getAllGames().map(game => {
      const incorrect_count = game.submissions.filter(s => s.result === 'miss').length;
      
      return {
        team_id: game.team_id,
        team_name: game.team_name,
        score: game.score,
        ships_sunk: game.ships_sunk,
        incorrect_count,
      };
    });

    // Sort by score descending, then by ships sunk, then by incorrect (ascending)
    scores.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.ships_sunk !== b.ships_sunk) return b.ships_sunk - a.ships_sunk;
      return a.incorrect_count - b.incorrect_count;
    });

    return scores;
  }

  async setCompetitionDuration(minutes: number): Promise<void> {
    if (this.isCompetitionActive()) {
      throw new Error('Cannot change duration while competition is active');
    }
    this.competition_duration_minutes = minutes;
    await gameDatabase.setCompetitionDuration(minutes);
  }

  getCompetitionDuration(): number {
    return this.competition_duration_minutes;
  }

  async startCompetition(): Promise<void> {
    // Prevent race condition if multiple start requests come in
    if (this.is_starting) {
      throw new Error('Competition start already in progress');
    }
    
    if (this.isCompetitionActive()) {
      throw new Error('Competition is already active');
    }

    this.is_starting = true;
    
    try {
      this.competition_start = new Date();
      this.competition_end = undefined;
      await gameDatabase.setCompetitionActive(true, this.competition_start);
      
      // Clear any existing timer
      if (this.auto_end_timer) {
        clearTimeout(this.auto_end_timer);
      }
      
      // Set up auto-end timer
      const duration_ms = this.competition_duration_minutes * 60 * 1000;
      this.auto_end_timer = setTimeout(() => {
        console.log(`⏰ Competition time (${this.competition_duration_minutes} minutes) has elapsed. Auto-ending...`);
        this.endCompetition();
      }, duration_ms);
      
      console.log(`🚀 Competition started! Will auto-end in ${this.competition_duration_minutes} minutes.`);
    } finally {
      this.is_starting = false;
    }
  }

  async endCompetition(): Promise<void> {
    this.competition_end = new Date();
    await gameDatabase.endCompetition(this.competition_end);
    
    // Clear the auto-end timer
    if (this.auto_end_timer) {
      clearTimeout(this.auto_end_timer);
      this.auto_end_timer = undefined;
    }
    
    console.log('🏁 Competition ended!');
  }

  isCompetitionActive(): boolean {
    return !!this.competition_start && !this.competition_end;
  }

  getCompetitionStatus(): {
    active: boolean;
    start_time?: Date;
    end_time?: Date;
    elapsed_minutes?: number;
    duration_minutes: number;
    remaining_minutes?: number;
  } {
    const active = this.isCompetitionActive();
    let elapsed_minutes: number | undefined;
    let remaining_minutes: number | undefined;

    if (this.competition_start) {
      const now = new Date();
      const elapsed_ms = now.getTime() - this.competition_start.getTime();
      elapsed_minutes = Math.floor(elapsed_ms / 60000);
      
      if (active) {
        remaining_minutes = Math.max(0, this.competition_duration_minutes - elapsed_minutes);
      }
    }

    return {
      active,
      start_time: this.competition_start,
      end_time: this.competition_end,
      elapsed_minutes,
      duration_minutes: this.competition_duration_minutes,
      remaining_minutes,
    };
  }

  reset(): void {
    this.games.clear();
    this.first_sinks.clear();
    this.competition_start = undefined;
    this.competition_end = undefined;
    this.is_starting = false;
  }

  async clearAllGames(): Promise<number> {
    const count = this.games.size;
    this.games.clear();
    this.first_sinks.clear();
    await gameDatabase.clearAllTeams();
    return count;
  }

  async fullReset(): Promise<number> {
    const count = this.games.size;
    this.games.clear();
    this.first_sinks.clear();
    this.competition_start = undefined;
    this.competition_end = undefined;
    this.is_starting = false;
    if (this.auto_end_timer) {
      clearTimeout(this.auto_end_timer);
      this.auto_end_timer = undefined;
    }
    await gameDatabase.fullReset();
    return count;
  }

  async deleteGame(team_id: string): Promise<boolean> {
    const deleted = this.games.delete(team_id);
    if (deleted) {
      await gameDatabase.deleteTeam(team_id);
    }
    return deleted;
  }
}
