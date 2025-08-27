# Como Criar as Tabelas no Supabase

O problema é que as tabelas não existem no banco de dados Supabase. Aqui está o passo a passo para resolver:

## 1. Acesse o Supabase Dashboard

1. Vá para: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: **atyeakcunmhrzzpdcvxm**

## 2. Abra o SQL Editor

1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique em **New Query** para criar uma nova consulta

## 3. Execute o Script de Migração

1. Abra o arquivo `supabase-migration.sql` no seu projeto
2. **Copie TODO o conteúdo** do arquivo (são 507 linhas)
3. **Cole no SQL Editor** do Supabase
4. Clique em **Run** para executar o script

## 4. Verifique se as Tabelas foram Criadas

Após executar o script, você deve ver as seguintes tabelas criadas:

- ✅ `users` - Usuários do sistema
- ✅ `products` - Produtos
- ✅ `sales` - Vendas
- ✅ `revenues` - **Receitas (principal)**
- ✅ `expenses` - Despesas
- ✅ `transactions` - Transações
- ✅ `debts` - Dívidas
- ✅ `goals` - Metas
- ✅ `dreams` - Sonhos
- ✅ `bets` - Apostas

## 5. Teste a Conexão

Após criar as tabelas, execute no terminal:

```bash
node test-supabase.js
```

Você deve ver:
```
✅ Tabela users acessível: X registros
✅ Tabela revenues acessível: X registros
✅ Receita de teste inserida
🧹 Receita de teste removida
```

## 6. Teste na Aplicação

1. Acesse: http://localhost:3001
2. Vá para a página de **Receitas**
3. Clique em **Adicionar Nova Receita**
4. Preencha os dados e salve
5. A receita deve ser salva no Supabase!

## Problemas Comuns

### Se der erro de permissão:
1. Execute o script `disable-rls.sql` no SQL Editor
2. Teste novamente
3. Depois reabilite o RLS se necessário

### Se ainda não funcionar:
1. Verifique se todas as variáveis de ambiente estão corretas no `.env.local`
2. Reinicie o servidor de desenvolvimento
3. Verifique os logs do console para mais detalhes

## Resultado Final

Após seguir estes passos:
- ✅ Todas as tabelas estarão criadas no Supabase
- ✅ As receitas serão salvas no Supabase
- ✅ A sincronização dual (Firebase + Supabase) funcionará
- ✅ Os dados estarão seguros e organizados

---

**Importante**: Execute o script `supabase-migration.sql` COMPLETO no SQL Editor do Supabase. Não execute apenas partes do script.