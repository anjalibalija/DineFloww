const prisma = require('../prisma/client');

const updateMenu = async () => {
  try {
    console.log('Starting menu highlights update...');

    // Find Trikal Cafe
    const restaurant = await prisma.restaurant.findFirst({
      where: { name: 'Trikal Cafe' }
    });

    if (!restaurant) {
      console.error('Restaurant Trikal Cafe not found!');
      process.exit(1);
    }

    const menu = [
      'Paneer Tikka (Appetizers): ₹320 - Clay oven roasted cottage cheese chunks marinated in yogurt and aromatic spices',
      'Veg Biryani (Mains): ₹450 - Fragrant long-grain basmati rice layered with seasonal vegetables, saffron, and fresh mint',
      'Masala Dosa (South Indian): ₹220 - Crispy golden rice and lentil crepe stuffed with a spiced potato mash, served with coconut chutney and sambar',
      'Dal Makhani (Mains): ₹380 - Slow-cooked black lentils and red kidney beans simmered overnight with cream, butter, and tomatoes',
      'Butter Naan (Breads): ₹90 - Traditional soft and fluffy clay oven baked flatbread brushed with melted butter',
      'Gulab Jamun (Desserts): ₹180 - Soft, warm milk-solid dumplings dipped in rose and green cardamom flavored sugar syrup',
      'Mango Lassi (Drinks): ₹150 - Creamy, chilled yogurt drink blended with sweet Alphonso mango pulp and a touch of saffron'
    ].join('\n');

    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { menuHighlights: menu }
    });

    console.log('Menu highlights successfully updated for Trikal Cafe!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating menu highlights:', error);
    process.exit(1);
  }
};

updateMenu();
