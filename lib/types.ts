// User roles for the system
export type UserRole = 'donor' | 'reporter' | 'ngo' | 'volunteer' | 'admin';

// User profile information
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  organization?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  service_radius_km?: number;
  created_at: string;
  updated_at: string;
}

// Donation record
export interface Donation {
  id: string;
  donor_id: string;
  description: string;
  quantity: number;
  category?: string;
  created_at: string;
  location?: string;
  pickup_time_window?: string;
  pickup_note?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  packaging_image_data_url: string;
  packaging_image_name: string;
  packaging_quality_status?: 'pass' | 'review' | 'pending';
  assigned_ngo_id?: string;
  assigned_ngo_name?: string;
  assigned_ngo_distance_km?: number;
  assignment_status?: 'unassigned' | 'assigned' | 'processing';
  assigned_at?: string;
  assigned_mission_ids?: string[];
  broadcast_to_roles?: UserRole[];
}

// Case report from reporters
export interface CaseReport {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  reporter_phone?: string;
  people_count?: number;
  reporter_note?: string;
  title: string;
  description?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  geo_captured_at?: string;
  broadcast_to_roles?: UserRole[];
  status: 'unverified' | 'verified' | 'in_progress' | 'completed';
  urgency_score: number;
  verified: boolean;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

// Mission/task for volunteers
export interface Mission {
  id: string;
  case_report_id?: string;
  source_role?: UserRole;
  source_entity_type?: 'donation' | 'case_report';
  source_entity_id?: string;
  title: string;
  description?: string;
  pickup_location: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  delivery_location: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  assigned_volunteer_id?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  broadcast_to_roles?: UserRole[];
  last_geo_update_at?: string;
  created_at: string;
  completed_at?: string;
}

// Authentication context
export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, role: UserRole, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
