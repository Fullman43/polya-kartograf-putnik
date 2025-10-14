-- Drop the existing policy that isn't working
DROP POLICY IF EXISTS "Anyone can create an organization" ON public.organizations;

-- Create a new policy that allows authenticated users to create organizations
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);