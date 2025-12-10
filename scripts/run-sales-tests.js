/* eslint-disable */
const fetch = global.fetch || require('node-fetch');

const userId = 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b';
const products = [
  { id: 'bffebfb1-ca34-4f35-aeda-97c2ac0fc57b', qty: 1 },
  { id: '07bba0ca-0740-4312-9618-e674b65339df', qty: 3 },
];

const bases = ['http://localhost:3001', 'http://localhost:3000'];

async function tryPost(base, productId, quantity) {
  const url = `${base}/api/sales/create?user_id=${userId}&product_id=${productId}`;
  const body = { quantity, date: new Date().toISOString(), buyerName: 'Teste CLI' };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await res.text();
  console.log('POST', url, 'status', res.status, 'body:', text);
  return { ok: res.ok, base, status: res.status, body: text };
}

async function tryGet(base, path) {
  const url = `${base}${path}`;
  const res = await fetch(url);
  const text = await res.text();
  console.log('GET', url, 'status', res.status, 'body length:', text.length);
  return { ok: res.ok, base, status: res.status, body: text };
}

(async () => {
  let chosenBase = bases[0];
  for (const base of bases) {
    try {
      const ping = await fetch(`${base}/`);
      if (ping.ok) { chosenBase = base; break; }
    } catch (_) {}
  }
  console.log('Using base:', chosenBase);

  for (const p of products) {
    await tryPost(chosenBase, p.id, p.qty);
  }

  await tryGet(chosenBase, `/api/sales/get?user_id=${userId}`);
  await tryGet(chosenBase, `/api/products/get?user_id=${userId}`);
})();

