-- Create profiles table for developers
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  developer_type TEXT CHECK (developer_type IN ('astro', 'bungee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create bug_tickets table
CREATE TABLE public.bug_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer TEXT NOT NULL CHECK (developer IN ('astro', 'bungee')),
  wow_class TEXT NOT NULL CHECK (wow_class IN ('rogue', 'hunter', 'warrior', 'warlock', 'paladin', 'priest', 'mage', 'shaman', 'druid')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved')),
  reporter_name TEXT NOT NULL,
  reporter_user_id UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on bug_tickets
ALTER TABLE public.bug_tickets ENABLE ROW LEVEL SECURITY;

-- Bug tickets policies - anyone can view
CREATE POLICY "Bug tickets are viewable by everyone"
  ON public.bug_tickets FOR SELECT
  USING (true);

-- Anyone can create bug tickets
CREATE POLICY "Anyone can create bug tickets"
  ON public.bug_tickets FOR INSERT
  WITH CHECK (true);

-- Only authenticated developers can update tickets
CREATE POLICY "Developers can update assigned tickets"
  ON public.bug_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.developer_type IS NOT NULL
    )
  );

-- Create code_changes table for tracking changes
CREATE TABLE public.code_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  change_description TEXT NOT NULL,
  change_type TEXT NOT NULL DEFAULT 'update' CHECK (change_type IN ('create', 'update', 'delete', 'fix', 'feature')),
  related_ticket_id UUID REFERENCES public.bug_tickets(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on code_changes
ALTER TABLE public.code_changes ENABLE ROW LEVEL SECURITY;

-- Code changes viewable by authenticated developers
CREATE POLICY "Code changes viewable by developers"
  ON public.code_changes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.developer_type IS NOT NULL
    )
  );

-- Developers can insert their own changes
CREATE POLICY "Developers can log their own changes"
  ON public.code_changes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.id = developer_id
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_bug_tickets_updated_at
  BEFORE UPDATE ON public.bug_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for bug_tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.bug_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.code_changes;