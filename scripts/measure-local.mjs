import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

const base = new URL(process.env.BREWLITE_PERF_URL ?? 'http://127.0.0.1:3003');
if (!['127.0.0.1', 'localhost'].includes(base.hostname)) {
  throw new Error('Use a disposable local database. This check creates paid mock orders.');
}

async function request(path, { body, token, key } = {}) {
  const start = performance.now();
  const response = await fetch(new URL(path, base), {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(body && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(key && { 'Idempotency-Key': key }),
    },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(5_000),
  });
  assert.ok(response.ok, `${path} returned ${response.status}`);
  const data = await response.json();
  return { data, ms: performance.now() - start };
}

assert.equal((await request('/health')).data.database, 'ok');
const products = (await request('/products')).data;
assert.ok(products.length >= 20, 'SRS requires at least 20 seeded products.');
const { data: session } = await request('/auth/register', {
  body: { fullName: 'Khách đo hiệu năng', email: `perf-${randomUUID()}@example.com`, password: 'BrewLitePerf6148' },
});

const orderProducts = products.filter((product) => product.category !== 'Test');
assert.ok(orderProducts.length > 0, "The regular demo menu must be seeded.");
const results = { products: [], orders: [], payments: [] };
for (let index = 0; index <= 20; index++) {
  const catalog = await request('/products');
  const token = session.access_token;
  const order = await request('/orders', {
    token,
    body: { items: [{ productId: orderProducts[index % orderProducts.length].id, quantity: 1 }] },
  });
  const payment = await request('/payments', {
    token,
    key: randomUUID(),
    body: { orderId: order.data.orderId, paymentMethod: 'CARD', mockOutcome: 'SUCCESS' },
  });
  assert.equal(payment.data.status, 'PAID');
  if (index === 0) continue;
  results.products.push(catalog.ms);
  results.orders.push(order.ms);
  results.payments.push(payment.ms);
}

console.log(`Seeded menu: ${products.length} products. 20 samples per endpoint, one warm-up excluded.`);
for (const [name, values] of Object.entries(results)) {
  const sorted = values.toSorted((a, b) => a - b);
  const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
  const max = sorted.at(-1);
  const threshold = name === 'products' ? 500 : 1000;
  console.log(`${name}: p95=${p95.toFixed(1)} ms, max=${max.toFixed(1)} ms (SRS < ${threshold} ms)`);
  if (max >= threshold) process.exitCode = 1;
}
