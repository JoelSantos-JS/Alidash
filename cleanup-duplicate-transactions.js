const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, deleteDoc, query, where } = require('firebase/firestore');

// Configuração do Firebase (substitua pelos seus dados)
const firebaseConfig = {
  // Adicione sua configuração do Firebase aqui
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupDuplicateTransactions(userId) {
  console.log(`🔍 Iniciando limpeza de transações duplicadas para o usuário: ${userId}`);
  
  try {
    // Buscar todas as transações da subcoleção
    const transactionsRef = collection(db, "user-data", userId, "transactions");
    const transactionsSnap = await getDocs(transactionsRef);
    
    if (transactionsSnap.empty) {
      console.log('📭 Nenhuma transação encontrada');
      return;
    }
    
    const transactions = [];
    const duplicateGroups = new Map();
    const toDelete = [];
    
    // Processar todas as transações
    transactionsSnap.forEach((doc) => {
      const transaction = {
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
      };
      
      transactions.push(transaction);
      
      // Gerar chave única para detectar duplicatas
      const date = transaction.date.toISOString().split('T')[0]; // YYYY-MM-DD
      const amount = transaction.amount?.toString() || '0';
      const description = transaction.description?.toLowerCase().trim() || '';
      const transactionKey = `${date}-${amount}-${description}`;
      
      if (!duplicateGroups.has(transactionKey)) {
        duplicateGroups.set(transactionKey, []);
      }
      duplicateGroups.get(transactionKey).push(transaction);
    });
    
    console.log(`📊 Total de transações encontradas: ${transactions.length}`);
    
    // Identificar duplicatas
    duplicateGroups.forEach((group, key) => {
      if (group.length > 1) {
        console.log(`🚫 Encontradas ${group.length} transações duplicadas para a chave: ${key}`);
        console.log('   Transações:', group.map(t => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          date: t.date.toISOString().split('T')[0]
        })));
        
        // Manter a primeira transação, marcar as outras para exclusão
        const [keep, ...duplicates] = group;
        toDelete.push(...duplicates);
      }
    });
    
    console.log(`🗑️ Total de transações duplicadas para exclusão: ${toDelete.length}`);
    
    if (toDelete.length === 0) {
      console.log('✅ Nenhuma transação duplicada encontrada');
      return;
    }
    
    // Confirmar exclusão
    console.log('\n⚠️ ATENÇÃO: As seguintes transações serão EXCLUÍDAS:');
    toDelete.forEach((transaction, index) => {
      console.log(`${index + 1}. ID: ${transaction.id} | ${transaction.description} | R$ ${transaction.amount} | ${transaction.date.toISOString().split('T')[0]}`);
    });
    
    // Aqui você pode adicionar uma confirmação manual se necessário
    // const readline = require('readline');
    // const rl = readline.createInterface({
    //   input: process.stdin,
    //   output: process.stdout
    // });
    // 
    // const answer = await new Promise(resolve => {
    //   rl.question('\nDeseja continuar com a exclusão? (y/N): ', resolve);
    // });
    // rl.close();
    // 
    // if (answer.toLowerCase() !== 'y') {
    //   console.log('❌ Operação cancelada pelo usuário');
    //   return;
    // }
    
    // Executar exclusões
    console.log('\n🗑️ Executando exclusões...');
    let deletedCount = 0;
    
    for (const transaction of toDelete) {
      try {
        const transactionRef = doc(db, "user-data", userId, "transactions", transaction.id);
        await deleteDoc(transactionRef);
        console.log(`✅ Excluída transação: ${transaction.id} - ${transaction.description}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Erro ao excluir transação ${transaction.id}:`, error);
      }
    }
    
    console.log(`\n🎉 Limpeza concluída! ${deletedCount} transações duplicadas foram removidas.`);
    console.log(`📊 Transações restantes: ${transactions.length - deletedCount}`);
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Função para listar todas as transações (para debug)
async function listAllTransactions(userId) {
  console.log(`📋 Listando todas as transações para o usuário: ${userId}`);
  
  try {
    const transactionsRef = collection(db, "user-data", userId, "transactions");
    const transactionsSnap = await getDocs(transactionsRef);
    
    if (transactionsSnap.empty) {
      console.log('📭 Nenhuma transação encontrada');
      return;
    }
    
    const transactions = [];
    transactionsSnap.forEach((doc) => {
      const transaction = {
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
      };
      transactions.push(transaction);
    });
    
    // Ordenar por data
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    console.log(`📊 Total de transações: ${transactions.length}\n`);
    
    transactions.forEach((transaction, index) => {
      console.log(`${index + 1}. ID: ${transaction.id}`);
      console.log(`   Descrição: ${transaction.description}`);
      console.log(`   Valor: R$ ${transaction.amount}`);
      console.log(`   Data: ${transaction.date.toISOString().split('T')[0]}`);
      console.log(`   Categoria: ${transaction.category}`);
      console.log(`   Tipo: ${transaction.type}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar transações:', error);
  }
}

// Exemplo de uso
// Substitua 'SEU_USER_ID' pelo ID do usuário real
const userId = process.argv[2] || 'SEU_USER_ID';

if (!userId || userId === 'SEU_USER_ID') {
  console.log('❌ Por favor, forneça o ID do usuário como argumento');
  console.log('Uso: node cleanup-duplicate-transactions.js <USER_ID>');
  process.exit(1);
}

// Executar limpeza
cleanupDuplicateTransactions(userId);

// Para listar transações (descomente se necessário)
// listAllTransactions(userId); 