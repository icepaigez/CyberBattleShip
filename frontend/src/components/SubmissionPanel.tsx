import { useState } from 'react';
import { Ship, GridRow, GridColumn } from '../types/game';
import { AttackType, ATTACK_TYPES } from '../types/attackTypes';
import { NotificationModal } from './NotificationModal';

interface Props {
    ships: Ship[];
    onSubmit: (row?: GridRow, column?: GridColumn, attackType?: AttackType) => void;
    submitting: boolean;
}

const ROWS: GridRow[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const COLUMNS: GridColumn[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function SubmissionPanel({ ships, onSubmit, submitting }: Props) {
    const [selectedRow, setSelectedRow] = useState<GridRow | ''>('');
    const [selectedColumn, setSelectedColumn] = useState<GridColumn | ''>('');
    const [selectedAttackType, setSelectedAttackType] = useState<AttackType | ''>('');
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRow && !selectedColumn) {
            setValidationError('Please select at least a row or column to identify the attacker location.');
            return;
        }
        if (!selectedAttackType) {
            setValidationError('Please select an attack type - this is how you identify the threat!');
            return;
        }
        onSubmit(
            selectedRow || undefined,
            selectedColumn || undefined,
            selectedAttackType || undefined
        );
        // Reset selections after submit
        setSelectedRow('');
        setSelectedColumn('');
        setSelectedAttackType('');
    };

    const activeShips = ships.filter(s => s.status !== 'sunk');
    const sunkShips = ships.filter(s => s.status === 'sunk');

    return (
        <div className="submission-panel">
            <div className="submission-header">
                <h3>Submit Coordinates</h3>
                <div className="submission-stats">
                    <span className="stat-item">
                        Active: <strong>{activeShips.length}</strong>
                    </span>
                    <span className="stat-item">
                        Sunk: <strong>{sunkShips.length}</strong>
                    </span>
                </div>
            </div>

            <div className="submission-content">
                <form onSubmit={handleSubmit} className="submission-form">
                    <h4 className="form-section-title">🎯 Identify the Threat</h4>

                    <div className="input-group">
                        <label htmlFor="attack-type-select">Attack Type *</label>
                        <select
                            id="attack-type-select"
                            value={selectedAttackType}
                            onChange={(e) => setSelectedAttackType(e.target.value as AttackType | '')}
                            className="submission-select attack-type-select"
                        >
                            <option value="">-- Select Attack Type --</option>
                            {Object.values(ATTACK_TYPES).map(attack => (
                                <option key={attack.id} value={attack.id}>
                                    {attack.icon} {attack.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <h4 className="form-section-title">📍 Attacker Location</h4>

                    <div className="submission-inputs">
                        <div className="input-group">
                            <label htmlFor="row-select">Row (optional)</label>
                            <select
                                id="row-select"
                                value={selectedRow}
                                onChange={(e) => setSelectedRow(e.target.value as GridRow | '')}
                                className="submission-select"
                            >
                                <option value="">-- None --</option>
                                {ROWS.map(row => (
                                    <option key={row} value={row}>{row}</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label htmlFor="column-select">Column (optional)</label>
                            <select
                                id="column-select"
                                value={selectedColumn}
                                onChange={(e) => setSelectedColumn(e.target.value ? Number(e.target.value) as GridColumn : '')}
                                className="submission-select"
                            >
                                <option value="">-- None --</option>
                                {COLUMNS.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="submission-hint">
                        {!selectedAttackType && <span className="hint-text error">⚠️ Attack type required!</span>}
                        {selectedAttackType && (!selectedRow && !selectedColumn) && <span className="hint-text warning">📍 Add location for more points</span>}
                        {selectedAttackType && selectedRow && !selectedColumn && <span className="hint-text success">✓ {ATTACK_TYPES[selectedAttackType].icon} {ATTACK_TYPES[selectedAttackType].name} at row {selectedRow}</span>}
                        {selectedAttackType && !selectedRow && selectedColumn && <span className="hint-text success">✓ {ATTACK_TYPES[selectedAttackType].icon} {ATTACK_TYPES[selectedAttackType].name} at column {selectedColumn}</span>}
                        {selectedAttackType && selectedRow && selectedColumn && <span className="hint-text success">🎯 {ATTACK_TYPES[selectedAttackType].icon} {ATTACK_TYPES[selectedAttackType].name} at {selectedRow}{selectedColumn}</span>}
                    </div>

                    <button
                        type="submit"
                        className="submission-btn"
                        disabled={submitting || !selectedAttackType || (!selectedRow && !selectedColumn)}
                    >
                        {submitting ? 'Analyzing...' : '🚨 Submit Threat Report'}
                    </button>
                </form>

                <div className="ship-status-list">
                    <h4>🚨 Active Threats</h4>
                    {ships.length === 0 ? (
                        <div className="status-empty">Loading threats...</div>
                    ) : activeShips.length === 0 ? (
                        <div className="status-empty">🎉 All threats neutralized!</div>
                    ) : (
                        activeShips.map((ship) => {
                            const attackInfo = ship.attack_type ? ATTACK_TYPES[ship.attack_type] : null;
                            return (
                                <div key={ship.id} className={`ship-status ship-status-${ship.status}`}>
                                    <span className="ship-icon">{attackInfo?.icon || '🎯'}</span>
                                    <span className="ship-name">{attackInfo?.name || 'Unknown Threat'}</span>
                                    <span className="ship-info">
                                        {ship.status === 'partial_row' && `Row ${ship.row}!`}
                                        {ship.status === 'partial_column' && `Col ${ship.column}!`}
                                        {ship.status === 'hidden' && 'Active'}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {validationError && (
                <NotificationModal
                    type="error"
                    message={validationError}
                    onClose={() => setValidationError(null)}
                />
            )}
        </div>
    );
}
