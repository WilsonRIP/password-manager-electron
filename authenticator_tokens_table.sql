-- Create the authenticator_tokens table
CREATE TABLE public.authenticator_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT requesting_user_id(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  label TEXT NOT NULL,
  secret TEXT NOT NULL, -- Store encrypted if necessary, for now plain text
  digits INTEGER NOT NULL DEFAULT 6,
  period INTEGER NOT NULL DEFAULT 30
);

-- Enable Row Level Security
ALTER TABLE public.authenticator_tokens ENABLE ROW LEVEL SECURITY;

-- Add policy: Allow users to manage only their own tokens
CREATE POLICY "Allow individual access" ON public.authenticator_tokens
  FOR ALL
  USING (requesting_user_id() = user_id)
  WITH CHECK (requesting_user_id() = user_id);

-- Add trigger to update updated_at timestamp (reuses existing function if created)
CREATE TRIGGER update_authenticator_tokens_updated_at
BEFORE UPDATE ON public.authenticator_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column(); 