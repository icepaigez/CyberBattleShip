interface LeaderboardEntry {
    team_id: string;
    team_name: string;
    score: number;
    ships_sunk: number;
    incorrect_count: number;
}

interface Props {
    leaderboard: LeaderboardEntry[];
    currentTeamId?: string;
}

export function Leaderboard({ leaderboard, currentTeamId }: Props) {
    return (
        <div className="leaderboard">
            <h3>🏆 Leaderboard</h3>
            <div className="leaderboard-list">
                {leaderboard.map((entry, index) => (
                    <div
                        key={entry.team_id}
                        className={`leaderboard-entry ${entry.team_id === currentTeamId ? 'current-team' : ''}`}
                    >
                        <div className="leaderboard-rank">
                            {index + 1}
                            {index === 0 && ' 🥇'}
                            {index === 1 && ' 🥈'}
                            {index === 2 && ' 🥉'}
                        </div>
                        <div className="leaderboard-info">
                            <div className="leaderboard-name">{entry.team_name}</div>
                            <div className="leaderboard-stats">
                                <span>{entry.score} pts</span>
                                <span>•</span>
                                <span>{entry.ships_sunk} sunk</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
