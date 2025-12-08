-- Script para sincronizar dados da tabela "user" customizada com a tabela "usuarios"
-- Assumindo que você tem uma tabela chamada "user" separada da auth.users

-- IMPORTANTE: Este script assume que você tem uma tabela customizada chamada "user"
-- com os campos de pagamento (plano_ativo, data_expiracao, etc.)

-- 1. Copiar dados da tabela "user" para "usuarios" pelo email
-- (assumindo que o email é a chave de ligação entre as duas tabelas)

UPDATE usuarios u
SET
  plano_ativo = usr.plano_ativo,
  data_expiracao = usr.data_expiracao,
  asaas_customer_id = usr.asaas_customer_id,
  status = COALESCE(usr.status, 'inativo'),
  whatsapp = usr.whatsapp,
  cpf = usr.cpf,
  billing_name = usr.billing_name,
  cep = usr.cep,
  logradouro = usr.logradouro,
  numero = usr.numero,
  complemento = usr.complemento,
  bairro = usr.bairro,
  cidade = usr.cidade,
  estado = usr.estado,
  updated_at = NOW()
FROM "user" usr
WHERE u.email = usr.email;

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
  l.status as loja_status
FROM usuarios u
LEFT JOIN lojas l ON l.id = u.loja_id
WHERE u.email = 'shopmarcas@gmail.com';

-- 3. Criar função trigger para sincronizar automaticamente quando "user" for atualizado
CREATE OR REPLACE FUNCTION sincronizar_user_para_usuarios()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar usuarios quando user for modificado
  UPDATE usuarios
  SET
    plano_ativo = NEW.plano_ativo,
    data_expiracao = NEW.data_expiracao,
    asaas_customer_id = NEW.asaas_customer_id,
    status = COALESCE(NEW.status, 'inativo'),
    whatsapp = NEW.whatsapp,
    cpf = NEW.cpf,
    billing_name = NEW.billing_name,
    cep = NEW.cep,
    logradouro = NEW.logradouro,
    numero = NEW.numero,
    complemento = NEW.complemento,
    bairro = NEW.bairro,
    cidade = NEW.cidade,
    estado = NEW.estado,
    updated_at = NOW()
  WHERE email = NEW.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger na tabela "user"
DROP TRIGGER IF EXISTS trigger_sync_user_to_usuarios ON "user";

CREATE TRIGGER trigger_sync_user_to_usuarios
  AFTER INSERT OR UPDATE OF plano_ativo, data_expiracao, status, asaas_customer_id
  ON "user"
  FOR EACH ROW
  EXECUTE FUNCTION sincronizar_user_para_usuarios();

-- 5. Forçar sincronização de todos os usuários existentes com suas lojas
DO $$
DECLARE
  usuario_record RECORD;
  plano_loja VARCHAR(20);
  status_loja VARCHAR(20);
BEGIN
  FOR usuario_record IN
    SELECT id, loja_id, plano_ativo, data_expiracao, status, papel
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

    RAISE NOTICE 'Usuário %: plano=% (%→%), status=% (%→%)',
      usuario_record.id,
      usuario_record.plano_ativo, plano_loja,
      usuario_record.status, status_loja;
  END LOOP;
END $$;

-- 6. Comentários
COMMENT ON FUNCTION sincronizar_user_para_usuarios() IS 'Sincroniza automaticamente dados da tabela user para usuarios';

-- Fluxo completo:
-- 1. Webhook do Asaas atualiza tabela "user"
-- 2. Trigger sincroniza "user" → "usuarios" (pelo email)
-- 3. Trigger sincroniza "usuarios" → "lojas" (já criado no script anterior)
-- 4. Tudo automático!

-- IMPORTANTE: Após executar este script, teste atualizando a tabela user:
/*
UPDATE "user"
SET
  plano_ativo = 'semester',
  data_expiracao = '2026-06-08 14:47:53.612+00',
  status = 'ativo'
WHERE email = 'shopmarcas@gmail.com';

-- Depois verifique se sincronizou:
SELECT * FROM usuarios WHERE email = 'shopmarcas@gmail.com';
SELECT l.* FROM lojas l JOIN usuarios u ON l.id = u.loja_id WHERE u.email = 'shopmarcas@gmail.com';
*/
