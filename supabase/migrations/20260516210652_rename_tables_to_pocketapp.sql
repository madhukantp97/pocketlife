-- Rename all tables to include the pocketapp_ prefix
ALTER TABLE IF EXISTS public.notes RENAME TO pocketapp_notes;
ALTER TABLE IF EXISTS public.todos RENAME TO pocketapp_todos;
ALTER TABLE IF EXISTS public.reminders RENAME TO pocketapp_reminders;
ALTER TABLE IF EXISTS public.important_dates RENAME TO pocketapp_important_dates;
ALTER TABLE IF EXISTS public.vault_entries RENAME TO pocketapp_vault_entries;
ALTER TABLE IF EXISTS public.app_settings RENAME TO pocketapp_app_settings;
ALTER TABLE IF EXISTS public.profiles RENAME TO pocketapp_profiles;
ALTER TABLE IF EXISTS public.documents RENAME TO pocketapp_documents;
ALTER TABLE IF EXISTS public.notifications RENAME TO pocketapp_notifications;

-- Update the new user trigger to use the new profile table name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.pocketapp_profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Refresh the API schema cache
NOTIFY pgrst, 'reload schema';
