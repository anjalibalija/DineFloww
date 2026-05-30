const { GoogleGenAI } = require('@google/generative-ai');
const prisma = require('../prisma/client');

// Initialize Gemini if key exists
const apiKey = process.env.GEMINI_API_KEY;
let aiInstance = null;

if (apiKey) {
  try {
    // Note: GoogleGenAI or GoogleGenerativeAI depending on package version.
    // The standard export from @google/generative-ai is GoogleGenerativeAI.
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    aiInstance = new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.error('Failed to initialize GoogleGenerativeAI:', err.message);
  }
}

/**
 * Uses Gemini to parse a natural language query into structured database filters.
 * Falls back to rule-based parsing if GEMINI_API_KEY is not set.
 */
exports.parseSearchQuery = async (query) => {
  if (!query) return {};

  if (aiInstance) {
    try {
      const model = aiInstance.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `
        You are a search query parsing agent for DineFlow, a luxury restaurant booking website.
        Analyze this search query: "${query}"
        
        Extract these fields if present. Respond ONLY with a valid JSON object. Do not include markdown codeblocks or other text.
        JSON format:
        {
          "cuisine": "extracted cuisine type (e.g., Italian, Chinese, Indian, American, Cafe) or null",
          "priceRange": "extracted price level ('$' or '$$' or '$$$' or '$$$$') or null",
          "city": "extracted city name or null",
          "search": "remaining query terms to search in restaurant names or description, or null"
        }
      `;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      // Clean possible markdown wrappers if model ignores instructions
      const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (err) {
      console.warn('Gemini query parsing failed, falling back to rule-based parser:', err.message);
    }
  }

  // Smart simulated/rule-based fallback parser
  const filters = { cuisine: null, priceRange: null, city: null, search: null, restaurantName: null };
  let cleaned = query;
  const lower = query.toLowerCase();

  // 0. Restaurant Name mapping
  let dynamicNames = [];
  try {
    const dbRests = await prisma.restaurant.findMany({
      select: { name: true }
    });
    dynamicNames = dbRests.map(r => r.name.toLowerCase());
  } catch (err) {
    console.error('Failed to load dynamic restaurant names for parser fallback:', err.message);
  }

  for (const name of dynamicNames) {
    if (lower.includes(name)) {
      const dbMatch = await prisma.restaurant.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
        select: { name: true }
      });
      filters.restaurantName = dbMatch ? dbMatch.name : name;
      cleaned = cleaned.replace(new RegExp(name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi'), '');
      break;
    }
  }

  const cleanedLower = cleaned.toLowerCase();

  // 1. Cuisine mapping
  const cuisines = ['italian', 'chinese', 'indian', 'mexican', 'japanese', 'thai', 'cafe', 'bakery', 'continental', 'french', 'fine dining', 'korean', 'american', 'mediterranean'];
  for (const c of cuisines) {
    if (cleanedLower.includes(c)) {
      filters.cuisine = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // 2. Price mapping
  if (cleanedLower.includes('₹₹₹₹') || cleanedLower.includes('$$$$') || cleanedLower.includes('luxury') || cleanedLower.includes('expensive') || cleanedLower.includes('premium')) {
    filters.priceRange = '₹₹₹₹';
  } else if (cleanedLower.includes('₹₹₹') || cleanedLower.includes('$$$')) {
    filters.priceRange = '₹₹₹';
  } else if (cleanedLower.includes('₹₹') || cleanedLower.includes('$$') || cleanedLower.includes('mid range') || cleanedLower.includes('moderate') || cleanedLower.includes('average')) {
    filters.priceRange = '₹₹';
  } else if (cleanedLower.includes('₹') || cleanedLower.includes('$') || cleanedLower.includes('cheap') || cleanedLower.includes('budget') || cleanedLower.includes('low price') || cleanedLower.includes('affordable')) {
    filters.priceRange = '₹';
  }

  // 3. City mapping
  const staticCities = ['mumbai', 'bangalore', 'delhi', 'chennai', 'hyderabad', 'pune', 'kolkata'];
  let dynamicCities = [];
  try {
    const dbRestaurants = await prisma.restaurant.findMany({
      select: { city: true },
      distinct: ['city']
    });
    dynamicCities = dbRestaurants.map(r => r.city ? r.city.toLowerCase() : '').filter(Boolean);
  } catch (err) {
    console.error('Failed to load dynamic cities for parser fallback:', err.message);
  }
  const allCities = Array.from(new Set([...staticCities, ...dynamicCities]));

  for (const city of allCities) {
    if (cleanedLower.includes(city)) {
      // Preserve exact casing stored in DB
      const matchingRestaurant = await prisma.restaurant.findFirst({
        where: { city: { equals: city, mode: 'insensitive' } },
        select: { city: true }
      });
      filters.city = matchingRestaurant ? matchingRestaurant.city : city.charAt(0).toUpperCase() + city.slice(1);
      break;
    }
  }

  // 4. Default remaining search text with smart cleanup of generic stop words
  const matchedValues = Object.values(filters).filter(Boolean);
  if (matchedValues.length > 0) {
    // Escape values for regex safety
    const escapedValues = matchedValues.map(v => v.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    cleaned = cleaned.replace(new RegExp(escapedValues.join('|'), 'gi'), '');
  }

  // Clean stop words and generic terms
  cleaned = cleaned
    .replace(/\b(who|how|what|why|when|serves?|serving|had|has|have|there|restaurants?|cafes?|places?|food|find|show|search|in|under|below|above|want|get|me|book|a|the|with|i|to|for|is|are|of|on|at|some|any|our|your)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length > 2) {
    filters.search = cleaned;
  }

  return filters;
};

/**
 * Uses Gemini Vision (multimodal) to extract structured food items from a menu image.
 * Falls back to a generic sample if GEMINI_API_KEY is not set.
 */
exports.digitizeMenuImage = async (base64Data, mimeType) => {
  if (aiInstance) {
    try {
      const model = aiInstance.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `
        You are a menu digitizer AI. Analyze this image of a restaurant food menu.
        Extract ALL food items visible in the image with their names, descriptions, prices, and categories.
        Be thorough - extract every single item you can see.
        If the text is in a non-English language, transliterate the dish names to English alongside the original script.
        If prices are not visible, estimate reasonable prices based on the dish type and cuisine.
        
        Respond ONLY with a valid JSON array of objects. Do not include markdown codeblocks or conversational text.
        Format:
        [
          {
            "name": "Name of the dish",
            "description": "Short description of ingredients/preparation",
            "price": 150,
            "category": "Menu category (e.g. Appetizers, Starters, Mains, Desserts, Drinks, Chats, Biryani, etc.)"
          }
        ]
      `;

      const imagePart = {
        inlineData: {
          data: base64Data.split(',')[1] || base64Data,
          mimeType
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text();
      const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const items = JSON.parse(cleanText);
      
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('AI returned empty or invalid menu items.');
      }
      
      console.log(`Successfully digitized ${items.length} menu items via Gemini AI.`);
      return items;
    } catch (err) {
      console.warn('Gemini Menu vision digitization failed:', err.message);
      throw new Error(`AI Menu Digitizer failed: ${err.message}`);
    }
  }

  // No Gemini API key configured — throw a clear, actionable error
  console.warn('[AI Menu Digitizer] GEMINI_API_KEY is empty or not configured in .env file.');
  throw new Error(
    'Gemini API key is not configured. Please add a valid GEMINI_API_KEY in your backend .env file. ' +
    'Get a free key at https://aistudio.google.com/apikey'
  );
};
