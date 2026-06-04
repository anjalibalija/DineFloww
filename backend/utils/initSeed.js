const prisma = require('../prisma/client');
const bcrypt = require('bcryptjs');

const initSeed = async () => {
  try {
    const adminExists = await prisma.user.findUnique({ where: { email: 'admin@dineflow.com' } });
    
    // Perform restaurant migration first (run even if admin exists to migrate any live data)
    await migrateRestaurants();

    if (adminExists) return; // Already seeded basic accounts

    console.log('Seeding initial data...');
    
    const salt = await bcrypt.genSalt(10);
    const adminHashed = await bcrypt.hash('adminpassword', salt);
    const userHashed = await bcrypt.hash('userpassword', salt);

    const admin = await prisma.user.create({
      data: { name: 'Admin User', email: 'admin@dineflow.com', password: adminHashed, role: 'admin' }
    });

    await prisma.user.create({
      data: { name: 'Test Customer', email: 'user@dineflow.com', password: userHashed, role: 'user' }
    });

    console.log('No default restaurants seeded on start.');
    console.log('Seed data successfully injected.');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

const migrateRestaurants = async () => {
  try {
    const restaurants = await prisma.restaurant.findMany();
    if (restaurants.length === 0) return;

    console.log(`Checking backward compatibility and migrating ${restaurants.length} restaurants...`);
    
    const defaultHours = [
      { day: 'Monday', open: '10:00', close: '22:00', closed: false },
      { day: 'Tuesday', open: '10:00', close: '22:00', closed: false },
      { day: 'Wednesday', open: '10:00', close: '22:00', closed: false },
      { day: 'Thursday', open: '10:00', close: '22:00', closed: false },
      { day: 'Friday', open: '10:00', close: '22:00', closed: false },
      { day: 'Saturday', open: '10:00', close: '22:00', closed: false },
      { day: 'Sunday', open: '10:00', close: '22:00', closed: false }
    ];

    const defaultSettings = {
      acceptsReservations: true,
      advanceBookingRequired: false,
      minGroupSize: 1,
      maxGroupSize: 20,
      reservationDuration: 120,
      cancellationWindow: 24
    };

    const defaultSocials = {
      instagram: '',
      facebook: '',
      website: '',
      googleMaps: ''
    };

    const defaultVerification = {
      gstNumber: '',
      fssaiNumber: '',
      status: 'Verified'
    };

    for (const res of restaurants) {
      const updateData = {};

      // 1. Cuisines list fallback
      if (!res.cuisines || res.cuisines.length === 0) {
        updateData.cuisines = res.cuisine 
          ? res.cuisine.split(',').map(c => c.trim()).filter(Boolean)
          : ['Fine Dining'];
      }

      // 2. Highlights fallback
      if (!res.highlights || res.highlights.length === 0) {
        updateData.highlights = res.tableCategories 
          ? res.tableCategories.split(',').map(c => c.trim()).filter(Boolean)
          : ['Window View', 'Family Friendly', 'Indoor Seating'];
      }

      // 3. Amenities fallback
      if (!res.amenities || res.amenities.length === 0) {
        updateData.amenities = ['Air Conditioning', 'UPI Payments', 'Parking'];
      }

      // 4. Menu Highlights array check & restore for Trikal
      if (!res.menuHighlights || res.menuHighlights.length === 0) {
        if (res.name.toLowerCase().includes('trikal') || res.id === '81ce6237-ab5e-429e-800f-95fce7f8e42e') {
          updateData.menuHighlights = [
            'Mysore Masala Dosa',
            'Filter Coffee',
            'Paneer Tikka',
            'Gobi Manchurian',
            'Paneer Butter Masala & Butter Naan',
            'Veg Biryani'
          ];
        } else {
          updateData.menuHighlights = [];
        }
      }

      // 5. Timings (operating hours)
      if (!res.operatingHours) {
        updateData.operatingHours = defaultHours;
      }

      // 6. Reservation Settings
      if (!res.reservationSettings) {
        updateData.reservationSettings = defaultSettings;
      }

      // 7. Social Links
      if (!res.socialLinks) {
        updateData.socialLinks = defaultSocials;
      }

      // 8. Verification details
      if (!res.verification) {
        updateData.verification = defaultVerification;
      }

      // 9. Seating Areas
      if (!res.seatingAreas) {
        updateData.seatingAreas = [
          { name: 'Indoor Seating', description: 'Cozy and elegant indoor dining room' },
          { name: 'Window Side Seating', description: 'Tables overlooking the street view' }
        ];
      }

      // 10. Table Types
      if (!res.tableTypes) {
        updateData.tableTypes = [
          { name: '2 Seater', capacity: 2, quantity: 4, seatingArea: 'Indoor Seating' },
          { name: '4 Seater', capacity: 4, quantity: 6, seatingArea: 'Indoor Seating' },
          { name: 'Window 2 Seater', capacity: 2, quantity: 2, seatingArea: 'Window Side Seating' }
        ];
      }

      // 11. Cover Image
      if (!res.coverImage) {
        updateData.coverImage = res.image || 'no-photo.jpg';
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.restaurant.update({
          where: { id: res.id },
          data: updateData
        });
        console.log(`Migrated restaurant: ${res.name}`);
      }
    }
  } catch (err) {
    console.error('Restaurant migration failed:', err);
  }
};

module.exports = initSeed;
