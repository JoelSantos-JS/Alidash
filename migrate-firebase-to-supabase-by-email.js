// Carregar variáveis de ambiente
require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs } = require('firebase/firestore');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!firebaseConfig.apiKey || !supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const firebaseApp = initializeApp(firebaseConfig);
const firebaseDb = getFirestore(firebaseApp);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateFirebaseToSupabaseByEmail() {
  console.log('🚀 Iniciando migração Firebase → Supabase por email...\n');

  try {
    // 1. Buscar todos os usuários no Firebase
    console.log('📋 Buscando usuários no Firebase...');
    const usersCollection = collection(firebaseDb, 'user-data');
    const usersSnapshot = await getDocs(usersCollection);
    
    const firebaseUsers = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      firebaseUsers.push({
        firebaseUid: doc.id,
        email: userData.email || '',
        name: userData.name || userData.displayName || '',
        avatarUrl: userData.avatarUrl || userData.photoURL || '',
        accountType: userData.accountType || 'personal',
        products: userData.products || [],
        revenues: userData.revenues || [],
        expenses: userData.expenses || [],
        transactions: userData.transactions || [],
        dreams: userData.dreams || [],
        bets: userData.bets || [],
        goals: userData.goals || [],
        debts: userData.debts || [],
        createdAt: userData.createdAt || new Date(),
        updatedAt: userData.updatedAt || new Date()
      });
    });

    console.log(`✅ ${firebaseUsers.length} usuários encontrados no Firebase`);

    if (firebaseUsers.length === 0) {
      console.log('ℹ️ Nenhum usuário encontrado no Firebase');
      return;
    }

    let totalUsersMigrated = 0;
    let totalProductsMigrated = 0;
    let totalRevenuesMigrated = 0;
    let totalExpensesMigrated = 0;
    let totalTransactionsMigrated = 0;
    let totalDreamsMigrated = 0;
    let totalBetsMigrated = 0;
    let totalGoalsMigrated = 0;
    let totalDebtsMigrated = 0;

    // 2. Para cada usuário do Firebase, migrar para Supabase
    for (const firebaseUser of firebaseUsers) {
      console.log(`\n👤 Migrando usuário: ${firebaseUser.name || firebaseUser.email || firebaseUser.firebaseUid}`);
      
      // Verificar se o usuário já existe no Supabase pelo email
      const { data: existingSupabaseUser, error: userCheckError } = await supabase
        .from('users')
        .select('id, firebase_uid, email, name')
        .eq('email', firebaseUser.email)
        .single();

      let supabaseUserId;

      if (userCheckError && userCheckError.code === 'PGRST116') {
        // Usuário não existe no Supabase, vamos criar
        console.log('   ➕ Criando usuário no Supabase...');
        
        const { data: newSupabaseUser, error: createUserError } = await supabase
          .from('users')
          .insert({
            firebase_uid: firebaseUser.firebaseUid,
            email: firebaseUser.email,
            name: firebaseUser.name,
            avatar_url: firebaseUser.avatarUrl,
            account_type: firebaseUser.accountType,
            created_at: firebaseUser.createdAt?.toDate?.() || new Date(firebaseUser.createdAt) || new Date(),
            updated_at: firebaseUser.updatedAt?.toDate?.() || new Date(firebaseUser.updatedAt) || new Date()
          })
          .select()
          .single();

        if (createUserError) {
          console.log(`   ❌ Erro ao criar usuário no Supabase: ${createUserError.message}`);
          continue;
        }

        supabaseUserId = newSupabaseUser.id;
        console.log(`   ✅ Usuário criado no Supabase: ${supabaseUserId}`);
        totalUsersMigrated++;
      } else if (userCheckError) {
        console.log(`   ❌ Erro ao verificar usuário no Supabase: ${userCheckError.message}`);
        continue;
      } else {
        // Usuário já existe no Supabase
        supabaseUserId = existingSupabaseUser.id;
        
        // Atualizar Firebase UID se não estiver definido
        if (!existingSupabaseUser.firebase_uid) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ firebase_uid: firebaseUser.firebaseUid })
            .eq('id', supabaseUserId);
          
          if (updateError) {
            console.log(`   ⚠️ Erro ao atualizar Firebase UID: ${updateError.message}`);
          } else {
            console.log(`   🔄 Firebase UID atualizado: ${firebaseUser.firebaseUid}`);
          }
        }
        
        console.log(`   ✅ Usuário já existe no Supabase: ${supabaseUserId}`);
      }

      // 3. Migrar produtos
      const products = firebaseUser.products || [];
      console.log(`   📦 ${products.length} produtos para migrar`);
      
      for (const product of products) {
        try {
          // Verificar se o produto já existe no Supabase
          const { data: existingProduct, error: productCheckError } = await supabase
            .from('products')
            .select('id')
            .eq('user_id', supabaseUserId)
            .eq('name', product.name)
            .single();

          if (productCheckError && productCheckError.code === 'PGRST116') {
            // Produto não existe, vamos criar
            const supabaseProduct = {
              user_id: supabaseUserId,
              name: product.name || '',
              category: product.category || '',
              supplier: product.supplier || '',
              aliexpress_link: product.aliexpressLink || '',
              image_url: product.imageUrl || '',
              description: product.description || '',
              notes: product.notes || '',
              tracking_code: product.trackingCode || '',
              purchase_email: product.purchaseEmail || '',
              purchase_price: parseFloat(product.purchasePrice) || 0,
              shipping_cost: parseFloat(product.shippingCost) || 0,
              import_taxes: parseFloat(product.importTaxes) || 0,
              packaging_cost: parseFloat(product.packagingCost) || 0,
              marketing_cost: parseFloat(product.marketingCost) || 0,
              other_costs: parseFloat(product.otherCosts) || 0,
              selling_price: parseFloat(product.sellingPrice) || 0,
              expected_profit: parseFloat(product.expectedProfit) || 0,
              profit_margin: parseFloat(product.profitMargin) || 0,
              quantity: parseInt(product.quantity) || 1,
              quantity_sold: parseInt(product.quantitySold) || 0,
              status: product.status || 'purchased',
              purchase_date: product.purchaseDate?.toDate?.() || new Date(product.purchaseDate) || new Date(),
              roi: parseFloat(product.roi) || 0,
              actual_profit: parseFloat(product.actualProfit) || 0,
              days_to_sell: product.daysToSell || null
            };

            const { error: insertError } = await supabase
              .from('products')
              .insert(supabaseProduct);

            if (insertError) {
              console.log(`   ❌ Erro ao migrar produto "${product.name}": ${insertError.message}`);
            } else {
              console.log(`   ✅ Produto migrado: ${product.name}`);
              totalProductsMigrated++;
            }
          } else if (productCheckError) {
            console.log(`   ❌ Erro ao verificar produto "${product.name}": ${productCheckError.message}`);
          } else {
            console.log(`   ℹ️ Produto já existe: ${product.name}`);
          }
        } catch (error) {
          console.log(`   ❌ Erro ao processar produto "${product.name}": ${error.message}`);
        }
      }

      // 4. Migrar receitas
      const revenues = firebaseUser.revenues || [];
      console.log(`   💰 ${revenues.length} receitas para migrar`);
      
      for (const revenue of revenues) {
        try {
          const supabaseRevenue = {
            user_id: supabaseUserId,
            date: revenue.date?.toDate?.() || new Date(revenue.date) || new Date(),
            time: revenue.time || null,
            description: revenue.description || '',
            amount: parseFloat(revenue.amount) || 0,
            category: revenue.category || '',
            source: revenue.source || 'other',
            notes: revenue.notes || '',
            product_id: revenue.productId || null
          };

          const { error: insertError } = await supabase
            .from('revenues')
            .insert(supabaseRevenue);

          if (insertError) {
            console.log(`   ❌ Erro ao migrar receita "${revenue.description}": ${insertError.message}`);
          } else {
            console.log(`   ✅ Receita migrada: ${revenue.description}`);
            totalRevenuesMigrated++;
          }
        } catch (error) {
          console.log(`   ❌ Erro ao processar receita "${revenue.description}": ${error.message}`);
        }
      }

      // 5. Migrar despesas
      const expenses = firebaseUser.expenses || [];
      console.log(`   💸 ${expenses.length} despesas para migrar`);
      
      for (const expense of expenses) {
        try {
          const supabaseExpense = {
            user_id: supabaseUserId,
            date: expense.date?.toDate?.() || new Date(expense.date) || new Date(),
            time: expense.time || null,
            description: expense.description || '',
            amount: parseFloat(expense.amount) || 0,
            category: expense.category || '',
            type: expense.type || 'other',
            supplier: expense.supplier || '',
            notes: expense.notes || '',
            product_id: expense.productId || null
          };

          const { error: insertError } = await supabase
            .from('expenses')
            .insert(supabaseExpense);

          if (insertError) {
            console.log(`   ❌ Erro ao migrar despesa "${expense.description}": ${insertError.message}`);
          } else {
            console.log(`   ✅ Despesa migrada: ${expense.description}`);
            totalExpensesMigrated++;
          }
        } catch (error) {
          console.log(`   ❌ Erro ao processar despesa "${expense.description}": ${error.message}`);
        }
      }

      // 6. Migrar transações
      const transactions = firebaseUser.transactions || [];
      console.log(`   🔄 ${transactions.length} transações para migrar`);
      
      for (const transaction of transactions) {
        try {
          const supabaseTransaction = {
            user_id: supabaseUserId,
            date: transaction.date?.toDate?.() || new Date(transaction.date) || new Date(),
            description: transaction.description || '',
            amount: parseFloat(transaction.amount) || 0,
            type: transaction.type || 'expense',
            category: transaction.category || '',
            subcategory: transaction.subcategory || '',
            payment_method: transaction.paymentMethod || null,
            status: transaction.status || 'completed',
            notes: transaction.notes || '',
            tags: transaction.tags || [],
            product_id: transaction.productId || null,
            is_installment: transaction.isInstallment || false,
            installment_info: transaction.installmentInfo || null
          };

          const { error: insertError } = await supabase
            .from('transactions')
            .insert(supabaseTransaction);

          if (insertError) {
            console.log(`   ❌ Erro ao migrar transação "${transaction.description}": ${insertError.message}`);
          } else {
            console.log(`   ✅ Transação migrada: ${transaction.description}`);
            totalTransactionsMigrated++;
          }
        } catch (error) {
          console.log(`   ❌ Erro ao processar transação "${transaction.description}": ${error.message}`);
        }
      }

      // 7. Migrar sonhos
      const dreams = firebaseUser.dreams || [];
      console.log(`   🌟 ${dreams.length} sonhos para migrar`);
      
      for (const dream of dreams) {
        try {
          const supabaseDream = {
            user_id: supabaseUserId,
            title: dream.title || '',
            description: dream.description || '',
            type: dream.type || 'personal',
            status: dream.status || 'planning',
            target_amount: parseFloat(dream.targetAmount) || 0,
            current_amount: parseFloat(dream.currentAmount) || 0,
            target_date: dream.targetDate?.toDate?.() || new Date(dream.targetDate) || null,
            priority: dream.priority || 'medium',
            notes: dream.notes || ''
          };

          const { error: insertError } = await supabase
            .from('dreams')
            .insert(supabaseDream);

          if (insertError) {
            console.log(`   ❌ Erro ao migrar sonho "${dream.title}": ${insertError.message}`);
          } else {
            console.log(`   ✅ Sonho migrado: ${dream.title}`);
            totalDreamsMigrated++;
          }
        } catch (error) {
          console.log(`   ❌ Erro ao processar sonho "${dream.title}": ${error.message}`);
        }
      }

      // 8. Migrar apostas
      const bets = firebaseUser.bets || [];
      console.log(`   🎲 ${bets.length} apostas para migrar`);
      
      for (const bet of bets) {
        try {
          const supabaseBet = {
            user_id: supabaseUserId,
            description: bet.description || '',
            type: bet.type || 'single',
            status: bet.status || 'pending',
            stake: parseFloat(bet.stake) || 0,
            odds: parseFloat(bet.odds) || 0,
            potential_win: parseFloat(bet.potentialWin) || 0,
            actual_win: parseFloat(bet.actualWin) || 0,
            date: bet.date?.toDate?.() || new Date(bet.date) || new Date(),
            notes: bet.notes || ''
          };

          const { error: insertError } = await supabase
            .from('bets')
            .insert(supabaseBet);

          if (insertError) {
            console.log(`   ❌ Erro ao migrar aposta "${bet.description}": ${insertError.message}`);
          } else {
            console.log(`   ✅ Aposta migrada: ${bet.description}`);
            totalBetsMigrated++;
          }
        } catch (error) {
          console.log(`   ❌ Erro ao processar aposta "${bet.description}": ${error.message}`);
        }
      }

      // 9. Migrar metas
      const goals = firebaseUser.goals || [];
      console.log(`   🎯 ${goals.length} metas para migrar`);
      
      for (const goal of goals) {
        try {
          const supabaseGoal = {
            user_id: supabaseUserId,
            title: goal.title || '',
            description: goal.description || '',
            category: goal.category || 'financial',
            type: goal.type || 'savings',
            target_value: parseFloat(goal.targetValue) || 0,
            current_value: parseFloat(goal.currentValue) || 0,
            unit: goal.unit || 'BRL',
            priority: goal.priority || 'medium',
            status: goal.status || 'active',
            target_date: goal.targetDate?.toDate?.() || new Date(goal.targetDate) || null,
            notes: goal.notes || ''
          };

          const { error: insertError } = await supabase
            .from('goals')
            .insert(supabaseGoal);

          if (insertError) {
            console.log(`   ❌ Erro ao migrar meta "${goal.title}": ${insertError.message}`);
          } else {
            console.log(`   ✅ Meta migrada: ${goal.title}`);
            totalGoalsMigrated++;
          }
        } catch (error) {
          console.log(`   ❌ Erro ao processar meta "${goal.title}": ${error.message}`);
        }
      }

      // 10. Migrar dívidas
      const debts = firebaseUser.debts || [];
      console.log(`   💳 ${debts.length} dívidas para migrar`);
      
      for (const debt of debts) {
        try {
          const supabaseDebt = {
            user_id: supabaseUserId,
            description: debt.description || '',
            category: debt.category || 'other',
            amount: parseFloat(debt.amount) || 0,
            paid_amount: parseFloat(debt.paidAmount) || 0,
            remaining_amount: parseFloat(debt.remainingAmount) || 0,
            priority: debt.priority || 'medium',
            status: debt.status || 'pending',
            due_date: debt.dueDate?.toDate?.() || new Date(debt.dueDate) || null,
            interest_rate: parseFloat(debt.interestRate) || 0,
            notes: debt.notes || ''
          };

          const { error: insertError } = await supabase
            .from('debts')
            .insert(supabaseDebt);

          if (insertError) {
            console.log(`   ❌ Erro ao migrar dívida "${debt.description}": ${insertError.message}`);
          } else {
            console.log(`   ✅ Dívida migrada: ${debt.description}`);
            totalDebtsMigrated++;
          }
        } catch (error) {
          console.log(`   ❌ Erro ao processar dívida "${debt.description}": ${error.message}`);
        }
      }

      // Aguardar um pouco para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Resumo da migração:');
    console.log(`   - Usuários migrados: ${totalUsersMigrated}`);
    console.log(`   - Produtos migrados: ${totalProductsMigrated}`);
    console.log(`   - Receitas migradas: ${totalRevenuesMigrated}`);
    console.log(`   - Despesas migradas: ${totalExpensesMigrated}`);
    console.log(`   - Transações migradas: ${totalTransactionsMigrated}`);
    console.log(`   - Sonhos migrados: ${totalDreamsMigrated}`);
    console.log(`   - Apostas migradas: ${totalBetsMigrated}`);
    console.log(`   - Metas migradas: ${totalGoalsMigrated}`);
    console.log(`   - Dívidas migradas: ${totalDebtsMigrated}`);
    console.log('✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

// Executar migração
migrateFirebaseToSupabaseByEmail().then(() => {
  console.log('\n🏁 Migração finalizada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 