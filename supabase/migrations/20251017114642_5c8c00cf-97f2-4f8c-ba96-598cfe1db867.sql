-- Add RLS policy for operators and managers to upload photos when creating tasks
CREATE POLICY "Operators and managers can upload photos"
ON task_photos
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'operator') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'organization_owner') OR 
  has_role(auth.uid(), 'organization_admin')
);