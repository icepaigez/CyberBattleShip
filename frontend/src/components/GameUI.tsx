import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { BattleshipGrid } from './BattleshipGrid';
import { TrafficObserver } from './TrafficObserver';
import { SubmissionPanel } from './SubmissionPanel';
import { Leaderboard } from './Leaderboard';
import { DecoderTools } from './DecoderTools';
import { TutorialModal } from './TutorialModal';
import { AttackGlossary } from './AttackGlossary';
import { ConfirmModal } from './NotificationModal';
import { TeamState, TrafficMessage, GridRow, GridColumn } from '../types/game';
import { AttackType } from '../types/attackTypes';
import { API_URL } from '../api';

interface Props {
    socket: Socket;
    teamState: TeamState;
    trafficMessages: TrafficMessage[];
    totalMessageCount: number;
    onSubmitCoordinate: (row?: GridRow, column?: GridColumn, attackType?: AttackType) => void;
    onLeaveTeam: () => void;
    submitting: boolean;
    showTutorial: boolean;
    onCloseTutorial: () => void;
    onOpenTutorial: () => void;
}

interface LeaderboardEntry {
    team_id: string;
    team_name: string;
    score: number;
    ships_sunk: number;
    incorrect_count: number;
}

export function GameUI({ socket: _socket, teamState, trafficMessages, totalMessageCount, onSubmitCoordinate, onLeaveTeam, submitting, showTutorial, onCloseTutorial, onOpenTutorial }: Props) {
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showTools, setShowTools] = useState(false);
    const [showGlossary, setShowGlossary] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        // Fetch leaderboard every 10 seconds
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch(`${API_URL}/api/competition/leaderboard`);
                const data = await response.json();
                setLeaderboard(data.leaderboard);
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
            }
        };

        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="game-ui">
            <div className="game-header">
                <h1>Cyber Battleships</h1>
                <div className="team-info">
                    <span className="team-name">{teamState.team_name}</span>
                    <span className="team-score">Score: {teamState.score}</span>
                    <span className="team-ships">Ships Sunk: {teamState.ships_sunk}</span>
                    <button
                        className="tools-button"
                        onClick={() => setShowTools(true)}
                    >
                        🔧 Tools
                    </button>
                    <button
                        className="help-button"
                        onClick={onOpenTutorial}
                    >
                        ❓ Tutorial
                    </button>
                    <button
                        className="glossary-button"
                        onClick={() => setShowGlossary(true)}
                    >
                        📚 Attacks
                    </button>
                    <button
                        className="leaderboard-toggle"
                        onClick={() => setShowLeaderboard(!showLeaderboard)}
                    >
                        {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
                    </button>
                    <button
                        className="leave-button"
                        onClick={() => setShowLeaveConfirm(true)}
                    >
                        🚪 Leave
                    </button>
                </div>
            </div>

            {showLeaderboard && (
                <div className="leaderboard-overlay">
                    <Leaderboard leaderboard={leaderboard} currentTeamId={teamState.team_id} />
                </div>
            )}

            {showTools && (
                <div className="tools-modal-overlay" onClick={() => setShowTools(false)}>
                    <div className="tools-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="tools-modal-header">
                            <div>
                                <h2>🔧 Decoder Tools</h2>
                                <p className="tools-subtitle">Decode Base64 and Hex encoded messages</p>
                            </div>
                            <button className="tools-close" onClick={() => setShowTools(false)}>
                                ✕ Close
                            </button>
                        </div>
                        <div className="tools-modal-content">
                            <DecoderTools />
                            <div className="tools-guide-compact">
                                <h4>Quick Guide</h4>
                                <ul>
                                    <li><strong>Step 1:</strong> Copy encoded text from Traffic Observer</li>
                                    <li><strong>Step 2:</strong> Try different decoders - <strong>Base64</strong>, <strong>Hex</strong>, <strong>ROT13</strong>, <strong>Binary</strong>, or <strong>ASCII</strong></li>
                                    <li><strong>Step 3:</strong> If you get coordinates (like "D4"), close this and submit</li>
                                    <li><strong>Tip:</strong> Some clues are layered - decode once, then decode the result again!</li>
                                </ul>
                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#16213e', borderRadius: '6px', fontSize: '0.85rem' }}>
                                    <strong>Examples:</strong><br />
                                    • <code>RDQ=</code> → Base64 → "D4"<br />
                                    • <code>4436</code> → Hex → "D6"<br />
                                    • <code>Q4</code> → ROT13 → "D4"<br />
                                    • <code>01000100 00110100</code> → Binary → "D4"<br />
                                    • <code>68 52</code> → ASCII → "D4"
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showTutorial && (
                <TutorialModal onClose={onCloseTutorial} />
            )}

            {showGlossary && (
                <AttackGlossary onClose={() => setShowGlossary(false)} />
            )}

            {showLeaveConfirm && (
                <ConfirmModal
                    message="Are you sure you want to leave the game? Your progress is saved and you can rejoin anytime."
                    onConfirm={() => {
                        setShowLeaveConfirm(false);
                        onLeaveTeam();
                    }}
                    onCancel={() => setShowLeaveConfirm(false)}
                />
            )}

            <div className="game-panels">
                <div className="panel panel-grid">
                    <BattleshipGrid ships={teamState.ships} />
                </div>

                <div className="panel panel-traffic">
                    <TrafficObserver messages={trafficMessages} totalCount={totalMessageCount} />
                </div>

                <div className="panel panel-submission">
                    <SubmissionPanel
                        ships={teamState.ships}
                        onSubmit={onSubmitCoordinate}
                        submitting={submitting}
                    />
                </div>
            </div>
        </div>
    );
}
