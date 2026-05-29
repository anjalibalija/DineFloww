const prisma = require('../prisma/client');

exports.toggleFavorite = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const userId = req.user.id;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Restaurant ID is required.' });
    }

    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_restaurantId: {
          userId,
          restaurantId
        }
      }
    });

    if (existing) {
      // Remove favorite
      await prisma.favorite.delete({
        where: {
          userId_restaurantId: {
            userId,
            restaurantId
          }
        }
      });
      return res.status(200).json({ success: true, isFavorite: false, message: 'Removed from favorites.' });
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: {
          userId,
          restaurantId
        }
      });
      return res.status(201).json({ success: true, isFavorite: true, message: 'Added to favorites.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyFavorites = async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        restaurant: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, count: favorites.length, data: favorites });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
