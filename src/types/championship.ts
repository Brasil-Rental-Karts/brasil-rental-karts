export interface Championship {
  id: string;
  name: string;
  description: string;
  league_id: string;
  start_date: string | null;
  end_date: string | null;
  status: 'upcoming' | 'active' | 'completed';
  logo_url: string | null;
  scoring_system_id: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  championship_id: string;
  max_pilots: number | null;
  ballast_kg: number | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithPilotCount extends Category {
  pilot_count: number;
}

export interface Race {
  id: string;
  championship_id: string;
  name: string;
  description: string | null;
  date: string | null;
  location: string | null;
  track_layout: string | null;
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  double_points: boolean;
}

export interface ScoringSystem {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
  points: Record<string, number>;
}

export interface RaceResult {
  id: string;
  race_id: string;
  pilot_id: string;
  category_id: string;
  position: number | null;
  qualification_position: number | null;
  fastest_lap: boolean;
  dnf: boolean;
  dq: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pilot {
  id: string;
  name: string;
  avatar_url: string | null;
  email: string;
}

export interface PilotStanding {
  pilot_id: string;
  pilot_name: string;
  pilot_avatar: string | null;
  total_points: number;
  initial_points: number;
  positions: Record<string, number | null>; // race_id -> position
  fastest_laps: number;
  dnfs: number;
  dqs: number;
  // Campos para exibição
  position?: number;
  previous_position?: number;
} 