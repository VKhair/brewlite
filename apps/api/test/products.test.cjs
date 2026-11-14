require('reflect-metadata');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const { Test } = require('@nestjs/testing');
const { AppModule } = require('../dist/app.module');
const { Database } = require('../dist/database');
const { configureHttp } = require('../dist/http');

let db, app, base;
const id = '10000000-0000-4000-8000-000000000001';
before(async () => {
  process.env.JWT_SECRET = 'products-test-secret-at-least-32-bytes-long';
  db = new PGlite();
  for (const file of ['schema.sql', 'seed.sql', 'schema.sql', 'seed.sql']) {
    await db.exec(readFileSync(resolve(__dirname, '../db', file), 'utf8'));
  }
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(Database).useValue({ query: (sql, params) => db.query(sql, params) }).compile();
  app = module.createNestApplication({ logger: false, bodyParser: false });
  configureHttp(app);
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
});
after(async () => { await app?.close(); await db?.close(); });

test('GET /products returns available seeded products and numeric VND prices', async () => {
  const response = await fetch(`${base}/products`);
  assert.equal(response.status, 200);
  const products = await response.json();
  assert.equal(products.length, 3);
  for (const p of products) {
    assert.equal(p.isAvailable, true);
    assert.equal(typeof p.basePrice, 'number');
    for (const key of ['id', 'name', 'description', 'imageUrl', 'category']) assert.equal(typeof p[key], 'string');
  }
});
test('GET /products/:id returns sizes, default M and only linked toppings', async () => {
  const response = await fetch(`${base}/products/${id}`);
  assert.equal(response.status, 200);
  const product = await response.json();
  assert.equal(product.id, id);
  assert.deepEqual(product.sizes.map(s => s.name), ['S', 'M', 'L']);
  assert.deepEqual(product.sizes.filter(s => s.isDefault).map(s => s.name), ['M']);
  assert.equal(product.toppings.length, 1);
  assert.equal(product.toppings[0].name, 'Thạch cà phê');
  const freeze = await (await fetch(`${base}/products/10000000-0000-4000-8000-000000000003`)).json();
  assert.equal(freeze.toppings[0].isAvailable, false);
});
test('unknown and unavailable products return 404 with the required message', async () => {
  for (const suffix of ['004', '099']) {
    const response = await fetch(`${base}/products/10000000-0000-4000-8000-000000000${suffix}`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).message, 'Product not found');
  }
});
test('invalid UUID and injection attempts return 400', async () => {
  for (const value of ['invalid', "' OR 1=1--"]) {
    assert.equal((await fetch(`${base}/products/${encodeURIComponent(value)}`)).status, 400);
  }
});
test('schema rejects negative prices and a second default size', async () => {
  await assert.rejects(db.query('UPDATE products SET base_price = -1 WHERE id = $1', [id]));
  await assert.rejects(db.query("UPDATE product_sizes SET is_default = true WHERE product_id = $1 AND name = 'L'", [id]));
});
test('empty catalog and products without options return empty arrays', async () => {
  await db.query('DELETE FROM product_sizes WHERE product_id = $1', [id]);
  await db.query('DELETE FROM product_toppings WHERE product_id = $1', [id]);
  const product = await (await fetch(`${base}/products/${id}`)).json();
  assert.deepEqual(product.sizes, []);
  assert.deepEqual(product.toppings, []);
  await db.query('UPDATE products SET is_available = false');
  const response = await fetch(`${base}/products`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
});
