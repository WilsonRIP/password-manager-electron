-- Create the secure_notes table
CREATE TABLE public.secure_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT requesting_user_id(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  salt TEXT NOT NULL, -- Salt for this specific note's encryption
  title_iv TEXT NOT NULL,
  title_ciphertext TEXT NOT NULL,
  content_iv TEXT NOT NULL,
  content_ciphertext TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.secure_notes ENABLE ROW LEVEL SECURITY;

-- Add policy: Allow users to manage only their own notes
CREATE POLICY "Allow individual access" ON public.secure_notes
  FOR ALL
  USING (requesting_user_id() = user_id)
  WITH CHECK (requesting_user_id() = user_id);

-- Add trigger to update updated_at timestamp (reuses existing function if created)
CREATE TRIGGER update_secure_notes_updated_at
BEFORE UPDATE ON public.secure_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column(); 