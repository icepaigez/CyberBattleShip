import { TrafficMessage, TrafficLevel } from '../models/TrafficMessage.js';
import { Ship } from '../models/Ship.js';

export interface TrafficConfig {
  noise_frequency_ms: number; // How often to send noise
  leak_frequency_ms: number;  // How often to leak clues
  noise_ratio: number;        // Noise messages per leak
}

export type EncodingType = 'base64' | 'hex' | 'rot13' | 'binary' | 'ascii' | 'layered';

export class TrafficGenerator {
  private config: TrafficConfig;

  constructor(config: TrafficConfig) {
    this.config = config;
  }

  // Encode a string using Base64
  private encodeBase64(text: string): string {
    return Buffer.from(text).toString('base64');
  }

  // Encode a string using Hex
  private encodeHex(text: string): string {
    return Buffer.from(text).toString('hex').toUpperCase();
  }

  // Encode using ROT13 (Caesar cipher)
  private encodeROT13(text: string): string {
    return text.replace(/[a-zA-Z]/g, (char) => {
      const start = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - start + 13) % 26) + start);
    });
  }

  // Encode to Binary
  private encodeBinary(text: string): string {
    return text.split('').map(char => 
      char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('');
  }

  // Encode to ASCII codes
  private encodeASCII(text: string): string {
    return text.split('').map(char => char.charCodeAt(0)).join(' ');
  }

  // Generate layered encoding (Base64 -> Hex)
  private encodeLayered(text: string): string {
    const base64 = this.encodeBase64(text);
    return this.encodeHex(base64);
  }

  // Generate noise message
  generateNoise(): TrafficMessage {
    const templates = [
      'STATUS OK',
      'alive=true',
      'heartbeat ping',
      'session_active=1',
      'health_check passed',
      'metrics: cpu=12% mem=45%',
      'cache_hit_rate=0.87',
      'request_count=1247',
      'connection_pool size=8',
      'thread_active=true',
      'queue_depth=0',
      'latency_ms=23',
      'db_connections=5',
      'uptime=3600s',
      'error_count=0',
    ];

    const levels: TrafficLevel[] = ['INFO', 'DEBUG'];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const message = templates[Math.floor(Math.random() * templates.length)];

    return {
      timestamp: new Date(),
      level,
      message,
      contains_leak: false,
    };
  }

  // Generate a leak message for a ship
  generateLeak(
    ship: Ship,
    leak_type: 'row' | 'column' | 'full',
    encoding: EncodingType = 'base64'
  ): TrafficMessage {
    let clue = '';
    
    if (leak_type === 'row') {
      clue = ship.row;
    } else if (leak_type === 'column') {
      clue = ship.column.toString();
    } else {
      clue = `${ship.row}${ship.column}`;
    }

    // Encode the clue
    let encoded = '';
    switch (encoding) {
      case 'base64':
        encoded = this.encodeBase64(clue);
        break;
      case 'hex':
        encoded = this.encodeHex(clue);
        break;
      case 'rot13':
        encoded = this.encodeROT13(clue);
        break;
      case 'binary':
        encoded = this.encodeBinary(clue);
        break;
      case 'ascii':
        encoded = this.encodeASCII(clue);
        break;
      case 'layered':
        encoded = this.encodeLayered(clue);
        break;
    }

    // Vary the message format to make it realistic
    const formats = [
      `payload=${encoded}`,
      `data=${encoded}`,
      `meta=${encoded}`,
      `DEBUG ${encoded}`,
      `coord_leak: ${encoded}`,
      `[TRACE] buffer=${encoded}`,
      `session_token=${encoded} valid=true`,
      `INFO | cache_key=${encoded}`,
    ];

    const message = formats[Math.floor(Math.random() * formats.length)];
    const levels: TrafficLevel[] = ['INFO', 'DEBUG', 'WARN'];
    const level = levels[Math.floor(Math.random() * levels.length)];

    return {
      timestamp: new Date(),
      level,
      message,
      contains_leak: true,
      leak_type,
      ship_id: ship.id,
    };
  }

  // Format message for transmission
  formatMessage(msg: TrafficMessage): any {
    return {
      timestamp: msg.timestamp.toISOString(),
      level: msg.level,
      message: msg.message,
    };
  }

  updateConfig(config: Partial<TrafficConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): TrafficConfig {
    return { ...this.config };
  }
}

// Default configuration
export const DEFAULT_TRAFFIC_CONFIG: TrafficConfig = {
  noise_frequency_ms: 2000,  // Noise every 2 seconds
  leak_frequency_ms: 10000,  // Leak every 10 seconds
  noise_ratio: 5,            // 5 noise messages per leak
};
