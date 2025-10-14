-- Create table for linking Telegram accounts to users
CREATE TABLE public.telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own Telegram link
CREATE POLICY "Users can view their own telegram link"
ON public.telegram_users
FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own Telegram link
CREATE POLICY "Users can create their own telegram link"
ON public.telegram_users
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can delete their own Telegram link
CREATE POLICY "Users can delete their own telegram link"
ON public.telegram_users
FOR DELETE
USING (user_id = auth.uid());

-- Create table for one-time authentication codes
CREATE TABLE public.telegram_auth_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.telegram_auth_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own auth codes
CREATE POLICY "Users can view their own auth codes"
ON public.telegram_auth_codes
FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own auth codes
CREATE POLICY "Users can create their own auth codes"
ON public.telegram_auth_codes
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Create table for bot state management
CREATE TABLE public.telegram_bot_state (
  telegram_id BIGINT PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.telegram_bot_state ENABLE ROW LEVEL SECURITY;

-- Only the bot (via service role) can manage state
-- No policies needed as this is internal bot state

-- Create index for faster lookups
CREATE INDEX idx_telegram_users_user_id ON public.telegram_users(user_id);
CREATE INDEX idx_telegram_users_telegram_id ON public.telegram_users(telegram_id);
CREATE INDEX idx_telegram_auth_codes_code ON public.telegram_auth_codes(code) WHERE NOT used;
CREATE INDEX idx_telegram_auth_codes_expires ON public.telegram_auth_codes(expires_at) WHERE NOT used;