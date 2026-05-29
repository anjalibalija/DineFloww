const prisma = require('../prisma/client');

const clearMenu = async () => {
  try {
    console.log('Starting menu highlights cleanup...');

    // Find Trikal Cafe
    const restaurant = await prisma.restaurant.findFirst({
      where: { name: 'Trikal Cafe' }
    });

    if (!restaurant) {
      console.error('Restaurant Trikal Cafe not found!');
      process.exit(1);
    }

    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { menuHighlights: '' }
    });

    console.log('Menu highlights successfully cleared for Trikal Cafe!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing menu highlights:', error);
    process.exit(1);
  }
};

clearMenu();
