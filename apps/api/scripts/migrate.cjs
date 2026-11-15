const { Client } = require('pg');
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const rootEnv = resolve(__dirname, '../../../.env');
const localEnv = resolve(__dirname, '../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);
if (existsSync(localEnv)) process.loadEnvFile(localEnv);

function runPrisma(args) {
  const cli = resolve(__dirname, '../../../node_modules/prisma/build/index.js');
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: resolve(__dirname, '..'), stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`prisma ${args.join(' ')} failed with exit code ${result.status}`);
}

async function main() {
  if (!process.env.DATABASE_URL && !process.env.PGHOST) throw new Error('DATABASE_URL or PGHOST is required');
  const client = new Client(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : undefined);
  try {
    await client.connect();
    const marker = await client.query("SELECT to_regclass('public._prisma_migrations') AS table_name");
    if (!marker.rows[0].table_name) {
      const tables = await client.query(`SELECT
        to_regclass('public.products') IS NOT NULL AS products,
        to_regclass('public.product_sizes') IS NOT NULL AS sizes,
        to_regclass('public.toppings') IS NOT NULL AS toppings,
        to_regclass('public.product_toppings') IS NOT NULL AS product_toppings,
        to_regclass('public.users') IS NOT NULL AS users,
        to_regclass('public.orders') IS NOT NULL AS orders,
        to_regclass('public.order_status_history') IS NOT NULL AS history,
        to_regclass('public.payments') IS NOT NULL AS payments`);
      const state = tables.rows[0];
      if (Object.values(state).every(Boolean)) {
        const required = await client.query(`SELECT
          (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='stock') AS product_stock,
          (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='items') AS order_items,
          (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='idempotency_key') AS idempotency_key`);
        if (Object.values(required.rows[0]).some(value => Number(value) !== 1)) {
          throw new Error('Existing database is not the recognized BrewLite UUID schema; migration stopped without changing data.');
        }
        console.log('Recognized existing BrewLite database; recording the non-destructive Prisma baseline.');
        runPrisma(['migrate', 'resolve', '--applied', '20261115000000_baseline']);
      }
    }
  } finally {
    await client.end();
  }
  runPrisma(['migrate', 'deploy']);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
