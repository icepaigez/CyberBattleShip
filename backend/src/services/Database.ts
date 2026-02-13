import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Ship } from '../models/Ship.js';
import { Submission } from '../models/Submission.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GameDatabase {
  private db: Database.Database;

  constructor(filename: string = 'battleship.db') {
    const dataDir = path.join(__dirname, '../../data');
    fs.mkdirSync(dataDir, { recursive: true });
    const dbPath = path.join(dataDir, filename);
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Performance optimization
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      -- Teams table
      CREATE TABLE IF NOT EXISTS teams (
        team_id TEXT PRIMARY KEY,
        team_name TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        ships_sunk INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Ships table
      CREATE TABLE IF NOT EXISTS ships (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        row TEXT,
        column INTEGER,
        attack_type TEXT,
        status TEXT DEFAULT 'hidden',
        is_active BOOLEAN DEFAULT 0,
        revealed_row BOOLEAN DEFAULT 0,
        revealed_column BOOLEAN DEFAULT 0,
        sunk_at TEXT,
        FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
      );

      -- Submissions table
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id TEXT NOT NULL,
        row TEXT,
        column INTEGER,
        attack_type TEXT,
        result TEXT,
        points_awarded INTEGER,
        ship_id TEXT,
        correct_attack_type BOOLEAN DEFAULT 0,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
      );

      -- Competition state table
      CREATE TABLE IF NOT EXISTS competition (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        is_active BOOLEAN DEFAULT 0,
        start_time TEXT,
        end_time TEXT,
        duration_minutes INTEGER DEFAULT 90
      );

      -- First global sinks table
      CREATE TABLE IF NOT EXISTS first_sinks (
        ship_key TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(team_id)
      );

      -- Initialize competition row if not exists
      INSERT OR IGNORE INTO competition (id, is_active, duration_minutes) 
      VALUES (1, 0, 90);

      -- Create indices for performance
      CREATE INDEX IF NOT EXISTS idx_ships_team ON ships(team_id);
      CREATE INDEX IF NOT EXISTS idx_ships_status ON ships(status);
      CREATE INDEX IF NOT EXISTS idx_submissions_team ON submissions(team_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_timestamp ON submissions(timestamp);
    `);
  }

  // Team operations
  saveTeam(team_id: string, team_name: string, score: number = 0, ships_sunk: number = 0): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO teams (team_id, team_name, score, ships_sunk)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(team_id, team_name, score, ships_sunk);
  }

  getTeam(team_id: string): { team_id: string; team_name: string; score: number; ships_sunk: number } | undefined {
    const stmt = this.db.prepare('SELECT * FROM teams WHERE team_id = ?');
    return stmt.get(team_id) as any;
  }

  getAllTeams(): Array<{ team_id: string; team_name: string; score: number; ships_sunk: number }> {
    const stmt = this.db.prepare('SELECT * FROM teams ORDER BY score DESC, ships_sunk DESC');
    return stmt.all() as any[];
  }

  updateTeamScore(team_id: string, score: number, ships_sunk: number): void {
    const stmt = this.db.prepare(`
      UPDATE teams 
      SET score = ?, ships_sunk = ? 
      WHERE team_id = ?
    `);
    stmt.run(score, ships_sunk, team_id);
  }

  deleteTeam(team_id: string): void {
    const stmt = this.db.prepare('DELETE FROM teams WHERE team_id = ?');
    stmt.run(team_id);
  }

  clearAllTeams(): void {
    this.db.exec(`
      DELETE FROM teams;
      DELETE FROM ships;
      DELETE FROM submissions;
      DELETE FROM first_sinks;
    `);
  }

  // Ship operations
  saveShip(team_id: string, ship: Ship): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ships 
      (id, team_id, row, column, attack_type, status, is_active, revealed_row, revealed_column, sunk_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      ship.id,
      team_id,
      ship.row,
      ship.column,
      ship.attack_type,
      ship.status,
      ship.is_active ? 1 : 0,
      ship.revealed_row ? 1 : 0,
      ship.revealed_column ? 1 : 0,
      ship.sunk_at?.toISOString() || null
    );
  }

  saveShips(team_id: string, ships: Ship[]): void {
    const transaction = this.db.transaction((ships: Ship[]) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO ships 
        (id, team_id, row, column, attack_type, status, is_active, revealed_row, revealed_column, sunk_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const ship of ships) {
        stmt.run(
          ship.id,
          team_id,
          ship.row,
          ship.column,
          ship.attack_type,
          ship.status,
          ship.is_active ? 1 : 0,
          ship.revealed_row ? 1 : 0,
          ship.revealed_column ? 1 : 0,
          ship.sunk_at?.toISOString() || null
        );
      }
    });
    
    transaction(ships);
  }

  getShips(team_id: string): Ship[] {
    const stmt = this.db.prepare('SELECT * FROM ships WHERE team_id = ? ORDER BY id');
    const rows = stmt.all(team_id) as any[];
    
    return rows.map(row => ({
      id: row.id,
      row: row.row,
      column: row.column,
      attack_type: row.attack_type,
      status: row.status,
      is_active: Boolean(row.is_active),
      revealed_row: Boolean(row.revealed_row),
      revealed_column: Boolean(row.revealed_column),
      sunk_at: row.sunk_at ? new Date(row.sunk_at) : undefined
    }));
  }

  // Submission operations
  saveSubmission(submission: Submission): void {
    const stmt = this.db.prepare(`
      INSERT INTO submissions 
      (team_id, row, column, attack_type, result, points_awarded, ship_id, correct_attack_type, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      submission.team_id,
      submission.row || null,
      submission.column || null,
      submission.attack_type || null,
      submission.result,
      submission.points_awarded,
      submission.ship_id || null,
      submission.correct_attack_type ? 1 : 0,
      submission.timestamp.toISOString()
    );
  }

  getSubmissions(team_id: string): Submission[] {
    const stmt = this.db.prepare('SELECT * FROM submissions WHERE team_id = ? ORDER BY timestamp');
    const rows = stmt.all(team_id) as any[];
    
    return rows.map(row => ({
      team_id: row.team_id,
      row: row.row,
      column: row.column,
      attack_type: row.attack_type,
      result: row.result,
      points_awarded: row.points_awarded,
      ship_id: row.ship_id,
      correct_attack_type: Boolean(row.correct_attack_type),
      timestamp: new Date(row.timestamp)
    }));
  }

  // Competition operations
  setCompetitionActive(isActive: boolean, startTime?: Date): void {
    const stmt = this.db.prepare(`
      UPDATE competition 
      SET is_active = ?, start_time = ?, end_time = NULL
      WHERE id = 1
    `);
    stmt.run(isActive ? 1 : 0, startTime?.toISOString() || null);
  }

  endCompetition(endTime: Date): void {
    const stmt = this.db.prepare(`
      UPDATE competition 
      SET is_active = 0, end_time = ?
      WHERE id = 1
    `);
    stmt.run(endTime.toISOString());
  }

  setCompetitionDuration(minutes: number): void {
    const stmt = this.db.prepare(`
      UPDATE competition 
      SET duration_minutes = ?
      WHERE id = 1
    `);
    stmt.run(minutes);
  }

  getCompetitionState(): {
    is_active: boolean;
    start_time: string | null;
    end_time: string | null;
    duration_minutes: number;
  } | undefined {
    const stmt = this.db.prepare('SELECT * FROM competition WHERE id = 1');
    const row = stmt.get() as any;
    if (!row) return undefined;
    
    return {
      is_active: Boolean(row.is_active),
      start_time: row.start_time,
      end_time: row.end_time,
      duration_minutes: row.duration_minutes
    };
  }

  // First sink operations
  saveFirstSink(ship_key: string, team_id: string): void {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO first_sinks (ship_key, team_id)
      VALUES (?, ?)
    `);
    stmt.run(ship_key, team_id);
  }

  getFirstSink(ship_key: string): { ship_key: string; team_id: string; timestamp: string } | undefined {
    const stmt = this.db.prepare('SELECT * FROM first_sinks WHERE ship_key = ?');
    return stmt.get(ship_key) as any;
  }

  getAllFirstSinks(): Array<{ ship_key: string; team_id: string; timestamp: string }> {
    const stmt = this.db.prepare('SELECT * FROM first_sinks');
    return stmt.all() as any[];
  }

  // Utility
  close(): void {
    this.db.close();
  }

  // Get database statistics
  getStats(): {
    totalTeams: number;
    totalSubmissions: number;
    totalShips: number;
    activePlayers: number;
  } {
    const teams = this.db.prepare('SELECT COUNT(*) as count FROM teams').get() as { count: number };
    const submissions = this.db.prepare('SELECT COUNT(*) as count FROM submissions').get() as { count: number };
    const ships = this.db.prepare('SELECT COUNT(*) as count FROM ships').get() as { count: number };
    
    return {
      totalTeams: teams.count,
      totalSubmissions: submissions.count,
      totalShips: ships.count,
      activePlayers: 0 // Will be tracked in memory
    };
  }
}

// Export singleton instance
export const gameDatabase = new GameDatabase();
