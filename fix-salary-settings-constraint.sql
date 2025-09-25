-- Script para corrigir a constraint de chave estrangeira da tabela personal_salary_settings
-- O problema é que a constraint está referenciando auth.users(id) em vez de users(id)

-- 1. Primeiro, vamos remover a constraint existente
ALTER TABLE personal_salary_settings 
DROP CONSTRAINT IF EXISTS personal_salary_settings_user_id_fkey;

-- 2. Agora vamos adicionar a constraint correta que referencia a tabela users
ALTER TABLE personal_salary_settings 
ADD CONSTRAINT personal_salary_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. Verificar se a constraint foi criada corretamente
-- (Este comando é apenas informativo, pode ser executado separadamente)
-- SELECT constraint_name, table_name, column_name 
-- FROM information_schema.key_column_usage 
-- WHERE table_name = 'personal_salary_settings' AND constraint_name LIKE '%fkey%';

-- 4. Comentário para documentação
COMMENT ON CONSTRAINT personal_salary_settings_user_id_fkey ON personal_salary_settings 
IS 'Chave estrangeira que referencia a tabela users (não auth.users)';