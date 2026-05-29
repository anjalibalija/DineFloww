const prisma = require('../prisma/client');

exports.getTablesByRestaurant = async (req, res) => {
  try {
    let query = {};
    if (req.params.id) {
      query = { restaurantId: req.params.id };
    }
    const tables = await prisma.restaurantTable.findMany({
      where: query,
      include: { bookings: true },
      orderBy: { tableNumber: 'asc' }
    });
    res.status(200).json({ success: true, count: tables.length, data: tables });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.createTable = async (req, res) => {
  try {
    const { restaurantId, tableNumber, category, capacity } = req.body;

    if (!restaurantId || !tableNumber || !category || !capacity) {
      return res.status(400).json({ success: false, message: 'restaurantId, tableNumber, category, and capacity are required.' });
    }

    // Verify the admin owns this restaurant
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }
    if (restaurant.adminId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only add tables to your own restaurants.' });
    }

    const table = await prisma.restaurantTable.create({
      data: {
        restaurantId,
        tableNumber,
        category,
        capacity: parseInt(capacity, 10),
        description: req.body.description || '',
        positionX: req.body.positionX ? parseFloat(req.body.positionX) : 0,
        positionY: req.body.positionY ? parseFloat(req.body.positionY) : 0
      }
    });
    res.status(201).json({ success: true, data: table });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const table = await prisma.restaurantTable.findUnique({
      where: { id: req.params.id },
      include: { restaurant: true }
    });

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found.' });
    }

    // Verify ownership
    if (table.restaurant.adminId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only edit tables in your own restaurants.' });
    }

    const updateData = { ...req.body };
    if (updateData.capacity) updateData.capacity = parseInt(updateData.capacity, 10);
    if (updateData.positionX) updateData.positionX = parseFloat(updateData.positionX);
    if (updateData.positionY) updateData.positionY = parseFloat(updateData.positionY);
    // Don't allow changing restaurantId
    delete updateData.restaurantId;

    const updated = await prisma.restaurantTable.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteTable = async (req, res) => {
  try {
    const table = await prisma.restaurantTable.findUnique({
      where: { id: req.params.id },
      include: { restaurant: true }
    });

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found.' });
    }

    // Verify ownership
    if (table.restaurant.adminId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete tables in your own restaurants.' });
    }

    await prisma.restaurantTable.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
