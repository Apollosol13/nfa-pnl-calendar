/*
  # PNL Calendar System

  1. New Tables
    - `pnl_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date, not null)
      - `pnl_amount` (numeric, not null) - The profit/loss amount for the day
      - `num_trades` (integer, default 0) - Number of trades executed
      - `notes` (text) - Optional notes about the trading day
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `pnl_entries` table
    - Add policies for authenticated users to manage their own entries
    
  3. Indexes
    - Add index on (user_id, date) for efficient queries
    - Unique constraint on (user_id, date) to prevent duplicate entries per day
*/

CREATE TABLE IF NOT EXISTS pnl_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  pnl_amount numeric NOT NULL,
  num_trades integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_pnl_entries_user_date ON pnl_entries(user_id, date);

-- Enable RLS
ALTER TABLE pnl_entries ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can view own PNL entries"
  ON pnl_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PNL entries"
  ON pnl_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PNL entries"
  ON pnl_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own PNL entries"
  ON pnl_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);