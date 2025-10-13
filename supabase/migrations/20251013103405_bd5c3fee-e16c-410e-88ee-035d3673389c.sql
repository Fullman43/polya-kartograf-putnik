-- Add new timestamp fields for tracking travel and work start times
ALTER TABLE public.tasks 
ADD COLUMN en_route_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;

-- Add new 'en_route' status to task_status enum
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'en_route';

-- Add comment for documentation
COMMENT ON COLUMN public.tasks.en_route_at IS 'Timestamp when employee started traveling to the task';
COMMENT ON COLUMN public.tasks.started_at IS 'Timestamp when employee arrived and started working on the task';