// ─── DATABASE MODELS ────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
}

// User data that's safe to send to the frontend (no password_hash)
export interface SafeUser {
  id: number;
  email: string;
  role: string;
  created_at: string;
}

export interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// ─── REQUEST TYPES ──────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateNoteRequest {
  title: string;
  content?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
}

// ─── AUTH TYPES ─────────────────────────────────────────────────

export interface JWTPayload {
  userId: number;
  role: string;
}

export interface AuthRequest {
  user: JWTPayload;
}
