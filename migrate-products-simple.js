// Carregar variáveis de ambiente
require('dotenv').config();

const https = require('https');
const http = require('http');

// Configuração
const API_BASE_URL = 'http://localhost:3000/api';
const SUPABASE_USER_ID = 'f06c3c27-5862-4332-96f2-d0f1e62bf9cc';

// Função fetch personalizada para Node.js
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Produtos reais do dashboard (baseado no código do page.tsx)
const realProducts = [
  {
    name: "iPhone 15 Pro",
    category: "Eletrônicos",
    supplier: "Apple Store",
    aliexpressLink: "",
    imageUrl: "",
    description: "Smartphone premium da Apple",
    notes: "Produto de alta demanda",
    trackingCode: "",
    purchaseEmail: "joeltere9@gmail.com",
    purchasePrice: 4500,
    shippingCost: 50,
    importTaxes: 200,
    packagingCost: 20,
    marketingCost: 100,
    otherCosts: 30,
    totalCost: 4900,
    sellingPrice: 5500,
    expectedProfit: 600,
    profitMargin: 12,
    quantity: 2,
    quantitySold: 1,
    status: "selling",
    purchaseDate: new Date(2024, 11, 5),
    roi: 57.9,
    actualProfit: 165,
    sales: []
  },
  {
    name: "MacBook Air M2",
    category: "Eletrônicos",
    supplier: "Apple Store",
    aliexpressLink: "",
    imageUrl: "",
    description: "Notebook ultraportátil",
    notes: "Excelente para trabalho",
    trackingCode: "",
    purchaseEmail: "joeltere9@gmail.com",
    purchasePrice: 6500,
    shippingCost: 80,
    importTaxes: 300,
    packagingCost: 30,
    marketingCost: 150,
    otherCosts: 50,
    totalCost: 7110,
    sellingPrice: 7800,
    expectedProfit: 690,
    profitMargin: 8.8,
    quantity: 1,
    quantitySold: 0,
    status: "purchased",
    purchaseDate: new Date(2024, 11, 10),
    roi: 10.6,
    actualProfit: 0,
    sales: []
  },
  {
    name: "AirPods Pro",
    category: "Acessórios",
    supplier: "Apple Store",
    aliexpressLink: "",
    imageUrl: "",
    description: "Fones de ouvido sem fio",
    notes: "Produto popular",
    trackingCode: "",
    purchaseEmail: "joeltere9@gmail.com",
    purchasePrice: 1200,
    shippingCost: 30,
    importTaxes: 60,
    packagingCost: 15,
    marketingCost: 50,
    otherCosts: 20,
    totalCost: 1375,
    sellingPrice: 1500,
    expectedProfit: 125,
    profitMargin: 8.3,
    quantity: 3,
    quantitySold: 1,
    status: "selling",
    purchaseDate: new Date(2024, 11, 15),
    roi: 10.4,
    actualProfit: 125,
    sales: []
  }
];

async function migrateProducts() {
  console.log('🚀 Iniciando migração de produtos reais...\n');

  try {
    console.log(`📦 ${realProducts.length} produtos para migrar:`);
    realProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - R$ ${product.purchasePrice} → R$ ${product.sellingPrice}`);
    });

    console.log('\n🔄 Migrando produtos para Supabase...');
    let migratedCount = 0;
    let errorCount = 0;

    for (const product of realProducts) {
      try {
        console.log(`📦 Migrando: ${product.name}`);
        
        const response = await fetch(`${API_BASE_URL}/products/create?user_id=${SUPABASE_USER_ID}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(product)
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ ${product.name} migrado com sucesso!`);
          console.log(`   Firebase: ${result.firebaseSuccess ? '✅' : '❌'}`);
          console.log(`   Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`);
          migratedCount++;
        } else {
          const errorText = await response.text();
          console.log(`❌ Erro ao migrar ${product.name}: ${response.status} - ${errorText}`);
          errorCount++;
        }

        // Aguardar um pouco entre as requisições
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`❌ Erro ao migrar ${product.name}:`, error.message);
        errorCount++;
      }
    }

    // Verificar produtos migrados
    console.log('\n🔍 Verificando produtos migrados...');
    const verifyResponse = await fetch(`${API_BASE_URL}/products/get?user_id=${SUPABASE_USER_ID}`);
    
    if (verifyResponse.ok) {
      const result = await verifyResponse.json();
      console.log(`✅ ${result.products?.length || 0} produtos encontrados na API`);
      
      if (result.products && result.products.length > 0) {
        result.products.forEach((product, index) => {
          console.log(`${index + 1}. ${product.name} (${product.category})`);
          console.log(`   Compra: R$ ${product.purchasePrice} | Venda: R$ ${product.sellingPrice}`);
        });
      }
    }

    console.log('\n📊 Resumo da migração:');
    console.log(`   Produtos para migrar: ${realProducts.length}`);
    console.log(`   Migrados com sucesso: ${migratedCount}`);
    console.log(`   Erros: ${errorCount}`);

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

// Executar migração
migrateProducts(); 