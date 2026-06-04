const prisma = require('../prisma/client');

exports.getTablesByRestaurant = async (req, res) => {
  try {
    let query = {};
    if (req.params.id) {
      query = { restaurantId: req.params.id };
    }
    let tables = await prisma.restaurantTable.findMany({
      where: query,
      include: { bookings: true },
      orderBy: { tableNumber: 'asc' }
    });

    // Auto-seed tables if this specific restaurant has 0 tables defined
    if (tables.length === 0 && req.params.id) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: req.params.id }
      });
      if (restaurant) {
        console.log(`Auto-seeding 8 default tables for restaurant: ${restaurant.name} (${restaurant.id})`);
        const defaultTables = [
          {
            tableNumber: 'T1',
            category: 'VIP Private Cabins',
            capacity: 4,
            positionX: 12.5,
            positionY: 45.0,
            description: 'Luxurious private glass cabin table offering ultimate seclusion and quiet ambiance.'
          },
          {
            tableNumber: 'T2',
            category: 'Window Side (Scenic View)',
            capacity: 5,
            positionX: 34.0,
            positionY: 11.0,
            description: 'Prime window-side seating with stunning views of the evening skyline.'
          },
          {
            tableNumber: 'T3',
            category: 'Window Side (Scenic View)',
            capacity: 3,
            positionX: 48.0,
            positionY: 11.0,
            description: 'Intimate scenic window table perfect for relaxed conversations.'
          },
          {
            tableNumber: 'T4',
            category: 'Window Side (Scenic View)',
            capacity: 4,
            positionX: 62.0,
            positionY: 11.0,
            description: 'Comfortable table right next to the grand floor-to-ceiling glass panel windows.'
          },
          {
            tableNumber: 'T5',
            category: 'Bar & Lounge',
            capacity: 2,
            positionX: 85.0,
            positionY: 11.0,
            description: 'High-top seating near the cocktail bar, perfect for couples enjoying mixologist craft.'
          },
          {
            tableNumber: 'T6',
            category: 'VIP Private Cabins',
            capacity: 6,
            positionX: 12.5,
            positionY: 68.0,
            description: 'Spacious private cabin table for families and larger groups seeking a private dining experience.'
          },
          {
            tableNumber: 'T7',
            category: 'Main Dining Hall',
            capacity: 4,
            positionX: 36.0,
            positionY: 45.0,
            description: 'Grand dining hall table situated under the central crystal chandelier.'
          },
          {
            tableNumber: 'T8',
            category: 'Main Dining Hall',
            capacity: 4,
            positionX: 62.0,
            positionY: 45.0,
            description: 'Elegant dining hall table offering swift butler access and lively energy.'
          }
        ];

        for (const t of defaultTables) {
          await prisma.restaurantTable.create({
            data: {
              restaurantId: req.params.id,
              ...t
            }
          });
        }

        // Fetch newly created tables
        tables = await prisma.restaurantTable.findMany({
          where: query,
          include: { bookings: true },
          orderBy: { tableNumber: 'asc' }
        });
      }
    }

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

exports.bulkSetTables = async (req, res) => {
  try {
    const restaurantId = req.params.id || req.body.restaurantId;
    const { tables, seatingAreas, tableTypes } = req.body;

    if (!restaurantId || !Array.isArray(tables)) {
      return res.status(400).json({ success: false, message: 'Restaurant ID and tables array are required.' });
    }

    // Verify the admin owns this restaurant
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }
    if (restaurant.adminId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only configure tables for your own restaurants.' });
    }

    // Perform database operations in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete existing bookings for the restaurant
      await tx.booking.deleteMany({
        where: { restaurantId }
      });

      // 2. Delete existing tables for the restaurant
      await tx.restaurantTable.deleteMany({
        where: { restaurantId }
      });

      // 3. Create the new tables
      const createdTables = [];
      for (const t of tables) {
        const newTable = await tx.restaurantTable.create({
          data: {
            restaurantId,
            tableNumber: t.tableNumber,
            category: t.category,
            capacity: parseInt(t.capacity, 10),
            description: t.description || '',
            positionX: t.positionX ? parseFloat(t.positionX) : 0,
            positionY: t.positionY ? parseFloat(t.positionY) : 0,
            isBestseller: t.isBestseller || false
          }
        });
        createdTables.push(newTable);
      }

      // 4. Update the seatingAreas and tableTypes on the restaurant model
      const updatedRestaurant = await tx.restaurant.update({
        where: { id: restaurantId },
        data: {
          seatingAreas: seatingAreas || null,
          tableTypes: tableTypes || null
        }
      });

      return { createdTables, updatedRestaurant };
    });

    res.status(200).json({
      success: true,
      message: 'Restaurant seating structure and tables saved successfully!',
      data: result.createdTables
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

