import React from 'react';

interface TutorialModalProps {
    onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content tutorial-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <h1>🛡️ Welcome, Junior SOC Analyst!</h1>
                <p className="tutorial-subtitle">
                    You're part of a Security Operations Center (SOC) team defending a corporate network
                    from cyber attacks. Your mission: identify threats and neutralize attackers!
                </p>

                <div className="tutorial-section">
                    <h2>🎯 Your Mission</h2>
                    <p>
                        <strong>80 different attackers</strong> are trying to breach the network over the next 90 minutes.
                        Each represents one of <strong>10 types</strong> of cyber attacks:
                    </p>
                    <ul>
                        <li><strong>🗄️ SQL Injection</strong> - Hacking databases</li>
                        <li><strong>🕷️ XSS Attack</strong> - Injecting malicious scripts</li>
                        <li><strong>🔍 Port Scan</strong> - Looking for system weaknesses</li>
                        <li><strong>🔨 Brute Force</strong> - Guessing passwords</li>
                        <li><strong>🎣 Phishing</strong> - Tricking users with fake emails</li>
                        <li><strong>🌊 DDoS Attack</strong> - Flooding servers with traffic</li>
                        <li><strong>👤 Man-in-the-Middle</strong> - Intercepting communications</li>
                        <li><strong>⚙️ Command Injection</strong> - Running unauthorized commands</li>
                        <li><strong>🔒 Ransomware</strong> - Encrypting files for ransom</li>
                        <li><strong>🍪 Session Hijacking</strong> - Stealing login sessions</li>
                    </ul>
                    <p className="tutorial-goal">
                        <strong>Your goal:</strong> Neutralize as many attackers as possible to earn the highest score!
                        You win by having the <strong>most points</strong> when time runs out (90 minutes).
                    </p>
                </div>

                <div className="tutorial-section">
                    <h2>📡 Step 1: Monitor Network Traffic</h2>
                    <p>
                        The <strong>Traffic Observer</strong> (middle panel) shows real-time network logs.
                        Most messages are normal traffic, but attackers hide clues in suspicious messages!
                    </p>
                    <ul>
                        <li><strong>Color codes:</strong> 🟢 INFO (normal) | 🟡 WARN (suspicious) | 🔴 ALERT (danger!)</li>
                        <li><strong>Categories:</strong> [HTTP], [DATABASE], [FIREWALL], [AUTH], [EMAIL], [SYSTEM]</li>
                        <li><strong>Look for:</strong> SQL keywords, &lt;script&gt; tags, port numbers, failed logins, suspicious emails</li>
                    </ul>
                    <p className="tutorial-example">
                        Example attack clue:<br />
                        <code>[ALERT][DATABASE] SQL injection: WHERE id='RDQ=' - Query blocked</code>
                    </p>
                </div>

