-- Adicionar coluna avatar_url na tabela lojas
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comentário
COMMENT ON COLUMN lojas.avatar_url IS 'URL do avatar/logo da loja (formato quadrado)';

-- Criar bucket de storage para avatars (caso não exista)
-- Execute este comando no painel do Supabase Storage:
-- Nome do bucket: avatars
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp
