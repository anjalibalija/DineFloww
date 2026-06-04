import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Star, MapPin, Users, Search, Navigation, X, SlidersHorizontal, ChevronDown, Grid, Map, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import DashboardMap from '../components/DashboardMap';

// ─── Haversine distance (km) ───────────────────────────────────────────────
const haversine = (lat1, lon1, lat2, lon2) => {
  if ([lat1, lon1, lat2, lon2].some(v => v == null)) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Smart location match ──────────────────────────────────────────────────
const locationMatchWithAlias = (restaurant, query) => {
  if (!query.trim()) return true;

  const haystack = [
    restaurant.location,
    restaurant.city,
    restaurant.state,
    restaurant.pincode,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/,/g, ' ');

  const variants = expandQuery(query);
  return variants.some(variant =>
    variant.split(/\s+/).every(word => haystack.includes(word))
  );
};

const CITY_ALIASES = {
  bangalore: ['bengaluru', 'bangalore'],
  bengaluru: ['bengaluru', 'bangalore'],
  mumbai: ['mumbai', 'bombay'],
  bombay: ['mumbai', 'bombay'],
  kolkata: ['kolkata', 'calcutta'],
  calcutta: ['kolkata', 'calcutta'],
  chennai: ['chennai', 'madras'],
  madras: ['chennai', 'madras'],
  pune: ['pune', 'poona'],
  poona: ['pune', 'poona'],
};

const expandQuery = (query) => {
  const lower = query.trim().toLowerCase();
  const aliases = CITY_ALIASES[lower];
  return aliases ? aliases : [lower];
};



const MOCK_RESTAURANTS = [
  {
    id: "res-olive-bistro",
    name: "Olive Bistro",
    cuisine: "Italian",
    location: "Indiranagar, Bengaluru",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    priceRange: "₹₹₹",
    priceTier: "Premium",
    openingTime: "11:00 AM",
    closingTime: "11:00 PM",
    latitude: 12.97189,
    longitude: 77.64115,
    description: "An elegant, candlelit sanctuary offering wood-fired pizzas, hand-rolled pasta, and curated fine wines in a romantic Mediterranean setting.",
    crowdLevel: "Medium",
  },
  {
    id: "res-spice-route",
    name: "Spice Route",
    cuisine: "Indian",
    location: "Koramangala, Bengaluru",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    priceRange: "₹₹₹₹",
    priceTier: "Fine Dining",
    openingTime: "12:00 PM",
    closingTime: "11:30 PM",
    latitude: 12.93519,
    longitude: 77.62448,
    description: "Embark on an authentic culinary journey with rich Mughal curries, slow-cooked Awadhi biryanis, and saffron-infused desserts.",
    crowdLevel: "High",
  },
  {
    id: "res-bella-italia",
    name: "Bella Italia",
    cuisine: "Italian",
    location: "Lavelle Road, Bengaluru",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    priceRange: "₹₹",
    priceTier: "Moderate",
    openingTime: "11:30 AM",
    closingTime: "10:30 PM",
    latitude: 12.97194,
    longitude: 77.59714,
    description: "A cozy family-owned trattoria serving rustic Italian favorites, fresh pestos, and artisan gelatos made from scratch.",
    crowdLevel: "Low",
  },
  {
    id: "res-kyoto-garden",
    name: "Kyoto Garden",
    cuisine: "Japanese",
    rating: 4.7,
    location: "Sadashivanagar, Bengaluru",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
    priceRange: "₹₹₹",
    priceTier: "Premium",
    openingTime: "12:30 PM",
    closingTime: "10:30 PM",
    latitude: 13.0068,
    longitude: 77.5813,
    description: "Immersive traditional Japanese dining with artfully crafted sashimi, hand-rolled sushi, and authentic teppanyaki tables.",
    crowdLevel: "Medium",
  },
  {
    id: "res-urban-tandoor",
    name: "Urban Tandoor",
    cuisine: "Indian",
    rating: 4.5,
    location: "Jayanagar, Bengaluru",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
    priceRange: "₹₹",
    priceTier: "Moderate",
    openingTime: "12:00 PM",
    closingTime: "11:00 PM",
    latitude: 12.9299,
    longitude: 77.5824,
    description: "A vibrant modern space offering classic North Indian clay-oven specialties, rich tandoori platters, and fusion mocktails.",
    crowdLevel: "High",
  },
  {
    id: "res-coastal-kitchen",
    name: "Coastal Kitchen",
    cuisine: "Continental",
    rating: 4.4,
    location: "Whitefield, Bengaluru",
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
    priceRange: "₹",
    priceTier: "Budget",
    openingTime: "10:00 AM",
    closingTime: "10:00 PM",
    latitude: 12.9698,
    longitude: 77.7499,
    description: "Casual ocean-breeze inspired bistro offering premium seafood grills, continental platters, and fresh organic salads.",
    crowdLevel: "Low",
  }
];

const RestaurantListing = () => {
  const { isAdmin } = useAuth();

  // Redirect owners/admins to their dashboard
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [userCoords, setUserCoords] = useState(null);   // { latitude, longitude }
  const [nearMeActive, setNearMeActive] = useState(false); // GPS distance-sort mode
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  // Suggestions dropdown
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Cuisine filter
  const [activeCuisine, setActiveCuisine] = useState('All');
  const [showCuisineMenu, setShowCuisineMenu] = useState(false);

  // Zomato style extra filters
  const [ratingFilter, setRatingFilter] = useState(false);
  const [priceFilter, setPriceFilter] = useState('All'); // 'All' | '1' | '2' | '3' | '4'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map' | 'split'

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/restaurants');
      setRestaurants(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch restaurants.');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Build unique location suggestions ────────────────────────────────────
  const locationSuggestions = useMemo(() => {
    const cities = new Set();
    const areas = new Set();
    restaurants.forEach(r => {
      if (r.city) cities.add(r.city.trim());
      if (r.state) cities.add(r.state.trim());
      if (r.location) {
        const parts = r.location.split(',').map(p => p.trim()).filter(Boolean);
        parts.forEach(p => {
          if (p.length > 2 && p.length < 50) areas.add(p);
        });
      }
    });
    return [...new Set([...cities, ...areas])].sort();
  }, [restaurants]);

  const filteredSuggestions = locationSuggestions.filter(s =>
    locationQuery.trim() &&
    s.toLowerCase().includes(locationQuery.toLowerCase()) &&
    s.toLowerCase() !== locationQuery.toLowerCase()
  );

  // ── Unique cuisines for quick filter ────────────────────────────────────
  const cuisines = useMemo(() => {
    const set = new Set(restaurants.map(r => r.cuisine).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [restaurants]);

  // ── GPS handler ──────────────────────────────────────────────────────────
  const handleGetCurrentLocation = () => {
    if (locating) return;
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationStatus('Accessing GPS…');
    setNearMeActive(false);

        navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ latitude, longitude });
        setNearMeActive(true);
        setLocationStatus('');
        setLocationQuery('Current Location');
        setLocating(false);
      },
      (err) => {
        console.error(err);
        const msgs = {
          1: 'Location permission denied. Please allow access in browser settings.',
          2: 'Position unavailable. Try again.',
          3: 'Location request timed out.',
        };
        setLocationStatus(msgs[err.code] || 'Could not get location.');
        setLocating(false);
        setTimeout(() => setLocationStatus(''), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearLocation = () => {
    setLocationQuery('');
    setUserCoords(null);
    setNearMeActive(false);
    setLocationStatus('');
    locationInputRef.current?.focus();
  };

  // Compute distance for each restaurant
  const withDistance = useMemo(() => {
    return restaurants.map(r => ({
      ...r,
      distance:
        userCoords && r.latitude && r.longitude
          ? haversine(userCoords.latitude, userCoords.longitude, r.latitude, r.longitude)
          : null,
    }));
  }, [restaurants, userCoords]);

  // Price helper
  const getPriceText = (priceRange) => {
    if (priceRange === '₹' || priceRange === '$') return '₹300 for two';
    if (priceRange === '₹₹' || priceRange === '$$') return '₹800 for two';
    if (priceRange === '₹₹₹' || priceRange === '$$$') return '₹1,800 for two';
    if (priceRange === '₹₹₹₹' || priceRange === '$$$$') return '₹3,500 for two';
    return '₹800 for two';
  };

  // Rating color helper (Luxury theme gold/brown)
  const getRatingColorClass = (rating) => {
    if (!rating) return 'bg-brown-800 text-cream-100';
    if (rating >= 4.5) return 'bg-gold-500 text-brown-950 font-bold border border-gold-600/20';
    return 'bg-brown-900 text-cream-100';
  };

  // ── Filter + Sort ────────────────────────────────────────────────────────
  const filteredAndSorted = useMemo(() => {
    return withDistance
      .filter(r => {
        // 1. Main search
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          (r.location && r.location.toLowerCase().includes(q)) ||
          (r.city && r.city.toLowerCase().includes(q));

        // 2. Cuisine quick-filter
        const matchesCuisine = activeCuisine === 'All' || r.cuisine === activeCuisine;

        // 3. Location filter
        let matchesLocation = true;
        if (nearMeActive && userCoords) {
          matchesLocation = r.distance !== null ? r.distance <= 50 : false;
        } else if (locationQuery.trim()) {
          matchesLocation = locationMatchWithAlias(r, locationQuery);
        }

        // 4. Rating filter
        const matchesRating = !ratingFilter || (r.rating && r.rating >= 4.0);

        // 5. Price filter
        const matchesPrice = priceFilter === 'All' ||
          (priceFilter === '1' && (r.priceRange === '$' || r.priceRange === '₹' || !r.priceRange)) ||
          (priceFilter === '2' && (r.priceRange === '$$' || r.priceRange === '₹₹')) ||
          (priceFilter === '3' && (r.priceRange === '$$$' || r.priceRange === '₹₹₹')) ||
          (priceFilter === '4' && (r.priceRange === '$$$$' || r.priceRange === '₹₹₹₹'));

        return matchesSearch && matchesCuisine && matchesLocation && matchesRating && matchesPrice;
      })
      .sort((a, b) => {
        if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
        if (a.distance !== null) return -1;
        if (b.distance !== null) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });
  }, [withDistance, searchQuery, locationQuery, nearMeActive, activeCuisine, ratingFilter, priceFilter]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-cream-100">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-serif text-lg text-brown-900 font-semibold animate-pulse">Loading amazing places near you…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-brown-900 font-serif text-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100/40 pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-50 bg-[#2C1B18] text-[#D4AF37] border border-[#D4AF37]/30 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-sm font-semibold"
          >
            <Sparkles size={16} className="text-[#D4AF37]" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>



      {/* ── Search + Location Bar Container ── */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Combined Search + Location Card */}
          <div className="w-full lg:max-w-3xl bg-white rounded-2xl border border-cream-200 shadow-md shadow-brown-900/5 p-1.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 min-h-[56px] focus-within:ring-2 focus-within:ring-gold-500/20 focus-within:border-gold-500 transition-all">
            
            {/* Location Section */}
            <div className="relative flex items-center flex-1 min-w-[200px] px-3 py-2 sm:py-0">
              <MapPin size={18} className="text-gold-500 mr-2 shrink-0 animate-pulse" />
              <input
                ref={locationInputRef}
                type="text"
                placeholder={nearMeActive ? '📍 Sorted by distance' : 'Select Location…'}
                value={locationQuery}
                onChange={e => {
                  setLocationQuery(e.target.value);
                  setNearMeActive(false);
                  setUserCoords(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                autoComplete="off"
                className="w-full text-sm focus:outline-none bg-transparent text-brown-900 placeholder-brown-700/40 font-medium"
              />
              
              {/* Clear location */}
              {(locationQuery || nearMeActive) && (
                <button
                  onClick={clearLocation}
                  className="text-brown-700/40 hover:text-brown-900 transition-colors p-1 mr-1 shrink-0 cursor-pointer"
                  title="Clear location"
                >
                  <X size={14} />
                </button>
              )}

              {/* GPS Button */}
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={locating}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0 ${
                  nearMeActive
                    ? 'bg-brown-900 text-cream-100 shadow-sm'
                    : 'bg-cream-100 hover:bg-cream-200 text-brown-900'
                }`}
                title="Sort by GPS distance"
              >
                {locating ? (
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Navigation size={12} className={nearMeActive ? '' : 'rotate-45'} />
                )}
                <span>{nearMeActive ? 'Near' : 'GPS'}</span>
              </button>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    ref={suggestionsRef}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-cream-200 shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto"
                  >
                    {/* Current Location Option */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleGetCurrentLocation();
                        setShowSuggestions(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-brown-900 hover:bg-cream-100/50 transition-colors text-left border-b border-cream-100 cursor-pointer"
                    >
                      {locating ? (
                        <span className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : (
                        <Navigation size={14} className="text-gold-500 rotate-45 shrink-0 animate-pulse" />
                      )}
                      <div>
                        <div className="font-serif font-bold text-brown-900 flex items-center gap-1.5">
                          Use Current Location
                        </div>
                        <div className="text-xs text-brown-700/50 font-sans font-normal">
                          {locationStatus || 'Detect location using GPS'}
                        </div>
                      </div>
                    </button>

                    {/* Suggestions list */}
                    {filteredSuggestions.slice(0, 8).map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setLocationQuery(suggestion);
                          setNearMeActive(false);
                          setUserCoords(null);
                          setShowSuggestions(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-brown-800 hover:bg-cream-100/50 transition-colors text-left cursor-pointer"
                      >
                        <MapPin size={14} className="text-gold-500 shrink-0" />
                        <span className="font-sans font-medium">{suggestion}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Vertical Divider */}
            <div className="hidden sm:block h-8 w-[1px] bg-cream-200 self-center"></div>

            {/* Search Section */}
            <div className="relative flex items-center flex-[1.5] px-3 py-2 sm:py-0">
              <Search size={18} className="text-brown-700/40 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search for restaurant, cuisine or a dish…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoComplete="off"
                className="w-full text-sm focus:outline-none bg-transparent text-brown-900 placeholder-brown-700/40 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-brown-700/40 hover:text-brown-900 transition-colors p-1 cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
            </div>

          </div>

          {/* Results Count & Clear All */}
          <div className="flex items-center gap-4 text-sm text-brown-700/60 font-serif font-bold self-end lg:self-center shrink-0">
            <span>
              {filteredAndSorted.length === restaurants.length
                ? `${restaurants.length} places`
                : `${filteredAndSorted.length} of ${restaurants.length} places`}
            </span>
            {(searchQuery || locationQuery || nearMeActive || activeCuisine !== 'All' || ratingFilter || priceFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setLocationQuery('');
                  setUserCoords(null);
                  setNearMeActive(false);
                  setActiveCuisine('All');
                  setRatingFilter(false);
                  setPriceFilter('All');
                }}
                className="text-brown-900 hover:text-gold-500 font-bold flex items-center gap-1 transition-colors bg-cream-200 px-3 py-1.5 rounded-xl border border-cream-200 cursor-pointer shadow-sm"
              >
                <X size={13} /> Clear all
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-cream-200/50 rounded-xl p-0.5 border border-cream-200 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-brown-900 text-cream-100 shadow-sm border border-brown-900'
                    : 'text-brown-700 hover:text-brown-900'
                }`}
                title="List view"
              >
                <Grid size={13} />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-brown-900 text-cream-100 shadow-sm border border-brown-900'
                    : 'text-brown-700 hover:text-brown-900'
                }`}
                title="Map view"
              >
                <Map size={13} />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`hidden md:flex px-3 py-1.5 rounded-lg text-xs font-bold transition-all items-center gap-1.5 cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-brown-900 text-cream-100 shadow-sm border border-brown-900'
                    : 'text-brown-700 hover:text-brown-900'
                }`}
                title="Split view"
              >
                <SlidersHorizontal size={13} />
                <span>Split</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Status message */}
        {locationStatus && (
          <p className="text-xs font-semibold text-gold-500 mt-2 flex items-center gap-1 animate-pulse">
            <Navigation size={11} className="rotate-45" /> {locationStatus}
          </p>
        )}
      </div>

      {/* ── Title Banner ── */}
      <div className="max-w-7xl mx-auto px-4 mb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-black text-brown-900 tracking-tight">
            Dine-out Restaurants in {locationQuery || 'your city'}
          </h1>
          <p className="text-sm text-brown-700/60 font-sans mt-1">Explore fine dining options and book your table seamlessly.</p>
        </div>


      </div>

      {/* ── Filter Pills Row ── */}
      <div className="max-w-7xl mx-auto px-4 mb-8 flex flex-wrap items-center gap-2.5">
        
        <span className="text-xs font-bold text-brown-700/40 uppercase tracking-wider font-sans">Cuisine:</span>

        {cuisines.slice(0, 5).map(c => (
          <button
            key={c}
            onClick={() => setActiveCuisine(c)}
            className={`px-3 py-1.5 rounded-xl text-xs font-serif font-bold transition-all border cursor-pointer ${
              activeCuisine === c
                ? 'bg-brown-900 text-cream-100 border-brown-900 shadow-sm'
                : 'bg-white text-brown-700 border-cream-200 hover:bg-cream-100/50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ── Restaurant Listings ── */}
      <div className="max-w-7xl mx-auto px-4">
        {viewMode === 'map' ? (
          <div className="bg-white p-4 rounded-3xl border border-cream-200 shadow-md">
            <DashboardMap restaurants={filteredAndSorted} />
          </div>
        ) : viewMode === 'split' ? (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left List */}
            <div className="w-full lg:w-5/12 max-h-[600px] overflow-y-auto pr-2 space-y-4 pb-4 scrollbar-thin scrollbar-thumb-cream-200">
              {filteredAndSorted.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-cream-200 shadow-sm">
                  <MapPin size={40} className="mx-auto text-gold-500/40 mb-3" />
                  <p className="text-lg font-serif font-bold text-brown-900 mb-1">No Matching Venues</p>
                  <p className="text-xs text-brown-700/60">Try adjusting your filters or location search.</p>
                </div>
              ) : (
                filteredAndSorted.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    className="flex bg-white rounded-2xl border border-cream-100 hover:border-cream-300 shadow-sm overflow-hidden hover:shadow-md transition-all group h-36 shrink-0"
                  >
                    {/* Compact Image */}
                    <div className="w-32 sm:w-40 h-full bg-cream-50 relative shrink-0 overflow-hidden">
                      <img
                        src={
                          restaurant.image && restaurant.image !== 'no-photo.jpg'
                            ? restaurant.image
                            : 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                        }
                        alt={restaurant.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {restaurant.distance !== null && (
                        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm text-brown-900 px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-sm border border-cream-100 flex items-center gap-0.5">
                          <Navigation size={9} className="text-gold-500 rotate-45" />
                          <span>{restaurant.distance < 1 ? `${Math.round(restaurant.distance * 1000)} m` : `${restaurant.distance.toFixed(1)} km`}</span>
                        </div>
                      )}
                    </div>
                    {/* Compact details */}
                    <div className="p-3 flex flex-col justify-between flex-grow min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-1 mb-0.5">
                          <h4 className="font-serif font-bold text-brown-900 text-sm group-hover:text-gold-600 transition-colors truncate pr-1">
                            {restaurant.name}
                          </h4>
                          <div className={`flex items-center gap-0.5 font-bold text-[10px] px-1.5 py-0.5 rounded-lg shrink-0 ${getRatingColorClass(restaurant.rating)}`}>
                            <span>{restaurant.rating ? restaurant.rating.toFixed(1) : 'New'}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-brown-700/60 truncate mb-0.5 font-medium">{restaurant.cuisine}</p>
                        <p className="text-[10px] text-brown-700/50 truncate mb-1">📍 {restaurant.location || restaurant.city}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-cream-100">
                        <span className="text-[11px] font-serif font-bold text-gold-500">
                          {restaurant.priceRange === '$' || restaurant.priceRange === '₹' ? 'Budget' : restaurant.priceRange === '$$' || restaurant.priceRange === '₹₹' ? 'Moderate' : restaurant.priceRange === '$$$' || restaurant.priceRange === '₹₹₹' ? 'Premium' : 'Fine Dining'}
                        </span>
                        <Link
                          to={`/restaurants/${restaurant.id}`}
                          className="bg-brown-900 hover:bg-gold-500 text-cream-100 hover:text-brown-900 px-3 py-1.5 rounded-lg text-[10px] font-serif font-bold transition-all shadow-sm"
                        >
                          Book Table
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Right Sticky Map */}
            <div className="w-full lg:w-7/12 rounded-3xl overflow-hidden border border-cream-200 shadow-md bg-white p-3">
              <DashboardMap restaurants={filteredAndSorted} />
            </div>
          </div>
        ) : (
          filteredAndSorted.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-cream-200 max-w-xl mx-auto shadow-md p-10">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold-500/10">
                <MapPin size={36} className="text-gold-500" />
              </div>
              <p className="text-2xl font-serif font-bold text-brown-900 mb-2">
                {restaurants.length === 0 ? 'No Registered Restaurants' : 'No Dining Venues Found'}
              </p>
              <p className="text-sm text-brown-700/60 mb-8 font-sans max-w-md mx-auto">
                {restaurants.length === 0
                  ? 'There are currently no restaurants registered in the system. If you are a restaurant owner, please go to the owner portal to register your restaurant.'
                  : locationQuery
                  ? `We couldn't find any premium restaurants matching "${locationQuery}". Try selecting another area or clearing filters.`
                  : 'Try adjusting your search criteria or filter options to discover restaurants.'}
              </p>
              {restaurants.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setLocationQuery('');
                      setUserCoords(null);
                      setNearMeActive(false);
                      setActiveCuisine('All');
                      setRatingFilter(false);
                      setPriceFilter('All');
                    }}
                    className="w-full sm:w-auto bg-cream-200 hover:bg-beige-200 text-brown-900 px-6 py-3 rounded-xl font-bold transition-all text-xs cursor-pointer shadow-sm"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAndSorted.map((restaurant, index) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.4) }}
                  className="bg-white rounded-3xl overflow-hidden border border-cream-200 hover:shadow-xl hover:shadow-brown-900/5 hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
                >
                  {/* Image Section */}
                  <div className="h-56 bg-cream-50 relative overflow-hidden shrink-0">
                    <img
                      src={
                        restaurant.image && restaurant.image !== 'no-photo.jpg'
                          ? restaurant.image
                          : 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                      }
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Cuisine Badge overlay */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-brown-900 px-3 py-1 rounded-xl text-xs font-serif font-bold shadow-sm border border-cream-200">
                      {restaurant.cuisine}
                    </div>

                    {/* Distance Overlay */}
                    {restaurant.distance !== null && (
                      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-brown-900 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-sm flex items-center gap-1 border border-cream-100">
                        <Navigation size={10} className="text-gold-500 rotate-45" />
                        <span>
                          {restaurant.distance < 1
                            ? `${Math.round(restaurant.distance * 1000)} m`
                            : `${restaurant.distance.toFixed(1)} km`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details Section */}
                  <div className="p-5 flex flex-col flex-grow">
                    {/* Name and Rating */}
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-serif font-bold text-brown-900 text-lg group-hover:text-gold-500 transition-colors truncate max-w-[80%]" title={restaurant.name}>
                        {restaurant.name}
                      </h3>
                      <div className={`flex items-center gap-0.5 font-bold text-xs px-2 py-0.5 rounded-lg shrink-0 ${getRatingColorClass(restaurant.rating)}`}>
                        <span>{restaurant.rating ? restaurant.rating.toFixed(1) : 'N/A'}</span>
                        <Star size={10} className="fill-current" />
                      </div>
                    </div>

                    {/* Location and Cost */}
                    <div className="flex justify-between items-center text-xs text-brown-700/60 font-sans font-medium mb-3">
                      <span className="truncate max-w-[55%]">📍 {restaurant.location || restaurant.city}</span>
                      <span className="shrink-0 text-brown-800 font-bold bg-gold-50 px-2 py-0.5 rounded-lg border border-gold-500/10">
                        {getPriceText(restaurant.priceRange)}
                      </span>
                    </div>

                    {/* Description snippet */}
                    {restaurant.description && (
                      <p className="text-brown-700/80 text-xs line-clamp-2 mb-4 leading-relaxed font-sans">
                        {restaurant.description}
                      </p>
                    )}

                    {/* Divider and Actions */}
                    <div className="pt-4 border-t border-cream-100 flex items-center justify-between mt-auto">
                      {/* Crowd indicator */}
                      <div className="flex items-center gap-1.5 text-xs font-sans">
                        <Users size={14} className="text-brown-700/50" />
                        <span
                          className={`font-bold ${
                            restaurant.crowdLevel === 'High' || restaurant.crowdLevel === 'Full'
                              ? 'text-red-600'
                              : restaurant.crowdLevel === 'Medium'
                              ? 'text-amber-600'
                              : 'text-green-600'
                          }`}
                        >
                          {restaurant.crowdLevel || 'Average'} Crowd
                        </span>
                      </div>

                      {/* Book a table button */}
                      <Link
                        to={`/restaurants/${restaurant.id}`}
                        className="bg-brown-900 hover:bg-gold-500 text-cream-100 hover:text-brown-900 px-4 py-2.5 rounded-xl text-xs font-serif font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        Book Table 🍽️
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default RestaurantListing;
