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
const { configureHttp } = require('../dist/common/http/configure-http');
const { PAYMENT_PROVIDER } = require('../dist/payments/providers/payment-provider');
const { VnpayProvider } = require('../dist/payments/providers/vnpay.provider');

const rootEnv = path.resolve(__dirname, '../../../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);
let admin, store, prisma, app, base, schema, user, scopedUrl;
const password = 'BrewLite123';
const previousMigrations = [
  '20261115000000_baseline',
  '20261115001000_api_features',
];
const inventoryMigration = '20261121000000_payment_ingredient_inventory';
const migration = (name) => readFileSync(path.resolve(__dirname, '../prisma/migrations', name, 'migration.sql'), 'utf8');
const toppingId = '20000000-0000-4000-8000-000000000001';

async function registerCustomer() {
  const registration = await api('/auth/register', { method: 'POST', body: {
    fullName: 'MVP Customer', email: randomUUID() + '@example.test', password,
  } });
  assert.equal(registration.status, 201, JSON.stringify(registration.body));
  return registration.body;
}

async function fixtureIngredient(name) {
  return prisma.ingredient.findUniqueOrThrow({ where: { name: 'Fixture ' + name } });
}

async function onHand(name) {
  return Number((await fixtureIngredient(name)).onHand);
}

async function createOrder(items, token = user.access_token) {
  const result = await api('/orders', { method: 'POST', token, body: { items } });
  assert.equal(result.status, 201, JSON.stringify(result.body));
  return result.body;
}

function mockPayment(orderId, { key = randomUUID(), mockOutcome, token = user.access_token } = {}) {
  return api('/payments', { method: 'POST', token, key, body: { orderId, paymentMethod: 'CARD', mockOutcome } });
}
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
    const coffeeBefore = await onHand('coffee');
    const created = await request('/orders', { method: 'POST', body: { items: [{ productId: products[0], quantity: 1 }] } });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const { orderId, totalAmount } = created.body;
    assert.equal(await onHand('coffee'), coffeeBefore);
    const key = randomUUID();
    const pay = (idempotencyKey) => request('/payments', { method: 'POST', key: idempotencyKey, body: { orderId, paymentMethod: 'VNPAY' } });
    const first = await pay(key);
    assert.equal(first.status, 200, JSON.stringify(first.body));
    assert.equal(await onHand('coffee'), coffeeBefore - 3);
    const url = new URL(first.body.checkoutUrl);
    const digest = (data) => createHmac('sha512', secret).update(data).digest('hex');
    assert.match(url.search, /vnp_OrderInfo=Thanh\+toan\+don\+hang\+/);
    const [signedQuery, checksum] = url.search.slice(1).split('&vnp_SecureHash=');
    assert.equal(checksum, digest(signedQuery));
    assert.equal(url.searchParams.get('vnp_Amount'), String(totalAmount * 100));
    assert.equal((await pay(randomUUID())).status, 409);
    assert.equal((await pay(key)).body.checkoutUrl, first.body.checkoutUrl);
    assert.equal(await onHand('coffee'), coffeeBefore - 3);
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
    const expired = await pay(key);
    assert.equal(expired.body.paymentId, first.body.paymentId);
    assert.equal(expired.body.checkoutUrl, undefined);
    assert.equal(expired.body.paymentStatus, 'PENDING');
    const cancelled = signed(firstRef, { vnp_ResponseCode: '24', vnp_TransactionStatus: '02' });
    assert.equal((await ipn(cancelled)).body.RspCode, '00');
    assert.equal((await ipn(cancelled)).body.RspCode, '02');
    assert.equal(await onHand('coffee'), coffeeBefore);
    assert.equal((await detail()).body.status, 'PAYMENT_FAILED');
    assert.equal((await pay(key)).body.checkoutUrl, undefined);

    const retry = await pay(randomUUID());
    const retryRef = new URL(retry.body.checkoutUrl).searchParams.get('vnp_TxnRef');
    assert.notEqual(retryRef, firstRef);
    const outcomes = await Promise.all([ipn(signed(retryRef)), ipn(signed(retryRef))]);
    assert.deepEqual(new Set(outcomes.map(result => result.body.RspCode)), new Set(['00', '02']));
    const paid = (await detail()).body;
    assert.equal(paid.status, 'PAID');
    assert.equal(await onHand('coffee'), coffeeBefore - 3);
    assert.equal(await prisma.inventoryMovement.count({ where: { paymentId: first.body.paymentId, type: 'REVERSAL' } }), 2);
    assert.equal(await prisma.inventoryMovement.count({ where: { paymentId: retry.body.paymentId, type: 'REVERSAL' } }), 0);
    assert.equal(paid.history.filter(entry => entry.toStatus === 'PAID').length, 1);
    assert.equal(await prisma.loyaltyTransaction.count({ where: { orderId, type: 'EARN' } }), 1);
    const another = await createOrder([{ productId: products[0], quantity: 1 }]);
    const cancelKey = randomUUID();
    const attempt = () => request('/payments', { method: 'POST', key: cancelKey, body: { orderId: another.orderId, paymentMethod: 'VNPAY' } });
    const started = await attempt();
    await prisma.payment.update({ where: { id: started.body.paymentId }, data: { createdAt: new Date(Date.now() - 16 * 60_000) } });
    assert.equal((await request('/orders/' + another.orderId + '/cancel', { method: 'PATCH' })).body.status, 'CANCELLED');
    assert.equal((await attempt()).body.paymentStatus, 'FAILED');
    assert.equal(await onHand('coffee'), coffeeBefore - 3);
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
  for (const name of [...previousMigrations, inventoryMigration]) await store.query(migration(name));
  await store.query(readFileSync(path.resolve(__dirname, 'fixtures/seed.sql'), 'utf8'));
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
  user = await registerCustomer();
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

test('mock failure restores ingredients and a successful retry deducts once', async () => {
  const coffeeBefore = await onHand('coffee');
  const order = await createOrder([{ productId: products[0], quantity: 1 }]);
  assert.equal(order.items[0].unitPrice, 29000);
  assert.equal(await onHand('coffee'), coffeeBefore);

  const firstKey = randomUUID();
  const failed = await mockPayment(order.orderId, { key: firstKey, mockOutcome: 'FAILURE' });
  assert.equal(failed.body.paymentStatus, 'FAILED');
  assert.equal(await onHand('coffee'), coffeeBefore);
  assert.deepEqual((await mockPayment(order.orderId, { key: firstKey, mockOutcome: 'FAILURE' })).body, failed.body);

  const retryKey = randomUUID();
  const paid = await mockPayment(order.orderId, { key: retryKey });
  assert.equal(paid.body.paymentStatus, 'SUCCESS');
  assert.deepEqual((await mockPayment(order.orderId, { key: retryKey })).body, paid.body);
  assert.equal(await onHand('coffee'), coffeeBefore - 3);
  const movements = await prisma.inventoryMovement.findMany({ where: { orderId: order.orderId } });
  assert.deepEqual(
    [failed, paid].map(({ body }) => movements.filter(row => row.paymentId === body.paymentId).length),
    [4, 2],
  );
  const detail = await api('/orders/' + order.orderId, { token: user.access_token });
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
    body: { items: [{ productId: products[2], quantity: 2 }], pointsUsed: 3 } });
  assert.equal(orderWithRecipe.status, 201, JSON.stringify(orderWithRecipe.body));
  const updated = await prisma.ingredient.findUnique({ where: { id: ingredient.body.id } });
  assert.equal(Number(updated.onHand), 20);
  assert.equal((await prisma.user.findUnique({ where: { id: user.user.id } })).loyaltyPoints, 92);

  const orderId = orderWithRecipe.body.orderId;
  const cancelled = await api('/orders/' + orderId + '/cancel', {
    method: 'PATCH', token: adminSession.body.access_token,
  });
  assert.equal(cancelled.status, 200, JSON.stringify(cancelled.body));
  assert.equal(cancelled.body.status, 'CANCELLED');
  assert.equal(await prisma.inventoryMovement.count({ where: { orderId } }), 0);
  assert.equal((await prisma.user.findUnique({ where: { id: user.user.id } })).loyaltyPoints, 95);
  assert.equal((await prisma.loyaltyTransaction.findFirst({ where: { orderId, type: 'REFUND' } })).points, 3);
  assert.equal(Number((await prisma.ingredient.findUnique({ where: { id: ingredient.body.id } })).onHand), 20);
});

