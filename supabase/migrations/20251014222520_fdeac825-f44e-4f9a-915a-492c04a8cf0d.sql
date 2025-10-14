-- Fix order number generation to prevent duplicates
-- Use MAX instead of COUNT to avoid race conditions

DROP FUNCTION IF EXISTS public.generate_order_number();

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  new_number TEXT;
  date_prefix TEXT;
  max_counter INTEGER;
  next_counter INTEGER;
BEGIN
  date_prefix := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Find the maximum counter for today's date
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(order_number FROM LENGTH(date_prefix) + 2) AS INTEGER
      )
    ),
    0
  ) INTO max_counter
  FROM public.tasks
  WHERE order_number LIKE date_prefix || '%';
  
  next_counter := max_counter + 1;
  new_number := date_prefix || '-' || LPAD(next_counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$function$;