const prisma = require('../prisma/client');

const updateLayout = async () => {
  try {
    console.log('Starting table layout update...');

    // Find Trikal Cafe
    const restaurant = await prisma.restaurant.findFirst({
      where: { name: 'Trikal Cafe' }
    });

    if (!restaurant) {
      console.error('Restaurant Trikal Cafe not found!');
      process.exit(1);
    }

    const restaurantId = restaurant.id;
    console.log(`Found restaurant: ${restaurant.name} (${restaurantId})`);

    // Fetch existing tables
    const tables = await prisma.restaurantTable.findMany({
      where: { restaurantId },
      orderBy: { tableNumber: 'asc' }
    });

    console.log(`Found ${tables.length} existing tables.`);

    // Define the correct, clean, non-overlapping table layout configuration
    // 2 VIP Private Cabins on the left
    // 3 Window Side tables at the top center
    // 1 Bar Area table at the top right
    // 2 Center tables in the main dining hall
    const targetLayout = [
      {
        tableNumber: 'T1',
        category: 'Private Cabin',
        capacity: 4,
        positionX: 12.5,
        positionY: 45.0,
        description: 'Luxurious private glass cabin table offering ultimate seclusion and quiet ambiance.'
      },
      {
        tableNumber: 'T2',
        category: 'Window Side',
        capacity: 5,
        positionX: 34.0,
        positionY: 11.0,
        description: 'Prime window-side seating with stunning views of the evening skyline.'
      },
      {
        tableNumber: 'T3',
        category: 'Window Side',
        capacity: 3,
        positionX: 48.0,
        positionY: 11.0,
        description: 'Intimate scenic window table perfect for relaxed conversations.'
      },
      {
        tableNumber: 'T4',
        category: 'Window Side',
        capacity: 4,
        positionX: 62.0,
        positionY: 11.0,
        description: 'Comfortable table right next to the grand floor-to-ceiling glass panel windows.'
      },
      {
        tableNumber: 'T5',
        category: 'Bar Area',
        capacity: 2,
        positionX: 85.0,
        positionY: 11.0,
        description: 'High-top seating near the cocktail bar, perfect for couples enjoying mixologist craft.'
      },
      {
        tableNumber: 'T6',
        category: 'Private Cabin',
        capacity: 6,
        positionX: 12.5,
        positionY: 68.0,
        description: 'Spacious private cabin table for families and larger groups seeking a private dining experience.'
      },
      {
        tableNumber: 'T7',
        category: 'Center',
        capacity: 4,
        positionX: 36.0,
        positionY: 45.0,
        description: 'Grand dining hall table situated under the central crystal chandelier.'
      },
      {
        tableNumber: 'T8',
        category: 'Center',
        capacity: 4,
        positionX: 62.0,
        positionY: 45.0,
        description: 'Elegant dining hall table offering swift butler access and lively energy.'
      }
    ];

    // If there are exactly 8 tables, update them one-by-one mapping by original indices
    // This preserves existing booking associations if any.
    if (tables.length === 8) {
      for (let i = 0; i < 8; i++) {
        const originalTable = tables[i];
        const target = targetLayout[i];

        await prisma.restaurantTable.update({
          where: { id: originalTable.id },
          data: {
            tableNumber: target.tableNumber,
            category: target.category,
            capacity: target.capacity,
            positionX: target.positionX,
            positionY: target.positionY,
            description: target.description
          }
        });
        console.log(`Updated table ${originalTable.tableNumber} -> ${target.tableNumber}`);
      }
    } else {
      // Re-create tables if count differs
      console.log('Table count is not 8. Re-creating tables to match target layout.');
      
      // Delete existing bookings first to avoid foreign key issues
      await prisma.booking.deleteMany({ where: { restaurantId } });
      await prisma.restaurantTable.deleteMany({ where: { restaurantId } });

      for (const target of targetLayout) {
        await prisma.restaurantTable.create({
          data: {
            restaurantId,
            ...target
          }
        });
        console.log(`Created table ${target.tableNumber}`);
      }
    }

    console.log('Table layout successfully updated!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating table layout:', error);
    process.exit(1);
  }
};

updateLayout();
