export type AttackType = 'sql_injection' | 'xss' | 'port_scan' | 'brute_force' | 'phishing' | 'ddos' | 'mitm' | 'command_injection' | 'ransomware' | 'session_hijacking';

export interface AttackTypeInfo {
  id: AttackType;
  name: string;
  icon: string;
  description: string;
  example: string;
  howToSpot: string[];
}

export const ATTACK_TYPES: Record<AttackType, AttackTypeInfo> = {
  sql_injection: {
    id: 'sql_injection',
    name: 'SQL Injection',
    icon: '🗄️',
    description: 'Attackers put special code into website forms to trick the database.',
    example: "admin' OR '1'='1' tricks the database into logging them in without a password!",
    howToSpot: [
      'Look for single quotes (\') in weird places',
      'Watch for SQL keywords: OR, SELECT, DROP, WHERE',
      'Check [DATABASE] logs'
    ]
  },
  xss: {
    id: 'xss',
    name: 'XSS Attack',
    icon: '🕷️',
    description: 'Attackers inject malicious JavaScript code into websites.',
    example: '<script>alert(\'hacked\')</script> in a search box',
    howToSpot: [
      'Look for <script> tags',
      'Check for HTML/JavaScript in user input',
      'Watch for "XSS" or "sanitizer" keywords'
    ]
  },
  port_scan: {
    id: 'port_scan',
    name: 'Port Scan',
    icon: '🔍',
    description: 'Attackers scan to find which "doors" (ports) are open.',
    example: 'Checking ports 22, 80, 443 to see what services are running',
    howToSpot: [
      'Multiple connection attempts to different ports',
      'Rapid connections from same IP',
      'Check [FIREWALL] logs'
    ]
  },
  brute_force: {
    id: 'brute_force',
    name: 'Brute Force',
    icon: '🔨',
    description: 'Attackers try thousands of passwords until one works.',
    example: 'Trying: password123, admin123, qwerty, 12345678...',
    howToSpot: [
      'Many failed login attempts from same IP',
      'Repetitive [AUTH] logs',
      'Look for "failed login", "invalid credentials"'
    ]
  },
  phishing: {
    id: 'phishing',
    name: 'Phishing',
    icon: '🎣',
    description: 'Attackers trick people into revealing passwords.',
    example: 'Fake email: "Account suspended! Click here to verify"',
    howToSpot: [
      'Suspicious email addresses (typos in domain)',
      'Urgent language: "Act now!"',
      'Check [EMAIL] logs for suspicious links'
    ]
  },
  ddos: {
    id: 'ddos',
    name: 'DDoS Attack',
    icon: '🌊',
    description: 'Attackers flood a server with massive traffic to crash it.',
    example: '10,000 requests/second from 500 different IPs',
    howToSpot: [
      'Massive traffic spike from multiple IPs',
      'High request rate (1000+ req/sec)',
      'Check [FIREWALL] or [NETWORK] logs',
      'Keywords: "traffic spike", "overload"'
    ]
  },
  mitm: {
    id: 'mitm',
    name: 'Man-in-the-Middle',
    icon: '👤',
    description: 'Attackers secretly intercept communication to steal data.',
    example: 'On public WiFi, attacker captures your login details',
    howToSpot: [
      'Certificate warnings or SSL errors',
      'Check [NETWORK] logs for ARP spoofing',
      'Duplicate IP addresses on network',
      'Keywords: "certificate", "SSL", "TLS"'
    ]
  },
  command_injection: {
    id: 'command_injection',
    name: 'Command Injection',
    icon: '⚙️',
    description: 'Attackers trick the server into running dangerous commands.',
    example: 'In search: file.txt; rm -rf / to delete all files!',
    howToSpot: [
      'Semicolons (;) or pipes (|) in input',
      'System commands: rm, wget, curl, cat',
      'Check [SYSTEM] logs',
      'Keywords: "exec", "shell", "command"'
    ]
  },
  ransomware: {
    id: 'ransomware',
    name: 'Ransomware',
    icon: '🔒',
    description: 'Malware that encrypts files and demands payment.',
    example: 'Files become report.docx.locked - Pay $500 to unlock!',
    howToSpot: [
      'Mass file modifications (.locked, .encrypted)',
      'Check [SYSTEM] or [FILE] logs',
      'Suspicious executables (.exe, .dll)',
      'Keywords: "encrypt", "ransom", "bitcoin"'
    ]
  },
  session_hijacking: {
    id: 'session_hijacking',
    name: 'Session Hijacking',
    icon: '🍪',
    description: 'Attackers steal your login session to impersonate you.',
    example: 'Attacker copies your session cookie and logs in as you',
    howToSpot: [
      'Multiple logins from different locations',
      'Check [AUTH] or [SESSION] logs',
      'Unexpected session timeouts',
      'Keywords: "cookie", "session", "token"'
    ]
  }
};

export type TrafficCategory = 'HTTP' | 'DATABASE' | 'FIREWALL' | 'AUTH' | 'EMAIL' | 'SYSTEM';
export type TrafficSeverity = 'INFO' | 'WARN' | 'ERROR' | 'ALERT';
