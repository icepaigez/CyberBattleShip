import { useEffect, useRef, useState } from 'react';
import { TrafficMessage } from '../types/game';
import { ATTACK_TYPES } from '../types/attackTypes';

interface Props {
    messages: TrafficMessage[];
    totalCount: number;
}

export function TrafficObserver({ messages, totalCount }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!scrollRef.current) return;

        const element = scrollRef.current;
        const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100;

        // Only auto-scroll if user is already near the bottom
        if (isNearBottom) {
            element.scrollTop = element.scrollHeight;
        }
    }, [messages]);

    const getSeverityClass = (severity: string): string => {
        return `severity-${severity.toLowerCase()}`;
    };

    const getCategoryClass = (category: string): string => {
        return `category-${category.toLowerCase()}`;
    };

    // Filter messages based on search term
    const filteredMessages = searchTerm
        ? messages.filter(msg => {
            const searchLower = searchTerm.toLowerCase();
            return (
                msg.message.toLowerCase().includes(searchLower) ||
                msg.category.toLowerCase().includes(searchLower) ||
                msg.severity.toLowerCase().includes(searchLower) ||
                msg.source_ip?.toLowerCase().includes(searchLower) ||
                msg.attack_type?.toLowerCase().includes(searchLower)
            );
        })
        : messages;

    return (
        <div className="traffic-observer">
            <div className="traffic-header">
                <h3>📡 Network Traffic Monitor</h3>
                <span className="traffic-count">
                    {searchTerm 
                        ? `${filteredMessages.length} / ${totalCount}` 
                        : `${totalCount} logs`
                    }
                </span>
            </div>
            <div className="traffic-search">
                <input
                    type="text"
                    placeholder="🔍 Search logs (message, IP, severity, category, attack type)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="clear-search-btn"
                        title="Clear search"
                    >
                        ✕
                    </button>
                )}
            </div>
            <div className="traffic-legend">
                <span className="legend-item severity-info">🟢 INFO</span>
                <span className="legend-item severity-warn">🟡 WARN</span>
                <span className="legend-item severity-error">🟠 ERROR</span>
                <span className="legend-item severity-alert">🔴 ALERT</span>
            </div>
            <div className="traffic-feed" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="traffic-empty">
                        <div className="traffic-loading">Connecting to network monitor...</div>
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <div className="traffic-empty">
                        <div className="traffic-no-results">No logs match "{searchTerm}"</div>
                    </div>
                ) : (
                    filteredMessages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`traffic-message ${getSeverityClass(msg.severity)} ${msg.contains_clue ? 'contains-clue' : ''}`}
                        >
                            <span className="traffic-timestamp">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                            <span className={`traffic-severity ${getSeverityClass(msg.severity)}`}>
                                [{msg.severity}]
                            </span>
                            <span className={`traffic-category ${getCategoryClass(msg.category)}`}>
                                [{msg.category}]
                            </span>
                            {msg.source_ip && (
                                <span className="traffic-ip">{msg.source_ip}</span>
                            )}
                            <span className="traffic-content">{msg.message}</span>
                            {msg.attack_type && (
                                <span className="traffic-attack-hint" title={ATTACK_TYPES[msg.attack_type].name}>
                                    {ATTACK_TYPES[msg.attack_type].icon}
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
