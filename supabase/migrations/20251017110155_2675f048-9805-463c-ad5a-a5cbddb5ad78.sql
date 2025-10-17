-- Исправляем проблему с отсутствующими organization_id
-- Для сотрудников с ролью organization_owner создаем организации

DO $$
DECLARE
  emp_record RECORD;
  new_org_id UUID;
  unique_inn TEXT;
BEGIN
  -- Находим всех organization_owner без organization_id
  FOR emp_record IN 
    SELECT e.id, e.user_id, e.full_name, e.phone, ur.role
    FROM employees e
    JOIN user_roles ur ON ur.user_id = e.user_id
    WHERE e.organization_id IS NULL 
      AND ur.role = 'organization_owner'
  LOOP
    -- Генерируем уникальный ИНН (используем часть UUID)
    unique_inn := LPAD(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 12), 12, '0');
    
    -- Создаем новую организацию для каждого owner-а
    INSERT INTO organizations (
      name,
      inn,
      contact_person,
      contact_email,
      contact_phone
    )
    SELECT 
      'Организация: ' || emp_record.full_name,
      unique_inn,
      emp_record.full_name,
      u.email,
      emp_record.phone
    FROM auth.users u
    WHERE u.id = emp_record.user_id
    RETURNING id INTO new_org_id;
    
    -- Обновляем organization_id у сотрудника
    UPDATE employees
    SET organization_id = new_org_id
    WHERE id = emp_record.id;
    
    RAISE NOTICE 'Создана организация % для сотрудника %', new_org_id, emp_record.full_name;
  END LOOP;
END $$;