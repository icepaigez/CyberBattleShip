export interface Team {
  id: string;
  name: string;
  score: number;
  ships_sunk: number;
  game_state: string; // JSON serialized game state if needed
  created_at: Date;
}

export interface TeamScore {
  team_id: string;
  team_name: string;
  score: number;
  ships_sunk: number;
  incorrect_submissions: number;
  last_sink_time?: Date;
}
