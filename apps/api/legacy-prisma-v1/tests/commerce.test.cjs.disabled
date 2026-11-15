require('reflect-metadata');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { PGlite } = require('@electric-sql/pglite');
const { Pool } = require('pg');
const { Test } = require('@nestjs/testing');
const { JwtService } = require('@nestjs/jwt');
const { compare } = require('bcryptjs');
const { AppModule } = require('../dist/app.module');
const { Database } = require('../dist/database');
const { jwtOptions } = require('../dist/auth');
const { assertTransition } = require('../dist/order-state');
const { configureHttp } = require('../dist/http');

let db, store, app, base, admin, schema, customer, other, staff, coffee, tea, freeze, coffeeSize, teaSize;
const password = 'BrewLite123';
const get = async (sql, params) => (await store.query(sql, params)).rows;
async function api(path, { method = 'GET', body, token, key } = {}) {
  const response = await fetch(`${base}${path}`, { method,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(key ? { 'Idempotency-Key': key } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined });
  return { status: response.status, body: await response.json() };
}
const cart = (quantity = 1, productId = coffee, extra = {}) => ({ items: [{ productId, quantity, ...extra }] });
async function order(body = cart(), token = customer.access_token) {
  const response = await api('/orders', { method: 'POST', body, token });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  return response.body;
}
async function pay(orderId, mockOutcome = 'SUCCESS', key = randomUUID(), token = customer.access_token, paymentMethod = 'CARD') {
  return api('/payments', { method: 'POST', token, key, body: { orderId, paymentMethod, mockOutcome } });
}
const stock = async (id = coffee) => Number((await get('SELECT stock FROM products WHERE id = $1', [id]))[0].stock);

before(async () => {
  process.env.JWT_SECRET = 'commerce-test-secret-at-least-32-bytes-long';
  process.env.JWT_EXPIRES_IN = '1d';
  if (process.env.TEST_DATABASE_URL) {
    // Opt-in verification against a real server, isolated from existing tables.
    schema = `commerce_test_${randomUUID().replaceAll('-', '')}`;
    admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    await admin.query(`CREATE SCHEMA "${schema}"`);
    db = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema}` });
    store = { query: db.query.bind(db), transaction: Database.prototype.transaction.bind(db) };
  } else {
    db = new PGlite();
    store = { query: db.query.bind(db), transaction: work => db.transaction(tx => work({ query: tx.query.bind(tx) })) };
  }
  for (let run = 0; run < 2; run++) {
    for (const file of ['schema.sql', '002-commerce.sql', 'seed.sql']) {
      const sql = readFileSync(resolve(__dirname, '../db', file), 'utf8');
      if (admin) await db.query(sql); else await db.exec(sql);
    }
  }
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(Database).useValue(store).compile();
  app = module.createNestApplication({ logger: false, bodyParser: false });
  configureHttp(app);
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
  [coffee, tea, freeze] = ['001', '002', '003'].map(s => `10000000-0000-4000-8000-000000000${s}`);
  coffeeSize = (await get("SELECT id FROM product_sizes WHERE product_id = $1 AND name = 'L'", [coffee]))[0].id;
  teaSize = (await get("SELECT id FROM product_sizes WHERE product_id = $1 AND name = 'M'", [tea]))[0].id;
  for (const name of ['Customer', 'Other', 'Staff']) {
    const response = await api('/auth/register', { method: 'POST', body: { fullName: name, email: `${name}@example.com`, password } });
    assert.equal(response.status, 201);
    if (name === 'Customer') customer = response.body;
    if (name === 'Other') other = response.body;
    if (name === 'Staff') staff = response.body;
  }
  await store.query("UPDATE users SET role = 'STAFF' WHERE id = $1", [staff.user.id]);
});
after(async () => {
  await app?.close();
  if (admin) {
    await db?.end();
    try { await admin.query(`DROP SCHEMA "${schema}" CASCADE`); } finally { await admin.end(); }
  } else await db?.close();
});

test('register normalizes email, hashes passwords and never returns password hashes', async () => {
  assert.equal(customer.user.email, 'customer@example.com');
  assert.equal(customer.user.role, 'CUSTOMER');
  assert.equal(customer.user.passwordHash, undefined);
  const user = (await get('SELECT * FROM users WHERE id = $1', [customer.user.id]))[0];
  assert.match(user.password_hash, /^\$2[aby]\$12\$/);
  assert.equal(await compare(password, user.password_hash), true);
  const duplicate = await api('/auth/register', { method: 'POST', body: { email: ' CUSTOMER@example.com ', fullName: 'Duplicate', password } });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.code, 'EMAIL_ALREADY_REGISTERED');
  assert.equal(duplicate.body.message, 'Email đã được đăng ký');
});
test('registration rejects invalid names, phones, emails, weak/oversize passwords and role injection', async () => {
  for (const change of [
    { email: 'bad' }, { fullName: 'X' }, { fullName: '<script>alert(1)</script>' }, { phone: '12345' },
    { password: '123456' }, { password: 'abcdef' }, { password: 'Ab12' },
    { password: 'ệ'.repeat(25) + '1' }, { role: 'STAFF' }, { passwordHash: 'bad' },
  ]) {
    const response = await api('/auth/register', { method: 'POST', body: { fullName: 'Valid Name', email: 'valid@example.com', password, ...change } });
    assert.equal(response.status, 400, JSON.stringify(change));
  }
});
test('login returns JWT and rejects wrong/unknown credentials with the same message', async () => {
  const login = await api('/auth/login', { method: 'POST', body: { email: ' CUSTOMER@EXAMPLE.COM ', password } });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.id, customer.user.id);
  const token = await new JwtService(jwtOptions()).verifyAsync(login.body.access_token);
  assert.equal(token.sub, customer.user.id);
  assert.equal(token.exp - token.iat, 86400);
  const bad = await api('/auth/login', { method: 'POST', body: { email: 'customer@example.com', password: 'Wrong123' } });
  const unknown = await api('/auth/login', { method: 'POST', body: { email: 'unknown@example.com', password } });
  assert.equal(bad.status, 401); assert.equal(unknown.status, 401);
  assert.equal(bad.body.code, 'INVALID_CREDENTIALS');
  assert.equal(bad.body.message, unknown.body.message);
});
test('all order/payment endpoints require authentication and reject expired or forged JWTs', async () => {
  for (const [path, method] of [['/orders', 'POST'], ['/orders/me', 'GET'], [`/orders/${randomUUID()}`, 'GET'],
    [`/orders/${randomUUID()}/cancel`, 'PATCH'], [`/orders/${randomUUID()}/status`, 'PATCH'], ['/payments', 'POST']]) {
    assert.equal((await api(path, { method })).status, 401);
  }
  const jwt = new JwtService(jwtOptions());
  const expired = await jwt.signAsync({ sub: customer.user.id }, { expiresIn: -1 });
  const forged = await jwt.signAsync({ sub: customer.user.id }, { secret: 'another-secret-with-at-least-32-bytes' });
  const malformed = await jwt.signAsync({ sub: '-'.repeat(36) });
  for (const token of [expired, forged, malformed, 'not-a-jwt']) {
    assert.equal((await api('/orders/me', { token })).status, 401);
  }
  assert.deepEqual((await api('/orders/me', { token: other.access_token })).body, []);
});
test('checkout prices size and toppings on the server and reserves stock', async () => {
  const before = await stock();
  const created = await order(cart(2, coffee, { sizeId: coffeeSize, toppingIds: ['20000000-0000-4000-8000-000000000001'] }));
  assert.equal(created.status, 'PENDING');
  assert.match(created.orderCode, /^BL-/);
  assert.equal(created.totalAmount, (29000 + 10000 + 5000) * 2);
  assert.equal(created.items[0].sizeName, 'L');
  assert.equal(created.items[0].unitPrice, 44000);
  assert.equal(await stock(), before - 2);
  const detail = await api(`/orders/${created.orderId}`, { token: customer.access_token });
  assert.equal(detail.status, 200);
  assert.deepEqual(detail.body.history.map(h => h.toStatus), ['PENDING']);
});
test('checkout validates nested input and rejects client totals, empty carts and invalid options', async () => {
  for (const body of [ { items: [] }, cart(0), cart(100), cart(1.5), cart('1'), cart(1, 'bad-id'),
    { ...cart(), totalAmount: 1 }, cart(1, coffee, { unitPrice: 1 }),
    cart(1, coffee, { toppingIds: ['20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001'] }),
    { items: [null] }, { items: 'invalid' }, { items: [[]] }, { items: [[{ productId: coffee, quantity: 1 }]] },
  ]) assert.equal((await api('/orders', { method: 'POST', token: customer.access_token, body })).status, 400, JSON.stringify(body));
  for (const body of [cart(1, randomUUID()), cart(1, '10000000-0000-4000-8000-000000000004'),
    cart(1, coffee, { sizeId: teaSize }), cart(1, coffee, { toppingIds: ['20000000-0000-4000-8000-000000000002'] }),
    cart(1, freeze, { toppingIds: ['20000000-0000-4000-8000-000000000003'] }),
  ]) assert.equal((await api('/orders', { method: 'POST', token: customer.access_token, body })).status, 409, JSON.stringify(body));
});
test('multi-item checkout rolls back all stock and order writes on insufficient inventory', async () => {
  await store.query('UPDATE products SET stock = 0 WHERE id = $1', [tea]);
  const before = await stock();
  const count = (await get('SELECT count(*)::int AS n FROM orders'))[0].n;
  const response = await api('/orders', { method: 'POST', token: customer.access_token,
    body: { items: [{ productId: coffee, quantity: 1 }, { productId: tea, quantity: 1 }] } });
  assert.equal(response.status, 409);
  assert.equal(response.body.code, 'INSUFFICIENT_STOCK');
  assert.equal(await stock(), before);
  assert.equal((await get('SELECT count(*)::int AS n FROM orders'))[0].n, count);
  await store.query('UPDATE products SET stock = 100 WHERE id = $1', [tea]);
});
test('concurrent checkouts cannot oversell the last product', async () => {
  await store.query('UPDATE products SET stock = 1 WHERE id = $1', [tea]);
  const results = await Promise.all([other, customer].map(user => api('/orders', {
    method: 'POST', token: user.access_token, body: cart(1, tea) })));
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  assert.equal(await stock(tea), 0);
  await store.query('UPDATE products SET stock = 100 WHERE id = $1', [tea]);
});
test('repeated product lines aggregate quantities for stock validation', async () => {
  await store.query('UPDATE products SET stock = 1 WHERE id = $1', [tea]);
  const response = await api('/orders', { method: 'POST', token: customer.access_token,
    body: { items: [{ productId: tea, quantity: 1 }, { productId: tea, quantity: 1 }] } });
  assert.equal(response.status, 409);
  assert.equal(await stock(tea), 1);
  await store.query('UPDATE products SET stock = 100 WHERE id = $1', [tea]);
});
test('payment succeeds once, stores one transaction and replays the exact response for a duplicate key', async () => {
  const created = await order();
  const reserved = await stock();
  const key = randomUUID();
  const results = await Promise.all([pay(created.orderId, 'SUCCESS', key), pay(created.orderId, 'SUCCESS', key)]);
  for (const r of results) assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual(results[0].body, results[1].body);
  assert.equal(results[0].body.status, 'PAID'); assert.equal(results[0].body.cartAction, 'CLEAR');
  assert.equal(await stock(), reserved);
  assert.equal((await get('SELECT count(*)::int AS n FROM payments WHERE order_id = $1', [created.orderId]))[0].n, 1);
  assert.equal((await pay(created.orderId)).status, 409);
  const reused = await pay(created.orderId, 'FAILURE', key);
  assert.equal(reused.status, 409); assert.equal(reused.body.code, 'IDEMPOTENCY_CONFLICT');
  const another = await order();
  assert.equal((await pay(another.orderId, 'SUCCESS', key)).status, 409);
});
test('different concurrent payment keys still allow only one successful payment', async () => {
  const created = await order();
  const results = await Promise.all([pay(created.orderId), pay(created.orderId)]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
});
test('failure restores stock once, keeps the cart and retries with a new key', async () => {
  const initialStock = await stock();
  const created = await order();
  const key = randomUUID();
  const failed = await pay(created.orderId, 'FAILURE', key, customer.access_token, 'EWALLET');
  assert.equal(failed.status, 200); assert.equal(failed.body.status, 'PAYMENT_FAILED');
  assert.equal(failed.body.cartAction, 'KEEP'); assert.equal(await stock(), initialStock);
  assert.deepEqual((await pay(created.orderId, 'FAILURE', key, customer.access_token, 'EWALLET')).body, failed.body);
  assert.equal(await stock(), initialStock);
  const retry = await pay(created.orderId);
  assert.equal(retry.status, 200); assert.equal(retry.body.status, 'PAID');
  assert.equal(await stock(), initialStock - 1);
  const detail = (await api(`/orders/${created.orderId}`, { token: customer.access_token })).body;
  assert.deepEqual(detail.history.map(h => h.toStatus), ['PENDING', 'PAYMENT_FAILED', 'PENDING', 'PAID']);
  assert.equal(detail.payments.length, 2);
});
test('retry without enough stock rolls back to PAYMENT_FAILED without a new payment', async () => {
  const created = await order(cart(1, tea));
  await pay(created.orderId, 'FAILURE');
  await store.query('UPDATE products SET stock = 0 WHERE id = $1', [tea]);
  assert.equal((await pay(created.orderId)).status, 409);
  const detail = (await api(`/orders/${created.orderId}`, { token: customer.access_token })).body;
  assert.equal(detail.status, 'PAYMENT_FAILED'); assert.equal(detail.payments.length, 1);
  await store.query('UPDATE products SET stock = 100 WHERE id = $1', [tea]);
});
test('payment requires a UUID v4 key, known method/outcome and rejects client amount', async () => {
  const created = await order();
  const body = { orderId: created.orderId, paymentMethod: 'CARD', mockOutcome: 'SUCCESS' };
  for (const change of [{ paymentMethod: 'CASH' }, { mockOutcome: 'anything' }, { amount: 1 }, { orderId: 'bad' }]) {
    assert.equal((await api('/payments', { method: 'POST', token: customer.access_token, key: randomUUID(), body: { ...body, ...change } })).status, 400);
  }
  for (const key of [undefined, 'bad', '10000000-0000-1000-8000-000000000001']) {
    assert.equal((await api('/payments', { method: 'POST', token: customer.access_token, key, body })).status, 400);
  }
});
test('users cannot inspect, cancel or pay another user order', async () => {
  const created = await order();
  for (const [path, method] of [[`/orders/${created.orderId}`, 'GET'], [`/orders/${created.orderId}/cancel`, 'PATCH']]) {
    assert.equal((await api(path, { method, token: other.access_token })).status, 404);
  }
  assert.equal((await pay(created.orderId, 'SUCCESS', randomUUID(), other.access_token)).status, 404);
  const history = (await api('/orders/me', { token: other.access_token })).body;
  assert.ok(history.every(o => o.userId === other.user.id && o.orderId !== created.orderId));
});
test('cancellation restores stock once and blocks payment/cancelling paid orders', async () => {
  const initialStock = await stock();
  const created = await order();
  const cancel = () => api(`/orders/${created.orderId}/cancel`, { method: 'PATCH', token: customer.access_token });
  const cancelled = await cancel(); assert.equal(cancelled.status, 200); assert.equal(cancelled.body.status, 'CANCELLED');
  assert.equal(await stock(), initialStock);
  assert.equal((await cancel()).status, 409); assert.equal(await stock(), initialStock);
  assert.equal((await pay(created.orderId)).status, 409);
  const paid = await order(); await pay(paid.orderId);
  assert.equal((await api(`/orders/${paid.orderId}/cancel`, { method: 'PATCH', token: customer.access_token })).status, 409);
});
test('staff advances only valid steps and customers cannot change fulfillment status', async () => {
  const created = await order();
  const update = (status, token = staff.access_token) => api(`/orders/${created.orderId}/status`, { method: 'PATCH', token, body: { status } });
  assert.equal((await update('PREPARING', customer.access_token)).status, 403);
  assert.equal((await update('COMPLETED')).status, 409);
  assert.equal((await update('PAID')).status, 400);
  await pay(created.orderId);
  assert.equal((await update('READY')).status, 409);
  for (const status of ['PREPARING', 'READY', 'COMPLETED']) {
    const response = await update(status); assert.equal(response.status, 200); assert.equal(response.body.status, status);
  }
  assert.equal((await update('PREPARING')).status, 409);
  const detail = (await api(`/orders/${created.orderId}`, { token: customer.access_token })).body;
  assert.deepEqual(detail.history.map(h => h.toStatus), ['PENDING', 'PAID', 'PREPARING', 'READY', 'COMPLETED']);
  // Replay remains the original receipt even after fulfillment progresses.
  const payment = (await get('SELECT idempotency_key FROM payments WHERE order_id = $1', [created.orderId]))[0];
  assert.equal((await pay(created.orderId, 'SUCCESS', payment.idempotency_key)).body.status, 'PAID');
});
test('history is newest first and snapshots survive catalog price/name changes', async () => {
  const created = await order();
  await store.query("UPDATE products SET name = 'Renamed', base_price = 1 WHERE id = $1", [coffee]);
  const detail = (await api(`/orders/${created.orderId}`, { token: customer.access_token })).body;
  assert.equal(detail.items[0].productName, 'Cà phê sữa'); assert.equal(detail.totalAmount, 29000);
  const history = (await api('/orders/me', { token: customer.access_token })).body;
  assert.equal(history[0].orderId, created.orderId);
  for (let i = 1; i < history.length; i++) assert.ok(Date.parse(history[i - 1].createdAt) >= Date.parse(history[i].createdAt));
  await store.query("UPDATE products SET name = 'Cà phê sữa', base_price = 29000 WHERE id = $1", [coffee]);
});
test('state machine rejects skipped steps and terminal transitions', () => {
  assert.throws(() => assertTransition('PENDING', 'COMPLETED'));
  assert.throws(() => assertTransition('COMPLETED', 'PENDING'));
  assert.throws(() => assertTransition('CANCELLED', 'PAID'));
  assert.doesNotThrow(() => assertTransition('PAYMENT_FAILED', 'PENDING'));
});
test('smoke CLI completes registration, login, payment failure/retry and history against HTTP', async () => {
  const { stdout } = await promisify(execFile)(process.execPath, [resolve(__dirname, '../scripts/smoke-commerce.cjs')],
    { env: { ...process.env, API_URL: base }, timeout: 30000 });
  assert.match(stdout, /PASS: register -> login\/JWT/);
});
test('commerce migration rerun preserves inventory and existing orders', async () => {
  const before = await stock();
  const count = (await get('SELECT count(*)::int AS n FROM orders'))[0].n;
  const sql = readFileSync(resolve(__dirname, '../db/002-commerce.sql'), 'utf8');
  if (admin) await db.query(sql); else await db.exec(sql);
  assert.equal(await stock(), before);
  assert.equal((await get('SELECT count(*)::int AS n FROM orders'))[0].n, count);
});
test('unexpected payment persistence errors roll back payment, status, history and inventory together', async () => {
  const created = await order();
  const reserved = await stock();
  const original = store.transaction;
  store.transaction = work => original(client => work({
    async query(sql, values) {
      if (sql.includes('INSERT INTO payments')) throw new Error('sensitive SQL and secret-password');
      return client.query(sql, values);
    },
  }));
  try {
    const result = await pay(created.orderId, 'FAILURE');
    assert.equal(result.status, 500); assert.equal(result.body.code, 'INTERNAL_ERROR');
    assert.doesNotMatch(JSON.stringify(result.body), /sensitive SQL|secret-password|stack/);
  } finally { store.transaction = original; }
  assert.equal(await stock(), reserved);
  const detail = (await api(`/orders/${created.orderId}`, { token: customer.access_token })).body;
  assert.equal(detail.status, 'PENDING'); assert.deepEqual(detail.payments, []);
  assert.deepEqual(detail.history.map(h => h.toStatus), ['PENDING']);
  assert.equal((await pay(created.orderId)).status, 200);
});
