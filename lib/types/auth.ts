import { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    email?: string;
  };
}

export interface UserError {
  message: string;
}