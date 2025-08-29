const fs = require('fs');

// Configuração do Firebase
const firebaseConfig = `# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyArzg3zwPRGPAzqatLrX_UHUzhdLeRrp0E
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=aliinsights.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=aliinsights
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=aliinsights.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=48131222137
NEXT_PUBLIC_FIREBASE_APP_ID=1:48131222137:web:7fc2ec9861093a7e20c2a8
`;

try {
  // Ler o arquivo .env atual
  const envContent = fs.readFileSync('.env', 'utf8');
  
  // Verificar se as variáveis do Firebase já existem
  if (envContent.includes('NEXT_PUBLIC_FIREBASE_API_KEY')) {
    console.log('✅ Variáveis do Firebase já existem no arquivo .env');
  } else {
    // Adicionar as variáveis do Firebase
    const newContent = envContent + '\n' + firebaseConfig;
    fs.writeFileSync('.env', newContent);
    console.log('✅ Variáveis do Firebase adicionadas ao arquivo .env');
  }
} catch (error) {
  console.error('❌ Erro ao adicionar variáveis do Firebase:', error.message);
} 