test('checkout aggregates size and topping quantities and permits exactly enough stock', async () => {
  const product = await api('/products/' + products[0]);
  const large = product.body.sizes.find(size => size.name === 'L');
  assert.ok(large);
  const coffee = await fixtureIngredient('coffee');
  const milk = await fixtureIngredient('milk');
  await prisma.ingredient.update({ where: { id: coffee.id }, data: { onHand: 12 } });
  await prisma.ingredient.update({ where: { id: milk.id }, data: { onHand: 15 } });
  const order = await createOrder([
    { productId: products[0], sizeId: large.id, toppingIds: [toppingId], quantity: 2 },
    { productId: products[0], quantity: 1 },
  ]);
  assert.equal(await onHand('coffee'), 12);
  assert.equal(await onHand('milk'), 15);
  const paid = await mockPayment(order.orderId);
  assert.equal(paid.status, 200, JSON.stringify(paid.body));
  assert.equal(paid.body.paymentStatus, 'SUCCESS');
  assert.equal(await onHand('coffee'), 0);
  assert.equal(await onHand('milk'), 0);
});

test('missing recipes and insufficient ingredients do not create a payment or leave partial debits', async () => {
  const coffee = await fixtureIngredient('coffee');
  const milk = await fixtureIngredient('milk');
  assert.ok(coffee.id < milk.id);
  await prisma.ingredient.update({ where: { id: coffee.id }, data: { onHand: 3 } });
  await prisma.ingredient.update({ where: { id: milk.id }, data: { onHand: 4 } });

  const noRecipe = await createOrder([{ productId: products[1], quantity: 1 }]);
  const missing = await mockPayment(noRecipe.orderId);
  assert.equal(missing.status, 409);
  assert.equal(missing.body.code, 'INGREDIENT_RECIPE_MISSING');

  const order = await createOrder([{ productId: products[0], quantity: 1 }]);
  const key = randomUUID();
  const shortage = await mockPayment(order.orderId, { key });
  assert.equal(shortage.status, 409);
  assert.equal(shortage.body.code, 'INSUFFICIENT_INGREDIENT_STOCK');
  assert.equal(await onHand('coffee'), 3);
  assert.equal(await onHand('milk'), 4);
  assert.equal(await prisma.payment.count({ where: { orderId: { in: [order.orderId, noRecipe.orderId] } } }), 0);
  assert.equal(await prisma.inventoryMovement.count({ where: { orderId: order.orderId } }), 0);
  assert.equal((await api('/orders/' + order.orderId, { token: user.access_token })).body.status, 'PENDING');

  await prisma.ingredient.update({ where: { id: milk.id }, data: { onHand: 5 } });
  assert.equal((await mockPayment(order.orderId, { key })).body.paymentStatus, 'SUCCESS');
});

