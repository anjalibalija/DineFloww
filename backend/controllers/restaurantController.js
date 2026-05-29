const prisma = require('../prisma/client');

exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany();
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getNearbyRestaurants = async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({ take: 5 });
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
      include: { tables: true }
    });
    if (!restaurant) return res.status(404).json({ success: false, message: `Restaurant not found with id of ${req.params.id}` });
    res.status(200).json({ success: true, data: restaurant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Admin: get only their own restaurants
exports.getMyRestaurants = async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { adminId: req.user.id },
      include: {
        tables: true,
        _count: { select: { bookings: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.createRestaurant = async (req, res) => {
  try {
    const {
      name, description, cuisine, location, city, state, pincode,
      phone, email, ownerName, latitude, longitude, priceRange,
      openingTime, closingTime, menuHighlights, tableCategories,
      image, crowdLevel, queueCount, rating
    } = req.body;

    if (!name || !description || !cuisine || !location) {
      return res.status(400).json({ success: false, message: 'Name, description, cuisine, and location are required.' });
    }

    // Enforce single restaurant restriction per admin
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: { adminId: req.user.id }
    });
    if (existingRestaurant) {
      return res.status(400).json({ success: false, message: 'You have already registered a restaurant. Admins can only manage one restaurant.' });
    }



    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        description,
        cuisine,
        location,
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        phone: phone || '',
        email: email || '',
        ownerName: ownerName || '',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        priceRange: priceRange || '$$',
        openingTime: openingTime || '10:00',
        closingTime: closingTime || '22:00',
        menuHighlights: menuHighlights || '',
        tableCategories: tableCategories || '',
        image: image || 'no-photo.jpg',
        crowdLevel: crowdLevel || 'Low',
        queueCount: queueCount ? parseInt(queueCount, 10) : 0,
        rating: rating ? parseFloat(rating) : null,
        adminId: req.user.id
      }
    });
    res.status(201).json({ success: true, data: restaurant });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    // Only the owning admin can update
    if (restaurant.adminId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only edit your own restaurants.' });
    }

    // Parse numeric fields if present
    const updateData = { ...req.body };
    if (updateData.latitude) updateData.latitude = parseFloat(updateData.latitude);
    if (updateData.longitude) updateData.longitude = parseFloat(updateData.longitude);
    if (updateData.queueCount) updateData.queueCount = parseInt(updateData.queueCount, 10);
    if (updateData.rating) updateData.rating = parseFloat(updateData.rating);

    const updated = await prisma.restaurant.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }

    // Only the owning admin can delete
    if (restaurant.adminId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own restaurants.' });
    }

    await prisma.restaurant.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
