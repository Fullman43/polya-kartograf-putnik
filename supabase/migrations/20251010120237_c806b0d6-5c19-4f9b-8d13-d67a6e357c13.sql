-- Create enum types
CREATE TYPE public.employee_status AS ENUM ('available', 'busy', 'offline');
CREATE TYPE public.task_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.app_role AS ENUM ('operator', 'employee', 'manager');

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  status employee_status NOT NULL DEFAULT 'offline',
  current_location POINT,
  current_task_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  location POINT,
  work_type TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'pending',
  assigned_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_comments table
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routes table
CREATE TABLE public.routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  distance INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  geometry JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (CRITICAL for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for employees
CREATE POLICY "Operators and managers can view all employees"
  ON public.employees FOR SELECT
  USING (
    public.has_role(auth.uid(), 'operator') OR 
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Employees can view their own profile"
  ON public.employees FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Operators can insert employees"
  ON public.employees FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Operators and employees can update their profile"
  ON public.employees FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'operator') OR 
    user_id = auth.uid()
  );

-- RLS Policies for tasks
CREATE POLICY "Operators and managers can view all tasks"
  ON public.tasks FOR SELECT
  USING (
    public.has_role(auth.uid(), 'operator') OR 
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Employees can view assigned tasks"
  ON public.tasks FOR SELECT
  USING (
    assigned_employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Operators can update tasks"
  ON public.tasks FOR UPDATE
  USING (public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Employees can update assigned tasks"
  ON public.tasks FOR UPDATE
  USING (
    assigned_employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for task_comments
CREATE POLICY "Users can view comments for their tasks"
  ON public.task_comments FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE 
        public.has_role(auth.uid(), 'operator') OR
        public.has_role(auth.uid(), 'manager') OR
        assigned_employee_id IN (
          SELECT id FROM public.employees WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can insert comments"
  ON public.task_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for routes
CREATE POLICY "Operators and managers can view all routes"
  ON public.routes FOR SELECT
  USING (
    public.has_role(auth.uid(), 'operator') OR 
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Operators can create routes"
  ON public.routes FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'operator'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Operators can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'operator'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add trigger to tasks table
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from metadata or default to 'employee'
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'employee'::app_role
  );
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  -- If employee or operator, create employee profile
  IF user_role IN ('employee', 'operator') THEN
    INSERT INTO public.employees (
      user_id,
      full_name,
      phone,
      status
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.raw_user_meta_data->>'phone',
      'offline'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();