test('simultaneous payments for different customers cannot oversell the same ingredients', async () => {
  const coffee = await fixtureIngredient('coffee');
  const milk = await fixtureIngredient('milk');
  await prisma.ingredient.update({ where: { id: coffee.id }, data: { onHand: 3 } });
  await prisma.ingredient.update({ where: { id: milk.id }, data: { onHand: 5 } });
  const customers = await Promise.all([registerCustomer(), registerCustomer()]);
  const orders = await Promise.all(customers.map(({ access_token }) =>
    createOrder([{ productId: products[0], quantity: 1 }], access_token),
  ));
  const results = await Promise.all(orders.map(({ orderId }, i) =>
    mockPayment(orderId, { token: customers[i].access_token }),
  ));
  assert.deepEqual(results.map(result => result.status).sort((a, b) => a - b), [200, 409]);
  assert.equal(results.find(result => result.status === 409).body.code, 'INSUFFICIENT_INGREDIENT_STOCK');
  assert.equal(results.find(result => result.status === 200).body.paymentStatus, 'SUCCESS');
  assert.equal(await onHand('coffee'), 0);
  assert.equal(await onHand('milk'), 0);
  assert.equal(await prisma.payment.count({ where: { orderId: { in: orders.map(order => order.orderId) } } }), 1);
});

