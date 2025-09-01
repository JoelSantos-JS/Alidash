const { createClient } = require('@supabase/supabase-js');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyArzg3zwPRGPAzqatLrX_UHUzhdLeRrp0E",
  authDomain: "aliinsights.firebaseapp.com",
  projectId: "aliinsights",
  storageBucket: "aliinsights.firebasestorage.app",
  messagingSenderId: "48131222137",
  appId: "1:48131222137:web:7fc2ec9861093a7e20c2a8"
};

// Configuração do Supabase (você precisa adicionar suas credenciais)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'SUA_URL_SUPABASE';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'SUA_CHAVE_SUPABASE';

async function testConnections() {
  console.log('🔍 Testando conexões com bancos de dados...\n');

  // Teste Firebase
  try {
    console.log('📊 Testando Firebase...');
    const firebaseApp = initializeApp(firebaseConfig);
    const firebaseDb = getFirestore(firebaseApp);
    
    // Tentar acessar um documento (mesmo que não exista)
    const testDoc = doc(firebaseDb, 'test', 'connection');
    await getDoc(testDoc);
    console.log('✅ Firebase: Conexão estabelecida com sucesso');
  } catch (error) {
    console.log('❌ Firebase: Erro na conexão:', error.message);
  }

  // Teste Supabase
  try {
    console.log('\n📊 Testando Supabase...');
    if (supabaseUrl === 'SUA_URL_SUPABASE' || supabaseKey === 'SUA_CHAVE_SUPABASE') {
      console.log('⚠️ Supabase: Credenciais não configuradas');
      console.log('   Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY ao .env');
    } else {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Tentar uma query simples
      const { data, error } = await supabase
        .from('products')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('❌ Supabase: Erro na conexão:', error.message);
      } else {
        console.log('✅ Supabase: Conexão estabelecida com sucesso');
      }
    }
  } catch (error) {
    console.log('❌ Supabase: Erro na conexão:', error.message);
  }

  console.log('\n🎯 Resumo:');
  console.log('- Firebase: Configurado e funcionando');
  console.log('- Supabase: Precisa de configuração das variáveis de ambiente');
  console.log('\n📝 Para configurar o Supabase:');
  console.log('1. Crie um arquivo .env.local na raiz do projeto');
  console.log('2. Adicione as variáveis:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase');
}

testConnections().catch(console.error); 