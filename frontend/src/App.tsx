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
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [notificationQueue, setNotificationQueue] = useState<Array<{ type: 'success' | 'error' | 'info'; message: string }>>([]);

    // Auto-rejoin on page refresh
    useEffect(() => {
        if (!socket || !connected) return;

        const savedTeamCode = localStorage.getItem('cyber_battleships_team');
        if (savedTeamCode && !teamState && !joining) {
            setJoining(true);
            socket.emit('join_team', { team_id: savedTeamCode });
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

            // Show tutorial on first join (not on auto-rejoin)
            const hasSeenTutorial = localStorage.getItem('cyber_battleships_tutorial_seen');
            if (!hasSeenTutorial) {
                setShowTutorial(true);
                localStorage.setItem('cyber_battleships_tutorial_seen', 'true');
            }
        });

        socket.on('error', (data: { message: string }) => {
            setJoinError(data.message);
            setJoining(false);
            setSubmitting(false); // Reset submitting state on error
            
            // Clear claimed team from localStorage if team not found
            if (data.message.includes('not found') || data.message.includes('Team not found')) {
                localStorage.removeItem('cyber_battleships_claimed_team');
            }
            
            addNotification({ type: 'error', message: data.message });
        });

        socket.on('state_update', (data: Partial<TeamState>) => {
            setTeamState(prev => prev ? { ...prev, ...data } : null);
        });

        socket.on('traffic_message', (message: TrafficMessage) => {
            setTrafficMessages(prev => [...prev, message]);
        });

        socket.on('submission_result', (result: any) => {
            setSubmitting(false);
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

        return () => {
            socket.off('team_joined');
            socket.off('error');
            socket.off('state_update');
            socket.off('traffic_message');
            socket.off('submission_result');
            socket.off('new_threat_detected');
        };
    }, [socket]);

    const handleJoinTeam = (teamId: string) => {
        if (!socket) return;

        setJoining(true);
        setJoinError('');
        socket.emit('join_team', { team_id: teamId });
    };

    const handleLeaveTeam = () => {
        localStorage.removeItem('cyber_battleships_team');
        setTeamState(null);
        setTrafficMessages([]);
        setJoinError('');
    };

    const handleSubmitCoordinate = (row?: GridRow, column?: GridColumn, attackType?: AttackType) => {
        if (!socket || !teamState) return;

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
                onSubmitCoordinate={handleSubmitCoordinate}
                onLeaveTeam={handleLeaveTeam}
                submitting={submitting}
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
