-- Migration: Auto-create user and store when auth user is created
-- This trigger automatically creates a store and user record when a new auth user signs up

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loja_id uuid;
  v_nome text;
  v_email text;
  v_avatar_url text;
  v_primeira_letra text;
BEGIN
  -- Extract user data from auth metadata
  v_nome := COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1));
  v_email := NEW.email;

  -- Generate avatar URL for store (first letter, white on black)
  v_primeira_letra := upper(substring(v_nome from 1 for 1));
  v_avatar_url := 'https://ui-avatars.com/api/?name=' || v_primeira_letra || '&background=000000&color=ffffff&size=200&bold=true&format=svg';

  -- 1. Create store (loja)
  INSERT INTO public.lojas (
    nome,
    avatar_url,
    plano,
    status,
    data_renovacao
  ) VALUES (
    v_nome,
    v_avatar_url,
    'FREE',
    'INACTIVE', -- Starts inactive until account is activated
    NOW() + INTERVAL '30 days'
  )
  RETURNING id INTO v_loja_id;

  -- 2. Create user record in usuarios table
  INSERT INTO public.usuarios (
    id,
    loja_id,
    email,
    nome,
    papel,
    avatar,
    senha_hash
  ) VALUES (
    NEW.id,
    v_loja_id,
    v_email,
    v_nome,
    'ADMIN',
    'https://ui-avatars.com/api/?name=' || v_primeira_letra || '&background=000000&color=10b981&size=200&bold=true&format=svg',
    'handled_by_supabase_auth'
  );

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't prevent user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates store and user record when a new auth user is created';
