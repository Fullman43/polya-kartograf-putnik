-- Create storage bucket for task photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-photos', 'task-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create task_photos table
CREATE TABLE IF NOT EXISTS public.task_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on task_photos
ALTER TABLE public.task_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_photos
CREATE POLICY "Users can view photos for their tasks"
ON public.task_photos
FOR SELECT
USING (
  task_id IN (
    SELECT id FROM public.tasks
    WHERE has_role(auth.uid(), 'operator'::app_role)
       OR has_role(auth.uid(), 'manager'::app_role)
       OR assigned_employee_id IN (
         SELECT id FROM public.employees WHERE user_id = auth.uid()
       )
  )
);

CREATE POLICY "Employees can upload photos"
ON public.task_photos
FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid()
  AND task_id IN (
    SELECT id FROM public.tasks
    WHERE assigned_employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  )
);

-- Storage policies for task-photos bucket
CREATE POLICY "Anyone can view task photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'task-photos');

CREATE POLICY "Authenticated users can upload task photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'task-photos'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own task photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'task-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own task photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'task-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);