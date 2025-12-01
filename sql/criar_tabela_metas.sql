-- Tabela de Metas
-- Armazena as metas definidas pelo admin para a loja
-- A meta é dividida igualmente entre todos os vendedores ativos

CREATE TABLE IF NOT EXISTS metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  valor_total DECIMAL(10, 2) NOT NULL, -- Valor total da meta para toda a equipe
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED
  criado_por UUID REFERENCES usuarios(id), -- Admin que criou a meta
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT metas_valor_positivo CHECK (valor_total > 0),
  CONSTRAINT metas_datas_validas CHECK (data_fim > data_inicio),
  CONSTRAINT metas_status_valido CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED'))
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_metas_loja_id ON metas(loja_id);
CREATE INDEX IF NOT EXISTS idx_metas_status ON metas(status);
CREATE INDEX IF NOT EXISTS idx_metas_datas ON metas(data_inicio, data_fim);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION atualizar_timestamp_metas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_timestamp_metas
  BEFORE UPDATE ON metas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp_metas();

-- Comentários
COMMENT ON TABLE metas IS 'Metas definidas pelo admin para a equipe de vendas';
COMMENT ON COLUMN metas.valor_total IS 'Valor total da meta que será dividido entre os vendedores';
COMMENT ON COLUMN metas.status IS 'Status da meta: ACTIVE (ativa), COMPLETED (concluída), CANCELLED (cancelada)';

-- RLS (Row Level Security) - Opcional
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver metas da própria loja
CREATE POLICY "Usuarios veem metas da propria loja"
  ON metas
  FOR SELECT
  USING (
    loja_id IN (
      SELECT loja_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- Política: Apenas admins podem criar/editar metas
CREATE POLICY "Admins gerenciam metas"
  ON metas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND loja_id = metas.loja_id
      AND papel = 'ADMIN'
    )
  );
