import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create a real client if configured, otherwise create a dummy one
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

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

// LocalStorage helpers for demo mode
const STORAGE_KEY = 'nfa_pnl_entries';

export const localStorageDB = {
  getEntries: (): PNLEntry[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  saveEntry: (entry: Omit<PNLEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>): PNLEntry => {
    const entries = localStorageDB.getEntries();
    const existingIndex = entries.findIndex(e => e.date === entry.date);
    
    const newEntry: PNLEntry = {
      id: existingIndex >= 0 ? entries[existingIndex].id : crypto.randomUUID(),
      user_id: 'local-user',
      date: entry.date,
      pnl_amount: entry.pnl_amount,
      num_trades: entry.num_trades,
      notes: entry.notes,
      created_at: existingIndex >= 0 ? entries[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      entries[existingIndex] = newEntry;
    } else {
      entries.push(newEntry);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return newEntry;
  },
  
  deleteEntry: (date: string): void => {
    const entries = localStorageDB.getEntries().filter(e => e.date !== date);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  },
  
  getEntriesInRange: (startDate: string, endDate: string): PNLEntry[] => {
    return localStorageDB.getEntries().filter(e => e.date >= startDate && e.date <= endDate);
  }
};
