-- Migration: Cascade delete user and store when auth user is deleted
-- This trigger automatically deletes the user record and store when an auth user is deleted

-- Function to handle user deletion cascade
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_loja_id uuid;
BEGIN
  -- Get the loja_id from the usuarios table before deleting
  SELECT loja_id INTO v_loja_id
  FROM public.usuarios
  WHERE id = OLD.id;

  -- Delete the user record from usuarios table
  -- This will cascade delete vendedores due to foreign key constraints
  DELETE FROM public.usuarios WHERE id = OLD.id;

  -- Delete the loja if it exists
  -- This will cascade delete vendas, metas, etc. due to foreign key constraints
  IF v_loja_id IS NOT NULL THEN
    DELETE FROM public.lojas WHERE id = v_loja_id;
  END IF;

  RETURN OLD;
END;
$$;

-- Create trigger on auth.users delete
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_deleted();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, service_role;

COMMENT ON FUNCTION public.handle_auth_user_deleted() IS 'Automatically deletes user record and associated store when auth user is deleted';
