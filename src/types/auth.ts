export interface User {
  id: string;
  email: string;
  name: string;
  flat_number?: string;
  role: 'neighbor' | 'trainer' | 'admin';
  created_at?: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
