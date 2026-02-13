import React from 'react';
import { ATTACK_TYPES } from '../types/attackTypes';

interface AttackGlossaryProps {
    onClose: () => void;
}

export const AttackGlossary: React.FC<AttackGlossaryProps> = ({ onClose }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glossary-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <h1>📚 Cyber Attack Glossary</h1>
                <p className="glossary-intro">
                    Learn about the 5 types of cyber attacks you'll be defending against.
                    Use this guide to identify threats in the network traffic!
                </p>

                <div className="glossary-grid">
                    {Object.values(ATTACK_TYPES).map((attack) => (
                        <div key={attack.id} className="glossary-card">
                            <div className="glossary-header">
                                <span className="glossary-icon">{attack.icon}</span>
                                <h2>{attack.name}</h2>
                            </div>

                            <div className="glossary-content">
                                <div className="glossary-section">
                                    <h3>What is it?</h3>
                                    <p>{attack.description}</p>
                                </div>

                                <div className="glossary-section">
                                    <h3>Example:</h3>
                                    <div className="glossary-example">{attack.example}</div>
                                </div>

                                <div className="glossary-section">
                                    <h3>How to spot it:</h3>
                                    <ul>
                                        {attack.howToSpot.map((tip, idx) => (
                                            <li key={idx}>{tip}</li>
                                        ))}
                                    </ul>
                                </div>

                                {attack.id === 'sql_injection' && (
                                    <div className="glossary-realworld">
                                        <strong>Real-world impact:</strong> In 2017, Equifax was breached via SQL injection,
                                        exposing data of 147 million people!
                                    </div>
                                )}
                                {attack.id === 'xss' && (
                                    <div className="glossary-realworld">
                                        <strong>Real-world impact:</strong> XSS attacks can steal login sessions,
                                        allowing hackers to impersonate users!
                                    </div>
                                )}
                                {attack.id === 'port_scan' && (
                                    <div className="glossary-realworld">
                                        <strong>Real-world impact:</strong> Port scanning is often the first step
                                        in planning a larger attack.
                                    </div>
                                )}
                                {attack.id === 'brute_force' && (
                                    <div className="glossary-realworld">
                                        <strong>Real-world impact:</strong> Weak passwords can be cracked in minutes.
                                        Always use long, complex passwords!
                                    </div>
                                )}
                                {attack.id === 'phishing' && (
                                    <div className="glossary-realworld">
                                        <strong>Real-world impact:</strong> 90% of data breaches start with a phishing email.
                                        Always verify sender addresses!
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="glossary-footer">
                    <h3>💡 Pro Tips:</h3>
                    <ul>
                        <li>Read the traffic <strong>category</strong> tags: [HTTP], [DATABASE], [FIREWALL], etc.</li>
                        <li>Look for <strong>severity</strong> levels: INFO (normal), WARN (suspicious), ALERT (danger!)</li>
                        <li>Suspicious IPs often appear repeatedly in attack traffic</li>
                        <li>Encoded strings often end with = (Base64) or are all numbers/letters (Hex)</li>
                    </ul>
                </div>

                <button className="close-glossary-btn" onClick={onClose}>
                    Close Glossary
                </button>
            </div>
        </div>
    );
};
