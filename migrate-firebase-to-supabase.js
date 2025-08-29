// Carregar variáveis de ambiente
require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const https = require('https');
const http = require('http');

// Configuração Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Configuração
const API_BASE_URL = 'http://localhost:3000/api';
const EMAIL = 'joeltere9@gmail.com';
const PASSWORD = '88127197';
const FIREBASE_UID = '1sAltLnRMgO3ZCYnh4zn9iFck0B3';
const SUPABASE_USER_ID = 'f06c3c27-5862-4332-96f2-d0f1e62bf9cc';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

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
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(jsonData),
            text: () => Promise.resolve(data)
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.reject(e),
            text: () => Promise.resolve(data)
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function migrateProducts() {
  console.log('🚀 Iniciando migração do Firebase para Supabase...\n');
  
  try {
    // 1. Fazer login no Firebase
    console.log('🔐 Fazendo login no Firebase...');
    await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
    console.log('✅ Login realizado com sucesso!');
    
    // 2. Buscar produtos do Firebase
    console.log('📋 Buscando produtos no Firebase...');
    const docRef = doc(db, "user-data", FIREBASE_UID);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('❌ Nenhum dado encontrado no Firebase');
      return;
    }
    
    const data = docSnap.data();
    const products = data.products || [];
    
    if (products.length === 0) {
      console.log('❌ Nenhum produto encontrado no Firebase');
      return;
    }
    
    console.log(`✅ ${products.length} produtos encontrados no Firebase\n`);
    
    // 3. Migrar cada produto para o Supabase
    console.log('🔄 Migrando produtos para Supabase...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`📦 Migrando ${i + 1}/${products.length}: ${product.name}`);
      
      try {
        // Preparar dados do produto para a API
        const productData = {
          name: product.name || 'Produto sem nome',
          category: product.category || 'Geral',
          supplier: product.supplier || 'N/A',
          aliexpressLink: product.aliexpressLink || '',
          imageUrl: product.imageUrl || '',
          description: product.description || '',
          notes: product.notes || '',
          trackingCode: product.trackingCode || '',
          purchaseEmail: product.purchaseEmail || 'joeltere9@gmail.com',
          purchasePrice: product.purchasePrice || 0,
          shippingCost: product.shippingCost || 0,
          importTaxes: product.importTaxes || 0,
          packagingCost: product.packagingCost || 0,
          marketingCost: product.marketingCost || 0,
          otherCosts: product.otherCosts || 0,
          sellingPrice: product.sellingPrice || 0,
          expectedProfit: product.expectedProfit || 0,
          profitMargin: product.profitMargin || 0,
          quantity: product.quantity || 1,
          status: product.status || 'purchased',
          createdAt: product.createdAt || new Date().toISOString(),
          updatedAt: product.updatedAt || new Date().toISOString()
        };
        
        // Enviar para a API
        const response = await fetch(`${API_BASE_URL}/products/create?user_id=${SUPABASE_USER_ID}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`   ✅ Migrado com sucesso! ID: ${result.id}`);
          successCount++;
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Erro: ${response.status} - ${errorText}`);
          errorCount++;
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao migrar: ${error.message}`);
        errorCount++;
      }
      
      console.log(''); // Linha em branco
    }
    
    // 4. Resumo final
    console.log('📊 Resumo da migração:');
    console.log('=' .repeat(40));
    console.log(`   Produtos encontrados: ${products.length}`);
    console.log(`   Migrados com sucesso: ${successCount}`);
    console.log(`   Erros: ${errorCount}`);
    console.log(`   Taxa de sucesso: ${((successCount / products.length) * 100).toFixed(1)}%`);
    
    if (successCount > 0) {
      console.log('\n🎉 Migração concluída!');
      console.log('💡 Agora você pode configurar o Supabase como banco principal.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
  }
}

// Executar migração
migrateProducts(); 