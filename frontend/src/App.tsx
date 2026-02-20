import { useEffect, useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { JoinTeam } from './components/JoinTeam';
import { GameUI } from './components/GameUI';
import { NotificationModal } from './components/NotificationModal';
import { TeamState, TrafficMessage, GridRow, GridColumn } from './types/game';
import { AttackType } from './types/attackTypes';

function App() {
    const { socket, connected } = useSocket();
    const [teamState, setTeamState] = useState<TeamState | null>(null);
    const [trafficMessages, setTrafficMessages] = useState<TrafficMessage[]>([]);
    const [totalMessageCount, setTotalMessageCount] = useState(0);
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [notificationQueue, setNotificationQueue] = useState<Array<{ type: 'success' | 'error' | 'info'; message: string }>>([]);
    const [competitionEnded, setCompetitionEnded] = useState(false);

    // Auto-rejoin on page refresh
    useEffect(() => {
        if (!socket || !connected) return;

        const savedTeamCode = localStorage.getItem('cyber_battleships_team');
        if (savedTeamCode && !teamState && !joining) {
            setJoining(true);
            // Mark this as an auto-rejoin attempt (not manual user input)
            socket.emit('join_team', { team_id: savedTeamCode, auto_rejoin: true });
        }
    }, [socket, connected, teamState, joining]);

    // Queue notification system - shows notifications sequentially
    useEffect(() => {
        if (!notification && notificationQueue.length > 0) {
            // Show next notification from queue
            const nextNotification = notificationQueue[0];
            setNotification(nextNotification);
            setNotificationQueue(prev => prev.slice(1));
        }
    }, [notification, notificationQueue]);

    const addNotification = (notif: { type: 'success' | 'error' | 'info'; message: string }) => {
        // Use functional updates to avoid race conditions
        setNotification(current => {
            if (!current) {
                // Show immediately if no notification is active
                return notif;
            } else {
                // Queue it for later
                setNotificationQueue(prev => [...prev, notif]);
                return current; // Keep current notification
            }
        });
    };

    useEffect(() => {
        if (!socket) return;

        socket.on('team_joined', (data: TeamState) => {
            setTeamState(data);
            setJoining(false);
            setJoinError('');
            // Save team code for auto-rejoin on refresh
            localStorage.setItem('cyber_battleships_team', data.team_id);

            // Restore traffic logs from localStorage (last 200 messages)
            try {
                const storedLogs = localStorage.getItem(`traffic_logs_${data.team_id}`);
                const storedCount = localStorage.getItem(`traffic_count_${data.team_id}`);
                if (storedLogs) {
                    const parsed = JSON.parse(storedLogs);
                    setTrafficMessages(parsed);
                }
                if (storedCount) {
                    setTotalMessageCount(parseInt(storedCount, 10));
                }
            } catch (error) {
                console.error('Failed to restore traffic logs:', error);
            }

            // Show tutorial on first join (not on auto-rejoin)
            const hasSeenTutorial = localStorage.getItem('cyber_battleships_tutorial_seen');
            if (!hasSeenTutorial) {
                setShowTutorial(true);
                localStorage.setItem('cyber_battleships_tutorial_seen', 'true');
            }
        });

        socket.on('error', (data: { message: string; silent?: boolean }) => {
            setJoining(false);
            setSubmitting(false); // Reset submitting state on error
            
            // Clear stale team data from localStorage if team not found
            if (data.message.includes('not found') || data.message.includes('Team not found')) {
                localStorage.removeItem('cyber_battleships_claimed_team');
                localStorage.removeItem('cyber_battleships_team');
            }
            
            // Only show error notification if this was a manual action (not auto-rejoin)
            if (!data.silent) {
                setJoinError(data.message);
                addNotification({ type: 'error', message: data.message });
            } else {
                console.log('Auto-rejoin failed (team no longer exists):', data.message);
            }
        });

        socket.on('state_update', (data: Partial<TeamState>) => {
            setTeamState(prev => prev ? { ...prev, ...data } : null);
        });

        socket.on('traffic_message', (message: TrafficMessage) => {
            setTotalMessageCount(prev => {
                const newCount = prev + 1;
                // Persist count to localStorage
                if (teamState) {
                    localStorage.setItem(`traffic_count_${teamState.team_id}`, newCount.toString());
                }
                return newCount;
            });
            
            setTrafficMessages(prev => {
                // Keep only last 200 messages to prevent memory issues
                const newMessages = [...prev, message];
                const capped = newMessages.length > 200 ? newMessages.slice(-200) : newMessages;
                
                // Persist messages to localStorage
                if (teamState) {
                    try {
                        localStorage.setItem(`traffic_logs_${teamState.team_id}`, JSON.stringify(capped));
                    } catch (error) {
                        console.warn('Failed to save traffic logs to localStorage:', error);
                    }
                }
                
                return capped;
            });
        });

        socket.on('submission_result', (result: any) => {
            setSubmitting(false);
            
            // Play sink sound effect if ship was sunk
            if (result.ship_sunk) {
                try {
                    const audio = new Audio('/sounds/ship-sink.mp3');
                    audio.volume = 0.5; // 50% volume
                    audio.play().catch(err => {
                        console.warn('Failed to play sink sound:', err);
                        // Fallback: play a simple beep using Web Audio API
                        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.frequency.value = 200; // Low boom frequency
                        oscillator.type = 'sine';
                        
                        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                        
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + 0.5);
                    });
                } catch (error) {
                    console.warn('Could not play sink sound effect:', error);
                }
            }
            
            // Show feedback to user
            if (result.message) {
                const type = result.result === 'miss' ? 'error' : result.result === 'hit' ? 'success' : 'info';
                addNotification({ type, message: result.message });
            }
        });

        socket.on('new_threat_detected', (data: { message: string; count: number }) => {
            addNotification({
                type: 'info',
                message: `${data.message} Check Active Threats panel!`
            });
        });

        socket.on('competition_started', (data: { message: string; start_time?: string; duration_minutes?: number }) => {
            setCompetitionEnded(false);
            addNotification({
                type: 'success',
                message: data.message
            });
        });

        socket.on('competition_ended', (data: { message: string; end_time?: string; duration_minutes?: number }) => {
            setCompetitionEnded(true);
            setSubmitting(false);
            addNotification({
                type: 'info',
                message: data.message
            });
        });

        socket.on('full_reset', (data: { message: string }) => {
            addNotification({
                type: 'info',
                message: data.message
            });
            // Clear local storage and force page reload after a short delay
            setTimeout(() => {
                localStorage.removeItem('cyber_battleships_team');
                localStorage.removeItem('cyber_battleships_claimed_team');
                window.location.reload();
            }, 3000);
        });

        return () => {
            socket.off('team_joined');
            socket.off('error');
            socket.off('state_update');
            socket.off('traffic_message');
            socket.off('submission_result');
            socket.off('new_threat_detected');
            socket.off('competition_started');
            socket.off('competition_ended');
            socket.off('full_reset');
        };
    }, [socket]);

    const handleJoinTeam = (teamId: string) => {
        if (!socket) return;

        setJoining(true);
        setJoinError('');
        socket.emit('join_team', { team_id: teamId });
    };

    const handleLeaveTeam = () => {
        const teamId = teamState?.team_id;
        localStorage.removeItem('cyber_battleships_team');
        if (teamId) {
            localStorage.removeItem(`traffic_logs_${teamId}`);
            localStorage.removeItem(`traffic_count_${teamId}`);
        }
        setTeamState(null);
        setTrafficMessages([]);
        setTotalMessageCount(0);
        setJoinError('');
    };

    const handleSubmitCoordinate = (row?: GridRow, column?: GridColumn, attackType?: AttackType) => {
        if (!socket || !teamState || competitionEnded) return;

        setSubmitting(true);
        socket.emit('submit_coordinate', {
            team_id: teamState.team_id,
            row,
            column,
            attack_type: attackType
        });
    };

    if (!connected) {
        return (
            <div className="app-loading">
                <h1>Connecting to server...</h1>
            </div>
        );
    }

    if (!teamState) {
        return (
            <JoinTeam
                onJoin={handleJoinTeam}
                joining={joining}
                error={joinError}
            />
        );
    }

    return (
        <>
            <GameUI
                socket={socket!}
                teamState={teamState}
                trafficMessages={trafficMessages}
                totalMessageCount={totalMessageCount}
                onSubmitCoordinate={handleSubmitCoordinate}
                onLeaveTeam={handleLeaveTeam}
                submitting={submitting || competitionEnded}
                showTutorial={showTutorial}
                onCloseTutorial={() => setShowTutorial(false)}
                onOpenTutorial={() => setShowTutorial(true)}
            />
            {notification && (
                <NotificationModal
                    type={notification.type}
                    message={notification.message}
                    onClose={() => setNotification(null)}
                />
            )}
        </>
    );
}

export default App;
