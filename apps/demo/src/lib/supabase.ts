import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'] as string;
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  email: string;
  password: string;
  name: string | null;
  wallet_address: string | null;
  app_id: string;
  referral_code: string | null;
  current_tier: string;
  current_points: number;
  total_points_earned: number;
  first_seen_at: string;
  last_active_at: string;
}
