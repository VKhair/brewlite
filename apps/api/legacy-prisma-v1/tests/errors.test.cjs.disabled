require('reflect-metadata');
const { test, before, after, mock } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Test } = require('@nestjs/testing');
const { JwtService } = require('@nestjs/jwt');
const { Logger, InternalServerErrorException } = require('@nestjs/common');
const { AppModule } = require('../dist/app.module');
const { Database } = require('../dist/database');
const { jwtOptions } = require('../dist/auth');
const { configureHttp } = require('../dist/http');

let app, base, token, failure, queries = 0, transactions = 0;
const logs = [];
const userId = randomUUID();
before(async () => {
  process.env.JWT_SECRET = 'validation-test-secret-at-least-32-bytes';
  mock.method(Logger.prototype, 'error', (...args) => logs.push(args));
  const database = {
    async query(sql) {
      queries++;
      if (sql.includes('FROM users WHERE id')) return { rows: [{ id: userId, email: 'test@example.com', fullName: 'Test User', role: 'CUSTOMER' }] };
      if (failure) throw failure;
      return { rows: [] };
    },
    async transaction() { transactions++; throw new Error('Invalid requests must never reach a transaction'); },
  };
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(Database).useValue(database).compile();
  app = module.createNestApplication({ logger: false, bodyParser: false });
  configureHttp(app);
  await app.listen(0, '127.0.0.1'); base = await app.getUrl();
  token = await new JwtService(jwtOptions()).signAsync({ sub: userId });
});
after(async () => { await app?.close(); mock.restoreAll(); });

