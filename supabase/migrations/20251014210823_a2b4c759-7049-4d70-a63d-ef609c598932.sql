-- Часть 2: Создаем таблицу организаций и обновляем политики
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  inn TEXT NOT NULL UNIQUE,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '14 days'),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Добавляем organization_id к employees
ALTER TABLE public.employees ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Добавляем organization_id к tasks
ALTER TABLE public.tasks ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Создаем функцию для получения organization_id пользователя
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.employees
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- RLS политики для organizations
CREATE POLICY "Users can view their own organization"
ON public.organizations
FOR SELECT
USING (id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Organization owners can update their organization"
ON public.organizations
FOR UPDATE
USING (
  id = public.get_user_organization_id(auth.uid()) 
  AND public.has_role(auth.uid(), 'organization_owner'::app_role)
);

CREATE POLICY "Anyone can create an organization"
ON public.organizations
FOR INSERT
WITH CHECK (true);

-- Обновляем RLS политики для employees
DROP POLICY IF EXISTS "Employees can view their own profile" ON public.employees;
DROP POLICY IF EXISTS "Users can view employees in their organization" ON public.employees;
DROP POLICY IF EXISTS "Organization owners and admins can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Organization owners and admins can update employees" ON public.employees;

CREATE POLICY "Employees can view their own profile"
ON public.employees
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view employees in their organization"
ON public.employees
FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Organization owners and admins can insert employees"
ON public.employees
FOR INSERT
WITH CHECK (
  organization_id = public.get_user_organization_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'organization_owner'::app_role)
    OR public.has_role(auth.uid(), 'organization_admin'::app_role)
    OR public.has_role(auth.uid(), 'operator'::app_role)
  )
);

CREATE POLICY "Organization owners and admins can update employees"
ON public.employees
FOR UPDATE
USING (
  organization_id = public.get_user_organization_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'organization_owner'::app_role)
    OR public.has_role(auth.uid(), 'organization_admin'::app_role)
    OR public.has_role(auth.uid(), 'operator'::app_role)
    OR user_id = auth.uid()
  )
);

-- Обновляем RLS политики для tasks
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Organization owners and admins can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Organization owners and admins can update tasks" ON public.tasks;

CREATE POLICY "Users can view tasks in their organization"
ON public.tasks
FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Organization owners and admins can create tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  organization_id = public.get_user_organization_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'organization_owner'::app_role)
    OR public.has_role(auth.uid(), 'organization_admin'::app_role)
    OR public.has_role(auth.uid(), 'operator'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
  )
);

CREATE POLICY "Organization owners and admins can update tasks"
ON public.tasks
FOR UPDATE
USING (
  organization_id = public.get_user_organization_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'organization_owner'::app_role)
    OR public.has_role(auth.uid(), 'organization_admin'::app_role)
    OR public.has_role(auth.uid(), 'operator'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR assigned_employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  )
);

-- Триггер для updated_at организаций
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();