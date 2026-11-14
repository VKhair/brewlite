const { PrismaClient } = require('@prisma/client');
const { createHash } = require('node:crypto');
const db = new PrismaClient();
const products = [
  ['10000000-0000-4000-8000-000000000001','Cà phê sữa','Cà phê phin cùng sữa đặc.',29000,'Cà phê',true],
  ['10000000-0000-4000-8000-000000000002','Trà đào','Trà thơm kết hợp đào.',39000,'Trà',true],
  ['10000000-0000-4000-8000-000000000003','Matcha Freeze','Matcha xay đá cùng sữa.',49000,'Freeze',true],
  ['10000000-0000-4000-8000-000000000004','Cacao đá','Cacao sữa đá.',35000,'Cacao',false],
];
const toppings = [
  ['20000000-0000-4000-8000-000000000001','Thạch cà phê',5000,true],
  ['20000000-0000-4000-8000-000000000002','Đào miếng',10000,true],
  ['20000000-0000-4000-8000-000000000003','Kem phô mai',10000,false],
];
async function main() {
  for (const [id,name,description,basePrice,category,isAvailable] of products) {
    await db.product.upsert({ where: { id }, update: {},
      create: { id,name,description,basePrice,category,isAvailable,imageUrl:'/images/drink.svg' } });
    for (const [size,delta] of [['S',-5000],['M',0],['L',10000]]) {
      const sizeId = createHash('md5').update(id + size).digest('hex');
      const uuid = `${sizeId.slice(0,8)}-${sizeId.slice(8,12)}-${sizeId.slice(12,16)}-${sizeId.slice(16,20)}-${sizeId.slice(20)}`;
      await db.productSize.upsert({ where: { productId_name: { productId:id,name:size } }, update: {},
        create: { id:uuid,productId:id,name:size,priceDelta:delta,isDefault:size==='M' } });
    }
  }
  for (const [id,name,price,isAvailable] of toppings) {
    await db.topping.upsert({where:{id},update:{},create:{id,name,price,isAvailable}});
  }
  for(const [productIndex,toppingIndex] of [[0,0],[1,1],[2,2]]) {
    const productId = products[productIndex][0];
    const toppingId = toppings[toppingIndex][0];
    await db.productTopping.upsert({where:{productId_toppingId:{productId,toppingId}},update:{},create:{productId,toppingId}});
  }
  console.log('Prisma seed completed; existing inventory and orders were not reset.');
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.$disconnect());
