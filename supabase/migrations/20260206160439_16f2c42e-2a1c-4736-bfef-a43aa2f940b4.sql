-- Fix function search path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Drop overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can create bug tickets" ON public.bug_tickets;

-- Create more restrictive INSERT policy (still allows anyone but with proper check)
CREATE POLICY "Users can create bug tickets"
  ON public.bug_tickets FOR INSERT
  WITH CHECK (
    reporter_name IS NOT NULL 
    AND title IS NOT NULL 
    AND description IS NOT NULL
  );