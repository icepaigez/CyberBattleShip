import { TrafficConfig } from './TrafficGenerator.js';
import { GameState } from './GameState.js';
import { EncodingType } from './CyberTrafficGenerator.js';

export interface DifficultyPhase {
  name: string;
  start_minute: number;
  end_minute: number;
  active_ships: number;
  encoding: EncodingType;
  leak_frequency_ms: number;
  noise_ratio: number;
}

export const DIFFICULTY_PHASES: DifficultyPhase[] = [
  {
    name: 'Phase 1: Learning',
    start_minute: 0,
    end_minute: 15,
    active_ships: 2,          // Time-based backstop (fast teams activate on performance)
    encoding: 'base64',
    leak_frequency_ms: 8000,  // Leak every 8 seconds (very frequent)
    noise_ratio: 3,           // 3 noise messages per leak (light)
  },
  {
    name: 'Phase 2: Recognition',
    start_minute: 15,
    end_minute: 30,
    active_ships: 6,          // Increased for 80-ship pool
    encoding: 'rot13',        // Will randomize across base64, rot13, hex
    leak_frequency_ms: 12000, // Leak every 12 seconds (frequent)
    noise_ratio: 5,           // 5 noise messages per leak (medium)
  },
  {
    name: 'Phase 3: Multitasking',
    start_minute: 30,
    end_minute: 50,
    active_ships: 15,         // Increased for 80-ship pool
    encoding: 'binary',       // Will randomize across all 5 encodings
    leak_frequency_ms: 15000, // Leak every 15 seconds (moderate)
    noise_ratio: 8,           // 8 noise messages per leak (heavy)
  },
  {
    name: 'Phase 4: Chaos',
    start_minute: 50,
    end_minute: 70,
    active_ships: 30,         // Increased for 80-ship pool
    encoding: 'base64',       // Will use layered encoding (e.g., base64→hex)
    leak_frequency_ms: 18000, // Leak every 18 seconds (less frequent)
    noise_ratio: 12,          // 12 noise messages per leak (very heavy)
  },
  {
    name: 'Phase 5: The Race',
    start_minute: 70,
    end_minute: 90,
    active_ships: 50,         // Increased for 80-ship pool (backstop for slow teams)
    encoding: 'base64',       // Fully randomized + layered
    leak_frequency_ms: 25000, // Leak every 25 seconds (sparse)
    noise_ratio: 20,          // 20 noise messages per leak (extreme)
  },
];

export class DifficultyScaler {
  private competition_start?: Date;

  setCompetitionStart(start: Date): void {
    this.competition_start = start;
  }

  // Get elapsed minutes since competition start
  getElapsedMinutes(): number {
    if (!this.competition_start) return 0;
    const now = new Date();
    const elapsed_ms = now.getTime() - this.competition_start.getTime();
    return Math.floor(elapsed_ms / 60000);
  }

  // Get current phase based on elapsed time
  getCurrentPhase(): DifficultyPhase {
    const elapsed = this.getElapsedMinutes();
    
    for (const phase of DIFFICULTY_PHASES) {
      if (elapsed >= phase.start_minute && elapsed < phase.end_minute) {
        return phase;
      }
    }
    
    // Default to last phase if over 90 minutes
    return DIFFICULTY_PHASES[DIFFICULTY_PHASES.length - 1];
  }

  // Get traffic configuration for current phase
  getTrafficConfig(): TrafficConfig {
    const phase = this.getCurrentPhase();
    
    return {
      noise_frequency_ms: 2000, // Keep noise steady
      leak_frequency_ms: phase.leak_frequency_ms,
      noise_ratio: phase.noise_ratio,
    };
  }

  // Adjust difficulty based on team performance
  adjustForTeamPerformance(
    gameState: GameState,
    baseConfig: TrafficConfig
  ): TrafficConfig {
    const config = { ...baseConfig };
    
    // If team is struggling (many incorrect submissions), make it easier
    const incorrectCount = gameState.submissions.filter(s => s.result === 'miss').length;
    const totalSubmissions = gameState.submissions.length;
    
    if (totalSubmissions > 5) {
      const errorRate = incorrectCount / totalSubmissions;
      
      if (errorRate > 0.6) {
        // High error rate - make easier
        config.leak_frequency_ms = Math.max(5000, config.leak_frequency_ms * 0.7);
        config.noise_ratio = Math.max(2, Math.floor(config.noise_ratio * 0.8));
      } else if (errorRate < 0.2 && gameState.ships_sunk > 2) {
        // Low error rate and progressing well - make harder
        config.leak_frequency_ms = Math.min(40000, config.leak_frequency_ms * 1.2);
        config.noise_ratio = Math.min(25, Math.floor(config.noise_ratio * 1.2));
      }
    }
    
    return config;
  }

  // Get recommended encoding for current difficulty
  getRecommendedEncoding(): EncodingType {
    const phase = this.getCurrentPhase();
    
    // In "Mixed Encodings" or "Final Pressure" phase, randomize between all types
    if (phase.name === 'Mixed Encodings' || phase.name === 'Final Pressure') {
      const encodings: EncodingType[] = ['base64', 'hex', 'rot13', 'binary', 'ascii'];
      return encodings[Math.floor(Math.random() * encodings.length)];
    }
    
    return phase.encoding as EncodingType;
  }

  // Get progress summary
  getProgressSummary(): {
    phase: string;
    elapsed_minutes: number;
    remaining_minutes: number;
    difficulty_level: string;
  } {
    const phase = this.getCurrentPhase();
    const elapsed = this.getElapsedMinutes();
    const remaining = 90 - elapsed;
    
    let difficulty_level = 'Easy';
    if (elapsed > 20 && elapsed <= 50) difficulty_level = 'Medium';
    else if (elapsed > 50 && elapsed <= 80) difficulty_level = 'Hard';
    else if (elapsed > 80) difficulty_level = 'Extreme';
    
    return {
      phase: phase.name,
      elapsed_minutes: elapsed,
      remaining_minutes: Math.max(0, remaining),
      difficulty_level,
    };
  }
}
