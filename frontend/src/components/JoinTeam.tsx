import { useState, useEffect } from 'react';
import { API_URL } from '../api';

interface Props {
    onJoin: (teamId: string) => void;
    joining: boolean;
    error?: string;
}

export function JoinTeam({ onJoin, joining, error }: Props) {
    const [teamId, setTeamId] = useState('');
    const [claiming, setClaiming] = useState(false);
    const [spinning, setSpinning] = useState(false);
    const [claimError, setClaimError] = useState('');
    const [hasClaimed, setHasClaimed] = useState(false);

    // Check if user already claimed a team
    useEffect(() => {
        const claimedTeam = localStorage.getItem('cyber_battleships_claimed_team');
        if (claimedTeam) {
            setTeamId(claimedTeam);
            setHasClaimed(true);
        }
    }, []);

    // Clear claimed state if team not found error
    useEffect(() => {
        if (error && error.includes('not found')) {
            setHasClaimed(false);
            setTeamId('');
        }
    }, [error]);

    const handleClaimTeam = async () => {
        if (hasClaimed) return;

        setClaiming(true);
        setSpinning(true);
        setClaimError('');

        try {
            // Add delay for animation effect
            await new Promise(resolve => setTimeout(resolve, 2000));

            const response = await fetch(`${API_URL}/api/teams/claim-random`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to claim team');
            }

            const data = await response.json();
            
            // Store claimed team in localStorage
            localStorage.setItem('cyber_battleships_claimed_team', data.team_id);
            
            setTeamId(data.team_id);
            setHasClaimed(true);
            setSpinning(false);
        } catch (err) {
            setClaimError(err instanceof Error ? err.message : 'Failed to claim team');
            setSpinning(false);
        } finally {
            setClaiming(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedTeamId = teamId.trim().toUpperCase();
        if (normalizedTeamId) {
            console.log('Joining team:', normalizedTeamId);
            onJoin(normalizedTeamId);
        }
    };

    return (
        <div className="join-team">
            <div className="join-container">
                <h1>🎯 Cyber Battleships</h1>
                <p className="join-subtitle">Defend the network from cyber threats</p>

                {!hasClaimed && (
                    <div className="claim-team-section">
                        <button
                            className={`claim-team-btn ${spinning ? 'spinning' : ''}`}
                            onClick={handleClaimTeam}
                            disabled={claiming || hasClaimed}
                        >
                            {spinning ? (
                                <>
                                    <span className="spinner">🎲</span>
                                    <span>Assigning Team...</span>
                                </>
                            ) : (
                                <>
                                    <span>🎲</span>
                                    <span>Get My Team</span>
                                </>
                            )}
                        </button>
                        {claimError && <div className="claim-error">{claimError}</div>}
                        <div className="claim-divider">
                            <span>OR</span>
                        </div>
                    </div>
                )}

                {hasClaimed && (
                    <div className="claimed-team-badge">
                        <span className="badge-icon">✅</span>
                        <span className="badge-text">Your Team: <strong>{teamId}</strong></span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="join-form">
                    <div className="join-input-group">
                        <label htmlFor="team-code">Team Code</label>
                        <input
                            id="team-code"
                            type="text"
                            value={teamId}
                            onChange={(e) => setTeamId(e.target.value)}
                            placeholder="e.g., ALPHA, BRAVO"
                            className="join-input"
                            disabled={joining}
                            readOnly={hasClaimed}
                        />
                    </div>

                    {error && <div className="join-error">{error}</div>}

                    <button
                        type="submit"
                        className="join-btn"
                        disabled={joining || !teamId.trim()}
                    >
                        {joining ? 'Joining...' : 'Join Team'}
                    </button>
                </form>

                {!hasClaimed && (
                    <div className="join-help">
                        <p>💡 Click "Get My Team" for a random assignment</p>
                        <p className="help-secondary">or enter your team code manually</p>
                    </div>
                )}
            </div>
        </div>
    );
}
