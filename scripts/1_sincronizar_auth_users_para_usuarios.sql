-- Script para sincronizar auth.users (Supabase Auth) com a tabela usuarios
-- Os dados de pagamento ficam em auth.users.raw_user_meta_data

-- IMPORTANTE: Execute primeiro o script adicionar_campos_plano_usuario.sql
-- antes de executar este script!

-- 1. Copiar dados de auth.users.raw_user_meta_data para usuarios
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

-- 2. Verificar se a sincronização funcionou
SELECT
  u.id,
  u.email,
  u.nome,
  u.plano_ativo,
  u.data_expiracao,
  u.status,
  u.asaas_customer_id,
  l.nome as loja_nome,
  l.plano as loja_plano,
  l.status as loja_status,
  l.data_renovacao as loja_data_renovacao
FROM usuarios u
LEFT JOIN lojas l ON l.id = u.loja_id
WHERE u.email = 'shopmarcas@gmail.com';

-- 3. Criar função trigger para sincronizar automaticamente
CREATE OR REPLACE FUNCTION sincronizar_auth_user_para_usuarios()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar usuarios quando auth.users.raw_user_meta_data for modificado
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

-- 4. Criar trigger em auth.users
DROP TRIGGER IF EXISTS trigger_sync_auth_users_to_usuarios ON auth.users;

CREATE TRIGGER trigger_sync_auth_users_to_usuarios
  AFTER UPDATE OF raw_user_meta_data
  ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sincronizar_auth_user_para_usuarios();

-- 5. Forçar sincronização de todos os usuários ADMIN com suas lojas
DO $$
DECLARE
  usuario_record RECORD;
  plano_loja VARCHAR(20);
  status_loja VARCHAR(20);
BEGIN
  FOR usuario_record IN
    SELECT id, loja_id, plano_ativo, data_expiracao, status, papel, email
    FROM usuarios
    WHERE papel = 'ADMIN' AND loja_id IS NOT NULL
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

    RAISE NOTICE 'Sincronizado: % (%) - Plano: % → %, Status: % → %',
      usuario_record.email,
      usuario_record.id,
      usuario_record.plano_ativo,
      plano_loja,
      usuario_record.status,
      status_loja;
  END LOOP;
END $$;

-- 6. Comentários
COMMENT ON FUNCTION sincronizar_auth_user_para_usuarios() IS 'Sincroniza dados de auth.users.raw_user_meta_data para usuarios';

-- Fluxo completo:
-- 1. Webhook do Asaas atualiza auth.users.raw_user_meta_data
-- 2. Trigger sincroniza auth.users → usuarios (automático)
-- 3. Trigger sincroniza usuarios → lojas (automático, já criado)
-- 4. Sistema completamente sincronizado!

-- ============================================
-- COMO ATUALIZAR VIA WEBHOOK DO ASAAS
-- ============================================

-- Quando receber confirmação de pagamento do Asaas, atualize assim:

/*
-- Exemplo de como o webhook deve atualizar:
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
  'plano_ativo', 'semester',
  'data_expiracao', '2026-06-08T14:47:53.612Z',
  'status', 'ativo',
  'asaas_customer_id', 'cus_000007287348',
  'whatsapp', '(99) 99137-2552',
  'cpf', '03788100060',
  'billing_name', 'Joao da Silva Santos',
  'cep', '65930-000',
  'logradouro', 'Rua P08',
  'numero', '1',
  'complemento', 'Casa',
  'bairro', 'Pequia',
  'cidade', 'Açailândia',
  'estado', 'MA'
)
WHERE email = 'shopmarcas@gmail.com';

-- Os triggers farão o resto automaticamente!
*/

-- ============================================
-- TESTE A SINCRONIZAÇÃO
-- ============================================

-- Execute este comando para testar:
/*
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
  'plano_ativo', 'semester',
  'data_expiracao', '2026-06-08T14:47:53.612Z',
  'status', 'ativo'
)
WHERE email = 'shopmarcas@gmail.com';

-- Aguarde 1 segundo e verifique:
SELECT
  u.email,
  u.plano_ativo,
  u.status,
  u.data_expiracao,
  l.plano as loja_plano,
  l.status as loja_status
FROM usuarios u
LEFT JOIN lojas l ON l.id = u.loja_id
WHERE u.email = 'shopmarcas@gmail.com';
*/
