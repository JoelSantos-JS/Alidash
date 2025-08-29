// Carregar variáveis de ambiente
require('dotenv').config();

console.log('🔍 Verificando variáveis de ambiente...\n');

// Firebase
console.log('Firebase:');
console.log('- NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Definida' : '❌ Não definida');
console.log('- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Definida' : '❌ Não definida');
console.log('- NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Definida' : '❌ Não definida');
console.log('- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ Definida' : '❌ Não definida');
console.log('- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Definida' : '❌ Não definida');
console.log('- NEXT_PUBLIC_FIREBASE_APP_ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Definida' : '❌ Não definida');

console.log('\nSupabase:');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Definida' : '❌ Não definida');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Definida' : '❌ Não definida');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Definida' : '❌ Não definida');

console.log('\n📊 Resumo:');
const firebaseVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const supabaseVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

const firebaseCount = firebaseVars.filter(v => process.env[v]).length;
const supabaseCount = supabaseVars.filter(v => process.env[v]).length;

console.log(`Firebase: ${firebaseCount}/${firebaseVars.length} variáveis definidas`);
console.log(`Supabase: ${supabaseCount}/${supabaseVars.length} variáveis definidas`);

if (firebaseCount === 0 && supabaseCount === 0) {
  console.log('\n❌ Nenhuma variável de ambiente encontrada!');
  console.log('Verifique se o arquivo .env existe e contém as variáveis necessárias.');
} else if (firebaseCount < firebaseVars.length || supabaseCount < supabaseVars.length) {
  console.log('\n⚠️ Algumas variáveis estão faltando!');
} else {
  console.log('\n✅ Todas as variáveis de ambiente estão definidas!');
} 