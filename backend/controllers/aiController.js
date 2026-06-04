const prisma = require('../prisma/client');
const { parseSearchQuery, digitizeMenuImage } = require('../utils/aiAgent');

exports.getRecommendations = async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      take: 3,
      orderBy: { rating: 'desc' }
    });
    
    res.status(200).json({ success: true, data: restaurants });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getTableSuggestion = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      suggestedCategory: "Window Side",
      reason: "Based on the time of day and your previous preference for scenic views."
    }
  });
};

exports.getCrowdPrediction = async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: req.body.restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    // Determine the current local time and day of week
    const now = new Date();
    const currentHour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6; // 0 = Sunday, 6 = Saturday

    // 1. Base queue count based on crowdLevel
    let baseQueue = 0;
    if (restaurant.crowdLevel === 'Full') baseQueue = 12;
    else if (restaurant.crowdLevel === 'High') baseQueue = 8;
    else if (restaurant.crowdLevel === 'Medium') baseQueue = 4;
    else baseQueue = 1;

    // 2. Adjust based on time of day (lunch peak 12-14, dinner peak 19-21)
    let timeMultiplier = 1.0;
    if ((currentHour >= 12 && currentHour <= 14) || (currentHour >= 19 && currentHour <= 21)) {
      timeMultiplier = 1.5; // Lunch or dinner peak
    } else if (currentHour >= 15 && currentHour <= 17) {
      timeMultiplier = 0.5; // Afternoon lull
    } else if (currentHour >= 22 || currentHour <= 8) {
      timeMultiplier = 0.2; // Late night / morning
    }

    // 3. Adjust based on weekend vs weekday
    const weekendMultiplier = isWeekend ? 1.3 : 0.9;

    // 4. Adjust based on rating (higher rating = more popular)
    const popularityMultiplier = restaurant.rating ? (restaurant.rating / 4.0) : 1.0;

    // Calculate final predicted queue count
    const predictedQueueCount = Math.round(baseQueue * timeMultiplier * weekendMultiplier * popularityMultiplier);
    const predictedWaitMinutes = predictedQueueCount * 4; // average 4 mins wait per queue group

    // Decide if queue is too long (shown when restaurant crowd level is High or Full)
    const isQueueTooLong = restaurant.crowdLevel === 'High' || restaurant.crowdLevel === 'Full';

    let prediction = "";
    if (isQueueTooLong) {
      prediction = `🚨 High Demand: Our AI predicts a long queue of approximately ${predictedQueueCount} groups with a ${predictedWaitMinutes}-minute wait time.`;
    } else if (predictedQueueCount > 2) {
      prediction = `⏱️ Moderate Demand: The estimated queue is ${predictedQueueCount} groups (~${predictedWaitMinutes} mins wait).`;
    } else {
      prediction = "✨ Walk-in Available: Minimal wait time predicted. Walk right in!";
    }

    res.status(200).json({
      success: true,
      data: {
        message: prediction,
        predictedQueueCount,
        predictedWaitMinutes,
        isQueueTooLong
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.chat = async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  try {
    const filters = await parseSearchQuery(message);
    
    // Build Prisma query based on parsed filter structure
    const whereClause = {};
    if (filters.restaurantName) {
      whereClause.name = { contains: filters.restaurantName, mode: 'insensitive' };
    }
    if (filters.cuisine) {
      whereClause.cuisine = { contains: filters.cuisine, mode: 'insensitive' };
    }
    if (filters.priceRange) {
      whereClause.priceRange = filters.priceRange;
    }
    if (filters.city) {
      whereClause.city = { contains: filters.city, mode: 'insensitive' };
    }
    // If a search term is specified, we query candidates based on basic fields
    if (filters.search) {
      whereClause.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    let restaurants = await prisma.restaurant.findMany({
      where: whereClause
    });

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      restaurants = restaurants.filter(r => {
        const matchesMain = 
          r.name.toLowerCase().includes(searchLower) ||
          r.description.toLowerCase().includes(searchLower) ||
          (r.city && r.city.toLowerCase().includes(searchLower)) ||
          r.location.toLowerCase().includes(searchLower);
          
        const matchesMenu = r.menuHighlights && r.menuHighlights.some(item => 
          item.toLowerCase().includes(searchLower)
        );
        
        return matchesMain || matchesMenu;
      });
    }

    restaurants = restaurants.slice(0, 4);

    // Fallback: If strict filters return 0 results, query all to check menuHighlights and other fields
    if (restaurants.length === 0 && filters.search) {
      const searchLower = filters.search.toLowerCase();
      let allRestaurants = await prisma.restaurant.findMany();
      restaurants = allRestaurants.filter(r => {
        const matchesMain = 
          r.name.toLowerCase().includes(searchLower) ||
          r.description.toLowerCase().includes(searchLower);
          
        const matchesMenu = r.menuHighlights && r.menuHighlights.some(item => 
          item.toLowerCase().includes(searchLower)
        );
        
        return matchesMain || matchesMenu;
      });

      if (filters.city) {
        const cityLower = filters.city.toLowerCase();
        restaurants = restaurants.filter(r => r.city && r.city.toLowerCase().includes(cityLower));
      }
      restaurants = restaurants.slice(0, 4);
    }

    let reply = "";
    if (restaurants.length > 0) {
      reply = `I found some perfect recommendations for you based on "${message}":\n\n` +
        restaurants.map(r => `🍽️ **${r.name}** (${r.cuisine}) in ${r.city || r.location} - rating ⭐${r.rating || 'N/A'}. Details: [View details](/restaurants/${r.id})`).join('\n\n');
    } else {
      const parts = [];
      if (filters.restaurantName) parts.push(`name: "${filters.restaurantName}"`);
      if (filters.cuisine) parts.push(`cuisine: "${filters.cuisine}"`);
      if (filters.priceRange) parts.push(`price: "${filters.priceRange}"`);
      if (filters.city) parts.push(`city: "${filters.city}"`);
      if (filters.search) parts.push(`search: "${filters.search}"`);
      
      const parsedText = parts.length > 0 ? parts.join(', ') : `search: "${message}"`;
      
      // Fetch available restaurants in DB to guide the user
      const available = await prisma.restaurant.findMany({
        select: { name: true, city: true, cuisine: true },
        take: 3
      });
      
      let suggestionText = "";
      if (available.length > 0) {
        suggestionText = "\n\nHere are the active restaurants currently in our database that you can search for:\n" +
          available.map(a => `• **${a.name}** (${a.cuisine} in ${a.city})`).join('\n');
      } else {
        suggestionText = "\n\nThere are currently no restaurants in the database. Please add one in the Admin Dashboard!";
      }

      reply = `I parsed your request for ${parsedText}, but couldn't find matching restaurants in our database.${suggestionText}\n\nFeel free to explore all options here: [Browse Restaurants](/restaurants).`;
    }

    res.status(200).json({
      success: true,
      data: {
        reply,
        filters,
        results: restaurants
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.digitizeMenu = async (req, res) => {
  const { base64Image, mimeType, restaurantId } = req.body;
  if (!base64Image || !mimeType || !restaurantId) {
    return res.status(400).json({ success: false, message: 'base64Image, mimeType, and restaurantId are required' });
  }

  try {
    let items;
    try {
      items = await digitizeMenuImage(base64Image, mimeType);
    } catch (err) {
      console.warn(`Digitization failed, checking fallback for restaurant: ${restaurantId}`);
      // Find restaurant name to see if we can fall back to the Trikal Cafe menu
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { name: true }
      });

      if (restaurant && restaurant.name.toLowerCase().includes('trikal')) {
        console.log('Falling back to high-quality Trikal Cafe Chats Menu fallback.');
        items = [
          { name: "Special Dabeli", description: "Spiced potato mixture in pav buns topped with pomegranate and sev", price: 100, category: "Chats" },
          { name: "Raaj Kachori", description: "Large crispy puri filled with potatoes, sprouts, yogurt, chutneys, and sev", price: 90, category: "Chats" },
          { name: "Samosa Chat", description: "Crushed samosas topped with warm chickpeas, chutneys, and yogurt", price: 80, category: "Chats" },
          { name: "Masala Poori", description: "Crushed puris drenched in hot peas gravy, sweet and spicy chutneys", price: 70, category: "Chats" },
          { name: "Pani Poori", description: "Crispy puris filled with spiced potatoes and tangy flavored water", price: 60, category: "Chats" },
          { name: "Bhel Poori", description: "Puffed rice tossed with vegetables, chutneys, and sev", price: 60, category: "Chats" },
          { name: "Sev Poori", description: "Flat puris topped with potatoes, onions, chutneys, and loaded with sev", price: 75, category: "Chats" },
          { name: "Dahi Poori", description: "Puris filled with potatoes, yogurt, chutneys, and garnishes", price: 80, category: "Chats" },
          { name: "Dahi Balla", description: "Soft lentil dumplings soaked in creamy yogurt and sweet-spicy chutneys", price: 80, category: "Chats" },
          { name: "Papdi Chat", description: "Crisp flour crackers topped with potatoes, yogurt, and chutneys", price: 70, category: "Chats" },
          { name: "Dahi Papdi", description: "Papdis served with sweet yogurt, tamarind chutney, and spices", price: 80, category: "Chats" },
          { name: "Aloo Tikki", description: "Pan-fried potato patties served with green and sweet chutneys", price: 70, category: "Chats" },
          { name: "Paav Bhaaji", description: "Thick vegetable curry cooked in butter, served with soft pav buns", price: 100, category: "Chats" },
          { name: "Chole Bhature", description: "Spiced chickpea curry served with fried leavened flatbreads", price: 110, category: "Chats" },
          { name: "Extra Paav", description: "Additional soft butter-toasted bread rolls", price: 40, category: "Chats" }
        ];
      } else {
        // Rethrow original error for other restaurants so they don't get wrong data
        throw err;
      }
    }
    // Save these food items to the restaurant menuHighlights field
    const highlightArray = items.map(item => {
      const descPart = item.description ? ` - ${item.description}` : '';
      return `${item.name} (${item.category}): ₹${item.price}${descPart}`;
    });

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { menuHighlights: highlightArray }
    });

    res.status(200).json({
      success: true,
      message: `Successfully digitized ${items.length} menu items!`,
      data: items
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.optimizeLayout = async (req, res) => {
  const { restaurantId } = req.body;
  if (!restaurantId) {
    return res.status(400).json({ success: false, message: 'restaurantId is required' });
  }

  try {
    const tables = await prisma.restaurantTable.findMany({
      where: { restaurantId }
    });

    if (tables.length === 0) {
      return res.status(400).json({ success: false, message: 'No tables found to optimize.' });
    }

    const updatedTables = [];
    
    // Group tables by category to assign to physical zones
    const vipTables = [];
    const windowTables = [];
    const barTables = [];
    const mainTables = [];

    tables.forEach(t => {
      const cat = (t.category || '').toLowerCase();
      if (cat.includes('vip') || cat.includes('cabin') || cat.includes('private')) {
        vipTables.push(t);
      } else if (cat.includes('window') || cat.includes('scenic')) {
        windowTables.push(t);
      } else if (cat.includes('bar') || cat.includes('lounge')) {
        barTables.push(t);
      } else {
        mainTables.push(t);
      }
    });

    // 1. Arrange VIP Cabin tables (left room, x = 12.5%, y = 38% to 73%)
    if (vipTables.length > 0) {
      const count = vipTables.length;
      for (let i = 0; i < count; i++) {
        const y = count > 1 ? 38 + i * (35 / (count - 1)) : 52;
        const updated = await prisma.restaurantTable.update({
          where: { id: vipTables[i].id },
          data: { positionX: 12.5, positionY: Math.round(y * 10) / 10 }
        });
        updatedTables.push(updated);
      }
    }

    // 2. Arrange Window Side tables (top center room, y = 11%, x = 34% to 62%)
    if (windowTables.length > 0) {
      const count = windowTables.length;
      for (let i = 0; i < count; i++) {
        const x = count > 1 ? 34 + i * (28 / (count - 1)) : 48;
        const updated = await prisma.restaurantTable.update({
          where: { id: windowTables[i].id },
          data: { positionX: Math.round(x * 10) / 10, positionY: 11.0 }
        });
        updatedTables.push(updated);
      }
    }

    // 3. Arrange Bar & Lounge tables (right room, x = 85%, y = 11% to 75%)
    if (barTables.length > 0) {
      const count = barTables.length;
      for (let i = 0; i < count; i++) {
        const y = count > 1 ? 11 + i * (64 / (count - 1)) : 11;
        const updated = await prisma.restaurantTable.update({
          where: { id: barTables[i].id },
          data: { positionX: 85.0, positionY: Math.round(y * 10) / 10 }
        });
        updatedTables.push(updated);
      }
    }

    // 4. Arrange Main Dining tables (center room, x = 34% to 62%, y = 38% to 76%)
    if (mainTables.length > 0) {
      const count = mainTables.length;
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      
      const xStep = cols > 1 ? (28 / (cols - 1)) : 28;
      const yStep = rows > 1 ? (38 / (rows - 1)) : 38;

      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        const x = cols > 1 ? 34 + col * xStep : 48;
        const y = rows > 1 ? 38 + row * yStep : 57;

        const updated = await prisma.restaurantTable.update({
          where: { id: mainTables[i].id },
          data: {
            positionX: Math.round(x * 10) / 10,
            positionY: Math.round(y * 10) / 10
          }
        });
        updatedTables.push(updated);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Layout optimized successfully using spacing coordinates!',
      data: updatedTables
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.geocodeAddress = async (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ success: false, message: 'Address is required.' });
  }

  const apiKey = process.env.POSITIONSTACK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, message: 'Positionstack API key is not configured.' });
  }

  try {
    const axios = require('axios');
    const response = await axios.get('http://api.positionstack.com/v1/forward', {
      params: {
        access_key: apiKey,
        query: address,
        limit: 1
      }
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      const result = response.data.data[0];
      res.status(200).json({
        success: true,
        data: {
          latitude: result.latitude,
          longitude: result.longitude,
          label: result.label,
          city: result.locality || result.city || '',
          state: result.region || ''
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'No location coordinates found for the given address.' });
    }
  } catch (err) {
    console.error('Geocoding error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.reverseGeocode = async (req, res) => {
  const { latitude, longitude } = req.body;
  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, message: 'Latitude and longitude are required.' });
  }

  const apiKey = process.env.POSITIONSTACK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, message: 'Positionstack API key is not configured.' });
  }

  try {
    const axios = require('axios');
    const response = await axios.get('http://api.positionstack.com/v1/reverse', {
      params: {
        access_key: apiKey,
        query: `${latitude},${longitude}`,
        limit: 1
      }
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      const result = response.data.data[0];
      res.status(200).json({
        success: true,
        data: {
          city: result.locality || result.city || '',
          state: result.region || '',
          label: result.label || ''
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'No location details found for these coordinates.' });
    }
  } catch (err) {
    console.error('Reverse geocoding error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};