test('migration transfers active VNPay reservations and releases only unpaid legacy reservations', async () => {
  const legacySchema = 'bl_legacy_' + randomUUID().replaceAll('-', '');
  await admin.query('CREATE SCHEMA "' + legacySchema + '"');
  const legacy = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL, options: '-c search_path=' + legacySchema + ',public' });
  try {
    for (const name of previousMigrations) await legacy.query(migration(name));
    const userId = randomUUID();
    const paymentId = randomUUID();
    const [pending, unpaid, reversed, paid] = Array.from({ length: 4 }, () => randomUUID());
    await legacy.query("INSERT INTO users (id, email, full_name, password_hash) VALUES ($1, 'legacy@example.test', 'Legacy User', 'fixture')", [userId]);
    await legacy.query("INSERT INTO ingredients (id, name, unit, on_hand) VALUES (1, 'Legacy Coffee', 'g', 10)");
    for (const [id, status] of [[pending, 'PENDING'], [unpaid, 'PENDING'], [reversed, 'PENDING'], [paid, 'PAID']]) {
      await legacy.query(
        "INSERT INTO orders (id, order_code, user_id, status, total_amount, items) VALUES ($1, $2, $3, $4, 1000, '[{}]')",
        [id, 'LEGACY-' + id, userId, status],
      );
      await legacy.query(
        "INSERT INTO inventory_movements (order_id, ingredient_id, type, quantity, reason) VALUES ($1, 1, 'CONSUMPTION', -2, 'legacy')",
        [id],
      );
    }
    await legacy.query("INSERT INTO inventory_movements (order_id, ingredient_id, type, quantity, reason) VALUES ($1, 1, 'REVERSAL', 2, 'legacy')", [reversed]);
    await legacy.query(
      "INSERT INTO payments (id, user_id, order_id, idempotency_key, payment_method, amount, status, response) VALUES ($1, $2, $3, $4, 'VNPAY', 1000, 'PENDING', '{}')",
      [paymentId, userId, pending, randomUUID()],
    );

    await legacy.query(migration(inventoryMigration));
    assert.equal((await legacy.query("SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'products' AND column_name = 'stock'")).rowCount, 0);
    assert.equal(Number((await legacy.query('SELECT on_hand FROM ingredients WHERE id = 1')).rows[0].on_hand), 12);
    const movements = (await legacy.query('SELECT order_id, payment_id, type, quantity FROM inventory_movements ORDER BY id')).rows;
    assert.equal(movements.length, 6);
    assert.deepEqual(movements.filter(row => row.payment_id !== null).map(row => [row.order_id, row.payment_id, row.type]), [[pending, paymentId, 'CONSUMPTION']]);
    assert.deepEqual(movements.filter(row => row.type === 'REVERSAL').map(row => [row.order_id, Number(row.quantity)]), [[reversed, 2], [unpaid, 2]]);
  } finally {
    await legacy.end();
    await admin.query('DROP SCHEMA "' + legacySchema + '" CASCADE');
  }
});
