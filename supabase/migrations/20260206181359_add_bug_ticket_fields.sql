-- Add new fields to bug_tickets table
ALTER TABLE public.bug_tickets
ADD COLUMN IF NOT EXISTS rotation TEXT,
ADD COLUMN IF NOT EXISTS pvpve_mode TEXT CHECK (pvpve_mode IN ('pve', 'pvp')),
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 80,
ADD COLUMN IF NOT EXISTS expansion TEXT CHECK (expansion IN ('tbc', 'era', 'hc')),
ADD COLUMN IF NOT EXISTS current_behavior TEXT,
ADD COLUMN IF NOT EXISTS expected_behavior TEXT,
ADD COLUMN IF NOT EXISTS logs TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS screenshot_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS discord_username TEXT,
ADD COLUMN IF NOT EXISTS sylvanas_username TEXT;

-- Update wow_class CHECK constraint to include 'esp'
ALTER TABLE public.bug_tickets
DROP CONSTRAINT IF EXISTS bug_tickets_wow_class_check;

ALTER TABLE public.bug_tickets
ADD CONSTRAINT bug_tickets_wow_class_check 
CHECK (wow_class IN ('rogue', 'hunter', 'warrior', 'warlock', 'paladin', 'priest', 'mage', 'shaman', 'druid', 'esp'));

-- Update INSERT policy to include new required fields
DROP POLICY IF EXISTS "Users can create bug tickets" ON public.bug_tickets;

CREATE POLICY "Users can create bug tickets"
  ON public.bug_tickets FOR INSERT
  WITH CHECK (
    reporter_name IS NOT NULL 
    AND title IS NOT NULL 
    AND description IS NOT NULL
    AND rotation IS NOT NULL
    AND pvpve_mode IS NOT NULL
    AND level IS NOT NULL
    AND expansion IS NOT NULL
    AND current_behavior IS NOT NULL
    AND expected_behavior IS NOT NULL
    AND discord_username IS NOT NULL
    AND sylvanas_username IS NOT NULL
    AND length(current_behavior) >= 200
    AND length(expected_behavior) >= 200
  );
