-- Script SQL para adicionar campos de plano e billing na tabela usuarios
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar campos de plano à tabela usuarios (se não existirem)
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS plano_ativo VARCHAR(20),
ADD COLUMN IF NOT EXISTS data_expiracao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'inativo',
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14),
ADD COLUMN IF NOT EXISTS billing_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
ADD COLUMN IF NOT EXISTS logradouro VARCHAR(255),
ADD COLUMN IF NOT EXISTS numero VARCHAR(20),
ADD COLUMN IF NOT EXISTS complemento VARCHAR(100),
ADD COLUMN IF NOT EXISTS bairro VARCHAR(100),
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado VARCHAR(2);

-- 2. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_usuarios_plano_ativo ON usuarios(plano_ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_data_expiracao ON usuarios(data_expiracao);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_asaas_customer_id ON usuarios(asaas_customer_id);

-- 3. Adicionar constraint de check para plano_ativo
ALTER TABLE usuarios
DROP CONSTRAINT IF EXISTS check_plano_ativo;

ALTER TABLE usuarios
ADD CONSTRAINT check_plano_ativo
CHECK (plano_ativo IN ('monthly', 'semester', 'annual') OR plano_ativo IS NULL);

-- 4. Adicionar constraint de check para status
ALTER TABLE usuarios
DROP CONSTRAINT IF EXISTS check_status_usuario;

ALTER TABLE usuarios
ADD CONSTRAINT check_status_usuario
CHECK (status IN ('ativo', 'inativo', 'pendente') OR status IS NULL);

-- 5. Criar função trigger para sincronizar automaticamente plano com loja
CREATE OR REPLACE FUNCTION sincronizar_plano_com_loja()
RETURNS TRIGGER AS $$
DECLARE
  plano_loja VARCHAR(20);
  status_loja VARCHAR(20);
BEGIN
  -- Mapear plano do usuário para plano da loja
  CASE NEW.plano_ativo
    WHEN 'monthly' THEN plano_loja := 'STARTER';
    WHEN 'semester' THEN plano_loja := 'PRO';
    WHEN 'annual' THEN plano_loja := 'ENTERPRISE';
    ELSE plano_loja := 'FREE';
  END CASE;

  -- Determinar status da loja
  IF NEW.status = 'ativo' AND (NEW.data_expiracao IS NULL OR NEW.data_expiracao > NOW()) THEN
    status_loja := 'ACTIVE';
  ELSIF NEW.status = 'ativo' AND NEW.data_expiracao <= NOW() THEN
    status_loja := 'PAST_DUE';
  ELSE
    status_loja := 'INACTIVE';
  END IF;

  -- Atualizar loja apenas se for ADMIN
  IF NEW.papel = 'ADMIN' THEN
    UPDATE lojas
    SET
      plano = plano_loja,
      status = status_loja,
      data_renovacao = NEW.data_expiracao,
      updated_at = NOW()
    WHERE id = NEW.loja_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger que executa a sincronização automaticamente
DROP TRIGGER IF EXISTS trigger_sincronizar_plano ON usuarios;

CREATE TRIGGER trigger_sincronizar_plano
  AFTER INSERT OR UPDATE OF plano_ativo, data_expiracao, status
  ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION sincronizar_plano_com_loja();

-- 7. Comentários para documentação
COMMENT ON COLUMN usuarios.plano_ativo IS 'Plano ativo do usuário: monthly, semester ou annual';
COMMENT ON COLUMN usuarios.data_expiracao IS 'Data de expiração do plano atual';
COMMENT ON COLUMN usuarios.asaas_customer_id IS 'ID do cliente no sistema de pagamento Asaas';
COMMENT ON COLUMN usuarios.status IS 'Status da assinatura: ativo, inativo ou pendente';

-- 8. Verificar se há campos updated_at nas tabelas (necessário para o trigger)
ALTER TABLE lojas
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 9. Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_updated_at_usuarios ON usuarios;
CREATE TRIGGER trigger_atualizar_updated_at_usuarios
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_updated_at();

DROP TRIGGER IF EXISTS trigger_atualizar_updated_at_lojas ON lojas;
CREATE TRIGGER trigger_atualizar_updated_at_lojas
  BEFORE UPDATE ON lojas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_updated_at();

-- 10. Script completo!
-- Após executar, os planos serão sincronizados automaticamente
-- sempre que os campos plano_ativo, data_expiracao ou status forem atualizados
