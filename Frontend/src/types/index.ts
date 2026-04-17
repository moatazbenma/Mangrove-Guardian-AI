// API Response Types
export interface ApiResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

// Auth Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'community' | 'organization' | 'admin';
  is_approved: boolean;
}

export interface AuthResponse {
  refresh: string;
  access: string;
}

// Report Types
export interface Report {
  id: number;
  location: string;
  description: string;
  lat: number;
  lng: number;
  photo?: string;
  user?: string;
  date_submitted?: string;
  analysis?: AnalysisData | null;
}

// Analysis Types
export interface AnalysisData {
  id: number;
  health_score?: number | null;
  damage_detected?: boolean | null;
  risk_level?: 'high' | 'medium' | 'low' | null;
  result?: string | null;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  created_at?: string;
  updated_at?: string;
}

// Restoration Types
export interface RestorationEvent {
  id: number;
  project: number;
  trees_planted: number;
  description: string;
  date: string;
}

export interface RestorationProject {
  id: number;
  name: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  start_date: string;
  end_date?: string;
  status: 'planned' | 'ongoing' | 'completed';
  created_by: string;
  events: RestorationEvent[];
}
