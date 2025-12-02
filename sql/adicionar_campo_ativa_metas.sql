-- Adicionar campo 'ativa' na tabela metas
-- Este campo indica se a meta está ativa (apenas uma pode estar ativa por vez)

-- Adicionar a coluna
ALTER TABLE metas
ADD COLUMN IF NOT EXISTS ativa BOOLEAN NOT NULL DEFAULT false;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_metas_ativa ON metas(ativa) WHERE ativa = true;

-- Garantir que apenas uma meta pode estar ativa por loja
-- Desativar todas as metas ativas antes de ativar uma nova
CREATE OR REPLACE FUNCTION garantir_unica_meta_ativa()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está ativando uma meta (ativa = true)
  IF NEW.ativa = true THEN
    -- Desativar todas as outras metas da mesma loja
    UPDATE metas
    SET ativa = false
    WHERE loja_id = NEW.loja_id
    AND id != NEW.id
    AND ativa = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_garantir_unica_meta_ativa ON metas;
CREATE TRIGGER trigger_garantir_unica_meta_ativa
  BEFORE UPDATE OF ativa ON metas
  FOR EACH ROW
  WHEN (NEW.ativa = true)
  EXECUTE FUNCTION garantir_unica_meta_ativa();

-- Comentário
COMMENT ON COLUMN metas.ativa IS 'Indica se a meta está ativa. Apenas uma meta pode estar ativa por loja por vez.';
