import axios from 'axios';
import type {
  AuditLog,
  KPIResponse,
  LiveQuestion,
  LiveSession,
  LiveTask,
  ModerationItem,
  Project,
  ProjectFile,
  ProjectStage,
  User,
  VolunteerStatus,
  UserRole,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

let authToken: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem('cop-token') : null;

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (typeof localStorage === 'undefined') {
    return;
  }
  if (token) {
    localStorage.setItem('cop-token', token);
  } else {
    localStorage.removeItem('cop-token');
  }
};

export interface LoginChallenge {
  challenge_id: string;
  expires_in: number;
  masked_phone: string;
}

export const loginRequest = async (email: string, password: string) => {
  const { data } = await api.post<LoginChallenge>('/auth/login', { email, password });
  return data;
};

export interface RegisterPayload {
  email: string;
  password: string;
  password_confirm: string;
  phone_number: string;
  full_name?: string;
  iin?: string;
}

export const registerRequest = async (payload: RegisterPayload) => {
  const { data } = await api.post<User>('/auth/register', payload);
  return data;
};

export const verifyTwoFactorRequest = async (challengeId: string, code: string) => {
  const { data } = await api.post<{ access_token: string }>('/auth/verify-2fa', {
    challenge_id: challengeId,
    code,
  });
  return data.access_token;
};

export const fetchCurrentUser = async () => {
  const { data } = await api.get<User>('/auth/me');
  return data;
};

export const fetchProjects = async (bounds?: string) => {
  const { data } = await api.get<Project[]>('/projects', { params: bounds ? { bounds } : undefined });
  return data;
};

export const fetchProject = async (projectId: number) => {
  const { data } = await api.get<Project>(`/projects/${projectId}`);
  return data;
};

export const fetchProjectStages = async (projectId: number) => {
  const { data } = await api.get<ProjectStage[]>(`/projects/${projectId}/stages`);
  return data;
};

export const fetchProjectFiles = async (projectId: number) => {
  const { data } = await api.get<ProjectFile[]>(`/projects/${projectId}/files`);
  return data;
};

export const submitProjectDraft = async (projectId: number, payload: { title: string; description?: string; is_draft?: boolean }) => {
  const { data } = await api.post<ProjectStage>(`/projects/${projectId}/stages`, payload);
  return data;
};

export const uploadProjectFile = async (projectId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<ProjectFile>(`/projects/${projectId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const listModerationQueue = async () => {
  const { data } = await api.get<ModerationItem[]>('/moderation');
  return data;
};

export const actOnModeration = async (itemId: number, payload: { status: 'approved' | 'rejected' | 'returned'; reason?: string }) => {
  const { data } = await api.post<ModerationItem>(`/moderation/${itemId}`, payload);
  return data;
};

export const listUsers = async () => {
  const { data } = await api.get<User[]>('/admin/users');
  return data;
};

export const updateUserRole = async (userId: number, payload: { role: UserRole; volunteer_status: VolunteerStatus }) => {
  const { data } = await api.patch<User>(`/admin/users/${userId}`, payload);
  return data;
};

export const listLiveSessions = async () => {
  const { data } = await api.get<LiveSession[]>('/live/sessions');
  return data;
};

export const fetchSessionQuestions = async (sessionId: number) => {
  const { data } = await api.get<LiveQuestion[]>(`/live/sessions/${sessionId}/questions`);
  return data;
};

export const fetchSessionTasks = async (sessionId: number) => {
  const { data } = await api.get<LiveTask[]>(`/live/sessions/${sessionId}/tasks`);
  return data;
};

export const submitQuestion = async (payload: { session_id: number; text: string }) => {
  const { data } = await api.post<LiveQuestion>('/live/questions', payload);
  return data;
};

export const approveQuestion = async (questionId: number) => {
  const { data } = await api.post<LiveQuestion>(`/live/questions/${questionId}/approve`, {});
  return data;
};

export const rejectQuestion = async (questionId: number, reason?: string) => {
  const { data } = await api.post<LiveQuestion>(`/live/questions/${questionId}/reject`, { reason });
  return data;
};

export const createLiveTask = async (payload: { session_id: number; title: string; description?: string; assignee_id?: number }) => {
  const { data } = await api.post<LiveTask>('/live/tasks', payload);
  return data;
};

export const fetchKpi = async () => {
  const { data } = await api.get<KPIResponse>('/analytics/kpi');
  return data;
};

export const fetchAuditLogs = async () => {
  const { data } = await api.get<AuditLog[]>('/analytics/audit');
  return data;
};

export const downloadPdf = () => api.get<Blob>('/analytics/export/pdf', { responseType: 'blob' });
export const downloadExcel = () => api.get<Blob>('/analytics/export/excel', { responseType: 'blob' });
