-- Обновляем функцию handle_new_user для поддержки новых ролей и организаций
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_role app_role;
  org_id UUID;
BEGIN
  -- Get role from metadata or default to 'employee'
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'employee'::app_role
  );
  
  -- Get organization_id from metadata if present
  org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  -- If employee, operator, organization_owner, or organization_admin, create employee profile
  IF user_role IN ('employee', 'operator', 'organization_owner', 'organization_admin') THEN
    INSERT INTO public.employees (
      user_id,
      full_name,
      phone,
      status,
      organization_id
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.raw_user_meta_data->>'phone',
      'offline',
      org_id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;