-- ============================================================================
-- MIGRATION COMPLETA - EXECUTAR ESTE ARQUIVO NO SUPABASE SQL EDITOR
-- ============================================================================
-- Este arquivo configura triggers automáticos para:
-- 1. Criar automaticamente loja e usuário quando um auth user é criado
-- 2. Deletar automaticamente loja e usuário quando um auth user é deletado
-- ============================================================================

-- ============================================================================
-- PARTE 1: Auto-criar loja e usuário quando auth user é criado
-- ============================================================================

-- Função que cria automaticamente loja e usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loja_id uuid;
  v_nome_usuario text;
  v_nome_loja text;
  v_email text;
  v_avatar_url_loja text;
  v_avatar_url_usuario text;
  v_primeira_letra_loja text;
  v_primeira_letra_usuario text;
BEGIN
  -- Extrair dados do usuário do metadata do auth
  v_nome_usuario := COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1));
  v_nome_loja := COALESCE(NEW.raw_user_meta_data->>'nomeLoja', v_nome_usuario);
  v_email := NEW.email;

  -- Gerar URL do avatar da loja (primeira letra, branco no preto)
  v_primeira_letra_loja := upper(substring(v_nome_loja from 1 for 1));
  v_avatar_url_loja := 'https://ui-avatars.com/api/?name=' || v_primeira_letra_loja || '&background=000000&color=ffffff&size=200&bold=true&format=svg';

  -- Gerar URL do avatar do usuário (primeira letra, verde no preto)
  v_primeira_letra_usuario := upper(substring(v_nome_usuario from 1 for 1));
  v_avatar_url_usuario := 'https://ui-avatars.com/api/?name=' || v_primeira_letra_usuario || '&background=000000&color=10b981&size=200&bold=true&format=svg';

  -- 1. Criar loja
  INSERT INTO public.lojas (
    nome,
    avatar_url,
    plano,
    status,
    data_renovacao
  ) VALUES (
    v_nome_loja,
    v_avatar_url_loja,
    'FREE',
    'INACTIVE', -- Começa inativa até ativar a conta
    NOW() + INTERVAL '30 days'
  )
  RETURNING id INTO v_loja_id;

  -- 2. Criar registro de usuário na tabela usuarios
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
    v_nome_usuario,
    'ADMIN',
    v_avatar_url_usuario,
    'handled_by_supabase_auth'
  );

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Logar erro mas não prevenir criação do usuário
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Criar trigger para quando auth user é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Cria automaticamente loja e registro de usuário quando um novo auth user é criado';

-- ============================================================================
-- PARTE 2: Auto-deletar loja e usuário quando auth user é deletado
-- ============================================================================

-- Função que deleta automaticamente loja e usuário
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_loja_id uuid;
BEGIN
  -- Buscar loja_id antes de deletar
  SELECT loja_id INTO v_loja_id
  FROM public.usuarios
  WHERE id = OLD.id;

  -- Deletar registro da tabela usuarios
  -- Isso vai deletar vendedores em cascata devido às foreign keys
  DELETE FROM public.usuarios WHERE id = OLD.id;

  -- Deletar a loja se existir
  -- Isso vai deletar vendas, metas, etc. em cascata devido às foreign keys
  IF v_loja_id IS NOT NULL THEN
    DELETE FROM public.lojas WHERE id = v_loja_id;
  END IF;

  RETURN OLD;
END;
$$;

-- Criar trigger para quando auth user é deletado
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_deleted();

COMMENT ON FUNCTION public.handle_auth_user_deleted() IS 'Deleta automaticamente loja e registro de usuário quando um auth user é deletado';

-- ============================================================================
-- PARTE 3: Garantir permissões corretas
-- ============================================================================

-- Garantir permissões no schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO postgres, service_role;

-- Garantir permissões nas tabelas
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETA
-- ============================================================================

-- Verificar se as funções foram criadas corretamente
SELECT
  'handle_new_user' as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'handle_new_user'
UNION ALL
SELECT
  'handle_auth_user_deleted' as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'handle_auth_user_deleted';

-- Verificar se os triggers foram criados corretamente
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name IN ('on_auth_user_created', 'on_auth_user_deleted')
ORDER BY trigger_name;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migration aplicada com sucesso!';
  RAISE NOTICE '🤖 Triggers configurados:';
  RAISE NOTICE '   - on_auth_user_created: Cria loja e usuário automaticamente';
  RAISE NOTICE '   - on_auth_user_deleted: Deleta loja e usuário automaticamente';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Próximos passos:';
  RAISE NOTICE '   1. Teste criando uma nova conta';
  RAISE NOTICE '   2. Verifique se a loja e o usuário foram criados automaticamente';
  RAISE NOTICE '   3. Teste deletando o usuário do Authentication';
  RAISE NOTICE '   4. Verifique se a loja e dados foram deletados automaticamente';
END $$;
