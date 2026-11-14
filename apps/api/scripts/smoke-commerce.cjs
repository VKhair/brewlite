const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const base = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
let token;
async function request(path, method = 'GET', body, key) {
  const response = await fetch(`${base}${path}`, { method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(key ? { 'Idempotency-Key': key } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(data)}`);
  return data;
}
async function main() {
  // Creates one demo customer and one paid order; use a local/test database.
  const email = `smoke-${randomUUID()}@example.com`;
  const password = `BrewLite${randomUUID()}`;
  await request('/auth/register', 'POST', { fullName: 'Khách kiểm thử', email, password });
  const session = await request('/auth/login', 'POST', { email, password });
  token = session.access_token;
  const products = await request('/products');
  if (!products.length) throw new Error('No available products: run db:seed first');
  const order = await request('/orders', 'POST', { items: [{ productId: products[0].id, quantity: 1 }] });
  assert.equal(order.status, 'PENDING');
  const failedBody = { orderId: order.orderId, paymentMethod: 'CARD', mockOutcome: 'FAILURE' };
  const key = randomUUID();
  const failed = await request('/payments', 'POST', failedBody, key);
  assert.equal(failed.status, 'PAYMENT_FAILED'); assert.equal(failed.cartAction, 'KEEP');
  assert.deepEqual(await request('/payments', 'POST', failedBody, key), failed);
  const receipt = await request('/payments', 'POST', { ...failedBody, mockOutcome: 'SUCCESS' }, randomUUID());
  assert.equal(receipt.status, 'PAID'); assert.equal(receipt.cartAction, 'CLEAR');
  const detail = await request(`/orders/${order.orderId}`);
  assert.deepEqual(detail.history.map(h => h.toStatus), ['PENDING', 'PAYMENT_FAILED', 'PENDING', 'PAID']);
  const history = await request('/orders/me');
  assert.ok(history.some(o => o.orderId === order.orderId));
  console.log('PASS: register -> login/JWT -> order -> failed payment -> replay -> retry -> history');
  console.log({ email, orderId: order.orderId, orderCode: order.orderCode, status: detail.status });
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
