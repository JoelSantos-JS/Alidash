# 📦 Formato Ideal para Criação de Produtos

## 🎯 Estrutura Completa do Produto

### ✅ Campos Obrigatórios

```typescript
{
  // Informações Básicas (OBRIGATÓRIOS)
  name: string,                    // Min: 3 caracteres
  category: string,                // Não pode ser string vazia
  supplier: string,                // Min: 2 caracteres
  
  // Preços e Custos (OBRIGATÓRIOS)
  purchasePrice: number,           // Preço de compra
  sellingPrice: number,            // Preço de venda
  quantity: number,                // Quantidade (padrão: 1)
  
  // Status e Data (OBRIGATÓRIOS)
  status: 'purchased' | 'shipping' | 'received' | 'selling' | 'sold',
  purchaseDate: Date,              // Data da compra
}
```

### 🔧 Campos Opcionais

```typescript
{
  // Links e Imagens
  aliexpressLink?: string,         // URL válida ou string vazia
  imageUrl?: string,               // URL válida ou string vazia
  images?: ProductImage[],         // Array de imagens múltiplas
  
  // Descrições
  description?: string,            // Descrição do produto
  notes?: string,                  // Observações adicionais
  
  // Rastreamento
  trackingCode?: string,           // Código de rastreio
  purchaseEmail?: string,          // Email usado na compra (deve ser válido)
  
  // Custos Adicionais
  shippingCost?: number,           // Custo de frete (padrão: 0)
  importTaxes?: number,            // Impostos de importação (padrão: 0)
  packagingCost?: number,          // Custo de embalagem (padrão: 0)
  marketingCost?: number,          // Custo de marketing (padrão: 0)
  otherCosts?: number,             // Outros custos (padrão: 0)
  
  // Controle de Vendas
  quantitySold?: number,           // Quantidade vendida (padrão: 0)
  sales?: Sale[],                  // Histórico de vendas (padrão: [])
}
```

## 📋 Categorias Disponíveis

```typescript
const categoryOptions = [
  "Eletrônicos",
  "Casa e Cozinha", 
  "Roupas e Acessórios",
  "Saúde e Beleza",
  "Brinquedos e Jogos",
  "Esportes e Lazer",
  "Automotivo",
  "Iluminação",
  "Áudio"
]
```

## 🏷️ Status Disponíveis

```typescript
const statusOptions = {
  purchased: 'Comprado',      // Produto foi comprado
  shipping: 'Em trânsito',    // Produto em transporte
  received: 'Recebido',       // Produto foi recebido
  selling: 'À venda',         // Produto está sendo vendido
  sold: 'Esgotado'           // Produto foi vendido
}
```

## 🖼️ Estrutura de Imagens

```typescript
interface ProductImage {
  id: string,
  url: string,                    // URL válida da imagem
  type: 'main' | 'gallery' | 'thumbnail',
  alt: string,                    // Texto alternativo
  created_at: string,             // Data de criação
  order?: number                  // Ordem de exibição
}
```

## 💰 Cálculos Automáticos

O sistema calcula automaticamente:

```typescript
{
  totalCost: number,              // Soma de todos os custos
  expectedProfit: number,         // sellingPrice - totalCost
  profitMargin: number,           // (expectedProfit / sellingPrice) * 100
  roi: number,                    // (expectedProfit / totalCost) * 100
  actualProfit: number            // expectedProfit * quantitySold
}
```

## 📝 Exemplo Completo - Formato Mínimo

```json
{
  "name": "Smartphone Samsung Galaxy A54",
  "category": "Eletrônicos",
  "supplier": "AliExpress Store ABC",
  "purchasePrice": 450.00,
  "sellingPrice": 650.00,
  "quantity": 1,
  "status": "purchased",
  "purchaseDate": "2024-01-15T10:30:00.000Z"
}
```

## 📝 Exemplo Completo - Formato Detalhado

```json
{
  "name": "Smartphone Samsung Galaxy A54 128GB",
  "category": "Eletrônicos",
  "supplier": "TechStore Global",
  "aliexpressLink": "https://aliexpress.com/item/1234567890",
  "imageUrl": "https://imgur.com/abc123.jpg",
  "description": "Smartphone Android com 128GB de armazenamento, câmera tripla 50MP",
  "notes": "Cor: Azul, Modelo: SM-A546B",
  "trackingCode": "BR123456789CN",
  "purchaseEmail": "compras@exemplo.com",
  
  "purchasePrice": 450.00,
  "shippingCost": 25.00,
  "importTaxes": 67.50,
  "packagingCost": 5.00,
  "marketingCost": 15.00,
  "otherCosts": 10.00,
  "sellingPrice": 650.00,
  
  "quantity": 2,
  "quantitySold": 0,
  "status": "shipping",
  "purchaseDate": "2024-01-15T10:30:00.000Z",
  
  "images": [
    {
      "id": "img1",
      "url": "https://imgur.com/main123.jpg",
      "type": "main",
      "alt": "Smartphone Samsung Galaxy A54 - Frente",
      "created_at": "2024-01-15T10:30:00.000Z",
      "order": 1
    }
  ],
  
  "sales": []
}
```

## ⚠️ Validações Importantes

### ❌ Evitar Erros Comuns

1. **Campo `category` vazio**: Use `undefined` ao invés de `""`
2. **URLs inválidas**: Certifique-se que URLs são válidas ou use `""`
3. **Email inválido**: Valide formato do email se fornecido
4. **Valores negativos**: Preços e custos devem ser ≥ 0
5. **Nome muito curto**: Mínimo 3 caracteres
6. **Supplier muito curto**: Mínimo 2 caracteres

### ✅ Boas Práticas

1. **Use categorias predefinidas** quando possível
2. **Forneça descrições detalhadas** para melhor controle
3. **Inclua todos os custos** para cálculo preciso de lucro
4. **Use códigos de rastreio** para acompanhamento
5. **Mantenha imagens organizadas** com tipos apropriados
6. **Defina status correto** conforme situação atual

## 🔄 Fluxo de Criação via API

```bash
POST /api/products/create?user_id={supabase_user_id}
Content-Type: application/json

{
  // Dados do produto conforme formato acima
}
```

## 📊 Métricas Calculadas

O sistema automaticamente calcula:

- **Total Cost**: Soma de todos os custos
- **Expected Profit**: Lucro esperado por unidade
- **Profit Margin**: Margem de lucro em percentual
- **ROI**: Retorno sobre investimento
- **Actual Profit**: Lucro real baseado em vendas

---

💡 **Dica**: Use o formulário da interface para validação automática ou siga este formato para integrações via API.