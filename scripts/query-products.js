const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load env from .env.local, fallback to .env
try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
} catch (_) {}
try {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
  }
} catch (_) {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { ids: [], user: undefined };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--ids') {
      out.ids = (args[i + 1] || '').split(',').map(s => s.trim()).filter(Boolean);
      i++;
    } else if (a === '--user') {
      out.user = args[i + 1];
      i++;
    }
  }
  return out;
}

(async () => {
  const { ids, user } = parseArgs();
  if (!ids || ids.length === 0) {
    console.error('Usage: node scripts/query-products.js --ids <id1,id2,...> [--user <uuid>]');
    process.exit(1);
  }

  let q = supabase
    .from('products')
    .select('id, name, status, quantity, quantity_sold, selling_price, user_id')
    .in('id', ids);

  if (user) q = q.eq('user_id', user);

  const { data, error } = await q;
  if (error) {
    console.error('Error querying products:', error.message);
    process.exit(1);
  }

  const transformed = (data || []).map(p => ({
    id: p.id,
    name: p.name,
    status: p.status,
    quantity: Number(p.quantity ?? 0),
    quantity: Number(p.quantity || 0),
    quantity_sold: Number(p.quantity_sold || 0),
    available: Math.max(0, Number(p.quantity || 0) - Number(p.quantity_sold || 0)),
    selling_price: Number(p.selling_price || 0),
    user_id: p.user_id
  }));

  console.log(JSON.stringify({ count: transformed.length, products: transformed }, null, 2));
})();
