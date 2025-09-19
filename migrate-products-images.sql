-- Migração para Sistema de Múltiplas Imagens em Produtos
-- Este script adiciona suporte a múltiplas imagens por produto
-- e migra os dados existentes do campo image_url

-- =====================================
-- 1. ADICIONAR CAMPO IMAGES
-- =====================================

-- Adicionar coluna images como JSONB para armazenar array de imagens
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Criar índice GIN para consultas eficientes no campo JSONB
CREATE INDEX IF NOT EXISTS idx_products_images ON products USING GIN (images);

-- =====================================
-- 2. MIGRAR DADOS EXISTENTES
-- =====================================

-- Migrar dados do campo image_url para o novo campo images
-- Cada image_url existente será convertida em um objeto de imagem
UPDATE products 
SET images = CASE 
  WHEN image_url IS NOT NULL AND image_url != '' THEN 
    jsonb_build_array(jsonb_build_object( 
      'id', concat('img_legacy_', id), 
      'url', image_url, 
      'type', 'main', 
      'alt', name,
      'created_at', created_at 
    )) 
  ELSE '[]'::jsonb 
END
WHERE images = '[]'::jsonb OR images IS NULL;

-- =====================================
-- 3. VERIFICAR MIGRAÇÃO
-- =====================================

-- Query para verificar os resultados da migração
SELECT 
  id,
  name,
  image_url,
  images,
  jsonb_array_length(images) as total_images
FROM products 
WHERE images != '[]'::jsonb
ORDER BY created_at DESC
LIMIT 10;

-- =====================================
-- 4. ESTRUTURA DO CAMPO IMAGES
-- =====================================

/*
Estrutura do campo images (JSONB Array):
[
  {
    "id": "img_unique_id_1",
    "url": "https://exemplo.com/imagem1.jpg",
    "type": "main|gallery|thumbnail",
    "alt": "Texto alternativo da imagem",
    "created_at": "2024-01-01T00:00:00Z",
    "order": 1
  },
  {
    "id": "img_unique_id_2",
    "url": "https://exemplo.com/imagem2.jpg",
    "type": "gallery",
    "alt": "Segunda imagem do produto",
    "created_at": "2024-01-01T00:00:00Z",
    "order": 2
  }
]

Tipos de imagem:
- main: Imagem principal do produto
- gallery: Imagens da galeria
- thumbnail: Miniaturas
*/

-- =====================================
-- 5. QUERIES ÚTEIS PARA TRABALHAR COM IMAGES
-- =====================================

-- Buscar produtos com imagens
-- SELECT * FROM products WHERE jsonb_array_length(images) > 0;

-- Buscar produtos sem imagens
-- SELECT * FROM products WHERE images = '[]'::jsonb;

-- Buscar produtos por tipo de imagem
-- SELECT * FROM products WHERE images @> '[{"type": "main"}]';

-- Contar total de imagens por produto
-- SELECT name, jsonb_array_length(images) as total_images FROM products;

-- Extrair URLs de todas as imagens
-- SELECT name, jsonb_path_query_array(images, '$[*].url') as image_urls FROM products;

-- =====================================
-- 6. FUNÇÕES AUXILIARES (OPCIONAL)
-- =====================================

-- Função para adicionar uma nova imagem a um produto
CREATE OR REPLACE FUNCTION add_product_image(
  product_id UUID,
  image_url TEXT,
  image_type TEXT DEFAULT 'gallery',
  alt_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  new_image JSONB;
  current_images JSONB;
BEGIN
  -- Buscar imagens atuais
  SELECT images INTO current_images FROM products WHERE id = product_id;
  
  IF current_images IS NULL THEN
    current_images := '[]'::jsonb;
  END IF;
  
  -- Criar novo objeto de imagem
  new_image := jsonb_build_object(
    'id', concat('img_', extract(epoch from now())::bigint, '_', floor(random() * 1000)::int),
    'url', image_url,
    'type', image_type,
    'alt', COALESCE(alt_text, (SELECT name FROM products WHERE id = product_id)),
    'created_at', now(),
    'order', jsonb_array_length(current_images) + 1
  );
  
  -- Adicionar nova imagem ao array
  UPDATE products 
  SET images = current_images || new_image
  WHERE id = product_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Função para remover uma imagem de um produto
CREATE OR REPLACE FUNCTION remove_product_image(
  product_id UUID,
  image_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE products 
  SET images = (
    SELECT jsonb_agg(img)
    FROM jsonb_array_elements(images) AS img
    WHERE img->>'id' != image_id
  )
  WHERE id = product_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 7. COMENTÁRIOS E OBSERVAÇÕES
-- =====================================

/*
VANTAGENS DO NOVO SISTEMA:
1. Suporte a múltiplas imagens por produto
2. Metadados ricos para cada imagem (tipo, alt, ordem)
3. Flexibilidade para diferentes tipos de imagem
4. Consultas eficientes com índices GIN
5. Compatibilidade com dados existentes

COMPATIBILIDADE:
- O campo image_url original é mantido para compatibilidade
- Dados existentes são migrados automaticamente
- Aplicação pode usar ambos os campos durante transição

PRÓXIMOS PASSOS:
1. Executar este script no Supabase
2. Atualizar tipos TypeScript
3. Modificar componentes React para suportar múltiplas imagens
4. Implementar upload de múltiplas imagens
5. Gradualmente deprecar o campo image_url
*/

COMMIT;