-- Create a better solution using sequences for each day
-- This guarantees no duplicates

DROP FUNCTION IF EXISTS public.generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS public.set_order_number() CASCADE;

-- Create function that uses a temporary table to track daily sequences
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  new_number TEXT;
  date_prefix TEXT;
  next_num INTEGER;
BEGIN
  date_prefix := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Create temp table if not exists to track sequence per day
  CREATE TEMP TABLE IF NOT EXISTS order_sequences (
    date_key TEXT PRIMARY KEY,
    next_value INTEGER NOT NULL
  );
  
  -- Get and increment the next value atomically
  INSERT INTO order_sequences (date_key, next_value)
  VALUES (date_prefix, 1)
  ON CONFLICT (date_key) DO UPDATE
  SET next_value = order_sequences.next_value + 1
  RETURNING next_value INTO next_num;
  
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
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();