-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Organization owners can create organizations" ON public.organizations;

-- Create a more permissive policy for organization creation
CREATE POLICY "Organization owners can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
  -- Check if user has organization_owner or operator role
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('organization_owner', 'operator')
  )
);