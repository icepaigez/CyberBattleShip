import React from 'react';

interface NotificationModalProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ message, type = 'info', onClose }) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            default: return 'ℹ️';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success': return '#4caf50';
            case 'error': return '#f44336';
            default: return '#667eea';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content notification-modal" onClick={(e) => e.stopPropagation()}>
                <div className="notification-icon" style={{ color: getColor() }}>
                    {getIcon()}
                </div>
                <div className="notification-message">{message}</div>
                <button className="notification-btn" onClick={onClose} style={{ background: getColor() }}>
                    OK
                </button>
            </div>
        </div>
    );
};

interface ConfirmModalProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning'
}) => {
    const getColor = () => {
        return type === 'danger' ? '#f44336' : '#ff9800';
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-icon" style={{ color: getColor() }}>
                    ⚠️
                </div>
                <div className="confirm-message">{message}</div>
                <div className="confirm-actions">
                    <button className="confirm-btn-cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className="confirm-btn-confirm"
                        onClick={onConfirm}
                        style={{ background: getColor() }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
