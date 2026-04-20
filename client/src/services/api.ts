import type {
  AuthResponse,
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper: get stored token
function getToken(): string | null {
  return localStorage.getItem('token');
}

// Helper: create headers with auth token
function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── AUTH API ───────────────────────────────────────────────────

export async function register(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }
  return response.json();
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }
  return response.json();
}

export async function getMe(): Promise<AuthResponse['user']> {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Not authenticated');
  return response.json();
}

// ─── NOTES API ──────────────────────────────────────────────────

export async function getNotes(): Promise<Note[]> {
  const response = await fetch(`${API_URL}/notes`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch notes');
  return response.json();
}

export async function getNote(id: number): Promise<Note> {
  const response = await fetch(`${API_URL}/notes/${id}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch note');
  return response.json();
}

export async function createNote(data: CreateNoteRequest): Promise<Note> {
  const response = await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create note');
  }
  return response.json();
}

export async function updateNote(
  id: number,
  data: UpdateNoteRequest
): Promise<Note> {
  const response = await fetch(`${API_URL}/notes/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update note');
  }
  return response.json();
}

export async function deleteNote(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/notes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete note');
}