                <div className="tutorial-section">
                    <h2>🔍 Step 2: Identify the Attack Type</h2>
                    <p>
                        Read the traffic message and figure out which type of attack it is. Click <strong>"📚 Attacks"</strong>
                        button to see the full glossary with examples!
                    </p>
                    <div className="tutorial-attack-hints">
                        <div><strong>🗄️ SQL Injection:</strong> Look for quotes ('), SQL keywords (SELECT, OR, DROP)</div>
                        <div><strong>🕷️ XSS:</strong> Look for &lt;script&gt; tags or HTML in weird places</div>
                        <div><strong>🔍 Port Scan:</strong> Multiple port numbers (22, 80, 443), firewall blocks</div>
                        <div><strong>🔨 Brute Force:</strong> Many failed login attempts from same IP</div>
                        <div><strong>🎣 Phishing:</strong> Suspicious email domains, urgent language</div>
                    </div>
                </div>

                <div className="tutorial-section">
                    <h2>🔓 Step 3: Decode Hidden Coordinates</h2>
                    <p>
                        Attackers encode their location to hide. Click <strong>"🔧 Tools"</strong> to access decoders:
                    </p>
                    <ul>
                        <li><strong>Base64:</strong> Random letters/numbers, often ends with =</li>
                        <li><strong>Hex:</strong> Only uses 0-9 and A-F</li>
                        <li><strong>ROT13:</strong> Letters shifted in alphabet</li>
                        <li><strong>Binary:</strong> Long strings of 1s and 0s</li>
                        <li><strong>ASCII:</strong> Decimal numbers (like "68 52")</li>
                    </ul>
                    <p className="tip">
                        💡 <strong>Cyber Tip:</strong> Attackers encode data to bypass security filters.
                        Understanding encoding is a core cybersecurity skill!
                    </p>
                </div>

                <div className="tutorial-section">
                    <h2>🚨 Step 4: Submit Threat Report</h2>
                    <p>
                        Use the <strong>Submission Panel</strong> (right side) to report what you found:
                    </p>
                    <ol>
                        <li><strong>Select Attack Type</strong> (required) - What kind of attack is it?</li>
                        <li><strong>Select Location</strong> (optional) - Row and/or column from decoded coordinates</li>
                        <li><strong>Submit</strong> - Send your threat report!</li>
                    </ol>
                    <p className="tutorial-results">
                        <strong>Results:</strong><br />
                        ✓ Correct attack type + location = <strong>Threat Neutralized!</strong> 🎯<br />
                        ✓ Correct attack type only = <strong>Partial points</strong> 📍<br />
                        ✓ Correct location only = <strong>Clue revealed</strong> 🔍<br />
                        ✗ Wrong guess = <strong>Points lost</strong> ❌
                    </p>
                </div>

                <div className="tutorial-section">
                    <h2>⭐ Scoring System</h2>
                    <ul>
                        <li><strong>+5 points:</strong> Correct attack type identified</li>
                        <li><strong>+5 points:</strong> Correct location found</li>
                        <li><strong>+15 points:</strong> Complete neutralization (both correct!)</li>
                        <li><strong>+5 bonus:</strong> First team globally to neutralize an attack</li>
                        <li><strong>-2 points:</strong> Wrong guess</li>
                    </ul>
                    <p className="tip">
                        🏆 <strong>Strategy:</strong> Work together as a SOC team! Split roles - some monitor traffic
                        for patterns, others decode clues, and coordinate your threat reports.
                    </p>
                </div>

                <div className="tutorial-section">
                    <h2>🏆 How to Win</h2>
                    <p>
                        <strong>Competition ends at 90 minutes</strong> - team with the <strong>HIGHEST SCORE</strong> wins!
                    </p>
                    <div className="tutorial-winning">
                        <p><strong>🎯 Winning Strategy:</strong></p>
                        <ul>
                            <li><strong>Speed matters:</strong> First team to neutralize each attack gets +5 bonus</li>
                            <li><strong>Accuracy matters:</strong> Wrong guesses cost -2 points each</li>
                            <li><strong>Completion isn't everything:</strong> A team with 18 neutralized threats and 285 points beats a team with 20 threats but 275 points!</li>
                        </ul>
                        <p className="tip">
                            🏅 <strong>Tiebreaker:</strong> If scores are equal → Most ships sunk wins → Fewest wrong guesses wins
                        </p>
                    </div>
                </div>

                <div className="tutorial-section">
                    <h2>⏱️ Progressive Difficulty - 5 Phases</h2>
                    <p>
                        <strong>Just like real SOC work, attacks escalate over time:</strong>
                    </p>
                    <div className="tutorial-phases">
                        <p><strong>📈 Phase Progression:</strong></p>
                        <ul>
                            <li><strong>Phase 1 (0-15 min): Learning 📚</strong> - 2 active threats, explicit hints [BASE64], frequent clues</li>
                            <li><strong>Phase 2 (15-30 min): Recognition 🔍</strong> - 4 active threats, vague hints (encoded), more noise</li>
                            <li><strong>Phase 3 (30-50 min): Multitasking ⚡</strong> - 9 active threats, NO hints, all encodings, heavy noise</li>
                            <li><strong>Phase 4 (50-70 min): Chaos 🔥</strong> - 16 active threats, layered encoding (Base64→Hex), extreme noise</li>
                            <li><strong>Phase 5 (70-90 min): The Race 🏆</strong> - 24 active threats, sparse clues, maximum difficulty!</li>
                        </ul>
                        <p className="tutorial-example">
                            <strong>🚨 New threats appear throughout the competition!</strong> As you neutralize attackers,
                            more appear on the network. Fast teams can neutralize 30-50+ threats, slow teams might get 10-20.
                        </p>
                    </div>
                    <p className="cyber-insight">
                        💡 <strong>Real Cyber Insight:</strong> Real SOC analysts face this exact challenge - threats
                        escalate, attacks get more sophisticated, and you must adapt your strategies on the fly!
                    </p>
                </div>

                <div className="tutorial-section">
                    <h2>👥 Team Play</h2>
                    <p>
                        Up to <strong>4 players</strong> per team - just like a real SOC shift!
                        Share your team code with teammates. If you refresh, you'll auto-rejoin.
                    </p>
                    <p className="team-roles">
                        <strong>Suggested roles:</strong><br />
                        🔍 <strong>Traffic Analyst</strong> - Monitors logs for suspicious patterns<br />
                        🔓 <strong>Decoder</strong> - Decodes encoded messages<br />
                        🎯 <strong>Threat Hunter</strong> - Identifies attack types<br />
                        📊 <strong>Coordinator</strong> - Manages submissions and strategy
                    </p>
                </div>

                <div className="tutorial-section">
                    <h2>🎓 What You're Learning</h2>
                    <p>
                        This game teaches <strong>real cybersecurity skills</strong> used by professionals:
                    </p>
                    <ul>
                        <li><strong>Log Analysis</strong> - Reading system logs to find threats</li>
                        <li><strong>Attack Pattern Recognition</strong> - Identifying different attack types</li>
                        <li><strong>Encoding/Decoding</strong> - Understanding how attackers hide data</li>
                        <li><strong>Threat Prioritization</strong> - Distinguishing real threats from noise</li>
                        <li><strong>Incident Response</strong> - Quick decision-making under pressure</li>
                    </ul>
                    <p className="career-note">
                        💼 These skills are used daily by SOC Analysts, Security Engineers, and Incident Responders!
                    </p>
                </div>

                <div className="tutorial-ready">
                    <h3>Ready to defend the network? 🛡️</h3>
                    <p>Remember: Click <strong>"📚 Attacks"</strong> anytime to review attack types!</p>
                    <button className="close-tutorial-btn" onClick={onClose}>
                        Start My SOC Shift 🚀
                    </button>
                </div>
            </div>
        </div>
    );
};
