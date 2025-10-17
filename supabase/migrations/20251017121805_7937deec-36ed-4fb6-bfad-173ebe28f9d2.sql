-- Добавить новый статус 'paused' в enum task_status
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'paused';

-- Создать таблицу для хранения истории пауз
CREATE TABLE IF NOT EXISTS public.task_pauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  paused_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resumed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Включить RLS для task_pauses
ALTER TABLE public.task_pauses ENABLE ROW LEVEL SECURITY;

-- RLS политики для task_pauses
CREATE POLICY "Employees can view pauses for their tasks"
  ON public.task_pauses FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE assigned_employee_id IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Operators and managers can view all pauses"
  ON public.task_pauses FOR SELECT
  USING (
    has_role(auth.uid(), 'operator'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'organization_owner'::app_role) OR
    has_role(auth.uid(), 'organization_admin'::app_role)
  );

CREATE POLICY "Employees can insert pauses for their tasks"
  ON public.task_pauses FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE assigned_employee_id IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Employees can update pauses for their tasks"
  ON public.task_pauses FOR UPDATE
  USING (
    task_id IN (
      SELECT id FROM public.tasks
      WHERE assigned_employee_id IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
      )
    )
  );

-- Индексы для оптимизации
CREATE INDEX idx_task_pauses_task_id ON public.task_pauses(task_id);
CREATE INDEX idx_task_pauses_resumed_at ON public.task_pauses(resumed_at) WHERE resumed_at IS NULL;

COMMENT ON TABLE public.task_pauses IS 'Хранит историю пауз для каждой задачи';
COMMENT ON COLUMN public.task_pauses.paused_at IS 'Время постановки на паузу';
COMMENT ON COLUMN public.task_pauses.resumed_at IS 'Время возобновления работы (NULL если пауза активна)';