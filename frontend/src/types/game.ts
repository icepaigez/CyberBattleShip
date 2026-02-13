import { AttackType, TrafficCategory, TrafficSeverity } from './attackTypes';

export type GridRow = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';
export type GridColumn = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type ShipStatus = 'hidden' | 'partial_row' | 'partial_column' | 'sunk';

export interface Ship {
  id: string;
  status: ShipStatus;
  row?: GridRow;
  column?: GridColumn;
  attack_type: AttackType;  // NEW: Each ship represents an attack type
}

export interface TrafficMessage {
  timestamp: string;
  severity: TrafficSeverity;  // Changed from 'level'
  category: TrafficCategory;  // NEW: HTTP, DATABASE, etc.
  source_ip?: string;         // NEW: Optional source IP
  message: string;
  contains_clue?: boolean;    // NEW: Does it have encoded coordinates?
  attack_type?: AttackType;   // NEW: What type of attack?
  encoded_data?: string;      // NEW: The encoded coordinate
  encoding_type?: string;     // NEW: base64, hex, etc.
}

export interface TeamState {
  team_id: string;
  team_name: string;
  score: number;
  ships_sunk: number;
  ships: Ship[];
}

export interface SubmissionResult {
  success: boolean;
  result: 'hit' | 'partial_row' | 'partial_column' | 'miss' | 'correct_type';
  points_awarded: number;
  message: string;
  ship_sunk: boolean;
  correct_attack_type?: boolean;  // NEW
  correct_location?: boolean;     // NEW
}
