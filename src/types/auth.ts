import { AuthResponse, User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string | undefined;
  character_name: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ data: { user: SupabaseUser | null; session: Session | null }, error: Error | null }>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
} 