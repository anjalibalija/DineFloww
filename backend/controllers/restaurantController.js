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
      name, description, cuisine, cuisines, location, city, state, pincode,
      phone, email, ownerName, latitude, longitude, priceRange,
      openingTime, closingTime, menuHighlights, highlights, amenities,
      seatingAreas, tableTypes, operatingHours, coverImage, image, gallery,
      reservationSettings, socialLinks, verification, crowdLevel, queueCount, rating
    } = req.body;

    if (!name || !description || !location) {
      return res.status(400).json({ success: false, message: 'Name, description, and location are required.' });
    }

    // Enforce single restaurant restriction per admin
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: { adminId: req.user.id }
    });
    if (existingRestaurant) {
      return res.status(400).json({ success: false, message: 'You have already registered a restaurant. Admins can only manage one restaurant.' });
    }

    // Parse array fallbacks for backward compatibility
    const finalCuisines = Array.isArray(cuisines) && cuisines.length > 0 
      ? cuisines 
      : (cuisine ? cuisine.split(',').map(c => c.trim()).filter(Boolean) : ['Fine Dining']);
    
    const finalCuisine = finalCuisines.join(', ');

    const finalMenuHighlights = Array.isArray(menuHighlights) 
      ? menuHighlights 
      : (typeof menuHighlights === 'string' ? menuHighlights.split('\n').map(h => h.trim().replace(/^\*\s*/, '')).filter(Boolean) : []);

    const finalHighlights = Array.isArray(highlights) 
      ? highlights 
      : (req.body.tableCategories ? req.body.tableCategories.split(',').map(h => h.trim()).filter(Boolean) : []);

    const finalAmenities = Array.isArray(amenities) ? amenities : [];

    const finalCoverImage = coverImage || image || 'no-photo.jpg';

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        description,
        cuisine: finalCuisine,
        cuisines: finalCuisines,
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
        menuHighlights: finalMenuHighlights,
        highlights: finalHighlights,
        amenities: finalAmenities,
        seatingAreas: seatingAreas || null,
        tableTypes: tableTypes || null,
        operatingHours: operatingHours || null,
        coverImage: finalCoverImage,
        image: finalCoverImage,
        gallery: gallery || null,
        reservationSettings: reservationSettings || null,
        socialLinks: socialLinks || null,
        verification: verification || null,
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

    const updateData = { ...req.body };
    
    // Parse numeric fields if present
    if (updateData.latitude) updateData.latitude = parseFloat(updateData.latitude);
    if (updateData.longitude) updateData.longitude = parseFloat(updateData.longitude);
    if (updateData.queueCount) updateData.queueCount = parseInt(updateData.queueCount, 10);
    if (updateData.rating) updateData.rating = parseFloat(updateData.rating);

    // Sync arrays and backward compatibility strings
    if (updateData.cuisines) {
      updateData.cuisine = Array.isArray(updateData.cuisines) ? updateData.cuisines.join(', ') : String(updateData.cuisines);
    } else if (updateData.cuisine && !updateData.cuisines) {
      updateData.cuisines = updateData.cuisine.split(',').map(c => c.trim()).filter(Boolean);
    }

    if (updateData.menuHighlights) {
      if (typeof updateData.menuHighlights === 'string') {
        updateData.menuHighlights = updateData.menuHighlights.split('\n').map(h => h.trim().replace(/^\*\s*/, '')).filter(Boolean);
      }
    }

    if (updateData.highlights) {
      if (typeof updateData.highlights === 'string') {
        updateData.highlights = updateData.highlights.split(',').map(h => h.trim()).filter(Boolean);
      }
    }

    if (updateData.coverImage || updateData.image) {
      const img = updateData.coverImage || updateData.image;
      updateData.coverImage = img;
      updateData.image = img;
    }

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
