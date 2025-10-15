-- Fix RLS policies for task_photos to allow organization owners/admins to view photos

DROP POLICY IF EXISTS "Users can view photos for their tasks" ON public.task_photos;

CREATE POLICY "Users can view photos for their tasks"
ON public.task_photos
FOR SELECT
USING (
  task_id IN (
    SELECT id FROM public.tasks
    WHERE has_role(auth.uid(), 'operator'::app_role)
       OR has_role(auth.uid(), 'manager'::app_role)
       OR has_role(auth.uid(), 'organization_owner'::app_role)
       OR has_role(auth.uid(), 'organization_admin'::app_role)
       OR assigned_employee_id IN (
         SELECT id FROM public.employees WHERE user_id = auth.uid()
       )
  )
);

-- Fix RLS policies for task_comments to allow organization owners/admins to view comments

DROP POLICY IF EXISTS "Users can view comments for their tasks" ON public.task_comments;

CREATE POLICY "Users can view comments for their tasks"
ON public.task_comments
FOR SELECT
USING (
  task_id IN (
    SELECT id FROM public.tasks
    WHERE has_role(auth.uid(), 'operator'::app_role)
       OR has_role(auth.uid(), 'manager'::app_role)
       OR has_role(auth.uid(), 'organization_owner'::app_role)
       OR has_role(auth.uid(), 'organization_admin'::app_role)
       OR assigned_employee_id IN (
         SELECT id FROM public.employees WHERE user_id = auth.uid()
       )
  )
);