-- Добавляем политики для пользователей без организаций (обратная совместимость)

-- Политики для tasks
CREATE POLICY "Users without organization can view all tasks"
ON public.tasks
FOR SELECT
USING (
  public.get_user_organization_id(auth.uid()) IS NULL
);

CREATE POLICY "Operators without organization can create tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  public.get_user_organization_id(auth.uid()) IS NULL
  AND (
    public.has_role(auth.uid(), 'operator'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
  )
);

CREATE POLICY "Operators without organization can update tasks"
ON public.tasks
FOR UPDATE
USING (
  public.get_user_organization_id(auth.uid()) IS NULL
  AND (
    public.has_role(auth.uid(), 'operator'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR assigned_employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  )
);

-- Политики для employees
CREATE POLICY "Users without organization can view all employees"
ON public.employees
FOR SELECT
USING (
  public.get_user_organization_id(auth.uid()) IS NULL
);

CREATE POLICY "Operators without organization can insert employees"
ON public.employees
FOR INSERT
WITH CHECK (
  public.get_user_organization_id(auth.uid()) IS NULL
  AND public.has_role(auth.uid(), 'operator'::app_role)
);

CREATE POLICY "Operators without organization can update employees"
ON public.employees
FOR UPDATE
USING (
  public.get_user_organization_id(auth.uid()) IS NULL
  AND (
    public.has_role(auth.uid(), 'operator'::app_role)
    OR user_id = auth.uid()
  )
);