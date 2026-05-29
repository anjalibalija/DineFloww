const dotenv = require('dotenv');
const prisma = require('../prisma/client');

dotenv.config({ path: '../.env' });

const deleteDemoRestaurants = async () => {
  try {
    // Demo restaurant names from seedData.js
    const demoNames = [
      'The Golden Plate',
      'Sushi Symphony',
      'Bella Roma',
      'Spice Route'
    ];

    console.log('Finding demo restaurants...');
    const demoRestaurants = await prisma.restaurant.findMany({
      where: { name: { in: demoNames } },
      select: { id: true, name: true }
    });

    if (demoRestaurants.length === 0) {
      console.log('No demo restaurants found in the database.');
      process.exit(0);
    }

    const demoIds = demoRestaurants.map(r => r.id);
    console.log(`Found ${demoRestaurants.length} demo restaurant(s):`, demoRestaurants.map(r => r.name));

    // Delete in correct order to respect foreign keys
    console.log('Deleting related bookings...');
    const bookingsResult = await prisma.booking.deleteMany({
      where: { restaurantId: { in: demoIds } }
    });
    console.log(`  Deleted ${bookingsResult.count} booking(s).`);

    console.log('Deleting related tables...');
    const tablesResult = await prisma.restaurantTable.deleteMany({
      where: { restaurantId: { in: demoIds } }
    });
    console.log(`  Deleted ${tablesResult.count} table(s).`);

    console.log('Deleting related favorites...');
    const favResult = await prisma.favorite.deleteMany({
      where: { restaurantId: { in: demoIds } }
    });
    console.log(`  Deleted ${favResult.count} favorite(s).`);

    console.log('Deleting demo restaurants...');
    const restResult = await prisma.restaurant.deleteMany({
      where: { id: { in: demoIds } }
    });
    console.log(`  Deleted ${restResult.count} restaurant(s).`);

    console.log('\n✅ All demo restaurants and their related data have been removed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting demo restaurants:', error);
    process.exit(1);
  }
};

deleteDemoRestaurants();
