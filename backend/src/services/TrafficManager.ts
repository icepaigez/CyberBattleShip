import { Server } from 'socket.io';
import { CyberTrafficGenerator } from './CyberTrafficGenerator.js';
import { GameState } from './GameState.js';
import { DifficultyScaler } from './DifficultyScaler.js';

export interface TrafficConfig {
  noise_frequency_ms: number;
  leak_frequency_ms: number;
  leak_probability: number;
}

export const DEFAULT_TRAFFIC_CONFIG: TrafficConfig = {
  noise_frequency_ms: 2000,  // Generate noise every 2 seconds
  leak_frequency_ms: 8000,   // Generate leak every 8 seconds
  leak_probability: 0.3      // 30% chance of leak when generating message
};

export class TrafficManager {
  private generators: Map<string, CyberTrafficGenerator> = new Map();
  private teamTimers: Map<string, NodeJS.Timeout[]> = new Map();
  private io: Server;
  private difficultyScaler: DifficultyScaler;
  private config: TrafficConfig;

  constructor(io: Server, config: TrafficConfig = DEFAULT_TRAFFIC_CONFIG) {
    this.io = io;
    this.config = config;
    this.difficultyScaler = new DifficultyScaler();
  }

  setCompetitionStart(start: Date): void {
    this.difficultyScaler.setCompetitionStart(start);
  }

  // Start traffic generation for a team
  startTrafficForTeam(team_id: string, gameState: GameState): void {
    this.stopTrafficForTeam(team_id); // Clear existing timers

    // Create a generator for this team with their ships
    const generator = new CyberTrafficGenerator(gameState.ships);
    this.generators.set(team_id, generator);

    const timers: NodeJS.Timeout[] = [];

    // Difficulty adjustment interval (every 60 seconds)
    const difficultyInterval = setInterval(async () => {
      const phase = this.difficultyScaler.getCurrentPhase();
      const elapsedMinutes = this.difficultyScaler.getElapsedMinutes();
      
      const difficultyPhase = elapsedMinutes < 50 ? 1 : 3;
      generator.setDifficultyPhase(difficultyPhase);
      
      const result = await gameState.activateShips(phase.active_ships);
      
      // Notify team if new ships were activated
      if (result.activated) {
        // Send notification
        this.io.to(team_id).emit('new_threat_detected', {
          message: `🚨 New threat${result.newShips.length > 1 ? 's' : ''} detected on the network!`,
          count: result.newShips.length,
        });
        
        // Send updated ship list so frontend can update Active Threats count
        this.io.to(team_id).emit('state_update', {
          ships: gameState.getVisibleShips(),
        });
      }
      
      console.log(`Difficulty updated for team ${team_id}: ${phase.name} (Phase ${difficultyPhase}, ${gameState.getActiveShipCount()}/${gameState.ships.length} ships active)`);
    }, 60000);

    timers.push(difficultyInterval);

    // Main traffic generation interval
    const trafficInterval = setInterval(() => {
      // Adjust leak probability based on team performance
      let leak_prob = this.config.leak_probability;
      if (gameState.ships_sunk > 2) {
        leak_prob *= 0.7; // Reduce leaks if team is doing well
      }
      
      // Let generator randomize encoding across all 5 types
      // This ensures students see all encodings in early phases before hints are removed
      const message = generator.generateMessage(leak_prob);
      this.io.to(team_id).emit('traffic_message', message);
    }, this.config.noise_frequency_ms);

    timers.push(trafficInterval);

    this.teamTimers.set(team_id, timers);
    console.log(`Traffic generation started for team ${team_id}`);
  }

  // Stop traffic generation for a team
  stopTrafficForTeam(team_id: string): void {
    const timers = this.teamTimers.get(team_id);
    if (timers) {
      timers.forEach(timer => clearInterval(timer));
      this.teamTimers.delete(team_id);
      this.generators.delete(team_id);
      console.log(`Traffic generation stopped for team ${team_id}`);
    }
  }

  // Stop all traffic
  stopAllTraffic(): void {
    for (const team_id of this.teamTimers.keys()) {
      this.stopTrafficForTeam(team_id);
    }
  }

  // Update traffic configuration
  updateConfig(config: Partial<TrafficConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get current configuration
  getConfig(): TrafficConfig {
    return this.config;
  }
}
