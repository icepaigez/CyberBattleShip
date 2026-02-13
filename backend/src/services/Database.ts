import { createClient, type Client } from '@libsql/client';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Ship } from '../models/Ship.js';
import { Submission } from '../models/Submission.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type DbClient = Client | Database.Database;

export class GameDatabase {
  private db: DbClient;
  private useTurso: boolean;

  constructor() {
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;

    if (tursoUrl && tursoToken) {
      this.db = createClient({ url: tursoUrl, authToken: tursoToken });
      this.useTurso = true;
      console.log('📦 Using Turso database (cloud)');
    } else {
      const dataDir = path.join(__dirname, '../../data');
      fs.mkdirSync(dataDir, { recursive: true });
      const dbPath = path.join(dataDir, 'battleship.db');
      this.db = new Database(dbPath) as Database.Database;
      (this.db as Database.Database).pragma('journal_mode = WAL');
      this.useTurso = false;
      console.log('📦 Using SQLite database (local)');
    }
  }

  async initialize(): Promise<void> {
    const schema = `
      CREATE TABLE IF NOT EXISTS teams (
        team_id TEXT PRIMARY KEY,
        team_name TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        ships_sunk INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

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

      CREATE TABLE IF NOT EXISTS competition (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        is_active BOOLEAN DEFAULT 0,
        start_time TEXT,
        end_time TEXT,
        duration_minutes INTEGER DEFAULT 90
      );

      CREATE TABLE IF NOT EXISTS first_sinks (
        ship_key TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(team_id)
      );

      INSERT OR IGNORE INTO competition (id, is_active, duration_minutes) VALUES (1, 0, 90);

      CREATE INDEX IF NOT EXISTS idx_ships_team ON ships(team_id);
      CREATE INDEX IF NOT EXISTS idx_ships_status ON ships(status);
      CREATE INDEX IF NOT EXISTS idx_submissions_team ON submissions(team_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_timestamp ON submissions(timestamp);
    `;

    if (this.useTurso) {
      const statements = schema
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));
      for (const stmt of statements) {
        await (this.db as Client).execute(stmt);
      }
    } else {
      (this.db as Database.Database).exec(schema);
    }
  }

  async saveTeam(
    team_id: string,
    team_name: string,
    score: number = 0,
    ships_sunk: number = 0
  ): Promise<void> {
    const sql = `INSERT OR REPLACE INTO teams (team_id, team_name, score, ships_sunk) VALUES (?, ?, ?, ?)`;
    if (this.useTurso) {
      await (this.db as Client).execute({ sql, args: [team_id, team_name, score, ships_sunk] });
    } else {
      (this.db as Database.Database).prepare(sql).run(team_id, team_name, score, ships_sunk);
    }
  }

  async getTeam(
    team_id: string
  ): Promise<{ team_id: string; team_name: string; score: number; ships_sunk: number } | undefined> {
    const sql = 'SELECT * FROM teams WHERE team_id = ?';
    if (this.useTurso) {
      const rs = await (this.db as Client).execute({ sql, args: [team_id] });
      const row = rs.rows[0] as Record<string, unknown> | undefined;
      return row
        ? {
            team_id: row.team_id as string,
            team_name: row.team_name as string,
            score: (row.score as number) ?? 0,
            ships_sunk: (row.ships_sunk as number) ?? 0,
          }
        : undefined;
    }
    return (this.db as Database.Database).prepare(sql).get(team_id) as any;
  }

  async getAllTeams(): Promise<
    Array<{ team_id: string; team_name: string; score: number; ships_sunk: number }>
  > {
    const sql = 'SELECT * FROM teams ORDER BY score DESC, ships_sunk DESC';
    if (this.useTurso) {
      const rs = await (this.db as Client).execute(sql);
      return (rs.rows as Record<string, unknown>[]).map((row) => ({
        team_id: row.team_id as string,
        team_name: row.team_name as string,
        score: (row.score as number) ?? 0,
        ships_sunk: (row.ships_sunk as number) ?? 0,
      }));
    }
    return (this.db as Database.Database).prepare(sql).all() as any[];
  }

  async updateTeamScore(team_id: string, score: number, ships_sunk: number): Promise<void> {
    const sql = `UPDATE teams SET score = ?, ships_sunk = ? WHERE team_id = ?`;
    if (this.useTurso) {
      await (this.db as Client).execute({ sql, args: [score, ships_sunk, team_id] });
    } else {
      (this.db as Database.Database).prepare(sql).run(score, ships_sunk, team_id);
    }
  }

  async deleteTeam(team_id: string): Promise<void> {
    const sql = 'DELETE FROM teams WHERE team_id = ?';
    if (this.useTurso) {
      await (this.db as Client).execute({ sql, args: [team_id] });
    } else {
      (this.db as Database.Database).prepare(sql).run(team_id);
    }
  }

  async clearAllTeams(): Promise<void> {
    const statements = [
      'DELETE FROM teams',
      'DELETE FROM ships',
      'DELETE FROM submissions',
      'DELETE FROM first_sinks',
    ];
    if (this.useTurso) {
      await (this.db as Client).batch(
        statements.map((sql) => ({ sql })),
        'write'
      );
    } else {
      for (const sql of statements) {
        (this.db as Database.Database).exec(sql);
      }
    }
  }

  async saveShip(team_id: string, ship: Ship): Promise<void> {
    const sql = `INSERT OR REPLACE INTO ships 
      (id, team_id, row, column, attack_type, status, is_active, revealed_row, revealed_column, sunk_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const args = [
      ship.id,
      team_id,
      ship.row,
      ship.column,
      ship.attack_type,
      ship.status,
      ship.is_active ? 1 : 0,
      ship.revealed_row ? 1 : 0,
      ship.revealed_column ? 1 : 0,
      ship.sunk_at?.toISOString() || null,
    ];
    if (this.useTurso) {
      await (this.db as Client).execute({ sql, args });
    } else {
      (this.db as Database.Database).prepare(sql).run(...args);
    }
  }

  async saveShips(team_id: string, ships: Ship[]): Promise<void> {
    const sql = `INSERT OR REPLACE INTO ships 
      (id, team_id, row, column, attack_type, status, is_active, revealed_row, revealed_column, sunk_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    if (this.useTurso) {
      const batch = ships.map((ship) => ({
        sql,
        args: [
          ship.id,
          team_id,
          ship.row,
          ship.column,
          ship.attack_type,
          ship.status,
          ship.is_active ? 1 : 0,
          ship.revealed_row ? 1 : 0,
          ship.revealed_column ? 1 : 0,
          ship.sunk_at?.toISOString() || null,
        ],
      }));
      await (this.db as Client).batch(batch, 'write');
    } else {
      const stmt = (this.db as Database.Database).prepare(sql);
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
    }
  }

  async getShips(team_id: string): Promise<Ship[]> {
    const sql = 'SELECT * FROM ships WHERE team_id = ? ORDER BY id';
    if (this.useTurso) {
      const rs = await (this.db as Client).execute({ sql, args: [team_id] });
      return (rs.rows as Record<string, unknown>[]).map((row) => ({
        id: row.id as string,
        row: row.row as Ship['row'],
        column: row.column as Ship['column'],
        attack_type: row.attack_type as Ship['attack_type'],
        status: row.status as Ship['status'],
        is_active: Boolean(row.is_active),
        revealed_row: Boolean(row.revealed_row),
        revealed_column: Boolean(row.revealed_column),
        sunk_at: row.sunk_at ? new Date(row.sunk_at as string) : undefined,
      })) as Ship[];
    }
    const rows = (this.db as Database.Database).prepare(sql).all(team_id) as any[];
    return rows.map((row) => ({
      id: row.id,
      row: row.row,
      column: row.column,
      attack_type: row.attack_type,
      status: row.status,
      is_active: Boolean(row.is_active),
      revealed_row: Boolean(row.revealed_row),
      revealed_column: Boolean(row.revealed_column),
      sunk_at: row.sunk_at ? new Date(row.sunk_at) : undefined,
    }));
  }

  async saveSubmission(submission: Submission): Promise<void> {
    const sql = `INSERT INTO submissions 
      (team_id, row, column, attack_type, result, points_awarded, ship_id, correct_attack_type, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const args = [
      submission.team_id,
      submission.row || null,
      submission.column || null,
      submission.attack_type || null,
      submission.result,
      submission.points_awarded,
      submission.ship_id || null,
      submission.correct_attack_type ? 1 : 0,
      submission.timestamp.toISOString(),
    ];
    if (this.useTurso) {
      await (this.db as Client).execute({ sql, args });
    } else {
      (this.db as Database.Database).prepare(sql).run(...args);
    }
  }

  async getSubmissions(team_id: string): Promise<Submission[]> {
    const sql = 'SELECT * FROM submissions WHERE team_id = ? ORDER BY timestamp';
    if (this.useTurso) {
      const rs = await (this.db as Client).execute({ sql, args: [team_id] });
      return (rs.rows as Record<string, unknown>[]).map((row) => ({
        team_id: row.team_id as string,
        row: row.row as Submission['row'],
        column: row.column as Submission['column'],
        attack_type: row.attack_type as Submission['attack_type'],
        result: row.result as Submission['result'],
        points_awarded: row.points_awarded as number,
        ship_id: row.ship_id as string | undefined,
        correct_attack_type: Boolean(row.correct_attack_type),
        timestamp: new Date(row.timestamp as string),
      })) as Submission[];
    }
    const rows = (this.db as Database.Database).prepare(sql).all(team_id) as any[];
    return rows.map((row) => ({
      team_id: row.team_id,
      row: row.row,
      column: row.column,
      attack_type: row.attack_type,
      result: row.result,
      points_awarded: row.points_awarded,
      ship_id: row.ship_id,
      correct_attack_type: Boolean(row.correct_attack_type),
      timestamp: new Date(row.timestamp),
    }));
  }

  async setCompetitionActive(isActive: boolean, startTime?: Date): Promise<void> {
    const sql = `UPDATE competition SET is_active = ?, start_time = ?, end_time = NULL WHERE id = 1`;
    if (this.useTurso) {
      await (this.db as Client).execute({
        sql,
        args: [isActive ? 1 : 0, startTime?.toISOString() || null],
      });
    } else {
      (this.db as Database.Database).prepare(sql).run(isActive ? 1 : 0, startTime?.toISOString() || null);
    }
  }

  async endCompetition(endTime: Date): Promise<void> {
    const sql = `UPDATE competition SET is_active = 0, end_time = ? WHERE id = 1`;
    if (this.useTurso) {
      await (this.db as Client).execute({ sql, args: [endTime.toISOString()] });
    } else {
      (this.db as Database.Database).prepare(sql).run(endTime.toISOString());
    }
  }

  async setCompetitionDuration(minutes: number): Promise<void> {
    const sql = `UPDATE competition SET duration_minutes = ? WHERE id = 1`;
    if (this.useTurso) {
      await (this.db as Client).execute({ sql, args: [minutes] });
    } else {
      (this.db as Database.Database).prepare(sql).run(minutes);
    }
  }

  async getCompetitionState(): Promise<{
    is_active: boolean;
    start_time: string | null;
    end_time: string | null;
    duration_minutes: number;
  } | undefined> {
    const sql = 'SELECT * FROM competition WHERE id = 1';
    if (this.useTurso) {
      const rs = await (this.db as Client).execute(sql);
      const row = rs.rows[0] as Record<string, unknown> | undefined;
      if (!row) return undefined;
      return {
        is_active: Boolean(row.is_active),
        start_time: row.start_time as string | null,
        end_time: row.end_time as string | null,
        duration_minutes: (row.duration_minutes as number) ?? 90,
      };
    }
    const row = (this.db as Database.Database).prepare(sql).get() as any;
    if (!row) return undefined;
    return {
      is_active: Boolean(row.is_active),
      start_time: row.start_time,
      end_time: row.end_time,
      duration_minutes: row.duration_minutes ?? 90,
    };
  }

  async saveFirstSink(ship_key: string, team_id: string): Promise<void> {
    const sql = `INSERT OR IGNORE INTO first_sinks (ship_key, team_id) VALUES (?, ?)`;
    if (this.useTurso) {
      await (this.db as Client).execute({ sql, args: [ship_key, team_id] });
    } else {
      (this.db as Database.Database).prepare(sql).run(ship_key, team_id);
    }
  }

  async getFirstSink(
    ship_key: string
  ): Promise<{ ship_key: string; team_id: string; timestamp: string } | undefined> {
    const sql = 'SELECT * FROM first_sinks WHERE ship_key = ?';
    if (this.useTurso) {
      const rs = await (this.db as Client).execute({ sql, args: [ship_key] });
      const row = rs.rows[0] as Record<string, unknown> | undefined;
      return row
        ? {
            ship_key: row.ship_key as string,
            team_id: row.team_id as string,
            timestamp: row.timestamp as string,
          }
        : undefined;
    }
    return (this.db as Database.Database).prepare(sql).get(ship_key) as any;
  }

  async getAllFirstSinks(): Promise<
    Array<{ ship_key: string; team_id: string; timestamp: string }>
  > {
    const sql = 'SELECT * FROM first_sinks';
    if (this.useTurso) {
      const rs = await (this.db as Client).execute(sql);
      return (rs.rows as Record<string, unknown>[]).map((row) => ({
        ship_key: row.ship_key as string,
        team_id: row.team_id as string,
        timestamp: row.timestamp as string,
      }));
    }
    return (this.db as Database.Database).prepare(sql).all() as any[];
  }

  close(): void {
    if (!this.useTurso) {
      (this.db as Database.Database).close();
    }
  }

  async getStats(): Promise<{
    totalTeams: number;
    totalSubmissions: number;
    totalShips: number;
    activePlayers: number;
  }> {
    if (this.useTurso) {
      const [teamsRs, subsRs, shipsRs] = await Promise.all([
        (this.db as Client).execute('SELECT COUNT(*) as count FROM teams'),
        (this.db as Client).execute('SELECT COUNT(*) as count FROM submissions'),
        (this.db as Client).execute('SELECT COUNT(*) as count FROM ships'),
      ]);
      return {
        totalTeams: (teamsRs.rows[0] as Record<string, number>).count ?? 0,
        totalSubmissions: (subsRs.rows[0] as Record<string, number>).count ?? 0,
        totalShips: (shipsRs.rows[0] as Record<string, number>).count ?? 0,
        activePlayers: 0,
      };
    }
    const db = this.db as Database.Database;
    const teams = db.prepare('SELECT COUNT(*) as count FROM teams').get() as { count: number };
    const submissions = db.prepare('SELECT COUNT(*) as count FROM submissions').get() as {
      count: number;
    };
    const ships = db.prepare('SELECT COUNT(*) as count FROM ships').get() as { count: number };
    return {
      totalTeams: teams.count,
      totalSubmissions: submissions.count,
      totalShips: ships.count,
      activePlayers: 0,
    };
  }
}

export const gameDatabase = new GameDatabase();
