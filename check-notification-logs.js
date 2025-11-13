require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const userId = process.argv[2];

if (!userId) {
  console.error('Uso: node check-notification-logs.js <user_id>');
  process.exit(1);
}

async function run() {
  console.log(`🔎 Buscando logs de notificação para user_id: ${userId}`);
  const { data, error } = await supabase
    .from('notification_logs')
    .select('*')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Erro ao buscar logs:', error.message, error.code || '');
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('⚠️ Nenhum log encontrado para este usuário.');
    process.exit(0);
  }

  console.log(`✅ ${data.length} log(s) encontrados:
`);
  for (const log of data) {
    console.log(`- ${log.sent_at} | canal: ${log.channel} | tipo: ${log.type}`);
    console.log(`  título: ${log.title}`);
    console.log(`  sucesso: ${log.success_count} | falha: ${log.failure_count}`);
    if (log.metadata) {
      console.log(`  metadata: ${JSON.stringify(log.metadata)}`);
    }
  }
}

run().catch((e) => {
  console.error('💥 Erro inesperado:', e.message);
  process.exit(1);
});