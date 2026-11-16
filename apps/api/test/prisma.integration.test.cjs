require('reflect-metadata');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac, randomUUID } = require('node:crypto');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
const pg = require('pg');
const nestTesting = require('@nestjs/testing');
const { PrismaService } = require('../dist/prisma/prisma.service');
const { AppModule } = require('../dist/app.module');
const { configureHttp } = require('../dist/http');
const { PAYMENT_PROVIDER } = require('../dist/payment-provider');
const { VnpayProvider } = require('../dist/vnpay');

const rootEnv = path.resolve(__dirname, '../../../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);
let admin, store, prisma, app, base, schema, user, scopedUrl;
const password = 'BrewLite123';
const products = ['001', '002', '003'].map(value => `10000000-0000-4000-8000-000000000${value}`);
async function api(path, { method = 'GET', body, token, key, origin = base } = {}) {
  const response = await fetch(`${origin}${path}`, { method, headers: {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(key ? { 'Idempotency-Key': key } : {}),
  }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

test('VNPay signs checkout and settles only via a valid IPN, once per attempt', async () => {
  const secret = 'fixture-vnpay-secret';
  const tmnCode = 'DEMOV210';
  const fixtureEnv = {
    VNPAY_HASH_SECRET: secret, VNPAY_TMN_CODE: tmnCode,
    VNPAY_RETURN_URL: 'https://merchant.example/payments/vnpay/return',
    VNPAY_PAYMENT_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  };
  const original = Object.fromEntries(Object.keys(fixtureEnv).map(key => [key, process.env[key]]));
  let provider;
  try {
    Object.assign(process.env, fixtureEnv);
    provider = new VnpayProvider();
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
  const instance = await nestTesting.Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue(new PrismaService(scopedUrl, schema))
    .overrideProvider(PAYMENT_PROVIDER).useValue(provider).compile();
  const vnpayApp = instance.createNestApplication({ logger: false, bodyParser: false });
  try {
    configureHttp(vnpayApp);
    await vnpayApp.listen(0, '127.0.0.1');
    const origin = await vnpayApp.getUrl();
    const request = (path, input) => api(path, { ...input, token: user.access_token, origin });
    const created = await request('/orders', { method: 'POST', body: { items: [{ productId: products[0], quantity: 1 }] } });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const { orderId, totalAmount } = created.body;
    const key = randomUUID();
    const pay = (idempotencyKey) => request('/payments', { method: 'POST', key: idempotencyKey, body: { orderId, paymentMethod: 'VNPAY' } });
    const first = await pay(key);
    assert.equal(first.status, 200, JSON.stringify(first.body));
    const url = new URL(first.body.checkoutUrl);
    const digest = (data) => createHmac('sha512', secret).update(data).digest('hex');
    assert.match(url.search, /vnp_OrderInfo=Thanh\+toan\+don\+hang\+/);
    const [signedQuery, checksum] = url.search.slice(1).split('&vnp_SecureHash=');
    assert.equal(checksum, digest(signedQuery));
    assert.equal(url.searchParams.get('vnp_Amount'), String(totalAmount * 100));
    assert.equal((await pay(randomUUID())).body.checkoutUrl, first.body.checkoutUrl);
    assert.equal((await request(`/orders/${orderId}/cancel`, { method: 'PATCH' })).status, 409);

    const signed = (txnRef, overrides = {}) => {
      const params = new URLSearchParams({
        vnp_TmnCode: tmnCode, vnp_TxnRef: txnRef, vnp_Amount: String(totalAmount * 100),
        vnp_ResponseCode: '00', vnp_TransactionStatus: '00', vnp_OrderInfo: 'Thanh toan don hang',
        ...overrides,
      });
      params.sort();
      return `${params}&vnp_SecureHash=${digest(params.toString())}`;
    };
    const ipn = (query) => request(`/payments/vnpay/ipn?${query}`);
    const detail = () => request(`/orders/${orderId}`);
    const firstRef = url.searchParams.get('vnp_TxnRef');
    const success = signed(firstRef);
    const redirect = await fetch(`${origin}/payments/vnpay/return?${success}`, { redirect: 'manual' });
    assert.equal(redirect.status, 302);
    assert.ok(redirect.headers.get('location').endsWith(`/success/${orderId}`));
    assert.equal((await detail()).body.status, 'PENDING');
    assert.equal((await ipn(success + '0')).body.RspCode, '97');
    assert.equal((await ipn(signed(firstRef, { vnp_TmnCode: 'WRONGTMN' }))).body.RspCode, '97');
    assert.equal((await ipn(signed(firstRef, { vnp_Amount: '100' }))).body.RspCode, '04');
    assert.equal((await detail()).body.status, 'PENDING');
    await prisma.payment.update({
      where: { id: first.body.paymentId },
      data: { createdAt: new Date(Date.now() - 16 * 60_000) },
    });
    const expired = await pay(randomUUID());
    assert.equal(expired.body.paymentId, first.body.paymentId);
    assert.equal(expired.body.checkoutUrl, undefined);
    assert.equal(expired.body.paymentStatus, 'PENDING');
    const cancelled = signed(firstRef, { vnp_ResponseCode: '24', vnp_TransactionStatus: '02' });
    assert.equal((await ipn(cancelled)).body.RspCode, '00');
    assert.equal((await detail()).body.status, 'PAYMENT_FAILED');
    assert.equal((await pay(key)).body.checkoutUrl, undefined);

    const retry = await pay(randomUUID());
    const retryRef = new URL(retry.body.checkoutUrl).searchParams.get('vnp_TxnRef');
    assert.notEqual(retryRef, firstRef);
    const outcomes = await Promise.all([ipn(signed(retryRef)), ipn(signed(retryRef))]);
    assert.deepEqual(new Set(outcomes.map(result => result.body.RspCode)), new Set(['00', '02']));
    const paid = (await detail()).body;
    assert.equal(paid.status, 'PAID');
    assert.equal(paid.history.filter(entry => entry.toStatus === 'PAID').length, 1);
    assert.equal(await prisma.loyaltyTransaction.count({ where: { orderId, type: 'EARN' } }), 1);
  } finally {
    await vnpayApp.close();
  }
});

before(async () => {
  process.env.JWT_SECRET = 'prisma-integration-test-secret-at-least-32-bytes';
  process.env.JWT_EXPIRES_IN = '1d';
  process.env.PAYMENT_MODE = 'mock';
  const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL or DATABASE_URL is required');
  admin = new pg.Client({ connectionString: url });
  await admin.connect();
  schema = `bl_test_${randomUUID().replaceAll('-', '')}`;
  await admin.query(`CREATE SCHEMA "${schema}"`);
  store = new pg.Pool({ connectionString: url, options: `-c search_path=${schema},public` });
  for (const file of [
    '../prisma/migrations/20261115000000_baseline/migration.sql',
    '../prisma/migrations/20261115001000_api_features/migration.sql',
    'fixtures/seed.sql',
  ]) await store.query(readFileSync(path.resolve(__dirname, file), 'utf8'));
  const scoped = new URL(url);
  scoped.searchParams.set('options', `-c search_path=${schema},public`);
  scopedUrl = scoped.toString();
  prisma = new PrismaService(scopedUrl, schema);
  const module = await nestTesting.Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService).useValue(prisma).compile();
  app = module.createNestApplication({ logger: false, bodyParser: false });
  configureHttp(app);
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
  const registration = await api('/auth/register', { method: 'POST', body: {
    fullName: 'MVP Customer', email: `${randomUUID()}@example.test`, password,
  } });
  assert.equal(registration.status, 201, JSON.stringify(registration.body));
  user = registration.body;
});

after(async () => {
  await app?.close();
  await store?.end();
  if (admin) {
    if (schema) await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.end();
  }
});

test('health, catalog, register/login and JWT authorization use Prisma', async () => {
  const health = await api('/health');
  assert.equal(health.status, 200);
  assert.deepEqual(health.body, { status: 'ok', database: 'ok' });
  const catalog = await api('/products');
  assert.equal(catalog.status, 200);
  assert.equal(catalog.body.length, 3);
  const product = await api(`/products/${products[0]}`);
  assert.deepEqual(product.body.sizes.map(size => size.name), ['S', 'M', 'L']);
  const login = await api('/auth/login', { method: 'POST', body: { email: user.user.email, password } });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.id, user.user.id);
  assert.equal((await api('/orders/me', { token: login.body.access_token })).status, 200);
  assert.equal((await api('/orders/me')).status, 401);
});

test('checkout, failed payment, retry and duplicate idempotency preserve stock and order state', async () => {
  const created = await api('/orders', { method: 'POST', token: user.access_token, body: { items: [{ productId: products[0], quantity: 1 }] } });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const order = created.body;
  assert.equal(order.items[0].unitPrice, 29000);
  const firstKey = randomUUID();
  const failed = await api('/payments', { method: 'POST', token: user.access_token, key: firstKey, body: { orderId: order.orderId, paymentMethod: 'CARD', mockOutcome: 'FAILURE' } });
  assert.equal(failed.body.paymentStatus, 'FAILED');
  const retryKey = randomUUID();
  const paid = await api('/payments', { method: 'POST', token: user.access_token, key: retryKey, body: { orderId: order.orderId, paymentMethod: 'CARD', mockOutcome: 'SUCCESS' } });
  assert.equal(paid.body.paymentStatus, 'SUCCESS');
  const replay = await api('/payments', { method: 'POST', token: user.access_token, key: retryKey, body: { orderId: order.orderId, paymentMethod: 'CARD', mockOutcome: 'SUCCESS' } });
  assert.deepEqual(replay.body, paid.body);
  const detail = await api(`/orders/${order.orderId}`, { token: user.access_token });
  assert.equal(detail.body.status, 'PAID');
  assert.equal(detail.body.payments.length, 2);
});

test('coupon, points ledger and ingredient recipes are persisted transactionally', async () => {
  await prisma.user.update({ where: { id: user.user.id }, data: { loyaltyPoints: 100 } });
  const orderResult = await api('/orders', { method: 'POST', token: user.access_token, body: {
    items: [{ productId: products[1], quantity: 2 }], couponCode: 'WELCOME', pointsUsed: 5,
  } });
  assert.equal(orderResult.status, 201, JSON.stringify(orderResult.body));
  const order = await prisma.order.findUnique({ where: { id: orderResult.body.orderId } });
  assert.equal(order.subtotalAmount, 78000);
  assert.equal(order.discountAmount, 15000);
  assert.equal(order.pointsDiscount, 5000);
  assert.equal(order.totalAmount, 58000);
  assert.equal((await prisma.loyaltyTransaction.findFirst({ where: { orderId: order.id, type: 'REDEEM' } })).points, -5);
  assert.equal((await api('/inventory/ingredients', { token: user.access_token })).status, 403);
  await prisma.user.update({ where: { id: user.user.id }, data: { role: 'ADMIN' } });
  const adminSession = await api('/auth/login', { method: 'POST', body: { email: user.user.email, password } });
  const ingredient = await api('/inventory/ingredients', { method: 'POST', token: adminSession.body.access_token,
    body: { name: 'Coffee test', unit: 'g', openingStock: 20 } });
  assert.equal(ingredient.status, 201, JSON.stringify(ingredient.body));
  const recipe = await api(`/inventory/products/${products[2]}/recipes/M`, { method: 'PUT', token: adminSession.body.access_token,
    body: { ingredients: [{ ingredientId: ingredient.body.id, quantity: 2 }] } });
  assert.equal(recipe.status, 200);
  const orderWithRecipe = await api('/orders', { method: 'POST', token: adminSession.body.access_token,
    body: { items: [{ productId: products[2], quantity: 2 }] } });
  assert.equal(orderWithRecipe.status, 201, JSON.stringify(orderWithRecipe.body));
  const updated = await prisma.ingredient.findUnique({ where: { id: ingredient.body.id } });
  assert.equal(Number(updated.onHand), 16);
});
