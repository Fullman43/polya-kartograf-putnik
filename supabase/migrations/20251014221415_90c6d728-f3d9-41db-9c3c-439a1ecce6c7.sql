-- Add RLS policies for telegram_bot_state table
-- This table is used only by the edge function, so we'll make it restrictive

CREATE POLICY "Service role can manage bot state"
ON public.telegram_bot_state
FOR ALL
USING (auth.role() = 'service_role');