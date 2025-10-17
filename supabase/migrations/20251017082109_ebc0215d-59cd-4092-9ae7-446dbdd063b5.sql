
-- Связываем обоих пользователей с созданной организацией
UPDATE employees
SET organization_id = 'b878c6d2-5dcf-4754-a154-fc8c453ed32a'
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('.!.@gmail.com', '2hera@gmail.com')
);
