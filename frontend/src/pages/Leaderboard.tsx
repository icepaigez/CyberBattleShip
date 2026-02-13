import { useState, useEffect } from 'react';
import { API_URL } from '../api';

interface Team {
    team_id: string;
    team_name: string;
    score: number;
    ships_sunk: number;
    active_players: number;
    game_complete: boolean;
}

interface CompetitionStatus {
    active: boolean;
    elapsed_minutes?: number;
}

export function Leaderboard() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [status, setStatus] = useState<CompetitionStatus>({ active: false });

    useEffect(() => {
        fetchTeams();
        fetchStatus();

        const interval = setInterval(() => {
            fetchTeams();
            fetchStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const fetchTeams = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/teams`);
            const data = await response.json();
            setTeams(data.teams);
        } catch (error) {
            console.error('Failed to fetch teams:', error);
        }
    };

    const fetchStatus = async () => {
        try {
            const response = await fetch(`${API_URL}/api/competition/status`);
            const data = await response.json();
            setStatus(data);
        } catch (error) {
            console.error('Failed to fetch status:', error);
        }
    };

    const sortedTeams = [...teams].sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        if (a.ships_sunk !== b.ships_sunk) return b.ships_sunk - a.ships_sunk;
        return 0;
    });

    if (!status.active) {
        return (
            <div className="leaderboard-page">
                <div className="leaderboard-waiting">
                    <h1>🏆 Competition Leaderboard</h1>
                    <p className="waiting-message">Competition has not started yet...</p>
                    <p className="waiting-subtitle">Leaderboard will appear when competition begins</p>
                </div>
            </div>
        );
    }

    return (
        <div className="leaderboard-page">
            <div className="leaderboard-page-header">
                <h1>🏆 Live Competition Leaderboard</h1>
                <div className="leaderboard-meta">
                    <span className="meta-item">
                        <span className="meta-label">Status:</span>
                        <span className="meta-value active">🟢 Live</span>
                    </span>
                    <span className="meta-item">
                        <span className="meta-label">Time Elapsed:</span>
                        <span className="meta-value">{status.elapsed_minutes} min</span>
                    </span>
                    <span className="meta-item">
                        <span className="meta-label">Teams:</span>
                        <span className="meta-value">{teams.length}</span>
                    </span>
                </div>
                <p className="leaderboard-subtitle">
                    Updates every 5 seconds • Highest score wins at 90 minutes
                </p>
            </div>

            <div className="leaderboard-display">
                <div className="leaderboard-table-header">
                    <div className="lb-col lb-rank">Rank</div>
                    <div className="lb-col lb-team">Team</div>
                    <div className="lb-col lb-score">Score</div>
                    <div className="lb-col lb-ships">Ships</div>
                    <div className="lb-col lb-players">Players</div>
                </div>
                {sortedTeams.map((team, index) => (
                    <div
                        key={team.team_id}
                        className={`leaderboard-row-display ${index === 0 ? 'rank-1' :
                            index === 1 ? 'rank-2' :
                                index === 2 ? 'rank-3' : ''
                            }`}
                    >
                        <div className="lb-col lb-rank">
                            {index === 0 && <span className="medal">🥇</span>}
                            {index === 1 && <span className="medal">🥈</span>}
                            {index === 2 && <span className="medal">🥉</span>}
                            {index > 2 && <span className="rank-number">#{index + 1}</span>}
                        </div>
                        <div className="lb-col lb-team">
                            <div className="lb-team-name">{team.team_id}</div>
                        </div>
                        <div className="lb-col lb-score">{team.score}</div>
                        <div className="lb-col lb-ships">{team.ships_sunk}</div>
                        <div className="lb-col lb-players">{team.active_players}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
