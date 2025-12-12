-- Rollback migration: Remove cascade delete trigger

-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_auth_user_deleted();

COMMENT ON SCHEMA public IS 'Cascade delete trigger removed';
