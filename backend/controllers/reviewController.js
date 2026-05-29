const prisma = require('../prisma/client');

// Helper to recalculate and update restaurant rating
const updateRestaurantRating = async (restaurantId) => {
  try {
    const aggregate = await prisma.review.aggregate({
      where: { restaurantId },
      _avg: {
        rating: true
      }
    });

    const averageRating = aggregate._avg.rating ? parseFloat(aggregate._avg.rating.toFixed(1)) : null;

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { rating: averageRating }
    });
  } catch (err) {
    console.error('Error updating restaurant rating:', err);
  }
};

exports.createReview = async (req, res) => {
  try {
    const { restaurantId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!restaurantId || rating === undefined || comment === undefined) {
      return res.status(400).json({ success: false, message: 'Restaurant ID, rating, and comment are required.' });
    }

    const ratingVal = parseInt(rating, 10);
    if (ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    // Check if review already exists from this user for this restaurant
    const existingReview = await prisma.review.findFirst({
      where: { userId, restaurantId }
    });

    let review;
    if (existingReview) {
      // Update existing
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: { rating: ratingVal, comment }
      });
    } else {
      // Create new
      review = await prisma.review.create({
        data: {
          userId,
          restaurantId,
          rating: ratingVal,
          comment
        }
      });
    }

    // Update restaurant average rating
    await updateRestaurantRating(restaurantId);

    res.status(200).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRestaurantReviews = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { restaurantId },
      include: {
        user: {
          select: {
            name: true,
            profilePicture: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: req.user.id },
      include: {
        restaurant: {
          select: {
            name: true,
            location: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAdminReviews = async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { adminId: req.user.id }
    });

    if (restaurants.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [], ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, averageRating: 0 });
    }

    const restaurantIds = restaurants.map(r => r.id);

    const reviews = await prisma.review.findMany({
      where: { restaurantId: { in: restaurantIds } },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            profilePicture: true
          }
        },
        restaurant: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate rating breakdown and aggregate average rating
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumRatings = 0;
    reviews.forEach(r => {
      if (breakdown[r.rating] !== undefined) {
        breakdown[r.rating] += 1;
      }
      sumRatings += r.rating;
    });

    const averageRating = reviews.length > 0 ? parseFloat((sumRatings / reviews.length).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
      ratingBreakdown: breakdown,
      averageRating
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
