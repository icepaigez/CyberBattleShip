import { GridRow, GridColumn } from './Ship.js';
import { AttackType } from './AttackTypes.js';

export type SubmissionResult = 'hit' | 'partial_row' | 'partial_column' | 'miss' | 'correct_type' | 'wrong_type' | 'duplicate';

export interface Submission {
  team_id: string;
  row?: GridRow;
  column?: GridColumn;
  attack_type?: AttackType;  // NEW: Student's guess of attack type
  result: SubmissionResult;
  ship_id?: string;
  timestamp: Date;
  points_awarded: number;
  correct_attack_type?: boolean;  // NEW: Was their attack type guess correct?
}

export interface SubmissionRequest {
  row?: GridRow;
  column?: GridColumn;
  attack_type?: AttackType;  // NEW: Required - which attack type they think it is
}

export interface SubmissionResponse {
  success: boolean;
  result: SubmissionResult;
  points_awarded: number;
  message: string;
  ship_sunk: boolean;
  ship_id?: string;
  revealed_row?: boolean;
  revealed_column?: boolean;
}
