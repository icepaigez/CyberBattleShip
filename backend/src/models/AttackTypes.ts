export type AttackType = 'sql_injection' | 'xss' | 'port_scan' | 'brute_force' | 'phishing' | 'ddos' | 'mitm' | 'command_injection' | 'ransomware' | 'session_hijacking';

export interface AttackTypeInfo {
  id: AttackType;
  name: string;
  icon: string;
  description: string;
  example: string;
  howToSpot: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export const ATTACK_TYPES: Record<AttackType, AttackTypeInfo> = {
  sql_injection: {
    id: 'sql_injection',
    name: 'SQL Injection',
    icon: '🗄️',
    description: 'Attackers put special code into website forms to trick the database into giving them information they shouldn\'t have.',
    example: "Instead of typing 'admin' as username, they type: admin' OR '1'='1' - This tricks the database into logging them in without a password!",
    howToSpot: [
      'Look for single quotes (\') in weird places',
      'Watch for SQL keywords: OR, SELECT, DROP, WHERE, UNION',
      'Check [DATABASE] or [SQL] category logs',
      'Suspicious query errors or syntax warnings'
    ],
    difficulty: 'easy'
  },
  xss: {
    id: 'xss',
    name: 'Cross-Site Scripting (XSS)',
    icon: '🕷️',
    description: 'Attackers inject malicious JavaScript code into websites to steal user data or hijack sessions.',
    example: 'They might put <script>alert(\'hacked\')</script> in a search box to run code on other users\' browsers.',
    howToSpot: [
      'Look for <script> tags in unexpected places',
      'Check for HTML/JavaScript in user input fields',
      'Watch for "XSS", "script", or "sanitizer" keywords',
      'Check [HTTP] logs with suspicious query parameters'
    ],
    difficulty: 'medium'
  },
  port_scan: {
    id: 'port_scan',
    name: 'Port Scanning',
    icon: '🔍',
    description: 'Attackers scan your network to find which "doors" (ports) are open so they can try to break in.',
    example: 'They check ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 3306 (MySQL) to see what services are running.',
    howToSpot: [
      'Multiple connection attempts to different ports',
      'Rapid successive connections from same IP',
      'Check [FIREWALL] logs for blocked connections',
      'Look for port numbers (22, 80, 443, 3306, etc.)'
    ],
    difficulty: 'easy'
  },
  brute_force: {
    id: 'brute_force',
    name: 'Brute Force Attack',
    icon: '🔨',
    description: 'Attackers try thousands of password combinations until they guess the right one - like trying every key on a keyring.',
    example: 'They might try: password123, admin123, qwerty, 12345678... until one works.',
    howToSpot: [
      'Many failed login attempts from same IP address',
      'Repetitive [AUTH] or authentication logs',
      'Look for "failed login", "invalid credentials"',
      'High number of attempts in short time period'
    ],
    difficulty: 'easy'
  },
  phishing: {
    id: 'phishing',
    name: 'Phishing / Social Engineering',
    icon: '🎣',
    description: 'Attackers trick people into clicking malicious links or revealing passwords by pretending to be someone trustworthy.',
    example: 'Fake email: "Dear user, your account will be deleted! Click here: evil-site.com to verify"',
    howToSpot: [
      'Suspicious email sender addresses (typos in domain)',
      'Urgent language: "Act now!", "Account suspended!"',
      'Check [EMAIL] logs for suspicious links',
      'Mismatched URLs (hover text vs actual link)'
    ],
    difficulty: 'medium'
  },
  ddos: {
    id: 'ddos',
    name: 'DDoS Attack',
    icon: '🌊',
    description: 'Attackers flood a server with massive amounts of traffic to overwhelm it and make it crash - like too many people rushing through a door at once.',
    example: 'Thousands of computers send requests at once: 10,000 requests/second from 500 different IPs, crashing the server.',
    howToSpot: [
      'Massive traffic spike from multiple IPs',
      'High request rate (1000+ req/sec)',
      'Check [FIREWALL] or [NETWORK] logs',
      'Server slowdown or timeout errors',
      'Keywords: "traffic spike", "rate limit", "overload"'
    ],
    difficulty: 'medium'
  },
  mitm: {
    id: 'mitm',
    name: 'Man-in-the-Middle (MITM)',
    icon: '👤',
    description: 'Attackers secretly intercept communication between two parties to steal information or inject malicious data - like eavesdropping on a phone call.',
    example: 'On public WiFi, attacker captures your login details as they travel from your laptop to the bank website.',
    howToSpot: [
      'Certificate warnings or SSL errors',
      'Unexpected network gateway changes',
      'Check [NETWORK] logs for ARP spoofing',
      'Duplicate IP addresses on network',
      'Keywords: "certificate", "SSL", "TLS", "proxy"'
    ],
    difficulty: 'hard'
  },
  command_injection: {
    id: 'command_injection',
    name: 'Command Injection',
    icon: '⚙️',
    description: 'Attackers trick the server into running dangerous system commands by hiding them in normal input - like sneaking instructions into a conversation.',
    example: 'In a search box, they type: file.txt; rm -rf / to delete all files after searching!',
    howToSpot: [
      'Semicolons (;) or pipes (|) in input fields',
      'System commands: rm, wget, curl, cat, ls',
      'Check [SYSTEM] or [APPLICATION] logs',
      'Unexpected process execution',
      'Keywords: "exec", "shell", "command"'
    ],
    difficulty: 'hard'
  },
  ransomware: {
    id: 'ransomware',
    name: 'Ransomware',
    icon: '🔒',
    description: 'Malicious software that encrypts all your files and demands payment to unlock them - like a digital kidnapping of your data.',
    example: 'All files get encrypted: report.docx → report.docx.locked. Message appears: "Pay $500 in Bitcoin to unlock!"',
    howToSpot: [
      'Unusual file encryption activity',
      'Mass file modifications (.locked, .encrypted)',
      'Check [SYSTEM] or [FILE] logs',
      'Suspicious executable files (.exe, .dll)',
      'Keywords: "encrypt", "ransom", "bitcoin", "payment"'
    ],
    difficulty: 'hard'
  },
  session_hijacking: {
    id: 'session_hijacking',
    name: 'Session Hijacking',
    icon: '🍪',
    description: 'Attackers steal your active login session (cookies) to impersonate you without needing your password - like stealing someone\'s ID badge.',
    example: 'Attacker copies your session cookie and uses it to log into your account as you, bypassing login.',
    howToSpot: [
      'Multiple logins from different locations',
      'Session ID in URLs (security risk)',
      'Check [AUTH] or [SESSION] logs',
      'Unexpected session timeouts',
      'Keywords: "cookie", "session", "token", "stolen"'
    ],
    difficulty: 'medium'
  }
};

export type TrafficCategory = 'HTTP' | 'DATABASE' | 'FIREWALL' | 'AUTH' | 'EMAIL' | 'SYSTEM';
export type TrafficSeverity = 'INFO' | 'WARN' | 'ERROR' | 'ALERT';

export interface CyberTrafficMessage {
  timestamp: string;
  severity: TrafficSeverity;
  category: TrafficCategory;
  source_ip?: string;
  message: string;
  contains_clue: boolean;  // True if it has encoded coordinates
  attack_type?: AttackType;
  encoded_data?: string;  // The encoded coordinate
  encoding_type?: string; // base64, hex, rot13, etc.
}
