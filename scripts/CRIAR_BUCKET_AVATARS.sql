-- ============================================
-- SCRIPT PARA CRIAR BUCKET DE AVATARS NO SUPABASE
-- ============================================
-- Este script cria o bucket de storage para logos das lojas
-- e configura as políticas de acesso necessárias

-- ============================================
-- 1. CRIAR BUCKET (se não existir)
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- bucket público para que as URLs funcionem sem autenticação
  5242880, -- 5MB de limite
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. POLÍTICAS DE ACESSO - LEITURA PÚBLICA
-- ============================================
-- Permitir que qualquer pessoa visualize os avatars (necessário para URLs públicas)
DROP POLICY IF EXISTS "Avatars são públicos para leitura" ON storage.objects;
CREATE POLICY "Avatars são públicos para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================
-- 3. POLÍTICAS DE ACESSO - UPLOAD AUTENTICADO
-- ============================================
-- Permitir que usuários autenticados façam upload de avatars
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de avatars" ON storage.objects;
CREATE POLICY "Usuários autenticados podem fazer upload de avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- ============================================
-- 4. POLÍTICAS DE ACESSO - ATUALIZAÇÃO
-- ============================================
-- Permitir que usuários autenticados atualizem seus próprios avatars
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar avatars" ON storage.objects;
CREATE POLICY "Usuários autenticados podem atualizar avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- ============================================
-- 5. POLÍTICAS DE ACESSO - EXCLUSÃO
-- ============================================
-- Permitir que usuários autenticados deletem avatars
DROP POLICY IF EXISTS "Usuários autenticados podem deletar avatars" ON storage.objects;
CREATE POLICY "Usuários autenticados podem deletar avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- ============================================
-- 6. VERIFICAR CONFIGURAÇÃO
-- ============================================
-- Verificar se o bucket foi criado corretamente
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'avatars';

-- Verificar políticas criadas
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;
