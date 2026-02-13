import { AttackType } from './AttackTypes.js';

export type ShipStatus = 'hidden' | 'partial_row' | 'partial_column' | 'sunk';

export type GridRow = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';
export type GridColumn = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Coordinate {
  row?: GridRow;
  column?: GridColumn;
}

export interface Ship {
  id: string;
  row: GridRow;
  column: GridColumn;
  status: ShipStatus;
  revealed_row: boolean;
  revealed_column: boolean;
  sunk_at?: Date;
  attack_type: AttackType;  // Each ship represents a type of cyber attack
  is_active: boolean; // Whether this ship is currently in play (gradually revealed)
}

export function isValidRow(row: string): row is GridRow {
  return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].includes(row);
}

export function isValidColumn(column: number): column is GridColumn {
  return column >= 1 && column <= 10;
}

export function parseCoordinate(coord: string): Coordinate | null {
  // Expected format: "A5", "D10", etc.
  const match = coord.match(/^([A-J])(\d{1,2})$/);
  if (!match) return null;

  const row = match[1];
  const column = parseInt(match[2], 10);

  if (!isValidRow(row) || !isValidColumn(column)) {
    return null;
  }

  return { row, column };
}

export function coordinateToString(coord: Coordinate): string {
  return `${coord.row}${coord.column}`;
}
