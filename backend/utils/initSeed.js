const prisma = require('../prisma/client');
const bcrypt = require('bcryptjs');

const initSeed = async () => {
  try {
    const adminExists = await prisma.user.findUnique({ where: { email: 'admin@dineflow.com' } });
    if (adminExists) return; // Already seeded

    console.log('Seeding initial data...');
    
    const salt = await bcrypt.genSalt(10);
    const adminHashed = await bcrypt.hash('adminpassword', salt);
    const userHashed = await bcrypt.hash('userpassword', salt);

    const admin = await prisma.user.create({
      data: { name: 'Admin User', email: 'admin@dineflow.com', password: adminHashed, role: 'admin' }
    });

    await prisma.user.create({
      data: { name: 'Test Customer', email: 'user@dineflow.com', password: userHashed, role: 'user' }
    });

    console.log('No default restaurants seeded on start.');

    console.log('Seed data successfully injected.');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

module.exports = initSeed;
