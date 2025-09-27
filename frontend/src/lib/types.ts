export type UserRole = 'guest' | 'volunteer' | 'moderator' | 'admin';
export type VolunteerStatus = 'pending' | 'approved' | 'banned';

export interface User {
  id: number;
  email: string;
  full_name?: string | null;
  phone_number?: string | null;
  role: UserRole;
  volunteer_status: VolunteerStatus;
  is_active: boolean;
  created_at: string;
}

export type ProjectStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type StageStatus = 'draft' | 'pending' | 'published' | 'rejected';

export interface GeometryPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface Project {
  id: number;
  title: string;
  description?: string | null;
  geo_point: GeometryPoint;
  status: ProjectStatus;
  owner_id: number;
  created_at: string;
}

export interface ProjectStage {
  id: number;
  project_id: number;
  title: string;
  description?: string | null;
  is_draft: boolean;
  status: StageStatus;
  created_at: string;
}

export interface ProjectFile {
  id: number;
  filename: string;
  content_type: string;
  minio_key: string;
  quarantine: boolean;
  thumbnail_key?: string | null;
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'returned';
export type ModerationTarget = 'project' | 'project_stage' | 'project_file' | 'comment' | 'live_question';

export interface ModerationItem {
  id: number;
  target_type: ModerationTarget;
  target_id: number;
  status: ModerationStatus;
  reason?: string | null;
  created_at: string;
}

export interface LiveSession {
  id: number;
  title: string;
  description?: string | null;
  scheduled_for: string;
  conference_id: string;
  created_by_id: number;
}

export interface LiveQuestion {
  id: number;
  session_id: number;
  author_id: number;
  text: string;
  is_approved: boolean;
  created_at: string;
}

export interface LiveTask {
  id: number;
  session_id: number;
  title: string;
  description?: string | null;
  assignee_id?: number | null;
  created_at: string;
}

export interface KPIResponse {
  projects: number;
  project_stages: number;
  live_sessions: number;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  action: string;
  entity: string;
  payload?: string | null;
  created_at: string;
}
