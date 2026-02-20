import React from 'react';
import { Ship, GridRow, GridColumn } from '../types/game';

interface Props {
    ships: Ship[];
}

const ROWS: GridRow[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const COLUMNS: GridColumn[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function BattleshipGrid({ ships }: Props) {
    const getCellStatus = (row: GridRow, col: GridColumn): { status: string; attackType?: string } => {
        for (const ship of ships) {
            // Full match - ship sunk
            if (ship.row === row && ship.column === col && ship.status === 'sunk') {
                return { status: 'sunk', attackType: ship.attack_type };
            }
            // Partial row revealed
            if (ship.row === row && ship.status !== 'hidden') {
                return { status: 'partial-row' };
            }
            // Partial column revealed
            if (ship.column === col && ship.status !== 'hidden') {
                return { status: 'partial-column' };
            }
        }
        return { status: 'unknown' };
    };

    return (
        <div className="battleship-grid">
            <div className="grid-header">
                <h3>Battleship Grid</h3>
            </div>
            <div className="grid-container">
                <div className="grid-corner"></div>
                {COLUMNS.map(col => (
                    <div key={col} className="grid-label grid-col-label">
                        {col}
                    </div>
                ))}

                {ROWS.map(row => (
                    <React.Fragment key={row}>
                        <div className="grid-label grid-row-label">
                            {row}
                        </div>
                        {COLUMNS.map(col => {
                            const cellData = getCellStatus(row, col);
                            return (
                                <div
                                    key={`${row}${col}`}
                                    className={`grid-cell grid-cell-${cellData.status}`}
                                    data-coord={`${row}${col}`}
                                    title={cellData.status === 'sunk' ? `Threat Neutralized: ${cellData.attackType?.toUpperCase().replace('_', ' ')}` : ''}
                                >
                                    {cellData.status === 'sunk' && (
                                        <div className="sunk-ship-container">
                                            <span className="sunk-ship-icon">🚢</span>
                                            <span className="sunk-ship-explosion">💥</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
