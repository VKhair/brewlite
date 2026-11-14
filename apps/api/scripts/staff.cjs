// Local operator command: deliberately no public role-changing HTTP endpoint.
const { config } = require('dotenv');
const { resolve } = require('node:path');
const { Client } = require('pg');
config({ path: resolve(__dirname, '../../../.env') });
config();
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !process.env.DATABASE_URL) throw new Error('Usage: npm run user:staff -- email@example.com (DATABASE_URL required)');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query("UPDATE users SET role = 'STAFF' WHERE email = $1 RETURNING id, email, role", [email]);
    if (!result.rows.length) throw new Error('Register this user first');
    console.log(result.rows[0]);
  } finally { await client.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
