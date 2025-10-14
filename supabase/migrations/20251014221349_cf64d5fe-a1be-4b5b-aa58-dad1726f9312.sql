-- Fix RLS policies: Users without organization should only see all if they are operators/managers

-- Drop problematic policies for employees
DROP POLICY IF EXISTS "Users without organization can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Operators without organization can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Operators without organization can update employees" ON public.employees;

-- Create correct policies for employees
CREATE POLICY "Operators/managers without organization can view all employees"
ON public.employees
FOR SELECT
USING (
  get_user_organization_id(auth.uid()) IS NULL 
  AND (has_role(auth.uid(), 'operator'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

CREATE POLICY "Operators/managers without organization can insert employees"
ON public.employees
FOR INSERT
WITH CHECK (
  get_user_organization_id(auth.uid()) IS NULL 
  AND (has_role(auth.uid(), 'operator'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

CREATE POLICY "Operators/managers without organization can update employees"
ON public.employees
FOR UPDATE
USING (
  get_user_organization_id(auth.uid()) IS NULL 
  AND (has_role(auth.uid(), 'operator'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR user_id = auth.uid())
);

-- Drop problematic policies for tasks
DROP POLICY IF EXISTS "Users without organization can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Operators without organization can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Operators without organization can update tasks" ON public.tasks;

-- Create correct policies for tasks
CREATE POLICY "Operators/managers without organization can view all tasks"
ON public.tasks
FOR SELECT
USING (
  get_user_organization_id(auth.uid()) IS NULL 
  AND (has_role(auth.uid(), 'operator'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

CREATE POLICY "Operators/managers without organization can create tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  get_user_organization_id(auth.uid()) IS NULL 
  AND (has_role(auth.uid(), 'operator'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

CREATE POLICY "Operators/managers without organization can update tasks"
ON public.tasks
FOR UPDATE
USING (
  get_user_organization_id(auth.uid()) IS NULL 
  AND (
    has_role(auth.uid(), 'operator'::app_role) 
    OR has_role(auth.uid(), 'manager'::app_role)
    OR assigned_employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  )
);