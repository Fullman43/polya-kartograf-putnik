-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;

-- Create a better SELECT policy that allows users to see organizations they're linked to
CREATE POLICY "Users can view their own organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  -- Allow if organization_id matches in employees table
  id IN (
    SELECT organization_id 
    FROM public.employees 
    WHERE user_id = auth.uid() 
    AND organization_id IS NOT NULL
  )
  OR
  -- Allow organization owners to see any organization (for initial setup)
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = 'organization_owner'
  )
);