const { createHash } = require('node:crypto');
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../dist/generated/prisma/client.js');

const rootEnv = resolve(__dirname, '../../../.env');
const localEnv = resolve(__dirname, '../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);
if (existsSync(localEnv)) process.loadEnvFile(localEnv);
const uuid = hex => `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
const sizeId = (productId, size) => uuid(createHash('md5').update(`${productId}${size}`).digest('hex'));

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const products = [
      ['10000000-0000-4000-8000-000000000001', 'Cà phê sữa', 'Cà phê phin cùng sữa đặc.', 29000, 'Cà phê', true],
      ['10000000-0000-4000-8000-000000000002', 'Trà đào', 'Trà thơm kết hợp đào.', 39000, 'Trà', true],
      ['10000000-0000-4000-8000-000000000003', 'Matcha Freeze', 'Matcha xay đá cùng sữa.', 49000, 'Freeze', true],
      ['10000000-0000-4000-8000-000000000004', 'Cacao đá', 'Cacao sữa đá.', 35000, 'Cacao', false],
    ];
    for (const [id, name, description, basePrice, category, isAvailable] of products) {
      await prisma.product.upsert({ where: { id }, update: {}, create: { id, name, description, basePrice, imageUrl: '/images/drink.svg', category, isAvailable, stock: 100 } });
      for (const [size, priceDelta] of [['S', -5000], ['M', 0], ['L', 10000]]) {
        await prisma.productSize.upsert({ where: { productId_name: { productId: id, name: size } }, update: {},
          create: { id: sizeId(id, size), productId: id, name: size, priceDelta, isDefault: size === 'M' } });
      }
    }
    const toppings = [
      ['20000000-0000-4000-8000-000000000001', 'Thạch cà phê', 5000, true],
      ['20000000-0000-4000-8000-000000000002', 'Đào miếng', 10000, true],
      ['20000000-0000-4000-8000-000000000003', 'Kem phô mai', 10000, false],
    ];
    for (const [id, name, price, isAvailable] of toppings) await prisma.topping.upsert({ where: { id }, update: {}, create: { id, name, price, isAvailable } });
    await prisma.productTopping.createMany({ data: [
      { productId: products[0][0], toppingId: toppings[0][0] },
      { productId: products[1][0], toppingId: toppings[1][0] },
      { productId: products[2][0], toppingId: toppings[2][0] },
    ], skipDuplicates: true });
    for (const coupon of [
      { code: 'BREWLITE10', discountPercent: 10, minOrderAmount: 30000, maxDiscount: 30000 },
      { code: 'GIAM20K', discountAmount: 20000, minOrderAmount: 50000 },
      { code: 'WELCOME', discountAmount: 15000, minOrderAmount: 0 },
    ]) await prisma.coupon.upsert({ where: { code: coupon.code }, update: {}, create: coupon });
    for (const [name, unit] of [['Cà phê', 'g'], ['Sữa', 'ml'], ['Nước', 'ml'], ['Trà', 'g'], ['Đào', 'g'], ['Cam', 'g'], ['Sả', 'g'], ['Matcha', 'g'], ['Trân châu trắng', 'g'], ['Kem Cheese', 'g']]) {
      await prisma.ingredient.upsert({ where: { name }, update: {}, create: { name, unit, onHand: 0 } });
    }
    console.log('Prisma seed completed; existing product and stock values were preserved.');
  } finally { await prisma.$disconnect(); }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
