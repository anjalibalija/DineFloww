const prisma = require('../prisma/client');

const calculateNoShowRisk = (booking) => {
  let score = 15; // base risk: 15%

  // 1. Party size factor (larger groups have higher cancellation/no-show risk)
  if (booking.peopleCount > 6) score += 25;
  else if (booking.peopleCount > 4) score += 15;

  // 2. Hour/Time factor (late night bookings are higher risk)
  if (booking.bookingTime) {
    const hour = parseInt(booking.bookingTime.split(':')[0], 10);
    if (hour >= 21) score += 20; // 9 PM or later
    else if (hour >= 18) score += 10; // dinner peak
  }

  // 3. Date factor (weekend bookings are higher demand, but also higher cancellation risk)
  if (booking.bookingDate) {
    const day = new Date(booking.bookingDate).getDay();
    if (day === 0 || day === 6) score += 10; // Sunday or Saturday
  }

  // 4. Special request (usually implies high commitment, lower risk)
  if (booking.specialRequest && booking.specialRequest.trim().length > 0) {
    score -= 10;
  }

  // Ensure risk falls within 5% to 95%
  return Math.min(Math.max(score, 5), 95);
};

exports.createBooking = async (req, res) => {
  try {
    req.body.userId = req.user.id;
    const { tableId, bookingDate, bookingTime } = req.body;
    const parsedDate = new Date(bookingDate);

    const existingBooking = await prisma.booking.findFirst({
      where: { tableId, bookingDate: parsedDate, bookingTime }
    });

    if (existingBooking) {
      return res.status(400).json({ success: false, message: 'Table is already booked for this specific time and date.' });
    }

    const booking = await prisma.booking.create({
      data: {
        ...req.body,
        bookingDate: parsedDate,
        peopleCount: parseInt(req.body.peopleCount, 10)
      }
    });

    await prisma.restaurantTable.update({
      where: { id: tableId },
      data: {
        bookingCount: { increment: 1 },
        isBestseller: true
      }
    });

    res.status(201).json({ success: true, data: { ...booking, noShowRisk: calculateNoShowRisk(booking) } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: { restaurant: true, table: true },
      orderBy: [{ bookingDate: 'desc' }, { bookingTime: 'desc' }]
    });

    const bookingsWithRisk = bookings.map(b => ({
      ...b,
      noShowRisk: calculateNoShowRisk(b)
    }));

    res.status(200).json({ success: true, count: bookingsWithRisk.length, data: bookingsWithRisk });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    if (booking.userId !== req.user.id && req.user.role !== 'admin') {
       return res.status(403).json({ success: false, message: 'Not authorized to delete this booking' });
    }

    await prisma.booking.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    // Admin sees only bookings for their own restaurants
    const bookings = await prisma.booking.findMany({
      where: {
        restaurant: { adminId: req.user.id }
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        restaurant: { select: { name: true } },
        table: { select: { tableNumber: true, category: true } }
      },
      orderBy: [{ bookingDate: 'desc' }, { bookingTime: 'desc' }]
    });

    const bookingsWithRisk = bookings.map(b => ({
      ...b,
      noShowRisk: calculateNoShowRisk(b)
    }));

    res.status(200).json({ success: true, count: bookingsWithRisk.length, data: bookingsWithRisk });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
