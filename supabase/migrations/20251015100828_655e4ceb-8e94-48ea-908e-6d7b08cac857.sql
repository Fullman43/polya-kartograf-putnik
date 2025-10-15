-- Add DELETE policy for employees table
-- Only operators and organization admins can delete employees

CREATE POLICY "Operators can delete employees"
ON public.employees
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "Organization admins can delete employees in their org"
ON public.employees
FOR DELETE
TO authenticated
USING (
  organization_id = get_user_organization_id(auth.uid()) AND
  (has_role(auth.uid(), 'organization_admin'::app_role) OR has_role(auth.uid(), 'organization_owner'::app_role))
);