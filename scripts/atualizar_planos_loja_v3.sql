-- Script para atualizar a estrutura de planos na tabela lojas
-- Versão 3: Com limpeza de espaços e caracteres invisíveis

-- ============================================
-- 1. VERIFICAR VALORES ATUAIS (com espaços visíveis)
-- ============================================

SELECT
  plano,
  LENGTH(plano) as comprimento,
  COUNT(*) as quantidade
FROM lojas
GROUP BY plano
ORDER BY plano;

-- ============================================
-- 2. LIMPAR E MIGRAR DADOS
-- ============================================

-- Primeiro, limpar espaços extras de todos os registros
UPDATE lojas
SET plano = TRIM(plano);

-- Agora converter para o novo formato
UPDATE lojas
SET plano = CASE
  -- Mapeamento dos planos antigos (com trim para garantir)
  WHEN TRIM(UPPER(plano)) = 'STARTER' THEN 'PRO - Mensal'
  WHEN TRIM(UPPER(plano)) = 'PRO' THEN 'PRO - Semestral'
  WHEN TRIM(UPPER(plano)) = 'ENTERPRISE' THEN 'PRO - Anual'
  WHEN TRIM(UPPER(plano)) = 'FREE' THEN 'FREE'

  -- Se já estiver no novo formato, normalizar
  WHEN TRIM(plano) LIKE 'PRO - Mensal%' OR TRIM(plano) LIKE '%Mensal' THEN 'PRO - Mensal'
  WHEN TRIM(plano) LIKE 'PRO - Semestral%' OR TRIM(plano) LIKE '%Semestral' THEN 'PRO - Semestral'
  WHEN TRIM(plano) LIKE 'PRO - Anual%' OR TRIM(plano) LIKE '%Anual' THEN 'PRO - Anual'

  -- Default para FREE
  ELSE 'FREE'
END;

-- ============================================
-- 3. VERIFICAR SE TODOS OS VALORES SÃO VÁLIDOS
-- ============================================

-- Esta query deve retornar apenas: FREE, PRO - Mensal, PRO - Semestral, PRO - Anual
SELECT
  plano,
  LENGTH(plano) as comprimento,
  COUNT(*) as quantidade
FROM lojas
GROUP BY plano
ORDER BY plano;

-- Verificar se há algum valor que NÃO está no formato esperado
SELECT
  id,
  nome,
  plano,
  LENGTH(plano) as comprimento
FROM lojas
WHERE plano NOT IN ('FREE', 'PRO - Mensal', 'PRO - Semestral', 'PRO - Anual');

-- ============================================
-- 4. REMOVER CONSTRAINT ANTIGA
-- ============================================

ALTER TABLE lojas
DROP CONSTRAINT IF EXISTS lojas_plano_check;

-- ============================================
-- 5. ADICIONAR NOVO CONSTRAINT
-- ============================================

ALTER TABLE lojas
ADD CONSTRAINT lojas_plano_check
CHECK (plano IN ('FREE', 'PRO - Mensal', 'PRO - Semestral', 'PRO - Anual'));

-- ============================================
-- 6. ATUALIZAR COMENTÁRIO
-- ============================================

COMMENT ON COLUMN lojas.plano IS 'Plano ativo da loja: FREE, PRO - Mensal, PRO - Semestral, PRO - Anual';

-- ============================================
-- 7. RESULTADO FINAL
-- ============================================

SELECT
  plano,
  status,
  COUNT(*) as quantidade
FROM lojas
GROUP BY plano, status
ORDER BY plano, status;

-- ============================================
-- IMPORTANTE: COMO ATUALIZAR PLANOS VIA WEBHOOK
-- ============================================

/*
Sempre use exatamente estes valores (case-sensitive):
- 'FREE'
- 'PRO - Mensal'
- 'PRO - Semestral'
- 'PRO - Anual'

Exemplo:

UPDATE lojas
SET
  plano = 'PRO - Semestral',
  status = 'ACTIVE',
  data_renovacao = NOW() + INTERVAL '6 months'
WHERE id = 'sua-loja-id';
*/
