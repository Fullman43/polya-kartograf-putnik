-- Create a permanent solution with a dedicated table for order sequences

-- Create table for storing daily order number sequences
CREATE TABLE IF NOT EXISTS public.order_number_sequences (
  date_key TEXT PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.order_number_sequences ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage sequences
CREATE POLICY "Service role can manage sequences"
ON public.order_number_sequences
FOR ALL
USING (auth.role() = 'service_role');

-- Drop and recreate the function to use permanent table
DROP FUNCTION IF EXISTS public.generate_order_number() CASCADE;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_number TEXT;
  date_prefix TEXT;
  next_num INTEGER;
BEGIN
  date_prefix := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Use INSERT ... ON CONFLICT to atomically get next number
  INSERT INTO order_number_sequences (date_key, last_number)
  VALUES (date_prefix, 1)
  ON CONFLICT (date_key) DO UPDATE
  SET last_number = order_number_sequences.last_number + 1
  RETURNING last_number INTO next_num;
  
  new_number := date_prefix || '-' || LPAD(next_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$function$;

-- Recreate the trigger function
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.tasks;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();

-- Initialize today's counter based on existing tasks
INSERT INTO order_number_sequences (date_key, last_number)
SELECT 
  TO_CHAR(CURRENT_DATE, 'YYYYMMDD'),
  COALESCE(MAX(CAST(SUBSTRING(order_number FROM 10) AS INTEGER)), 0)
FROM tasks
WHERE order_number LIKE TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '%'
ON CONFLICT (date_key) DO NOTHING;