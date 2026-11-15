require('reflect-metadata');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
const pg = require('pg');
const nestTesting = require('@nestjs/testing');
const { PrismaService } = require('../dist/prisma/prisma.service');
const { AppModule } = require('../dist/app.module');
const { configureHttp } = require('../dist/http');

const rootEnv = path.resolve(__dirname, '../../../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);
let admin, store, prisma, app, base, schema, user;
const password = 'BrewLite123';
const products = ['001', '002', '003'].map(value => `10000000-0000-4000-8000-000000000${value}`);
async function api(path, { method = 'GET', body, token, key } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(key ? { 'Idempotency-Key': key } : {}),
  }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

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
  prisma = new PrismaService(url, schema);
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
