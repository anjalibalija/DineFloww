const prisma = require('./backend/prisma/client');

async function test() {
  const all = await prisma.restaurant.findMany();
  console.log('All restaurants in DB:', JSON.stringify(all, null, 2));

  const where1 = {
    cuisine: { contains: "Fine Dining", mode: 'insensitive' },
    city: { contains: "tumkur", mode: 'insensitive' }
  };
  const res1 = await prisma.restaurant.findMany({ where: where1 });
  console.log('Strict Query with contains:', JSON.stringify(res1, null, 2));

  const where2 = {
    cuisine: "Fine Dining",
    city: "tumkur"
  };
  const res2 = await prisma.restaurant.findMany({ where: where2 });
  console.log('Strict Query exact:', JSON.stringify(res2, null, 2));

  process.exit(0);
}
test();
