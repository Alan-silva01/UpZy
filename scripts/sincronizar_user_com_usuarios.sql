-- Script para sincronizar dados da tabela auth.users para a tabela usuarios
-- E manter sincronização automática

-- IMPORTANTE: A tabela "user" que você mencionou é na verdade a tabela auth.users do Supabase
-- Vamos criar uma integração entre auth.users e a tabela usuarios

-- 1. Primeiro, vamos copiar os dados existentes de auth.users para usuarios
-- Atualizar apenas os campos que existem em auth.users (via raw_user_meta_data)

UPDATE usuarios u
SET
  plano_ativo = (au.raw_user_meta_data->>'plano_ativo')::VARCHAR,
  data_expiracao = (au.raw_user_meta_data->>'data_expiracao')::TIMESTAMPTZ,
  asaas_customer_id = au.raw_user_meta_data->>'asaas_customer_id',
  status = COALESCE((au.raw_user_meta_data->>'status')::VARCHAR, 'inativo'),
  whatsapp = au.raw_user_meta_data->>'whatsapp',
  cpf = au.raw_user_meta_data->>'cpf',
  billing_name = au.raw_user_meta_data->>'billing_name',
  cep = au.raw_user_meta_data->>'cep',
  logradouro = au.raw_user_meta_data->>'logradouro',
  numero = au.raw_user_meta_data->>'numero',
  complemento = au.raw_user_meta_data->>'complemento',
  bairro = au.raw_user_meta_data->>'bairro',
  cidade = au.raw_user_meta_data->>'cidade',
  estado = au.raw_user_meta_data->>'estado',
  updated_at = NOW()
FROM auth.users au
WHERE u.id = au.id
  AND u.email = au.email;

-- 2. Criar função para sincronizar auth.users com usuarios
CREATE OR REPLACE FUNCTION sincronizar_auth_user_com_usuarios()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar a tabela usuarios com dados de auth.users
  UPDATE usuarios
  SET
    plano_ativo = (NEW.raw_user_meta_data->>'plano_ativo')::VARCHAR,
    data_expiracao = (NEW.raw_user_meta_data->>'data_expiracao')::TIMESTAMPTZ,
    asaas_customer_id = NEW.raw_user_meta_data->>'asaas_customer_id',
    status = COALESCE((NEW.raw_user_meta_data->>'status')::VARCHAR, 'inativo'),
    whatsapp = NEW.raw_user_meta_data->>'whatsapp',
    cpf = NEW.raw_user_meta_data->>'cpf',
    billing_name = NEW.raw_user_meta_data->>'billing_name',
    cep = NEW.raw_user_meta_data->>'cep',
    logradouro = NEW.raw_user_meta_data->>'logradouro',
    numero = NEW.raw_user_meta_data->>'numero',
    complemento = NEW.raw_user_meta_data->>'complemento',
    bairro = NEW.raw_user_meta_data->>'bairro',
    cidade = NEW.raw_user_meta_data->>'cidade',
    estado = NEW.raw_user_meta_data->>'estado',
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar trigger em auth.users para sincronizar automaticamente
DROP TRIGGER IF EXISTS trigger_sync_auth_users_to_usuarios ON auth.users;

CREATE TRIGGER trigger_sync_auth_users_to_usuarios
  AFTER UPDATE OF raw_user_meta_data
  ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sincronizar_auth_user_com_usuarios();

-- 4. Verificar se a sincronização funcionou
-- Execute esta query para verificar:
-- SELECT
--   u.id,
--   u.email,
--   u.nome,
--   u.plano_ativo,
--   u.data_expiracao,
--   u.status,
--   u.asaas_customer_id
-- FROM usuarios u
-- WHERE u.email = 'shopmarcas@gmail.com';

-- 5. Agora vamos garantir que o trigger de sincronização com lojas continue funcionando
-- (o trigger já foi criado no script anterior, mas vamos garantir que está ativo)

-- Forçar sincronização imediata com lojas para todos os usuários ADMIN
DO $$
DECLARE
  usuario_record RECORD;
  plano_loja VARCHAR(20);
  status_loja VARCHAR(20);
BEGIN
  FOR usuario_record IN
    SELECT id, loja_id, plano_ativo, data_expiracao, status, papel
    FROM usuarios
    WHERE papel = 'ADMIN'
  LOOP
    -- Mapear plano
    CASE usuario_record.plano_ativo
      WHEN 'monthly' THEN plano_loja := 'STARTER';
      WHEN 'semester' THEN plano_loja := 'PRO';
      WHEN 'annual' THEN plano_loja := 'ENTERPRISE';
      ELSE plano_loja := 'FREE';
    END CASE;

    -- Determinar status
    IF usuario_record.status = 'ativo' AND (usuario_record.data_expiracao IS NULL OR usuario_record.data_expiracao > NOW()) THEN
      status_loja := 'ACTIVE';
    ELSIF usuario_record.status = 'ativo' AND usuario_record.data_expiracao <= NOW() THEN
      status_loja := 'PAST_DUE';
    ELSE
      status_loja := 'INACTIVE';
    END IF;

    -- Atualizar loja
    UPDATE lojas
    SET
      plano = plano_loja,
      status = status_loja,
      data_renovacao = usuario_record.data_expiracao,
      updated_at = NOW()
    WHERE id = usuario_record.loja_id;

    RAISE NOTICE 'Sincronizado usuário % com loja %: plano=%, status=%',
      usuario_record.id, usuario_record.loja_id, plano_loja, status_loja;
  END LOOP;
END $$;

-- 6. Comentários
COMMENT ON FUNCTION sincronizar_auth_user_com_usuarios() IS 'Sincroniza dados de pagamento de auth.users para usuarios';

-- Pronto! Agora o fluxo é:
-- 1. Webhook do Asaas atualiza auth.users.raw_user_meta_data
-- 2. Trigger sincroniza auth.users -> usuarios
-- 3. Trigger sincroniza usuarios -> lojas
-- Tudo automático!
