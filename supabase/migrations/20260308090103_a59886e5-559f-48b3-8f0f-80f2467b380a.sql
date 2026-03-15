
-- Add starred column to notes, todos, reminders
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS starred boolean NOT NULL DEFAULT false;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS starred boolean NOT NULL DEFAULT false;
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS starred boolean NOT NULL DEFAULT false;

-- Add alert_before to reminders (minutes before reminder to alert)
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS alert_before integer DEFAULT 0;

-- Create documents table
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  file_type text NOT NULL DEFAULT '',
  storage_path text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- Create documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 20971520)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Users can upload own documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view own documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own documents" ON storage.objects FOR DELETE USING (
  bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
);
