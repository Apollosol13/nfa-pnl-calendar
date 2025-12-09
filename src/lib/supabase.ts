import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PNLEntry {
  id: string;
  user_id: string;
  date: string;
  pnl_amount: number;
  num_trades: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}
