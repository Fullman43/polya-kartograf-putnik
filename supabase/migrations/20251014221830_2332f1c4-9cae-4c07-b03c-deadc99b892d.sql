-- Fix: Allow organization owners without organization to create tasks and employees
-- This is needed when organization owner registers first time

-- Add policy for organization owners to insert tasks without organization check
CREATE POLICY "Organization owners can create tasks without organization"
ON public.tasks
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'organization_owner'::app_role)
);

-- Add policy for organization owners to insert employees without organization check
CREATE POLICY "Organization owners can insert employees without organization check"
ON public.employees
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'organization_owner'::app_role)
);