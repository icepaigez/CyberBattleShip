export type TrafficLevel = 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';

export interface TrafficMessage {
  timestamp: Date;
  level: TrafficLevel;
  message: string;
  contains_leak: boolean;
  leak_type?: 'row' | 'column' | 'full';
  ship_id?: string;
}

export interface FormattedTrafficMessage {
  timestamp: string; // ISO string for transmission
  level: TrafficLevel;
  message: string;
}
