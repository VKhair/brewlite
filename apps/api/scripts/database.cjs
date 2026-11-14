const { config } = require('dotenv');
const { resolve } = require('node:path');
const { readFileSync } = require('node:fs');
const { Client } = require('pg');

config({ path: resolve(__dirname, '../../../.env') });
config();
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const file = process.argv[2];
  if (!['schema.sql', 'seed.sql'].includes(file)) throw new Error('Unknown database script');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const files = file === 'schema.sql' ? ['schema.sql', '002-commerce.sql'] : [file];
    for (const sqlFile of files) {
      await client.query(readFileSync(resolve(__dirname, '../db', sqlFile), 'utf8'));
    }
    console.log(`${file} completed`);
  } finally { await client.end(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