async function request(path, body, options = {}) {
  const response = await fetch(`${base}${path}`, {
    method: options.method ?? (body === undefined ? 'GET' : 'POST'),
    headers: { 'Content-Type': 'application/json', ...(options.auth ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    body: body === undefined ? undefined : options.raw ? body : JSON.stringify(body),
  });
  const result = await response.json();
  assert.equal(result.statusCode, response.status);
  assert.match(result.requestId, /^[0-9a-f-]{36}$/);
  assert.equal(response.headers.get('x-request-id'), result.requestId);
  assert.equal(typeof result.code, 'string');
  assert.ok(Array.isArray(result.details));
  assert.ok(Number.isFinite(Date.parse(result.timestamp)));
  return { status: response.status, body: result };
}
function field(result, name) {
  assert.equal(result.status, 400, JSON.stringify(result.body));
  assert.equal(result.body.code, 'VALIDATION_ERROR');
  assert.ok(result.body.details.some(d => d.field === name && d.messages.length), JSON.stringify(result.body));
}
const valid = { email: 'valid@example.com', password: 'BrewLite123', fullName: 'Valid Name' };

test('validation returns field errors without input values or database writes', async () => {
  const before = queries;
  const result = await request('/auth/register', { ...valid, email: 'secret-invalid-email', password: 'secret', fullName: '   ' });
  for (const name of ['email', 'password', 'fullName']) field(result, name);
  assert.equal(queries, before);
  assert.doesNotMatch(JSON.stringify(result.body), /secret-invalid-email|"value"|"target"|BrewLite123/);
});
test('registration rejects missing values, invalid types, punctuation-only names and null optional phone', async () => {
  for (const [change, name] of [
    [{ email: null }, 'email'], [{ password: 123456 }, 'password'], [{ fullName: '--' }, 'fullName'],
    [{ phone: null }, 'phone'], [{ phone: '0123456789' }, 'phone'], [{ email: ['x@example.com'] }, 'email'],
    [{ password: 'ệ'.repeat(25) + '1' }, 'password'], [{ password: 'Ab12' }, 'password'],
  ]) field(await request('/auth/register', { ...valid, ...change }), name);
  const empty = await request('/auth/register', {});
  for (const name of ['email', 'password', 'fullName']) field(empty, name);
});
test('login validates byte length and rejects extra fields before querying users', async () => {
  const before = queries;
  field(await request('/auth/login', { email: valid.email, password: 'ệ'.repeat(25) + '1' }), 'password');
  field(await request('/auth/login', { email: valid.email, password: valid.password, role: 'STAFF' }), 'role');
  assert.equal(queries, before);
});
test('nested order fields reject null options, unknown prices and non-integer quantities', async () => {
  const before = transactions;
  for (const [extra, name] of [
    [{ quantity: '1' }, 'quantity'], [{ quantity: -1 }, 'quantity'], [{ quantity: 100 }, 'quantity'],
    [{ quantity: 1.5 }, 'quantity'], [{ sizeId: null }, 'sizeId'], [{ toppingIds: null }, 'toppingIds'],
    [{ toppingIds: [null] }, 'toppingIds'], [{ price: 1 }, 'price'],
  ]) field(await request('/orders', { items: [{ productId: randomUUID(), quantity: 1, ...extra }] }, { auth: true }), `items.0.${name}`);
  for (const items of [[], [null], [[]], [1], 'wrong']) {
    assert.equal((await request('/orders', { items }, { auth: true })).status, 400);
  }
  const tooMany = Array.from({ length: 51 }, () => ({ productId: randomUUID(), quantity: 1 }));
  field(await request('/orders', { items: tooMany }, { auth: true }), 'items');
  field(await request('/orders', { items: [{ productId: randomUUID(), quantity: 1, toppingIds: Array.from({ length: 21 }, () => randomUUID()) }] }, { auth: true }), 'items.0.toppingIds');
  assert.equal(transactions, before);
});
test('payment header and route parameter errors identify the invalid field', async () => {
  field(await request('/payments', { orderId: randomUUID(), paymentMethod: 'CARD', mockOutcome: 'SUCCESS' }, { auth: true }), 'headers.idempotency-key');
  for (const path of ['/products/bad', '/orders/bad', '/orders/bad/cancel', '/orders/bad/status']) {
    field(await request(path, path.endsWith('/status') ? { status: 'READY' } : undefined,
      { auth: true, method: path.endsWith('/cancel') || path.endsWith('/status') ? 'PATCH' : 'GET' }), 'params.id');
  }
});
test('malformed JSON is 400 and never echoes the submitted password', async () => {
  const result = await request('/auth/login', '{"password":"super-secret-value",', { raw: true });
  assert.equal(result.status, 400); assert.equal(result.body.code, 'INVALID_JSON');
  assert.doesNotMatch(JSON.stringify(result.body), /super-secret-value|SyntaxError|stack/);
});
test('root arrays, primitive bodies and excessive nesting cannot reach DTO transformation', async () => {
  for (const value of [[], [valid], 'hello', 1, true, null]) {
    assert.equal((await request('/auth/register', JSON.stringify(value), { raw: true })).status, 400);
  }
  let value = {};
  for (let i = 0; i < 20; i++) value = { next: value };
  const result = await request('/auth/register', value);
  assert.equal(result.status, 400); assert.equal(result.body.code, 'PAYLOAD_TOO_COMPLEX');
});
test('oversized request body returns the standard 413 format', async () => {
  const result = await request('/auth/register', { ...valid, fullName: 'x'.repeat(70000) });
  assert.equal(result.status, 413); assert.equal(result.body.code, 'PAYLOAD_TOO_LARGE');
});
test('prototype keys cannot bypass whitelist validation or pollute objects', async () => {
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    const body = JSON.stringify(valid).replace(/}$/, `,"${key}":{"polluted":true}}`);
    field(await request('/auth/register', body, { raw: true }), 'body');
  }
  assert.equal({}.polluted, undefined);
});
test('unsupported JSON charset returns a safe 415', async () => {
  const result = await request('/auth/register', valid, { headers: { 'Content-Type': 'application/json; charset=made-up' } });
  assert.equal(result.status, 415); assert.equal(result.body.code, 'UNSUPPORTED_ENCODING');
});
test('authentication and unknown routes use the same envelope and do not echo query secrets', async () => {
  const unauthorized = await request('/orders/me');
  assert.equal(unauthorized.status, 401); assert.equal(unauthorized.body.code, 'UNAUTHORIZED');
  const missing = await request('/does-not-exist?token=secret-query-token');
  assert.equal(missing.status, 404); assert.equal(missing.body.path, '/does-not-exist');
  assert.doesNotMatch(JSON.stringify(missing.body), /secret-query-token/);
});
test('database outages return 503 and the API recovers on the next healthy request', async () => {
  try {
    for (const code of ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', '08006', '57P03', '53300']) {
      failure = Object.assign(new Error('postgresql://admin:secret@private-db/internal'), { code });
      const result = await request('/products');
      assert.equal(result.status, 503); assert.equal(result.body.code, 'SERVICE_UNAVAILABLE');
      assert.doesNotMatch(JSON.stringify(result.body), /private-db|admin|secret|stack/);
    }
  } finally { failure = undefined; }
  const healthy = await fetch(`${base}/products`);
  assert.equal(healthy.status, 200); assert.deepEqual(await healthy.json(), []);
});
test('database constraints and concurrent-write conflicts return safe 409 errors', async () => {
  try {
    for (const code of ['23505', '23503', '23514', '40001', '40P01', '55P03']) {
      failure = Object.assign(new Error('SQL contains secret-password and table internal_users'), { code, detail: 'secret-password' });
      const result = await request('/products');
      assert.equal(result.status, 409);
      assert.equal(result.body.code, ['40001', '40P01', '55P03'].includes(code) ? 'CONCURRENT_MODIFICATION' : 'DATA_CONFLICT');
      assert.doesNotMatch(JSON.stringify(result.body), /secret-password|internal_users/);
    }
  } finally { failure = undefined; }
});
test('unexpected errors and HTTP 500 messages are redacted in both response and logs', async () => {
  try {
    for (const error of [new Error('secret-password SQL SELECT FROM internal_users'),
      new InternalServerErrorException('secret-password SQL SELECT FROM internal_users')]) {
      failure = error;
      const result = await request('/products');
      assert.equal(result.status, 500); assert.equal(result.body.code, 'INTERNAL_ERROR');
      assert.equal(result.body.message, 'Internal server error');
      assert.doesNotMatch(JSON.stringify(result.body), /secret-password|internal_users|stack/);
      assert.ok(logs.some(args => JSON.stringify(args).includes(result.body.requestId)));
    }
    assert.doesNotMatch(JSON.stringify(logs), /secret-password|internal_users|private-db/);
  } finally { failure = undefined; }
});
test('failed rollback discards the broken connection and preserves the original business error', async () => {
  const original = new Error('original business failure');
  const calls = [];
  let discarded;
  const client = {
    async query(sql) { calls.push(sql); if (sql === 'ROLLBACK') throw new Error('rollback connection lost'); },
    release(value) { discarded = value; },
  };
  const database = { async connect() { return client; } };
  await assert.rejects(Database.prototype.transaction.call(database, async () => { throw original; }), error => error === original);
  assert.deepEqual(calls, ['BEGIN', 'ROLLBACK']); assert.equal(discarded, true);
});
