const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../dist/generated/prisma/client.js');

const rootEnv = resolve(__dirname, '../../../.env');
const localEnv = resolve(__dirname, '../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);
if (existsSync(localEnv)) process.loadEnvFile(localEnv);

async function main() {
  const role = process.argv[2];
  const email = process.argv[3]?.trim().toLowerCase();
  if (!['STAFF', 'ADMIN'].includes(role) || !email || !process.env.DATABASE_URL) {
    throw new Error('Usage: npm run user:staff -- email@example.com | npm run user:admin -- email@example.com');
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const user = await prisma.user.update({ where: { email }, data: { role }, select: { id: true, email: true, role: true } });
    console.log(user);
  } catch (error) {
    if (error.code === 'P2025') throw new Error('Register this user first');
    throw error;
  } finally { await prisma.$disconnect(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
