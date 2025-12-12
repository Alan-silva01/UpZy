-- Rollback migration: Remove auto-create user and store trigger

-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

COMMENT ON SCHEMA public IS 'Auto-create trigger removed';
