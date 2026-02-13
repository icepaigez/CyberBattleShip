import { useState, useEffect, useCallback } from 'react';
import { NotificationModal, ConfirmModal } from '../components/NotificationModal';
import { API_URL } from '../api';

const adminFetch = (url: string, options: RequestInit = {}, onUnauthorized: () => void) =>
    fetch(url, { ...options, credentials: 'include' }).then((res) => {
        if (res.status === 401) onUnauthorized();
        return res;
    });

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
    start_time?: string;
    end_time?: string;
    elapsed_minutes?: number;
    duration_minutes: number;
    remaining_minutes?: number;
}

interface Notification {
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ConfirmDialog {
    message: string;
    onConfirm: () => void;
    type?: 'warning' | 'danger';
}

export function Admin() {
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    const [loginError, setLoginError] = useState<string>('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [teams, setTeams] = useState<Team[]>([]);
    const [status, setStatus] = useState<CompetitionStatus>({ active: false, duration_minutes: 90 });
    const [loading, setLoading] = useState(false);
    const [teamCount, setTeamCount] = useState(22);
    const [durationMinutes, setDurationMinutes] = useState(90);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
    const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());

    const onUnauthorized = useCallback(() => setAuthenticated(false), []);

    const fetchTeams = useCallback(async () => {
        try {
            const response = await adminFetch(`${API_URL}/api/admin/teams`, {}, onUnauthorized);
            const data = await response.json();
            setTeams(data.teams ?? []);
        } catch (error) {
            console.error('Failed to fetch teams:', error);
        }
    }, [onUnauthorized]);

    const fetchStatus = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/competition/status`, { credentials: 'include' });
            const data = await response.json();
            setStatus(data);
        } catch (error) {
            console.error('Failed to fetch status:', error);
        }
    }, []);

    useEffect(() => {
        if (authenticated !== true) return;
        fetchTeams();
        fetchStatus();

        const interval = setInterval(() => {
            fetchTeams();
            fetchStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, [authenticated, fetchTeams, fetchStatus]);

    // Check auth on mount
    useEffect(() => {
        adminFetch(`${API_URL}/api/admin/teams`, {}, () => setAuthenticated(false))
            .then((res) => {
                if (res.ok) setAuthenticated(true);
                else if (res.status === 401) setAuthenticated(false);
                else setAuthenticated(false);
            })
            .catch(() => setAuthenticated(false));
    }, []);

    // Sync duration from status
    useEffect(() => {
        if (status.duration_minutes) {
            setDurationMinutes(status.duration_minutes);
        }
    }, [status.duration_minutes]);

    const handleLogin = async (password: string) => {
        setLoginError('');
        setLoginLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok) setAuthenticated(true);
            else setLoginError(data.error || 'Invalid password');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch(`${API_URL}/api/admin/logout`, { method: 'POST', credentials: 'include' });
        setAuthenticated(false);
    };

    const setGameDuration = async () => {
        setLoading(true);
        try {
            const response = await adminFetch(`${API_URL}/api/competition/duration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duration_minutes: durationMinutes }),
            }, onUnauthorized);
            const data = await response.json();
            if (response.ok) {
                setNotification({ message: `Game duration set to ${durationMinutes} minutes`, type: 'success' });
                fetchStatus();
            } else {
                setNotification({ message: data.error || 'Failed to set duration', type: 'error' });
            }
        } catch (error) {
            setNotification({ message: 'Failed to set duration', type: 'error' });
        }
        setLoading(false);
    };

    const createTeams = async () => {
        setLoading(true);
        try {
            const response = await adminFetch(`${API_URL}/api/admin/teams/create-multiple`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: teamCount }),
            }, onUnauthorized);
            const data = await response.json();
            setNotification({ message: `Created ${data.count} teams successfully`, type: 'success' });
            fetchTeams();
        } catch (error) {
            setNotification({ message: 'Failed to create teams', type: 'error' });
        }
        setLoading(false);
    };

    const startCompetition = async () => {
        setLoading(true);
        try {
            const response = await adminFetch(`${API_URL}/api/competition/start`, { method: 'POST' }, onUnauthorized);
            const data = await response.json();

            if (response.ok) {
                setNotification({ message: `Competition started! Duration: ${status.duration_minutes} minutes`, type: 'success' });
                fetchStatus();
                fetchTeams(); // Refresh teams to show updated state
            } else {
                setNotification({ message: data.error || 'Failed to start competition', type: 'error' });
            }
        } catch (error) {
            console.error('Start competition error:', error);
            setNotification({ message: 'Failed to start competition', type: 'error' });
        }
        setLoading(false);
    };

    const endCompetition = () => {
        setConfirmDialog({
            message: 'Are you sure you want to end the competition?',
            type: 'danger',
            onConfirm: async () => {
                setConfirmDialog(null);
                setLoading(true);
                try {
                    await adminFetch(`${API_URL}/api/competition/end`, { method: 'POST' }, onUnauthorized);
                    setNotification({ message: 'Competition ended', type: 'success' });
                    fetchStatus();
                } catch (error) {
                    setNotification({ message: 'Failed to end competition', type: 'error' });
                }
                setLoading(false);
            }
        });
    };

    const clearAllTeams = () => {
        setConfirmDialog({
            message: `Are you sure you want to delete all ${teams.length} teams? This cannot be undone!`,
            type: 'danger',
            onConfirm: async () => {
                setConfirmDialog(null);
                setLoading(true);
                try {
                    const response = await adminFetch(`${API_URL}/api/admin/teams/clear`, { method: 'DELETE' }, onUnauthorized);
                    const data = await response.json();

                    if (response.ok) {
                        setNotification({ message: `Successfully cleared ${data.count} teams`, type: 'success' });
                        setSelectedTeams(new Set());
                        fetchTeams();
                    } else {
                        setNotification({ message: data.error || 'Failed to clear teams', type: 'error' });
                    }
                } catch (error) {
                    setNotification({ message: 'Failed to clear teams', type: 'error' });
                }
                setLoading(false);
            }
        });
    };

    const deleteSelectedTeams = () => {
        const count = selectedTeams.size;
        if (count === 0) {
            setNotification({ message: 'No teams selected', type: 'error' });
            return;
        }

        setConfirmDialog({
            message: `Are you sure you want to delete ${count} selected team${count > 1 ? 's' : ''}? This cannot be undone!`,
            type: 'danger',
            onConfirm: async () => {
                setConfirmDialog(null);
                setLoading(true);
                try {
                    const response = await adminFetch(`${API_URL}/api/admin/teams/delete-selected`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ team_ids: Array.from(selectedTeams) })
                    }, onUnauthorized);
                    const data = await response.json();

                    if (response.ok) {
                        setNotification({ message: `Deleted ${count} team${count > 1 ? 's' : ''} successfully`, type: 'success' });
                        setSelectedTeams(new Set());
                        fetchTeams();
                    } else {
                        setNotification({ message: data.error || 'Failed to delete teams', type: 'error' });
                    }
                } catch (error) {
                    setNotification({ message: 'Failed to delete teams', type: 'error' });
                }
                setLoading(false);
            }
        });
    };

    const toggleTeamSelection = (teamId: string) => {
        setSelectedTeams(prev => {
            const newSet = new Set(prev);
            if (newSet.has(teamId)) {
                newSet.delete(teamId);
            } else {
                newSet.add(teamId);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedTeams.size === teams.length) {
            setSelectedTeams(new Set());
        } else {
            setSelectedTeams(new Set(teams.map(t => t.team_id)));
        }
    };

    // Loading auth check
    if (authenticated === null) {
        return (
            <div className="admin-page admin-login-container">
                <h1>🎮 Competition Admin</h1>
                <p>Checking authentication...</p>
            </div>
        );
    }

    // Login form
    if (!authenticated) {
        return (
            <div className="admin-page admin-login-container">
                <h1>🎮 Competition Admin</h1>
                <form
                    className="admin-login-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;
                        if (password) handleLogin(password);
                    }}
                >
                    <input
                        type="password"
                        name="password"
                        placeholder="Admin password"
                        className="admin-input"
                        autoFocus
                        autoComplete="current-password"
                        disabled={loginLoading}
                    />
                    <button type="submit" className="admin-btn admin-btn-primary" disabled={loginLoading}>
                        {loginLoading ? (
                            <span className="admin-login-spinner">Logging in...</span>
                        ) : (
                            'Log in'
                        )}
                    </button>
                    {loginError && <p className="admin-login-error">{loginError}</p>}
                </form>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>🎮 Competition Admin Dashboard</h1>
                <div className="admin-header-right">
                    <button onClick={handleLogout} className="admin-btn admin-btn-secondary" style={{ marginLeft: 'auto' }}>
                        Log out
                    </button>
                    <div className="status-badge">
                    {status.active ? (
                        <span className="badge badge-active">
                            🟢 Active ({status.elapsed_minutes}min elapsed)
                        </span>
                    ) : (
                        <span className="badge badge-inactive">⚪ Not Started</span>
                    )}
                    </div>
                </div>
            </div>

            <div className="admin-actions">
                <div className="action-section">
                    <h3>Setup</h3>
                    <div className="action-group">
                        <input
                            type="number"
                            value={teamCount}
                            onChange={(e) => setTeamCount(Number(e.target.value))}
                            min="1"
                            max="50"
                            className="admin-input"
                        />
                        <button
                            onClick={createTeams}
                            disabled={loading || status.active}
                            className="admin-btn admin-btn-primary"
                        >
                            Create {teamCount} Teams
                        </button>
                    </div>
                    <div className="action-group" style={{ marginTop: '1rem' }}>
                        <button
                            onClick={deleteSelectedTeams}
                            disabled={loading || status.active || selectedTeams.size === 0}
                            className="admin-btn admin-btn-warning"
                            title="Delete selected teams (only works before competition starts)"
                        >
                            🗑️ Delete Selected ({selectedTeams.size})
                        </button>
                        <button
                            onClick={clearAllTeams}
                            disabled={loading || status.active || teams.length === 0}
                            className="admin-btn admin-btn-danger"
                            title="Delete all teams (only works before competition starts)"
                        >
                            🗑️ Clear All Teams ({teams.length})
                        </button>
                    </div>
                </div>

                <div className="action-section">
                    <h3>Competition Control</h3>
                    <div className="action-group">
                        <label className="duration-label">⏱️ Game Duration (minutes):</label>
                        <input
                            type="number"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                            min="1"
                            max="180"
                            disabled={status.active}
                            className="admin-input"
                            style={{ width: '80px' }}
                        />
                        <button
                            onClick={setGameDuration}
                            disabled={loading || status.active}
                            className="admin-btn admin-btn-secondary"
                            title="Set game duration before starting"
                        >
                            Set Duration
                        </button>
                    </div>
                    <div className="action-group" style={{ marginTop: '1rem' }}>
                        <button
                            onClick={startCompetition}
                            disabled={loading || status.active || teams.length === 0}
                            className="admin-btn admin-btn-success"
                        >
                            ▶️ Start Competition ({durationMinutes} min)
                        </button>
                        <button
                            onClick={endCompetition}
                            disabled={loading || !status.active}
                            className="admin-btn admin-btn-danger"
                        >
                            ⏹️ End Competition
                        </button>
                    </div>
                    {status.active && status.remaining_minutes !== undefined && (
                        <div className="timer-display">
                            ⏰ Time Remaining: <strong>{Math.floor(status.remaining_minutes)} minutes</strong>
                            {status.remaining_minutes <= 5 && status.remaining_minutes > 0 && (
                                <span className="timer-warning"> ⚠️ ENDING SOON!</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {status.active && teams.length > 0 && (
                <div className="live-leaderboard">
                    <h2>🏆 Live Leaderboard</h2>
                    <div className="leaderboard-subtitle">
                        Updates every 5 seconds | Top score wins at 90 minutes
                    </div>
                    <div className="leaderboard-table">
                        <div className="leaderboard-header">
                            <div className="lb-rank">Rank</div>
                            <div className="lb-team">Team</div>
                            <div className="lb-score">Score</div>
                            <div className="lb-ships">Ships</div>
                            <div className="lb-players">Players</div>
                        </div>
                        {[...teams]
                            .sort((a, b) => {
                                if (a.score !== b.score) return b.score - a.score;
                                if (a.ships_sunk !== b.ships_sunk) return b.ships_sunk - a.ships_sunk;
                                return 0;
                            })
                            .map((team, index) => (
                                <div
                                    key={team.team_id}
                                    className={`leaderboard-row ${index === 0 ? 'rank-1' :
                                        index === 1 ? 'rank-2' :
                                            index === 2 ? 'rank-3' : ''
                                        }`}
                                >
                                    <div className="lb-rank">
                                        {index === 0 && '🥇'}
                                        {index === 1 && '🥈'}
                                        {index === 2 && '🥉'}
                                        {index > 2 && `#${index + 1}`}
                                    </div>
                                    <div className="lb-team">
                                        <div className="lb-team-name">{team.team_id}</div>
                                    </div>
                                    <div className="lb-score">{team.score}</div>
                                    <div className="lb-ships">{team.ships_sunk}</div>
                                    <div className="lb-players">{team.active_players}</div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            <div className="admin-teams">
                <div className="teams-header">
                    <h3>All Teams ({teams.length})</h3>
                    {teams.length > 0 && (
                        <label className="select-all-checkbox">
                            <input
                                type="checkbox"
                                checked={selectedTeams.size === teams.length && teams.length > 0}
                                onChange={toggleSelectAll}
                            />
                            <span>Select All</span>
                        </label>
                    )}
                </div>
                <div className="teams-grid">
                    {teams.map(team => (
                        <div key={team.team_id} className={`team-card ${selectedTeams.has(team.team_id) ? 'team-card-selected' : ''}`}>
                            <div className="team-card-header">
                                <label className="team-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedTeams.has(team.team_id)}
                                        onChange={() => toggleTeamSelection(team.team_id)}
                                    />
                                </label>
                                <strong className="team-code-display">{team.team_id}</strong>
                            </div>
                            <div className="team-card-body">
                                <div className="team-stat">
                                    Score: <strong>{team.score}</strong>
                                </div>
                                <div className="team-stat">
                                    Ships: <strong>{team.ships_sunk}</strong>
                                </div>
                                <div className="team-stat">
                                    Players: <strong>{team.active_players}</strong>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {notification && (
                <NotificationModal
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            {confirmDialog && (
                <ConfirmModal
                    message={confirmDialog.message}
                    type={confirmDialog.type}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(null)}
                />
            )}
        </div>
    );
}
