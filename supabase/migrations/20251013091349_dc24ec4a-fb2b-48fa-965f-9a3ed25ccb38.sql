-- Часть 2: Создаем таблицу для описаний ролей и обновляем политики

-- Создаем таблицу для описаний ролей
CREATE TABLE IF NOT EXISTS public.role_descriptions (
  role app_role PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Включаем RLS для таблицы описаний ролей
ALTER TABLE public.role_descriptions ENABLE ROW LEVEL SECURITY;

-- Политика: все авторизованные пользователи могут читать описания ролей
CREATE POLICY "Anyone can view role descriptions"
  ON public.role_descriptions
  FOR SELECT
  TO authenticated
  USING (true);

-- Вставляем описания всех ролей
INSERT INTO public.role_descriptions (role, title, description, permissions) VALUES
  ('operator', 'Оператор / Диспетчер', 
   'Управление задачами, оборудованием, клиентским порталом, дашборды KPI, управление филиалами и интеграциями',
   '["tasks_management", "employees_management", "equipment_management", "clients_portal", "kpi_dashboards", "branches_management", "integrations"]'::jsonb),
  
  ('employee', 'Сотрудник (Техник)', 
   'Доступ к чек-листам оборудования, фотоотчётам, QR-сканированию, подзадачам, офлайн-работе',
   '["assigned_tasks", "equipment_checklists", "photo_reports", "qr_scanning", "subtasks", "offline_mode"]'::jsonb),
  
  ('manager', 'Руководитель / Аналитик', 
   'Аналитика, KPI-дэшборды, отчёты, управление регионами/филиалами, оценка эффективности',
   '["analytics", "kpi_dashboards", "reports", "regions_management", "branches_management", "performance_evaluation", "view_all"]'::jsonb),
  
  ('client', 'Клиент', 
   'Портальный доступ к статусам заявок, уведомлениям, просмотру исполнителя и истории работ',
   '["view_own_tasks", "notifications", "view_executor", "work_history"]'::jsonb)
ON CONFLICT (role) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- Обновляем существующие RLS политики для поддержки новых ролей

-- Обновляем политику просмотра задач для менеджеров
DROP POLICY IF EXISTS "Operators and managers can view all tasks" ON public.tasks;
CREATE POLICY "Operators and managers can view all tasks"
  ON public.tasks
  FOR SELECT
  USING (
    has_role(auth.uid(), 'operator'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

-- Обновляем политику просмотра сотрудников для менеджеров
DROP POLICY IF EXISTS "Operators and managers can view all employees" ON public.employees;
CREATE POLICY "Operators and managers can view all employees"
  ON public.employees
  FOR SELECT
  USING (
    has_role(auth.uid(), 'operator'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

-- Обновляем политику просмотра маршрутов для менеджеров
DROP POLICY IF EXISTS "Operators and managers can view all routes" ON public.routes;
CREATE POLICY "Operators and managers can view all routes"
  ON public.routes
  FOR SELECT
  USING (
    has_role(auth.uid(), 'operator'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

-- Добавляем политику для клиентов: они могут видеть только свои задачи
CREATE POLICY "Clients can view their own tasks"
  ON public.tasks
  FOR SELECT
  USING (
    has_role(auth.uid(), 'client'::app_role) AND 
    created_by = auth.uid()
  );

-- Менеджеры могут управлять задачами как операторы
CREATE POLICY "Managers can update tasks"
  ON public.tasks
  FOR UPDATE
  USING (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can create tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

COMMENT ON TABLE public.role_descriptions IS 'Описания ролей пользователей в системе с их правами доступа';
COMMENT ON COLUMN public.role_descriptions.permissions IS 'JSON массив с кодами доступных функций для роли';