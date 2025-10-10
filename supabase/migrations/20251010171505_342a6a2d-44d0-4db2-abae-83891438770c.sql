-- Add priority enum
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Add new columns to tasks table
ALTER TABLE public.tasks
ADD COLUMN order_number TEXT UNIQUE,
ADD COLUMN customer_name TEXT,
ADD COLUMN customer_phone TEXT,
ADD COLUMN priority task_priority NOT NULL DEFAULT 'medium';

-- Create index on order_number for faster lookups
CREATE INDEX idx_tasks_order_number ON public.tasks(order_number);

-- Create function to auto-generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
  date_prefix TEXT;
  counter INTEGER;
BEGIN
  date_prefix := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get the count of orders created today
  SELECT COUNT(*) + 1 INTO counter
  FROM public.tasks
  WHERE order_number LIKE date_prefix || '%';
  
  -- Format: YYYYMMDD-XXXX (e.g., 20251010-0001)
  new_number := date_prefix || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;

-- Create trigger to auto-generate order number on insert
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_order_number();