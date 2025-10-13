-- Enable realtime for employees table
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;

-- Enable realtime for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;