-- Fix RLS policy for organizations to allow organization_owner to create
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

CREATE POLICY "Organization owners can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'organization_owner'::app_role) OR
  has_role(auth.uid(), 'operator'::app_role)
);

-- Allow organization owners to update employee organization_id after creating org
CREATE POLICY "Organization owners can update employee org after creation"
ON public.employees
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() AND
  has_role(auth.uid(), 'organization_owner'::app_role)
);