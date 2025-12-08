-- Script FINAL para atualizar a estrutura de planos
-- Este script resolve o problema do constraint violado

-- ============================================
-- PASSO 1: REMOVER TODOS OS CONSTRAINTS EXISTENTES
-- ============================================

-- Listar todos os constraints da coluna plano
SELECT constraint_name
FROM information_schema.constraint_column_usage
WHERE table_name = 'lojas' AND column_name = 'plano';

-- Remover qualquer constraint que exista
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'lojas' AND constraint_type = 'CHECK'
  LOOP
    EXECUTE format('ALTER TABLE lojas DROP CONSTRAINT IF EXISTS %I', constraint_rec.constraint_name);
    RAISE NOTICE 'Removido constraint: %', constraint_rec.constraint_name;
  END LOOP;
END $$;

-- ============================================
-- PASSO 2: LIMPAR E NORMALIZAR DADOS
-- ============================================

-- Ver valores atuais
SELECT DISTINCT
  plano,
  LENGTH(plano) as tamanho,
  COUNT(*) OVER (PARTITION BY plano) as quantidade
FROM lojas
ORDER BY plano;

-- Limpar espaços extras
UPDATE lojas SET plano = TRIM(plano);

-- Normalizar valores
UPDATE lojas
SET plano = CASE
  WHEN UPPER(TRIM(plano)) = 'STARTER' THEN 'PRO - Mensal'
  WHEN UPPER(TRIM(plano)) = 'PRO' THEN 'PRO - Semestral'
  WHEN UPPER(TRIM(plano)) = 'ENTERPRISE' THEN 'PRO - Anual'
  WHEN UPPER(TRIM(plano)) = 'FREE' THEN 'FREE'

  -- Já no novo formato
  WHEN TRIM(plano) = 'PRO - Mensal' THEN 'PRO - Mensal'
  WHEN TRIM(plano) = 'PRO - Semestral' THEN 'PRO - Semestral'
  WHEN TRIM(plano) = 'PRO - Anual' THEN 'PRO - Anual'

  -- Qualquer coisa com "Mensal" no nome
  WHEN plano ILIKE '%mensal%' THEN 'PRO - Mensal'
  WHEN plano ILIKE '%semestral%' THEN 'PRO - Semestral'
  WHEN plano ILIKE '%anual%' THEN 'PRO - Anual'

  ELSE 'FREE'
END;

-- ============================================
-- PASSO 3: VERIFICAR SE TODOS OS VALORES SÃO VÁLIDOS
-- ============================================

-- Deve retornar ZERO linhas
SELECT
  id,
  nome,
  plano,
  '"' || plano || '"' as plano_com_aspas,
  LENGTH(plano) as tamanho
FROM lojas
WHERE plano NOT IN ('FREE', 'PRO - Mensal', 'PRO - Semestral', 'PRO - Anual');

-- Se a query acima retornar alguma linha, PARE e corrija manualmente antes de continuar!

-- ============================================
-- PASSO 4: ADICIONAR NOVO CONSTRAINT
-- ============================================

ALTER TABLE lojas
ADD CONSTRAINT lojas_plano_check
CHECK (plano IN ('FREE', 'PRO - Mensal', 'PRO - Semestral', 'PRO - Anual'));

-- ============================================
-- PASSO 5: VERIFICAR SUCESSO
-- ============================================

-- Ver distribuição dos planos
SELECT
  plano,
  status,
  COUNT(*) as total
FROM lojas
GROUP BY plano, status
ORDER BY plano, status;

-- Testar o constraint com um INSERT fictício (será revertido)
DO $$
BEGIN
  -- Teste 1: Valor válido (deve funcionar)
  BEGIN
    INSERT INTO lojas (nome, plano, status) VALUES ('Teste Valid', 'PRO - Mensal', 'ACTIVE');
    DELETE FROM lojas WHERE nome = 'Teste Valid';
    RAISE NOTICE '✓ Constraint permite valores válidos';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✗ ERRO ao inserir valor válido: %', SQLERRM;
  END;

  -- Teste 2: Valor inválido (deve falhar)
  BEGIN
    INSERT INTO lojas (nome, plano, status) VALUES ('Teste Invalid', 'PREMIUM', 'ACTIVE');
    DELETE FROM lojas WHERE nome = 'Teste Invalid';
    RAISE NOTICE '✗ ERRO: Constraint permitiu valor inválido!';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE '✓ Constraint bloqueia valores inválidos corretamente';
  END;
END $$;

-- ============================================
-- DOCUMENTAÇÃO
-- ============================================

COMMENT ON COLUMN lojas.plano IS 'Plano ativo da loja: FREE | PRO - Mensal | PRO - Semestral | PRO - Anual';

SELECT 'Migration completed successfully!' as status;
