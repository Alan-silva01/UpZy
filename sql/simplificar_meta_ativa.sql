-- Simplificar sistema de meta ativa
-- Usar apenas o campo 'status' existente
-- ACTIVE = meta ativa, CANCELLED = desativada

-- Garantir que apenas uma meta pode estar ativa (status = 'ACTIVE') por loja
CREATE OR REPLACE FUNCTION garantir_unica_meta_ativa()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está ativando uma meta (status = 'ACTIVE')
  IF NEW.status = 'ACTIVE' THEN
    -- Desativar (CANCELLED) todas as outras metas da mesma loja
    UPDATE metas
    SET status = 'CANCELLED'
    WHERE loja_id = NEW.loja_id
    AND id != NEW.id
    AND status = 'ACTIVE';

    RAISE NOTICE 'Meta % ativada. Outras metas da loja % foram desativadas.', NEW.id, NEW.loja_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_garantir_unica_meta_ativa ON metas;
CREATE TRIGGER trigger_garantir_unica_meta_ativa
  BEFORE UPDATE OF status ON metas
  FOR EACH ROW
  WHEN (NEW.status = 'ACTIVE')
  EXECUTE FUNCTION garantir_unica_meta_ativa();

-- Criar trigger também para INSERT (quando criar meta já ativa)
DROP TRIGGER IF EXISTS trigger_garantir_unica_meta_ativa_insert ON metas;
CREATE TRIGGER trigger_garantir_unica_meta_ativa_insert
  BEFORE INSERT ON metas
  FOR EACH ROW
  WHEN (NEW.status = 'ACTIVE')
  EXECUTE FUNCTION garantir_unica_meta_ativa();

-- Remover campo 'ativa' se existir (limpeza)
ALTER TABLE metas DROP COLUMN IF EXISTS ativa;

-- Comentário
COMMENT ON COLUMN metas.status IS 'Status da meta: ACTIVE (meta ativa - apenas uma por loja), COMPLETED (concluída), CANCELLED (cancelada/desativada)';
