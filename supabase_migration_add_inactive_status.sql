-- ============================================
-- MIGRATION: Adicionar status INACTIVE e planos STARTER/PRO
-- ============================================

-- 1. Remover constraints antigas
ALTER TABLE lojas DROP CONSTRAINT IF EXISTS lojas_status_check;
ALTER TABLE lojas DROP CONSTRAINT IF EXISTS lojas_plano_check;

-- 2. Adicionar nova constraint de status com INACTIVE incluído
ALTER TABLE lojas ADD CONSTRAINT lojas_status_check
  CHECK (status IN ('ACTIVE', 'INACTIVE', 'PAST_DUE'));

-- 3. Adicionar nova constraint de plano com STARTER e PRO incluídos
ALTER TABLE lojas ADD CONSTRAINT lojas_plano_check
  CHECK (plano IN ('FREE', 'STARTER', 'PRO', 'ENTERPRISE'));

-- 3. (Opcional) Atualizar lojas existentes para ACTIVE se necessário
-- Descomente a linha abaixo se quiser que todas as lojas existentes fiquem ativas
-- UPDATE lojas SET status = 'ACTIVE' WHERE status IS NULL OR status NOT IN ('ACTIVE', 'INACTIVE', 'PAST_DUE');

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se a constraint foi criada corretamente
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'lojas_status_check';

-- Verificar status das lojas
SELECT id, nome, status, plano FROM lojas;
