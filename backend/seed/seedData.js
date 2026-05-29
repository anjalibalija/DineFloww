const dotenv = require('dotenv');
const prisma = require('../prisma/client');
const bcrypt = require('bcryptjs');

dotenv.config({ path: '../.env' });

const importData = async () => {
  try {
    // Clear the database tables
    await prisma.booking.deleteMany();
    await prisma.restaurantTable.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();

    console.log('Existing data cleared');

    const salt = await bcrypt.genSalt(10);
    const adminHashed = await bcrypt.hash('adminpassword', salt);
    const userHashed = await bcrypt.hash('userpassword', salt);

    const admin = await prisma.user.create({
      data: { name: 'Admin User', email: 'admin@dineflow.com', password: adminHashed, role: 'admin' }
    });

    await prisma.user.create({
      data: { name: 'Test Customer', email: 'user@dineflow.com', password: userHashed, role: 'user' }
    });

    console.log('Users seeded');
    console.log('  Admin: admin@dineflow.com / adminpassword');
    console.log('  User:  user@dineflow.com / userpassword');

    console.log('No default restaurants seeded');
    console.log('Data Imported successfully');
    process.exit();
  } catch (error) {
    console.error('Error with data import:', error);
    process.exit(1);
  }
};

importData();
