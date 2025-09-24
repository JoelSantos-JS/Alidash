# Guia de Configuração - Salário Fixo

## Visão Geral
Este guia explica como configurar e usar a funcionalidade de salário fixo no sistema.

## 1. Configuração do Banco de Dados

### Passo 1: Criar a Tabela no Supabase
1. Acesse o painel do Supabase
2. Vá para "SQL Editor"
3. Execute o seguinte SQL:

```sql
-- CRIAR TABELA DE CONFIGURAÇÕES DE SALÁRIO
CREATE TABLE IF NOT EXISTS personal_salary_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    payment_day INTEGER NOT NULL CHECK (payment_day >= 1 AND payment_day <= 31), 
    is_active BOOLEAN DEFAULT true,
    is_taxable BOOLEAN DEFAULT true,
    tax_withheld DECIMAL(10,2) DEFAULT 0,
    source TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que cada usuário tenha apenas uma configuração
    UNIQUE(user_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_personal_salary_settings_user_id ON personal_salary_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_salary_settings_active ON personal_salary_settings(is_active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE personal_salary_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: usuários só podem ver/editar suas próprias configurações
CREATE POLICY "Users can view own salary settings" ON personal_salary_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own salary settings" ON personal_salary_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary settings" ON personal_salary_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary settings" ON personal_salary_settings
    FOR DELETE USING (auth.uid() = user_id);
```

### Passo 2: Verificar a Criação
Execute o script de verificação:
```bash
node create-salary-table.js
```

## 2. Como Usar a Funcionalidade

### Configurar Salário Fixo
1. Acesse o dashboard principal
2. Clique no botão "Salário Fixo" (ícone de engrenagem) ao lado do botão "Renda"
3. Preencha os campos:
   - **Valor do Salário**: Valor bruto mensal
   - **Descrição**: Ex: "Salário CLT", "Freelance Fixo"
   - **Dia do Pagamento**: Dia do mês (1-31)
   - **Fonte**: Ex: "Empresa XYZ"
   - **Salário Automático**: Ative para aplicação automática
   - **Tributável**: Se o salário sofre desconto de impostos
   - **Imposto Retido**: Valor descontado (se aplicável)
   - **Observações**: Notas adicionais

### Aplicar Salário Manualmente
1. Na tela de configuração de salário
2. Clique em "Aplicar Mês Atual"
3. O sistema verificará se já foi aplicado no mês
4. Se não foi aplicado, criará uma entrada de renda automaticamente

## 3. Funcionalidades Implementadas

### Componentes
- **SalarySettingsForm**: Formulário de configuração
- **Integração no Dashboard**: Botão de acesso rápido

### APIs
- `POST /api/personal/salary-settings`: Salvar configurações
- `GET /api/personal/salary-settings`: Buscar configurações
- `POST /api/personal/salary-automation`: Aplicar salário automaticamente
- `GET /api/personal/salary-automation`: Verificar se já foi aplicado

### Automação
- **salary-automation.ts**: Lógica para aplicação automática
- **Cálculo de valores líquidos**: Desconta impostos automaticamente
- **Verificação de duplicatas**: Evita aplicar o mesmo salário duas vezes

## 4. Segurança

### Row Level Security (RLS)
- Cada usuário só pode ver suas próprias configurações
- Políticas de segurança implementadas para SELECT, INSERT, UPDATE e DELETE

### Validações
- Valor do salário deve ser positivo
- Dia do pagamento entre 1 e 31
- Usuário autenticado obrigatório

## 5. Próximos Passos (Opcionais)

### Automação Completa
Para implementar aplicação automática mensal:
1. Configurar cron job ou scheduled function
2. Executar `applyFixedSalaries()` mensalmente
3. Enviar notificações de confirmação

### Relatórios
- Histórico de salários aplicados
- Comparativo mensal
- Projeções anuais

## 6. Troubleshooting

### Erro: Tabela não encontrada
- Execute o SQL de criação da tabela no Supabase

### Erro: Permissão negada
- Verifique se as políticas RLS foram criadas corretamente

### Salário não aparece
- Verifique se o usuário está autenticado
- Confirme se a configuração está ativa (`is_active = true`)

---

**Implementação concluída com sucesso!** ✅