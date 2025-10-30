// Script para debugar autenticação
console.log('🔍 Verificando autenticação...');

// Simular o que acontece na página
if (typeof window !== 'undefined') {
  // Verificar se há dados de autenticação no localStorage
  const authData = localStorage.getItem('supabase.auth.token');
  console.log('🔐 Dados de auth no localStorage:', authData ? 'Presente' : 'Ausente');
  
  // Verificar cookies
  console.log('🍪 Cookies:', document.cookie);
  
  // Verificar se o usuário está logado
  console.log('👤 User object:', window.user || 'Não definido');
} else {
  console.log('❌ Não está no browser');
}

// Testar chamada para API de auth
async function testAuth() {
  try {
    const response = await fetch('/api/auth/user');
    console.log('📊 Status auth API:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dados do usuário:', data);
    } else {
      console.log('❌ Erro na auth API:', await response.text());
    }
  } catch (error) {
    console.log('❌ Erro ao testar auth:', error.message);
  }
}

testAuth();