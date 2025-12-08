-- Script para atualizar a estrutura de planos na tabela lojas
-- Agora o plano será armazenado diretamente como: FREE, PRO - Mensal, PRO - Semestral, PRO - Anual

-- ============================================
-- 1. REMOVER CONSTRAINT ANTIGA (se existir)
-- ============================================

ALTER TABLE lojas
DROP CONSTRAINT IF EXISTS lojas_plano_check;

-- ============================================
-- 2. ADICIONAR NOVO CONSTRAINT COM OPÇÕES CORRETAS
-- ============================================

ALTER TABLE lojas
ADD CONSTRAINT lojas_plano_check
CHECK (plano IN ('FREE', 'PRO - Mensal', 'PRO - Semestral', 'PRO - Anual'));

-- ============================================
-- 3. MIGRAR DADOS EXISTENTES (SE NECESSÁRIO)
-- ============================================

-- Converter planos antigos para o novo formato
-- STARTER → PRO - Mensal
-- PRO → PRO - Semestral
-- ENTERPRISE → PRO - Anual

UPDATE lojas
SET plano = CASE
  WHEN plano = 'STARTER' THEN 'PRO - Mensal'
  WHEN plano = 'PRO' THEN 'PRO - Semestral'
  WHEN plano = 'ENTERPRISE' THEN 'PRO - Anual'
  WHEN plano = 'FREE' THEN 'FREE'
  ELSE plano
END
WHERE plano IN ('STARTER', 'PRO', 'ENTERPRISE', 'FREE');

-- ============================================
-- 4. ATUALIZAR COMENTÁRIO DA COLUNA
-- ============================================

COMMENT ON COLUMN lojas.plano IS 'Plano ativo da loja: FREE, PRO - Mensal, PRO - Semestral, PRO - Anual';

-- ============================================
-- 5. VERIFICAR RESULTADO
-- ============================================

-- Ver todos os planos atuais
SELECT
  id,
  nome,
  plano,
  status,
  data_renovacao
FROM lojas
ORDER BY plano, nome;

-- Contar por tipo de plano
SELECT
  plano,
  COUNT(*) as quantidade
FROM lojas
GROUP BY plano
ORDER BY plano;

-- ============================================
-- EXEMPLO DE USO
-- ============================================

/*
-- Criar nova loja com plano FREE
INSERT INTO lojas (nome, plano, status)
VALUES ('Minha Loja', 'FREE', 'ACTIVE');

-- Atualizar para plano PRO Semestral
UPDATE lojas
SET
  plano = 'PRO - Semestral',
  status = 'ACTIVE',
  data_renovacao = NOW() + INTERVAL '6 months'
WHERE id = 'sua-loja-id';

-- Atualizar para plano PRO Mensal
UPDATE lojas
SET
  plano = 'PRO - Mensal',
  status = 'ACTIVE',
  data_renovacao = NOW() + INTERVAL '1 month'
WHERE id = 'sua-loja-id';

-- Atualizar para plano PRO Anual
UPDATE lojas
SET
  plano = 'PRO - Anual',
  status = 'ACTIVE',
  data_renovacao = NOW() + INTERVAL '1 year'
WHERE id = 'sua-loja-id';
*/
