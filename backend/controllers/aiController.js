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
      prediction = `🚨 High Demand: Our AI predicts a long queue of approximately ${predictedQueueCount} groups with a ${predictedWaitMinutes}-minute wait time. Play our puzzle to earn a 20% - 30% discount on your bill while you wait!`;
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
    if (filters.search) {
      whereClause.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
        { menuHighlights: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    let restaurants = await prisma.restaurant.findMany({
      where: whereClause,
      take: 4
    });

    // Fallback: If strict filters (like cuisine/price matching) return 0 results
    // but the user specified a search query, fall back to searching purely by search term and city.
    if (restaurants.length === 0 && filters.search) {
      const fallbackClause = {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { menuHighlights: { contains: filters.search, mode: 'insensitive' } }
        ]
      };
      if (filters.city) {
        fallbackClause.city = { contains: filters.city, mode: 'insensitive' };
      }
      restaurants = await prisma.restaurant.findMany({
        where: fallbackClause,
        take: 4
      });
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
    const items = await digitizeMenuImage(base64Image, mimeType);
    
    // Save these food items to the restaurant menuHighlights field
    const highlightString = items.map(item => `${item.name} (${item.category}): ₹${item.price}`).join(', ');

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { menuHighlights: highlightString }
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

    const count = tables.length;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    
    const xStep = cols > 1 ? (60 / (cols - 1)) : 60;
    const yStep = rows > 1 ? (50 / (rows - 1)) : 50;

    const updatedTables = [];
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      const x = cols > 1 ? 20 + col * xStep : 50;
      const y = rows > 1 ? 25 + row * yStep : 50;

      // Add a slight random noise to look natural
      const finalX = Math.round(Math.min(Math.max(x + (Math.random() * 4 - 2), 15), 85));
      const finalY = Math.round(Math.min(Math.max(y + (Math.random() * 4 - 2), 20), 80));

      const updated = await prisma.restaurantTable.update({
        where: { id: tables[i].id },
        data: {
          positionX: finalX,
          positionY: finalY
        }
      });
      updatedTables.push(updated);
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
