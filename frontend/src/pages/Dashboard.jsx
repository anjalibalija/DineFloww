import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LayoutGrid, Calendar, Heart, MessageSquare, Ticket, Clock, Users, MapPin, X,
  ChevronRight, Award, Shield, Sparkles, Navigation, Trash2, Copy,
  ShieldCheck, Info, RefreshCw, Sparkle, LogOut, TrendingUp, HelpCircle, User,
  QrCode, Sliders, Receipt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Mock Data Sets for Demo Simulation Mode
const MOCK_BOOKINGS = [
  {
    id: "mock-book-1",
    restaurantName: "Olive Bistro",
    restaurantImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    location: "Indiranagar, Bengaluru",
    date: "2026-06-15",
    time: "19:30",
    guests: 4,
    tableNumber: "T3",
    tableCategory: "Window Side (Scenic View)",
    occasion: "Romantic Date",
    status: "Confirmed",
    bookingFee: "₹250",
    specialRequest: "Need a quiet window table for anniversary dinner.",
    paymentId: "pay_mock_99210",
    createdAt: "2026-05-28T14:30:00Z"
  },
  {
    id: "mock-book-2",
    restaurantName: "Kyoto Garden",
    restaurantImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
    location: "Sadashivanagar, Bengaluru",
    date: "2026-07-02",
    time: "20:30",
    guests: 6,
    tableNumber: "T5",
    tableCategory: "VIP Private Cabin",
    occasion: "Business Dinner",
    status: "Confirmed",
    bookingFee: "₹500",
    specialRequest: "Presentation screen requested.",
    paymentId: "pay_mock_99211",
    createdAt: "2026-05-29T10:15:00Z"
  },
  {
    id: "mock-book-3",
    restaurantName: "Spice Route",
    restaurantImage: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    location: "Koramangala, Bengaluru",
    date: "2026-05-24",
    time: "20:00",
    guests: 2,
    tableNumber: "T8",
    tableCategory: "Rooftop Deck",
    occasion: "Casual Dining",
    status: "Completed",
    bookingFee: "₹250",
    specialRequest: "Vegetarian pre-orders added.",
    paymentId: "pay_mock_99182",
    createdAt: "2026-05-20T12:00:00Z"
  },
  {
    id: "mock-book-4",
    restaurantName: "Bella Italia",
    restaurantImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    location: "Lavelle Road, Bengaluru",
    date: "2026-05-10",
    time: "13:00",
    guests: 2,
    tableNumber: "T2",
    tableCategory: "Main Dining Hall",
    occasion: "Social Hangout",
    status: "Cancelled",
    bookingFee: "₹250",
    specialRequest: "",
    paymentId: null,
    createdAt: "2026-05-08T09:30:00Z"
  }
];

const MOCK_FAVORITES = [
  {
    id: "fav-mock-1",
    restaurantId: "res-olive-bistro",
    name: "Olive Bistro",
    cuisine: "Italian",
    location: "Indiranagar, Bengaluru",
    rating: 4.8,
    reviewsCount: 182,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    priceRange: "₹₹₹",
    priceTier: "Premium",
    description: "An elegant, candlelit sanctuary offering wood-fired pizzas, hand-rolled pasta, and curated fine wines in a romantic Mediterranean setting."
  },
  {
    id: "fav-mock-2",
    restaurantId: "res-spice-route",
    name: "Spice Route",
    cuisine: "Indian",
    location: "Koramangala, Bengaluru",
    rating: 4.9,
    reviewsCount: 310,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    priceRange: "₹₹₹₹",
    priceTier: "Fine Dining",
    description: "Embark on an authentic culinary journey with rich Mughal curries, slow-cooked Awadhi biryanis, and saffron-infused desserts."
  },
  {
    id: "fav-mock-3",
    restaurantId: "res-bella-italia",
    name: "Bella Italia",
    cuisine: "Italian",
    location: "Lavelle Road, Bengaluru",
    rating: 4.6,
    reviewsCount: 94,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    priceRange: "₹₹",
    priceTier: "Moderate",
    description: "A cozy family-owned trattoria serving rustic Italian favorites, fresh pestos, and artisan gelatos made from scratch."
  }
];

const MOCK_REVIEWS = [
  {
    id: "rev-mock-1",
    restaurantName: "Olive Bistro",
    rating: 5,
    comment: "The Wood-fired pizza was out of this world! Perfect candlelight setting. Booking through DineFlow worked like a charm.",
    date: "2026-05-29"
  },
  {
    id: "rev-mock-2",
    restaurantName: "Kyoto Garden",
    rating: 4,
    comment: "Immersive experience, but definitely premium priced. The sushi was incredibly fresh. Clean service!",
    date: "2026-05-18"
  },
  {
    id: "rev-mock-3",
    restaurantName: "Spice Route",
    rating: 5,
    comment: "Mughal curries are so rich and flavorful. Seating at the rooftop deck was fantastic. Recommended!",
    date: "2026-04-12"
  }
];

const MOCK_COUPONS = [
  {
    code: "DINEGOLD15",
    discount: "15% OFF",
    description: "15% off on booking fee for any premium dining reservation.",
    expiry: "Valid till 30 Jun 2026",
    status: "Active"
  },
  {
    code: "WELCOMEFLOW25",
    discount: "25% OFF",
    description: "25% off on your next fine dining reservation.",
    expiry: "Valid till 15 Jul 2026",
    status: "Active"
  },
  {
    code: "SUNDAYFEAST50",
    discount: "50% OFF",
    description: "Half off on booking fee for weekend brunch bookings.",
    expiry: "Expired on 15 May 2026",
    status: "Expired"
  }
];

const getCountdownText = (bookingDateStr) => {
  if (!bookingDateStr) return "Scheduled";
  const targetDate = new Date(bookingDateStr);
  const now = new Date();
  
  // Reset hours to compare dates cleanly
  const targetDateReset = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const nowDateReset = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = targetDateReset - nowDateReset;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (isNaN(diffDays)) return "Upcoming";
  if (diffDays < 0) return "Dined Out";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `In ${diffDays} Days`;
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState('overview'); // overview, bookings, favorites, reviews, coupons
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  
  // Data states
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [coupons, setCoupons] = useState([]);

  // Seating & Dietary preference states
  const [selectedCuisines, setSelectedCuisines] = useState(['Italian', 'Indian']);
  const [selectedDietary, setSelectedDietary] = useState(['Vegetarian']);
  const [selectedSeating, setSelectedSeating] = useState('Scenic Window');

  // Action / Form states
  const [bookingFilter, setBookingFilter] = useState('upcoming'); // upcoming, past, cancelled

  // Modals
  const [blueprintModalBooking, setBlueprintModalBooking] = useState(null);
  const [cancelConfirmBooking, setCancelConfirmBooking] = useState(null);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [digitalPassBooking, setDigitalPassBooking] = useState(null);

  // Toast trigger helper
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Google Fonts loading
  useEffect(() => {
    const fontLinkId = 'luxury-fonts';
    if (!document.getElementById(fontLinkId)) {
      const link = document.createElement('link');
      link.id = fontLinkId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Memoized upcoming booking selector
  const upcomingBooking = useMemo(() => {
    return bookings.find(b => {
      const status = (b.status || '').toLowerCase();
      return status === 'confirmed' || status === 'pending';
    });
  }, [bookings]);

  // Unified load function with database-to-mock automatic fallback
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch reservations
      let userBookings = [];
      try {
        const bookingsRes = await axios.get('/api/bookings/my');
        userBookings = bookingsRes.data.data || [];
      } catch (err) {
        console.error('Failed to fetch bookings:', err.message);
      }

      // 2. Fetch favorites
      let userFavs = [];
      try {
        const favsRes = await axios.get('/api/favorites');
        userFavs = favsRes.data.data || [];
      } catch (err) {
        console.error('Failed to fetch favorites:', err.message);
      }

      // 3. Fetch reviews
      let userReviews = [];
      try {
        const reviewsRes = await axios.get('/api/reviews/my');
        userReviews = reviewsRes.data.data || [];
      } catch (err) {
        console.error('Failed to fetch reviews:', err.message);
      }

      // 4. Fetch coupons
      let userCoupons = [];
      try {
        const couponsRes = await axios.get('/api/coupons/my');
        userCoupons = couponsRes.data.data || [];
      } catch (err) {
        console.error('Failed to fetch coupons:', err.message);
      }

      // Populate database values or fall back to mock data if empty (satisfying empty-state protection)
      setBookings(userBookings.length > 0 ? userBookings : MOCK_BOOKINGS);
      setFavorites(userFavs.length > 0 ? userFavs : MOCK_FAVORITES);
      setReviews(userReviews.length > 0 ? userReviews : MOCK_REVIEWS);
      setCoupons(userCoupons.length > 0 ? userCoupons : MOCK_COUPONS);
      
    } catch (err) {
      // Complete offline fallback in case of CORS or connectivity failures
      setBookings(MOCK_BOOKINGS);
      setFavorites(MOCK_FAVORITES);
      setReviews(MOCK_REVIEWS);
      setCoupons(MOCK_COUPONS);
      showToast('Loaded offline realistic sample data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Toggle favorite API
  const handleToggleFavorite = async (restaurantId, name) => {
    if (String(restaurantId).startsWith('res-') || String(restaurantId).startsWith('fav-mock')) {
      setFavorites(prev => prev.filter(f => f.restaurantId !== restaurantId && f.id !== restaurantId));
      showToast(`Removed ${name} from favorites (Offline Mode).`);
      return;
    }

    try {
      await axios.post(`/api/favorites/${restaurantId}`);
      const favsRes = await axios.get('/api/favorites');
      const userFavs = favsRes.data.data || [];
      setFavorites(userFavs.length > 0 ? userFavs : MOCK_FAVORITES);
      showToast(`Successfully updated favorite status for ${name}.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to toggle favorite.');
    }
  };

  // Cancel reservation
  const handleCancelBooking = async () => {
    if (!cancelConfirmBooking) return;
    const { id, restaurantName } = cancelConfirmBooking;

    if (String(id).startsWith('mock-book-')) {
      setBookings(prev =>
        prev.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b)
      );
      setCancelConfirmBooking(null);
      showToast(`Cancelled reservation at ${restaurantName} (Offline Mode).`);
      return;
    }

    try {
      await axios.delete(`/api/bookings/${id}`);
      setBookings(prev =>
        prev.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b)
      );
      setCancelConfirmBooking(null);
      showToast(`Cancelled reservation at ${restaurantName}.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel reservation.');
    }
  };

  // Delete review
  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    const { id, restaurantName } = reviewToDelete;

    if (String(id).startsWith('rev-mock-')) {
      setReviews(prev => prev.filter(r => r.id !== id));
      setReviewToDelete(null);
      showToast(`Deleted review for ${restaurantName} (Offline Mode).`);
      return;
    }

    try {
      await axios.delete(`/api/reviews/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
      setReviewToDelete(null);
      showToast(`Deleted review for ${restaurantName}.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete review.');
    }
  };

  // Copy code animation
  const copyPromoCode = (code) => {
    navigator.clipboard.writeText(code);
    showToast(`Code "${code}" copied to clipboard!`);
  };

  // Derived bookings filter logic
  const filteredBookings = bookings.filter(b => {
    const status = (b.status || '').toLowerCase();
    if (bookingFilter === 'upcoming') {
      return status === 'confirmed' || status === 'pending';
    } else if (bookingFilter === 'past') {
      return status === 'completed';
    } else {
      return status === 'cancelled';
    }
  });

  // Dynamic loyalty calculations based on database bookings and reviews
  const loyaltyPoints = useMemo(() => {
    const isMock = bookings.length > 0 && String(bookings[0].id).startsWith('mock-');
    if (isMock) return 250;
    const completedCount = bookings.filter(b => b.status === 'Completed').length;
    const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;
    return (completedCount + confirmedCount) * 50 + reviews.length * 25;
  }, [bookings, reviews]);

  const loyaltyTier = loyaltyPoints >= 500 ? 'Platinum' : loyaltyPoints >= 300 ? 'Gold' : loyaltyPoints >= 100 ? 'Silver' : 'Bronze';
  const loyaltyNextPoints = loyaltyPoints >= 500 ? 500 : loyaltyPoints >= 300 ? 500 : loyaltyPoints >= 100 ? 300 : 100;
  const loyaltyPrevPoints = loyaltyPoints >= 500 ? 500 : loyaltyPoints >= 300 ? 300 : loyaltyPoints >= 100 ? 100 : 0;
  const loyaltyProgressPercent = loyaltyPoints >= 500 ? 100 : Math.round(((loyaltyPoints - loyaltyPrevPoints) / (loyaltyNextPoints - loyaltyPrevPoints)) * 100);

  // Dynamic Radar Chart Coordinates Calculation
  const radarPoints = useMemo(() => {
    let socialVal = 45;
    let privacyVal = 50;
    let scenicVal = 45;
    let serviceVal = 50;
    let flavorVal = 55;

    // Social calculations
    if (selectedCuisines.length > 2) socialVal += 15;
    if (selectedDietary.includes('Vegan') || selectedDietary.includes('Vegetarian')) socialVal += 10;

    // Privacy calculations
    if (selectedSeating === 'VIP Private Cabin') privacyVal = 70;
    else if (selectedSeating === 'Bar Lounge') privacyVal = 35;
    else if (selectedSeating === 'Center Table') privacyVal = 40;
    else privacyVal = 55;

    // Scenic calculations
    if (selectedSeating === 'Scenic Window') scenicVal = 70;
    else if (selectedSeating === 'Rooftop Deck') scenicVal = 70;
    else if (selectedSeating === 'Center Table') scenicVal = 30;

    // Service calculations
    if (selectedDietary.includes('Gluten-Free') || selectedDietary.includes('Nut-Free')) serviceVal = 70;
    else if (selectedDietary.length > 1) serviceVal = 60;

    // Flavor calculations
    if (selectedCuisines.includes('Indian') || selectedCuisines.includes('Japanese')) flavorVal = 70;
    else if (selectedCuisines.length > 0) flavorVal = 60;

    const pts = [
      // Social: theta = -90 deg
      { x: 100, y: 100 - socialVal },
      // Privacy: theta = -18 deg
      { x: 100 + privacyVal * 0.951, y: 100 - privacyVal * 0.309 },
      // Scenic: theta = 54 deg
      { x: 100 + scenicVal * 0.588, y: 100 + scenicVal * 0.809 },
      // Service: theta = 126 deg
      { x: 100 - serviceVal * 0.588, y: 100 + serviceVal * 0.809 },
      // Flavor: theta = 198 deg
      { x: 100 - flavorVal * 0.951, y: 100 - flavorVal * 0.309 }
    ];

    return pts.map(p => `${Math.round(p.x)},${Math.round(p.y)}`).join(' ');
  }, [selectedCuisines, selectedDietary, selectedSeating]);

  // AI Matches matching cuisine and seating preferences
  const recommendedMatches = useMemo(() => {
    const pool = [
      {
        id: "res-olive-bistro",
        name: "Olive Bistro",
        cuisine: "Italian",
        location: "Indiranagar, Bengaluru",
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80",
        seating: "Scenic Window",
        tagline: "Romantic Mediterranean terrace setting"
      },
      {
        id: "res-kyoto-garden",
        name: "Kyoto Garden",
        cuisine: "Japanese",
        location: "Sadashivanagar, Bengaluru",
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80",
        seating: "VIP Private Cabin",
        tagline: "Traditional tatami private dining rooms"
      },
      {
        id: "res-spice-route",
        name: "Spice Route",
        cuisine: "Indian",
        location: "Koramangala, Bengaluru",
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80",
        seating: "Rooftop Deck",
        tagline: "Slow-cooked Awadhi royal biryanis"
      },
      {
        id: "res-bella-italia",
        name: "Bella Italia",
        cuisine: "Italian",
        location: "Lavelle Road, Bengaluru",
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
        seating: "Center Table",
        tagline: "Cozy trattoria with hand-rolled pastas"
      }
    ];

    return pool.map(res => {
      let score = 70;
      if (selectedCuisines.includes(res.cuisine)) score += 18;
      if (selectedSeating === res.seating) score += 12;
      else if (selectedSeating === 'Rooftop Deck' && res.seating === 'Scenic Window') score += 5;
      
      score = Math.min(score, 99);
      return { ...res, matchScore: score };
    }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  }, [selectedCuisines, selectedSeating]);

  return (
    <div
      className="min-h-screen bg-[#FDFBF7] text-[#3E2723] pb-24 selection:bg-[#D4AF37]/30"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-50 bg-[#2C1B18] text-[#D4AF37] border border-[#D4AF37]/30 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs font-semibold"
          >
            <Sparkles size={14} className="text-[#D4AF37]" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Hospitality Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2C1B18] via-[#3E2723] to-[#1E110F] text-[#FAF6EE] py-12 px-4 md:px-8 border-b border-[#D4AF37]/20">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex justify-center md:justify-start items-center gap-2 text-[#D4AF37] tracking-widest text-[10px] font-bold uppercase">
              <Sparkle size={10} className="animate-spin-slow" />
              <span>DineFlow Gourmet Command Center</span>
              <Sparkle size={10} className="animate-spin-slow" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Patron Dashboard
            </h1>
            <p className="text-xs md:text-sm text-[#C5A880] font-light max-w-md">
              Review dinner schedules, explore table seating layouts, unlock exclusive coupon rewards, and check dining analytics.
            </p>
          </div>

          {/* Patron Membership Badge Status Card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-3xl flex items-center gap-4 shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Award size={20} />
            </div>
            <div className="text-left">
              <span className="block text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkle size={10} className="text-[#D4AF37] animate-pulse" />
                {loyaltyTier} Patron Membership
              </span>
              <span className="text-[10px] text-[#C5A880]/70 font-light block mt-0.5">
                {loyaltyPoints} Gourmet Points Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-8">
        
        {/* Horizontal Navigation bar segment bar (replaces left settings-style vertical sidebar) */}
        <div className="flex bg-white/60 backdrop-blur-md border border-white/40 p-2 rounded-2xl shadow-sm mb-8 overflow-x-auto gap-2 items-center justify-start scrollbar-none">
          {[
            { id: 'overview', label: 'Dashboard Home', icon: LayoutGrid },
            { id: 'bookings', label: 'My Reservations', icon: Calendar },
            { id: 'favorites', label: 'Saved Favorites', icon: Heart },
            { id: 'reviews', label: 'Dining Reviews', icon: MessageSquare },
            { id: 'coupons', label: 'Rewards & Coupons', icon: Ticket }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2C1B18] text-white shadow-md'
                    : 'text-[#8D6E63] hover:bg-[#FAF6EE] hover:text-[#3E2723]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#D4AF37]' : 'text-[#8D6E63]'} />
                {tab.label}
              </button>
            );
          })}

          {/* Quick link to actual profile page */}
          <Link
            to="/profile"
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-[#8D6E63] hover:bg-[#FAF6EE] hover:text-[#3E2723] transition-all ml-auto whitespace-nowrap"
          >
            <User size={14} />
            My Profile Settings ⚙️
          </Link>
        </div>

        {/* Active Tab Screen Area */}
        <div className="min-h-[500px]">
          {loading ? (
            <div className="bg-white/60 border border-white/40 rounded-3xl p-16 flex flex-col items-center justify-center text-[#2C1B18] font-serif text-xl space-y-4 shadow-sm">
              <RefreshCw size={36} className="animate-spin text-[#D4AF37]" />
              <span>Synchronizing workspace databases...</span>
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              
              {/* 1. OVERVIEW SCREEN */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Welcome banner */}
                  <div className="bg-white border border-white p-6 rounded-3xl shadow-sm text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-24 opacity-10 bg-gradient-to-l from-[#D4AF37] pointer-events-none" />
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] flex items-center gap-1">
                        <Sparkles size={10} /> Member Hub
                      </span>
                      <h2 className="text-2xl font-bold font-serif text-[#2C1B18]">
                        Welcome Back, {user?.name?.split(' ')[0] || 'Patron'}
                      </h2>
                      <p className="text-xs text-stone-400 font-light">
                        Review your dining activity, schedule reservations, and check points balance.
                      </p>
                    </div>
                    <span className="px-4 py-1.5 rounded-full bg-[#FAF6EE] text-[#D4AF37] border border-[#D4AF37]/20 text-[10px] font-bold uppercase tracking-wider">
                      👑 {loyaltyTier} Member
                    </span>
                  </div>

                  {/* Demo/Fallback Notification Banner */}
                  {bookings.length > 0 && String(bookings[0].id).startsWith('mock-') && (
                    <div className="bg-amber-50/50 border border-[#D4AF37]/20 p-4 rounded-3xl text-left flex items-center gap-3">
                      <div className="bg-[#2C1B18] text-[#D4AF37] p-2 rounded-xl shrink-0">
                        <Info size={14} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#2C1B18] text-xs">Viewing Demonstration Sample Data</h4>
                        <p className="text-stone-500 text-[10px] mt-0.5 font-light">
                          Your PostgreSQL database currently holds no bookings. We've automatically loaded realistic mock data for preview!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Upcoming Dinner Countdown Banner */}
                  {upcomingBooking && (
                    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-[#D4AF37]/30 p-5 rounded-3xl text-left flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#2C1B18] text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/20 shrink-0">
                          <Clock size={20} className="animate-pulse" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] uppercase font-black text-[#D4AF37] tracking-widest block">Upcoming Dining Experience</span>
                          <h4 className="font-serif font-black text-md text-[#2C1B18]">
                            {upcomingBooking.restaurantName || upcomingBooking.restaurant?.name}
                          </h4>
                          <p className="text-[10px] text-stone-500">
                            📍 {upcomingBooking.location || upcomingBooking.restaurant?.location} • 👥 {upcomingBooking.guests || upcomingBooking.peopleCount} guests
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0 font-sans shrink-0">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Scheduled for</span>
                        <span className="text-sm font-black text-[#2C1B18]">
                          {upcomingBooking.date || new Date(upcomingBooking.bookingDate).toLocaleDateString()} at {upcomingBooking.time || upcomingBooking.bookingTime}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 border border-amber-200/50 rounded-full font-bold block">
                            {getCountdownText(upcomingBooking.date || upcomingBooking.bookingDate)}
                          </span>
                          <button
                            onClick={() => setDigitalPassBooking(upcomingBooking)}
                            className="bg-[#2C1B18] hover:bg-[#D4AF37] text-white hover:text-[#2C1B18] border border-[#2C1B18] hover:border-[#D4AF37] px-3 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode size={10} /> Digital Pass
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'My Bookings', value: bookings.length, icon: Calendar, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                      { label: 'Favorites', value: favorites.length, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
                      { label: 'Gourmet Points', value: loyaltyPoints, icon: Award, color: 'text-[#D4AF37]', bg: 'bg-amber-50' },
                      { label: 'My Reviews', value: reviews.length, icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                    ].map((stat, idx) => {
                      const Icon = stat.icon;
                      return (
                        <div key={idx} className="bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl p-5 shadow-sm text-left flex flex-col justify-between h-28 group hover:shadow transition">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">{stat.label}</span>
                            <div className={`p-1.5 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-105 transition`}>
                              <Icon size={14} />
                            </div>
                          </div>
                          <span className="text-2xl font-bold font-serif text-[#2C1B18]">{stat.value}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Two-Column Overview Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Left Column: Loyalty Status, Dining Preferences, Timeline */}
                    <div className="space-y-8">
                      {/* Loyalty Status details */}
                      <div className="bg-gradient-to-br from-[#2C1B18] via-[#3E2723] to-[#1E110F] text-[#FAF6EE] rounded-3xl p-6 shadow-md text-left relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none">
                          <svg viewBox="0 0 100 100" className="w-full h-full text-[#D4AF37]" fill="currentColor">
                            <path d="M50 0 C60 20 80 30 100 50 C80 70 60 80 50 100 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                          </svg>
                        </div>
                        
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-[#D4AF37] tracking-wider">Loyalty Rewards progress</span>
                            <h3 className="font-serif text-lg font-bold text-white flex items-center gap-1.5">
                              <Award size={18} className="text-[#D4AF37]" />
                              {loyaltyTier} Gourmet Tier
                            </h3>
                          </div>
                          <span className="text-xs font-mono font-bold text-[#C5A880]">{loyaltyPoints} PTS</span>
                        </div>

                        {/* Level gauge */}
                        <div className="mt-6 space-y-2">
                          <div className="flex justify-between items-center text-[10px] text-stone-400">
                            <span>Bronze (0 pts)</span>
                            {loyaltyPoints < 500 && (
                              <span className="text-[#C5A880] font-semibold">
                                {loyaltyNextPoints - loyaltyPoints} pts to {loyaltyTier === 'Silver' ? 'Gold' : 'Platinum'}
                              </span>
                            )}
                            <span>Platinum (500 pts)</span>
                          </div>
                          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                            <div
                              className="h-full bg-gradient-to-r from-[#C5A880] to-[#D4AF37] rounded-full transition-all duration-1000"
                              style={{ width: `${loyaltyProgressPercent}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-4 border-t border-white/5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] text-stone-400">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck size={12} className="text-[#D4AF37]" />
                            <span>Guaranteed Priority Table Bookings</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck size={12} className="text-[#D4AF37]" />
                            <span>No-show cancellation fees waived</span>
                          </div>
                        </div>
                      </div>

                      {/* Dietary & Seating Preference Configurator Card (NEW) */}
                      <div className="bg-white border border-white rounded-3xl p-6 shadow-sm text-left space-y-4">
                        <h3 className="font-serif font-bold text-md text-[#2C1B18] flex items-center gap-1.5 pb-2 border-b border-[#FAF6EE]">
                          <Sliders size={16} className="text-[#D4AF37]" />
                          Dining Preferences Manager
                        </h3>
                        <p className="text-[10px] text-stone-400 font-light">
                          Configure your preferences below to dynamically personalize your matchmaker recommendations and update your priority radar profile.
                        </p>

                        <div className="space-y-4">
                          {/* Cuisines Choice */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-[#8D6E63] tracking-widest block">Preferred Cuisines</span>
                            <div className="flex flex-wrap gap-1.5">
                              {['Italian', 'Indian', 'Japanese', 'Chinese', 'Continental'].map(cuisine => {
                                const selected = selectedCuisines.includes(cuisine);
                                return (
                                  <button
                                    key={cuisine}
                                    onClick={() => setSelectedCuisines(prev => 
                                      selected ? prev.filter(c => c !== cuisine) : [...prev, cuisine]
                                    )}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                                      selected 
                                        ? 'bg-[#2C1B18] text-[#D4AF37] border-[#2C1B18]' 
                                        : 'bg-stone-50 border-stone-200 text-[#8D6E63] hover:bg-[#FAF6EE]'
                                    }`}
                                  >
                                    {cuisine}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Dietary Options */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-[#8D6E63] tracking-widest block">Dietary Options</span>
                            <div className="flex flex-wrap gap-1.5">
                              {['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Nut-Free'].map(diet => {
                                const selected = selectedDietary.includes(diet);
                                return (
                                  <button
                                    key={diet}
                                    onClick={() => setSelectedDietary(prev => 
                                      selected ? prev.filter(d => d !== diet) : [...prev, diet]
                                    )}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                                      selected 
                                        ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30' 
                                        : 'bg-stone-50 border-stone-200 text-stone-400 hover:bg-[#FAF6EE]'
                                    }`}
                                  >
                                    {diet}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Seating Choice */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] uppercase font-bold text-[#8D6E63] tracking-widest block">Preferred Table Seating</span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                              {['Scenic Window', 'Rooftop Deck', 'VIP Private Cabin', 'Bar Lounge', 'Center Table'].map(seat => {
                                const selected = selectedSeating === seat;
                                return (
                                  <button
                                    key={seat}
                                    onClick={() => setSelectedSeating(seat)}
                                    className={`px-2 py-1.5 rounded-xl text-[9px] font-bold border transition cursor-pointer text-center truncate ${
                                      selected 
                                        ? 'bg-[#2C1B18] text-[#D4AF37] border-[#2C1B18]' 
                                        : 'bg-stone-50 border-stone-200 text-stone-400 hover:bg-[#FAF6EE]'
                                    }`}
                                  >
                                    {seat}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Patron Dining Timeline (Vertical activity log) */}
                      <div className="bg-white border border-white rounded-3xl p-6 shadow-sm text-left space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-serif font-bold text-md text-[#2C1B18] flex items-center gap-1.5">
                            <Clock size={16} className="text-[#D4AF37]" />
                            Patron Activity Timeline
                          </h3>
                          <button
                            onClick={() => setActiveTab('bookings')}
                            className="text-[10px] font-bold text-[#D4AF37] hover:underline"
                          >
                            View all bookings
                          </button>
                        </div>

                        {bookings.length === 0 ? (
                          <p className="text-stone-400 text-xs py-8 text-center font-light">
                            No dining history timeline logged yet. Reserving a table will start your timeline.
                          </p>
                        ) : (
                          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D4AF37]/20">
                            {bookings.map((b, bIdx) => {
                              const status = (b.status || '').toLowerCase();
                              let color = 'bg-[#D4AF37]';
                              let title = `Booking Scheduled at ${b.restaurantName || b.restaurant?.name}`;
                              let desc = `Table ${b.tableNumber || b.table?.tableNumber || 'Auto'} reserved for ${b.guests || b.peopleCount} guests.`;
                              
                              if (status === 'completed') {
                                color = 'bg-emerald-500';
                                title = `Dine-out Completed at ${b.restaurantName || b.restaurant?.name}`;
                                desc = `Successfully completed your reservation. Earned rewards points.`;
                              } else if (status === 'cancelled') {
                                color = 'bg-red-500';
                                title = `Reservation Cancelled at ${b.restaurantName || b.restaurant?.name}`;
                                desc = `Cancelled. Table inventory freed back to the public pool.`;
                              }

                              return (
                                <div key={b.id || bIdx} className="relative space-y-1 text-left">
                                  <span className={`absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${color} ${status === 'confirmed' || status === 'pending' ? 'animate-pulse' : ''}`} />
                                  <div className="flex justify-between items-baseline gap-2">
                                    <h4 className="font-bold text-xs text-[#2C1B18]">{title}</h4>
                                    <span className="text-[8px] text-stone-400 font-medium shrink-0">
                                      {b.date || new Date(b.bookingDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-stone-500 font-light leading-snug">{desc}</p>
                                </div>
                              );
                            }).slice(0, 4)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Gourmet Dining Insights & Achievements */}
                    <div className="space-y-8">
                      {/* Gourmet Dining Insights Card */}
                      <div className="bg-white border border-white rounded-3xl p-6 shadow-sm text-left space-y-5">
                        <h3 className="font-serif font-bold text-md text-[#2C1B18] flex items-center gap-1.5 pb-2 border-b border-[#FAF6EE]">
                          <TrendingUp size={16} className="text-[#D4AF37]" />
                          Gourmet Dining Insights
                        </h3>

                        {/* Visual SVG Radar Chart */}
                        <div className="space-y-2">
                          <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block text-left">Dining Priority Profile</span>
                          
                          <div className="flex justify-center py-2 bg-[#FAF6EE]/30 rounded-2xl border border-[#FAF6EE] relative">
                            <div className="w-44 h-44">
                              <svg viewBox="0 0 200 200" className="w-full h-full">
                                {/* Grid lines (Concentric Pentagons) */}
                                <polygon points="100,30 166,78 141,156 59,156 34,78" fill="none" stroke="rgba(212, 175, 55, 0.12)" strokeWidth="1" />
                                <polygon points="100,47 149,83 130,142 69,142 50,83" fill="none" stroke="rgba(212, 175, 55, 0.18)" strokeWidth="1" />
                                <polygon points="100,65 133,89 120,128 79,128 67,89" fill="none" stroke="rgba(212, 175, 55, 0.24)" strokeWidth="1" />
                                <polygon points="100,82 116,94 110,114 89,114 83,94" fill="none" stroke="rgba(212, 175, 55, 0.24)" strokeWidth="1" />
                                
                                {/* Axis lines */}
                                <line x1="100" y1="100" x2="100" y2="30" stroke="rgba(212, 175, 55, 0.12)" strokeWidth="1" />
                                <line x1="100" y1="100" x2="166" y2="78" stroke="rgba(212, 175, 55, 0.12)" strokeWidth="1" />
                                <line x1="100" y1="100" x2="141" y2="156" stroke="rgba(212, 175, 55, 0.12)" strokeWidth="1" />
                                <line x1="100" y1="100" x2="59" y2="156" stroke="rgba(212, 175, 55, 0.12)" strokeWidth="1" />
                                <line x1="100" y1="100" x2="34" y2="78" stroke="rgba(212, 175, 55, 0.12)" strokeWidth="1" />

                                {/* User Priority Polygon (Dynamically recalculated coordinates) */}
                                <polygon
                                  points={radarPoints}
                                  fill="rgba(212, 175, 55, 0.18)"
                                  stroke="#D4AF37"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="transition-all duration-500"
                                />
                                
                                {/* Outer Labels */}
                                <text x="100" y="24" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#2C1B18">Social</text>
                                <text x="172" y="78" textAnchor="start" fontSize="8" fontWeight="bold" fill="#2C1B18">Privacy</text>
                                <text x="145" y="166" textAnchor="start" fontSize="8" fontWeight="bold" fill="#2C1B18">Scenic</text>
                                <text x="53" y="166" textAnchor="end" fontSize="8" fontWeight="bold" fill="#2C1B18">Service</text>
                                <text x="26" y="78" textAnchor="end" fontSize="8" fontWeight="bold" fill="#2C1B18">Flavor</text>
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        {/* Favorite Cuisines visual bar chart */}
                        <div className="space-y-3 border-t border-[#FAF6EE] pt-4">
                          <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Favorite Cuisines</span>
                          
                          <div className="space-y-2.5">
                            {[
                              { name: 'Italian', percentage: 50, count: 4, color: 'from-[#D4AF37] to-[#C5A880]' },
                              { name: 'Japanese', percentage: 30, count: 2, color: 'from-[#8D6E63] to-[#A1887F]' },
                              { name: 'Indian', percentage: 20, count: 1, color: 'from-[#2C1B18] to-[#3E2723]' }
                            ].map((cuisine, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-[#2C1B18]">
                                  <span>{cuisine.name}</span>
                                  <span className="text-stone-400">{cuisine.percentage}% ({cuisine.count} visits)</span>
                                </div>
                                <div className="h-1.5 w-full bg-[#FAF6EE] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full bg-gradient-to-r ${cuisine.color} rounded-full`}
                                    style={{ width: `${cuisine.percentage}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Spending Distribution analytics widget (NEW) */}
                        <div className="border-t border-[#FAF6EE] pt-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Spending Distribution</span>
                            <span className="text-[8px] font-bold text-[#D4AF37] uppercase flex items-center gap-0.5">
                              <Receipt size={10} /> Monthly Average: ₹4,800
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="h-4 w-full bg-[#FAF6EE] rounded-full overflow-hidden flex">
                              <div className="h-full bg-[#2C1B18] hover:opacity-90 transition" style={{ width: '15%' }} title="Budget: 15%" />
                              <div className="h-full bg-[#8D6E63] hover:opacity-90 transition" style={{ width: '30%' }} title="Moderate: 30%" />
                              <div className="h-full bg-[#D4AF37] hover:opacity-90 transition" style={{ width: '35%' }} title="Premium: 35%" />
                              <div className="h-full bg-amber-500 hover:opacity-90 transition flex-1" style={{ width: '20%' }} title="Fine Dining: 20%" />
                            </div>

                            <div className="grid grid-cols-4 gap-1 text-[8px] text-center font-bold font-mono">
                              <div className="flex items-center gap-0.5 justify-center text-[#2C1B18]">
                                <span className="w-1 h-1 rounded-full bg-[#2C1B18]" />
                                <span>Budget(15%)</span>
                              </div>
                              <div className="flex items-center gap-0.5 justify-center text-[#8D6E63]">
                                <span className="w-1 h-1 rounded-full bg-[#8D6E63]" />
                                <span>Mod(30%)</span>
                              </div>
                              <div className="flex items-center gap-0.5 justify-center text-[#D4AF37]">
                                <span className="w-1 h-1 rounded-full bg-[#D4AF37]" />
                                <span>Prem(35%)</span>
                              </div>
                              <div className="flex items-center gap-0.5 justify-center text-amber-700">
                                <span className="w-1 h-1 rounded-full bg-amber-500" />
                                <span>Fine(20%)</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Dining Habits Statistics */}
                        <div className="border-t border-[#FAF6EE] pt-4 space-y-2">
                          <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block">Dining Habits</span>
                          
                          <div className="grid grid-cols-2 gap-3 text-[10px]">
                            <div className="bg-[#FAF6EE] p-2.5 rounded-xl border border-[#FAF6EE]/80">
                              <span className="block text-stone-400 text-[8px] uppercase">Favorite Seating</span>
                              <span className="font-bold text-[#2C1B18] block mt-0.5">{selectedSeating} (Active)</span>
                            </div>
                            <div className="bg-[#FAF6EE] p-2.5 rounded-xl border border-[#FAF6EE]/80">
                              <span className="block text-stone-400 text-[8px] uppercase">Peak Dinner Time</span>
                              <span className="font-bold text-[#2C1B18] block mt-0.5 font-sans">7:30 PM - 8:30 PM</span>
                            </div>
                            <div className="bg-[#FAF6EE] p-2.5 rounded-xl border border-[#FAF6EE]/80">
                              <span className="block text-stone-400 text-[8px] uppercase">Visited Regions</span>
                              <span className="font-bold text-[#2C1B18] block mt-0.5">Indiranagar (60%)</span>
                            </div>
                            <div className="bg-[#FAF6EE] p-2.5 rounded-xl border border-[#FAF6EE]/80">
                              <span className="block text-stone-400 text-[8px] uppercase">Commitment Rate</span>
                              <span className="font-bold text-emerald-600 block mt-0.5">98% (0 no-shows)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AI Matchmaker Curated Recommendations (NEW) */}
                      <div className="bg-white border border-white rounded-3xl p-6 shadow-sm text-left space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-[#FAF6EE]">
                          <h3 className="font-serif font-bold text-md text-[#2C1B18] flex items-center gap-1.5">
                            <Sparkles size={16} className="text-[#D4AF37] animate-pulse" />
                            AI Gourmet Matchmaker
                          </h3>
                          <span className="text-[8px] font-mono uppercase bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded font-bold">
                            Live Match
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 font-light">
                          Handpicked venues based on your active preferred cuisines and seating selection:
                        </p>

                        <div className="space-y-3">
                          {recommendedMatches.map((match) => (
                            <div key={match.id} className="flex items-center gap-3 p-2 bg-[#FAF6EE]/50 hover:bg-[#FAF6EE] rounded-2xl border border-[#FAF6EE] transition group">
                              <img
                                src={match.image}
                                alt={match.name}
                                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white"
                              />
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex justify-between items-baseline">
                                  <h4 className="font-bold text-xs text-[#2C1B18] truncate">{match.name}</h4>
                                  <span className="text-[9px] font-black text-[#D4AF37] shrink-0 bg-white px-1.5 py-0.5 rounded-md border border-[#D4AF37]/20 shadow-sm">
                                    {match.matchScore}% Match
                                  </span>
                                </div>
                                <p className="text-[9px] text-stone-400 truncate">{match.cuisine} • {match.seating}</p>
                                <p className="text-[9px] text-[#8D6E63] italic truncate">"{match.tagline}"</p>
                              </div>
                              <Link
                                to={`/restaurants/${match.id.replace('res-', '')}`}
                                className="bg-[#2C1B18] hover:bg-[#D4AF37] text-white hover:text-[#2C1B18] p-1.5 rounded-xl transition shadow-sm shrink-0"
                              >
                                <ChevronRight size={12} />
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Patron Milestones & Badges Card */}
                      <div className="bg-white border border-white rounded-3xl p-6 shadow-sm text-left space-y-4">
                        <h3 className="font-serif font-bold text-md text-[#2C1B18] flex items-center gap-1.5 pb-2 border-b border-[#FAF6EE]">
                          <Award size={16} className="text-[#D4AF37]" />
                          Patron Milestones & Badges
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { name: 'First Bite', desc: 'Booked first table', icon: '🍽️', unlocked: bookings.length > 0 },
                            { name: 'Cabin VIP', desc: 'Reserved VIP Cabin', icon: '👑', unlocked: bookings.some(b => b.tableCategory?.includes('Cabin') || b.table?.category?.includes('Cabin')) },
                            { name: 'Gourmet Critic', desc: 'Authored 3 reviews', icon: '✍️', unlocked: reviews.length >= 3 },
                            { name: 'Epicurean Elite', desc: 'Reach 500 points', icon: '🍷', unlocked: loyaltyPoints >= 500 }
                          ].map((badge, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-2xl border flex flex-col justify-between h-24 relative overflow-hidden transition group ${
                                badge.unlocked
                                  ? 'bg-[#FAF6EE] border-[#D4AF37]/20 hover:shadow-sm'
                                  : 'bg-stone-50 border-stone-200 opacity-60'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-xl group-hover:scale-110 transition duration-300">{badge.icon}</span>
                                <span className={`text-[6px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded ${
                                  badge.unlocked ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'bg-stone-200 text-stone-500'
                                }`}>
                                  {badge.unlocked ? 'Unlocked' : 'Locked'}
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="block font-bold text-[10px] text-[#2C1B18] truncate">{badge.name}</span>
                                <span className="block text-[8px] text-stone-400 font-light leading-none truncate">{badge.desc}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* 2. RESERVATIONS SCREEN */}
              {activeTab === 'bookings' && (
                <div className="bg-white border border-white rounded-3xl p-6 shadow-sm text-left space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pb-4 border-b border-[#FAF6EE]">
                    <h2 className="text-xl font-bold font-serif text-[#2C1B18] flex items-center gap-2">
                      <Calendar size={20} className="text-[#D4AF37]" />
                      My Reservations ({bookings.length})
                    </h2>
                    
                    {/* Filter selector */}
                    <div className="flex bg-[#FAF6EE] p-0.5 rounded-xl text-[10px] font-bold self-start sm:self-auto shadow-inner border border-[#D4AF37]/5">
                      {[
                        { id: 'upcoming', label: 'Upcoming' },
                        { id: 'past', label: 'Past Dine-out' },
                        { id: 'cancelled', label: 'Cancelled' }
                      ].map((btn) => (
                        <button
                          key={btn.id}
                          onClick={() => setBookingFilter(btn.id)}
                          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            bookingFilter === btn.id
                              ? 'bg-[#2C1B18] text-white shadow-sm'
                              : 'text-[#8D6E63] hover:text-[#3E2723]'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredBookings.length === 0 ? (
                    <div className="py-16 text-center space-y-4">
                      <Calendar size={40} className="mx-auto text-stone-300" />
                      <p className="text-stone-400 text-sm max-w-xs mx-auto">
                        No {bookingFilter} reservations found. Book a dynamic table blueprint at your favorite restaurant!
                      </p>
                      


                      <Link
                        to="/restaurants"
                        className="inline-flex bg-[#2C1B18] hover:bg-[#D4AF37] text-white hover:text-[#2C1B18] text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
                      >
                        Discover Restaurants
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="bg-white/60 border border-[#FAF6EE] hover:border-[#D4AF37]/20 p-5 rounded-3xl flex flex-col md:flex-row gap-5 items-stretch shadow-sm transition hover:shadow-md"
                        >
                          <img
                            src={booking.restaurantImage || booking.restaurant?.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80"}
                            alt={booking.restaurantName || booking.restaurant?.name}
                            className="w-full md:w-32 h-24 rounded-2xl object-cover border border-[#FAF6EE]"
                          />

                          <div className="flex-1 flex flex-col justify-between space-y-3 md:space-y-0 text-left">
                            <div className="space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <h3 className="font-serif font-black text-sm text-[#2C1B18] leading-tight">
                                  {booking.restaurantName || booking.restaurant?.name}
                                </h3>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                                  booking.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                  booking.status === 'Cancelled' ? 'bg-red-50 text-red-600 border border-red-100' :
                                  booking.status === 'Completed' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                  'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                  {booking.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-stone-400 font-light flex items-center gap-1">
                                <MapPin size={10} className="text-[#D4AF37]" />
                                {booking.location || booking.restaurant?.location}
                              </p>
                            </div>

                            <div className="grid grid-cols-4 gap-2 bg-[#FAF6EE] p-2 rounded-xl text-[10px] font-bold text-[#2C1B18] text-center border border-[#FAF6EE]/80">
                              <div>
                                <span className="block text-[8px] text-stone-400 font-normal uppercase">Date</span>
                                <span className="truncate block mt-0.5">{booking.date || new Date(booking.bookingDate).toLocaleDateString()}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] text-stone-400 font-normal uppercase">Time</span>
                                <span className="truncate block mt-0.5">{booking.time || booking.bookingTime}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] text-stone-400 font-normal uppercase">Guests</span>
                                <span className="truncate block mt-0.5">{booking.guests || booking.peopleCount} Seats</span>
                              </div>
                              <div>
                                <span className="block text-[8px] text-stone-400 font-normal uppercase">Table Code</span>
                                <span className="truncate block mt-0.5 text-[#D4AF37]">
                                  {booking.tableNumber || booking.table?.tableNumber || 'Auto'}
                                </span>
                              </div>
                            </div>

                            {booking.specialRequest && (
                              <p className="text-[10px] text-stone-400 italic line-clamp-1">
                                " {booking.specialRequest} "
                              </p>
                            )}

                            <div className="flex justify-between items-center pt-2 border-t border-[#FAF6EE] mt-auto">
                              <span className="text-[9px] text-[#C5A880] font-mono">
                                ID: {booking.id.slice(0, 8).toUpperCase()}
                              </span>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                {(booking.status === 'Confirmed' || booking.status === 'Pending') && (
                                  <button
                                    onClick={() => setDigitalPassBooking(booking)}
                                    className="bg-[#FAF6EE] hover:bg-[#2C1B18] text-[#2C1B18] hover:text-[#D4AF37] border border-[#D4AF37]/20 px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <QrCode size={10} className="text-[#D4AF37]" /> Digital Pass
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => setBlueprintModalBooking(booking)}
                                  className="bg-[#FAF6EE] hover:bg-[#3E2723] text-[#3E2723] hover:text-white border border-[#D4AF37]/10 hover:border-[#3E2723] px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Navigation size={10} className="text-[#D4AF37]" /> Blueprint
                                </button>

                                {(booking.status === 'Confirmed' || booking.status === 'Pending') && (
                                  <button
                                    onClick={() => setCancelConfirmBooking(booking)}
                                    className="border border-red-100 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. MY FAVORITES SCREEN */}
              {activeTab === 'favorites' && (
                <div className="bg-white border border-white rounded-3xl p-6 shadow-sm text-left space-y-6">
                  <h2 className="text-xl font-bold font-serif text-[#2C1B18] flex items-center gap-2 pb-4 border-b border-[#FAF6EE]">
                    <Heart size={20} className="text-rose-500" />
                    My Favorites ({favorites.length})
                  </h2>

                  {favorites.length === 0 ? (
                    <div className="py-16 text-center space-y-4">
                      <Heart size={40} className="mx-auto text-stone-300" />
                      <p className="text-stone-400 text-sm max-w-xs mx-auto">
                        Your favorites folder is empty. Browse restaurants to bookmark preferred venues.
                      </p>
                      


                      <Link
                        to="/restaurants"
                        className="inline-flex bg-[#2C1B18] hover:bg-[#D4AF37] text-white hover:text-[#2C1B18] text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
                      >
                        Browse Venues
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {favorites.map((fav) => (
                        <div
                          key={fav.id}
                          className="bg-white border border-[#FAF6EE] hover:border-[#D4AF37]/20 rounded-3xl overflow-hidden shadow-sm hover:shadow flex flex-col h-full group transition duration-300"
                        >
                          <div className="h-40 bg-stone-100 relative overflow-hidden shrink-0">
                            <img
                              src={fav.image || fav.restaurant?.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80"}
                              alt={fav.name || fav.restaurant?.name}
                              className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
                            />
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-[#D4AF37] border border-white/10 flex items-center gap-1 shadow-sm">
                              ★ {fav.rating || fav.restaurant?.rating || '4.5'}
                            </div>
                          </div>

                          <div className="p-4 flex flex-col justify-between flex-grow space-y-4 text-left">
                            <div className="space-y-1">
                              <h3 className="font-serif font-black text-md text-[#2C1B18]">
                                {fav.name || fav.restaurant?.name}
                              </h3>
                              <p className="text-[10px] text-stone-400 font-medium">
                                🍽️ {fav.cuisine || fav.restaurant?.cuisine} • {fav.location || fav.restaurant?.location}
                              </p>
                              <p className="text-[10px] text-stone-500 font-light font-sans line-clamp-2 mt-1">
                                {fav.description || fav.restaurant?.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-[#FAF6EE]">
                              <button
                                onClick={() => handleToggleFavorite(fav.restaurantId || fav.restaurant?.id, fav.name || fav.restaurant?.name)}
                                className="text-stone-400 hover:text-red-500 text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Remove
                              </button>
                              <Link
                                  to={`/restaurants/${fav.restaurantId || fav.restaurant?.id}`}
                                className="bg-[#2C1B18] hover:bg-[#D4AF37] text-white hover:text-[#2C1B18] px-3.5 py-1.5 rounded-xl text-[10px] font-serif font-bold transition flex items-center gap-1"
                              >
                                Book Table <ChevronRight size={10} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. MY REVIEWS SCREEN */}
              {activeTab === 'reviews' && (
                <div className="bg-white border border-white rounded-3xl p-6 shadow-sm text-left space-y-6">
                  <h2 className="text-xl font-bold font-serif text-[#2C1B18] flex items-center gap-2 pb-4 border-b border-[#FAF6EE]">
                    <MessageSquare size={20} className="text-emerald-500" />
                    My Dining Reviews ({reviews.length})
                  </h2>

                  {reviews.length === 0 ? (
                    <div className="py-16 text-center space-y-4">
                      <MessageSquare size={40} className="mx-auto text-stone-300" />
                      <p className="text-stone-400 text-sm max-w-xs mx-auto">
                        You haven't written any dining reviews yet. Rate your dining experiences under completed bookings!
                      </p>
                      

                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="bg-white border border-[#FAF6EE] hover:border-[#D4AF37]/15 p-5 rounded-3xl space-y-3 shadow-sm transition"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h3 className="font-serif font-bold text-sm text-[#2C1B18]">
                                {rev.restaurantName || rev.restaurant?.name}
                              </h3>
                              <p className="text-[9px] text-stone-400 font-light mt-0.5">
                                Reviewed on {rev.date || new Date(rev.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-100">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className={`text-xs ${i < rev.rating ? 'text-[#D4AF37]' : 'text-stone-300'}`}>★</span>
                              ))}
                            </div>
                          </div>

                          <p className="text-xs text-stone-600 leading-relaxed font-light font-sans bg-[#FDFBF7] p-3 rounded-xl border border-[#FAF6EE]">
                            " {rev.comment} "
                          </p>

                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => setReviewToDelete(rev)}
                              className="text-[10px] text-red-500 hover:text-red-700 font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={12} /> Delete Feedback
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. REWARDS & COUPONS SCREEN */}
              {activeTab === 'coupons' && (
                <div className="space-y-8">
                  <div className="bg-white border border-white rounded-3xl p-6 shadow-sm text-left space-y-6">
                    <h2 className="text-xl font-bold font-serif text-[#2C1B18] flex items-center gap-2 pb-4 border-b border-[#FAF6EE]">
                      <Ticket size={20} className="text-[#D4AF37]" />
                      Active Promo Codes
                    </h2>

                    {coupons.length === 0 ? (
                      <div className="py-10 text-center space-y-3">
                        <Ticket size={36} className="mx-auto text-stone-300 animate-pulse" />
                        <p className="text-stone-400 text-xs max-w-xs mx-auto">
                          No coupons currently assigned. Solve puzzles to unlock elite promotional discounts!
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {coupons.map((coupon, idx) => {
                          const isExpired = coupon.status === 'Expired';
                          return (
                            <div
                              key={idx}
                              className={`border rounded-3xl p-5 text-left relative overflow-hidden flex flex-col justify-between h-40 transition shadow-sm ${
                                isExpired
                                  ? 'bg-stone-50 border-stone-200 opacity-60'
                                  : 'bg-gradient-to-tr from-[#2C1B18] to-[#3E2723] text-white border-[#D4AF37]/25 hover:shadow-md'
                              }`}
                            >
                              <div className="space-y-1 relative z-10">
                                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                                  isExpired ? 'bg-stone-200 text-stone-500' : 'bg-[#D4AF37] text-[#2C1B18]'
                                }`}>
                                  {coupon.discount}
                                </span>
                                <h3 className="font-serif font-black text-md tracking-wider mt-2">
                                  {coupon.code}
                                </h3>
                                <p className={`text-[9px] font-light font-sans line-clamp-2 mt-1 leading-snug ${
                                  isExpired ? 'text-stone-400' : 'text-stone-300'
                                }`}>
                                  {coupon.description}
                                </p>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-auto relative z-10">
                                <span className={`text-[8px] ${isExpired ? 'text-stone-400' : 'text-stone-400'}`}>
                                  {coupon.expiry}
                                </span>
                                
                                {!isExpired && (
                                  <button
                                    onClick={() => copyPromoCode(coupon.code)}
                                    className="bg-white/10 hover:bg-[#D4AF37] text-white hover:text-[#2C1B18] p-1.5 rounded-lg border border-white/10 transition cursor-pointer"
                                    title="Copy Coupon"
                                  >
                                    <Copy size={11} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Loyalty Points Transaction Ledger (NEW) */}
                  <div className="bg-white border border-white rounded-3xl p-6 shadow-sm text-left space-y-6">
                    <h2 className="text-xl font-bold font-serif text-[#2C1B18] flex items-center gap-2 pb-4 border-b border-[#FAF6EE]">
                      <Award size={20} className="text-[#D4AF37]" />
                      VIP Rewards & Points Ledger
                    </h2>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead>
                          <tr className="border-b border-[#FAF6EE] text-stone-400 font-bold text-[9px] uppercase tracking-wider">
                            <th className="pb-3 pl-2">Date</th>
                            <th className="pb-3">Activity Description</th>
                            <th className="pb-3">Category</th>
                            <th className="pb-3 text-right pr-2">Points Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#FAF6EE]">
                          {[
                            { id: "tx-1", date: "24 May 2026", desc: "Dine-out at Spice Route (Rooftop Seating Completed)", cat: "Table Reservation", pts: "+50 PTS", type: "earn" },
                            { id: "tx-2", date: "18 May 2026", desc: "Authored dining feedback for Kyoto Garden", cat: "Patron Review", pts: "+25 PTS", type: "earn" },
                            { id: "tx-3", date: "15 May 2026", desc: "Redeemed welcome coupon promo WELCOMEFLOW25", cat: "Coupon Burn", pts: "-50 PTS", type: "burn" },
                            { id: "tx-4", date: "12 May 2026", desc: "Completed Level 3 Block sliding puzzle game", cat: "Gourmet Game", pts: "+75 PTS", type: "earn" },
                            { id: "tx-5", date: "01 May 2026", desc: "DineFlow Gourmet welcome points bonus", cat: "Welcome Bonus", pts: "+150 PTS", type: "earn" }
                          ].map((tx) => (
                            <tr key={tx.id} className="hover:bg-[#FAF6EE]/30 transition">
                              <td className="py-3 pl-2 font-mono text-[10px] text-stone-400">{tx.date}</td>
                              <td className="py-3 font-medium text-[#2C1B18]">{tx.desc}</td>
                              <td className="py-3 text-stone-500 text-[10px] font-semibold">{tx.cat}</td>
                              <td className={`py-3 text-right pr-2 font-bold font-mono ${tx.type === 'earn' ? 'text-emerald-600' : 'text-red-500'}`}>
                                {tx.pts}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Gourmet puzzle teaser widget */}
                  <div className="bg-gradient-to-r from-amber-50/50 via-gold-50/20 to-transparent border border-[#D4AF37]/15 rounded-3xl p-6 text-left flex flex-col md:flex-row items-center gap-6 shadow-sm">
                    <div className="bg-[#2C1B18] text-[#D4AF37] p-3 rounded-2xl shrink-0 shadow">
                      <Sparkles size={24} className="animate-pulse" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="font-serif font-bold text-[#2C1B18] text-sm">Elite Rewards Puzzle Box</h4>
                      <p className="text-xs text-stone-500 leading-relaxed font-light font-sans max-w-xl">
                        Unlock up to 50% discount on booking fees! Test your dining intelligence in our exclusive sliding block puzzle game and claim custom vouchers instantly.
                      </p>
                    </div>
                    <Link
                      to="/puzzle"
                      className="bg-[#2C1B18] hover:bg-[#D4AF37] text-white hover:text-[#2C1B18] px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap self-stretch md:self-auto text-center"
                    >
                      Play Puzzle 🧩
                    </Link>
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </div>

      </div>

      {/* --- PREMIUM BLUEPRINT FLOOR PLAN MODAL --- */}
      <AnimatePresence>
        {blueprintModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FDFBF7] border border-[#D4AF37]/30 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-[#2C1B18] text-white p-6 border-b border-[#D4AF37]/20 flex justify-between items-center shrink-0">
                <div className="text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-widest block">Live Reservation Seating Blueprint</span>
                  <h3 className="font-serif font-black text-xl text-white leading-tight">
                    {blueprintModalBooking.restaurantName || blueprintModalBooking.restaurant?.name}
                  </h3>
                  <p className="text-[10px] text-[#C5A880] font-light">
                    📍 {blueprintModalBooking.location || blueprintModalBooking.restaurant?.location}
                  </p>
                </div>
                <button
                  onClick={() => setBlueprintModalBooking(null)}
                  className="p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-[#D4AF37] text-white hover:text-[#2C1B18] transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Map Layout Area */}
              <div className="p-6 overflow-y-auto space-y-6 flex-grow">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF6EE] p-3 rounded-2xl border border-[#FAF6EE]/80 text-[10px] font-bold text-center">
                  <div>
                    <span className="block text-[8px] text-stone-400 font-normal uppercase">Category</span>
                    <span className="text-[#2C1B18] mt-0.5 block truncate">
                      {blueprintModalBooking.tableCategory || blueprintModalBooking.table?.category || 'Window Side'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-stone-400 font-normal uppercase">Table Number</span>
                    <span className="text-[#D4AF37] mt-0.5 block truncate font-black">
                      {blueprintModalBooking.tableNumber || blueprintModalBooking.table?.tableNumber || 'T3'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-stone-400 font-normal uppercase">Seats Set</span>
                    <span className="text-[#2C1B18] mt-0.5 block truncate">
                      {blueprintModalBooking.guests || blueprintModalBooking.peopleCount || 4} Guests
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-stone-400 font-normal uppercase">Occasion</span>
                    <span className="text-[#2C1B18] mt-0.5 block truncate">
                      {blueprintModalBooking.occasion || 'Standard Dining'}
                    </span>
                  </div>
                </div>

                {/* CSS Floor plan */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-black text-[#8D6E63] tracking-widest text-left block">Dining Floor Layout</span>
                  
                  <div className="relative bg-stone-900 border border-[#D4AF37]/20 rounded-3xl h-64 overflow-hidden w-full select-none shadow-inner">
                    <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(212,175,55,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.15)_1px,transparent_1px)] [background-size:20px_20px]" />
                    
                    <div className="absolute top-0 left-0 right-0 h-4 bg-sky-500/10 border-b border-sky-400/25 flex items-center justify-center text-[7px] text-sky-300 font-mono tracking-widest uppercase">
                      🏞️ Skyline View Glass Window Side
                    </div>

                    <div className="absolute bottom-0 left-[40%] right-[40%] h-3 bg-stone-800 border-t border-stone-700 flex items-center justify-center text-[7px] text-stone-500 font-bold uppercase tracking-wider">
                      🚪 Entrance Door
                    </div>

                    <div className="absolute left-0 top-4 bottom-4 w-[25%] bg-[#2C1B18]/40 border-r border-[#D4AF37]/10 flex items-center justify-center">
                      <span className="text-[8px] text-[#C5A880] tracking-widest uppercase font-bold rotate-270">VIP Cabins</span>
                    </div>

                    <div className="absolute right-0 top-4 bottom-4 w-[25%] bg-stone-950/50 border-l border-stone-800 flex items-center justify-center">
                      <span className="text-[8px] text-stone-500 tracking-widest uppercase font-bold rotate-90">Bar & Lounge</span>
                    </div>

                    {/* Tables placement representation */}
                    {[
                      { num: 'T1', cat: 'Main Dining Hall', cap: 4, left: '35%', top: '30%' },
                      { num: 'T2', cat: 'Main Dining Hall', cap: 4, left: '35%', top: '65%' },
                      { num: 'T3', cat: 'Window Side (Scenic View)', cap: 4, left: '50%', top: '22%' },
                      { num: 'T4', cat: 'VIP Private Cabin', cap: 2, left: '10%', top: '28%' },
                      { num: 'T5', cat: 'VIP Private Cabin', cap: 6, left: '10%', top: '62%' },
                      { num: 'T6', cat: 'Bar Lounge', cap: 2, left: '85%', top: '28%' },
                      { num: 'T7', cat: 'Bar Lounge', cap: 2, left: '85%', top: '62%' },
                      { num: 'T8', cat: 'Rooftop Deck', cap: 6, left: '50%', top: '55%' },
                      { num: 'T9', cat: 'Window Side (Scenic View)', cap: 2, left: '65%', top: '22%' },
                      { num: 'T10', cat: 'Center Dining', cap: 8, left: '65%', top: '55%' },
                    ].map((table, tIdx) => {
                      const isUserTable = table.num === (blueprintModalBooking.tableNumber || blueprintModalBooking.table?.tableNumber || 'T3');
                      return (
                        <div
                          key={tIdx}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                          style={{ left: table.left, top: table.top }}
                        >
                          {isUserTable && (
                            <span className="absolute -inset-3 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 animate-ping pointer-events-none" />
                          )}

                          <div
                            className={`w-9 h-9 rounded-full flex flex-col items-center justify-center border font-bold text-[9px] shadow relative transition ${
                              isUserTable
                                ? 'bg-[#D4AF37] border-white text-[#2C1B18] scale-110 z-10'
                                : 'bg-stone-800 border-stone-700 text-stone-500 opacity-40'
                            }`}
                          >
                            <span>{table.num}</span>
                            {isUserTable && <span className="text-[6px] tracking-tighter uppercase font-bold text-[#2C1B18] mt-0.5">Patron</span>}
                            
                            {Array.from({ length: table.cap }).map((_, seatIdx) => {
                              const angle = (seatIdx / table.cap) * 2 * Math.PI;
                              const radius = 17;
                              const xOffset = Math.cos(angle) * radius;
                              const yOffset = Math.sin(angle) * radius;
                              return (
                                <span
                                  key={seatIdx}
                                  className={`absolute w-1.5 h-1.5 rounded-full border border-stone-900 ${
                                    isUserTable ? 'bg-white' : 'bg-stone-700'
                                  }`}
                                  style={{
                                    transform: `translate(${xOffset}px, ${yOffset}px)`
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-stone-200/10 text-xs font-light text-stone-500 leading-relaxed text-left flex gap-3">
                  <Info size={16} className="text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#2C1B18] block mb-0.5">Seating Floor Instructions</span>
                    Scan your check-in code at the DineFlow reception. The highlighted table {blueprintModalBooking.tableNumber || blueprintModalBooking.table?.tableNumber || 'T3'} is reserved exclusively for you. Present ID verification upon arrival.
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-[#FAF6EE] p-4 border-t border-stone-200/20 flex justify-end shrink-0">
                <button
                  onClick={() => setBlueprintModalBooking(null)}
                  className="bg-[#2C1B18] hover:bg-[#3E2723] text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Dismiss Blueprint
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CANCEL RESERVATION CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {cancelConfirmBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-stone-200 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-100">
                <Calendar size={20} />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-[#2C1B18]">Cancel Reservation?</h3>
                <p className="text-xs text-stone-400 font-light">
                  Are you sure you want to cancel your confirmed table at {cancelConfirmBooking.restaurantName || cancelConfirmBooking.restaurant?.name} on {cancelConfirmBooking.date || new Date(cancelConfirmBooking.bookingDate).toLocaleDateString()} at {cancelConfirmBooking.time || cancelConfirmBooking.bookingTime}?
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setCancelConfirmBooking(null)}
                  className="flex-1 py-2.5 bg-[#FAF6EE] text-stone-600 hover:bg-stone-100 border border-stone-200/10 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Keep Reservation
                </button>
                <button
                  onClick={handleCancelBooking}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel Booking
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- REVIEW DELETE CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {reviewToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-stone-200 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-100">
                <Trash2 size={20} />
              </div>

              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-[#2C1B18]">Delete Written Review?</h3>
                <p className="text-xs text-stone-400 font-light">
                  Are you sure you want to remove your feedback for {reviewToDelete.restaurantName || reviewToDelete.restaurant?.name}? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setReviewToDelete(null)}
                  className="flex-1 py-2.5 bg-[#FAF6EE] text-stone-600 hover:bg-stone-100 border border-stone-200/10 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Keep Review
                </button>
                <button
                  onClick={handleDeleteReview}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Delete Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DIGITAL DINE-IN PASS MODAL --- */}
      <AnimatePresence>
        {digitalPassBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#2C1B18] border border-[#D4AF37]/40 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl relative text-white"
            >
              {/* Premium Ticket Frame elements */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#D4AF37] via-amber-500 to-[#D4AF37]" />
              
              {/* Left & Right Ticket Notches */}
              <div className="absolute top-1/2 -left-4 w-8 h-8 rounded-full bg-[#FAFBF7] border-r border-[#D4AF37]/30 transform -translate-y-1/2 z-10" />
              <div className="absolute top-1/2 -right-4 w-8 h-8 rounded-full bg-[#FAFBF7] border-l border-[#D4AF37]/30 transform -translate-y-1/2 z-10" />

              {/* Close Button */}
              <button
                onClick={() => setDigitalPassBooking(null)}
                className="absolute top-6 right-6 p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-[#D4AF37] text-white hover:text-[#2C1B18] transition cursor-pointer z-20"
              >
                <X size={14} />
              </button>

              <div className="p-8 text-center space-y-6">
                {/* Header Logo */}
                <div className="space-y-1 mt-4">
                  <div className="flex justify-center items-center gap-1.5 text-[#D4AF37] tracking-widest text-[9px] font-bold uppercase">
                    <Sparkle size={8} className="animate-spin-slow" />
                    <span>DINEFLOW LUXURY ENTRY PASS</span>
                    <Sparkle size={8} className="animate-spin-slow" />
                  </div>
                  <h3 className="font-serif font-black text-2xl text-white tracking-tight leading-none mt-1">
                    {digitalPassBooking.restaurantName || digitalPassBooking.restaurant?.name}
                  </h3>
                  <p className="text-[10px] text-[#C5A880] font-light">
                    {digitalPassBooking.location || digitalPassBooking.restaurant?.location}
                  </p>
                </div>

                {/* Separator Dashed line */}
                <div className="border-t-2 border-dashed border-[#D4AF37]/20 relative">
                  <span className="absolute -top-1 left-4 w-2 h-2 rounded-full bg-[#D4AF37]/20" />
                  <span className="absolute -top-1 right-4 w-2 h-2 rounded-full bg-[#D4AF37]/20" />
                </div>

                {/* Ticket Details */}
                <div className="grid grid-cols-2 gap-4 text-left bg-white/5 border border-white/5 p-4 rounded-2xl text-xs font-sans">
                  <div>
                    <span className="text-[8px] text-[#C5A880] uppercase tracking-wide block">GUEST DECK</span>
                    <span className="font-bold text-white block mt-0.5">{digitalPassBooking.guests || digitalPassBooking.peopleCount} Seats</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-[#C5A880] uppercase tracking-wide block">TABLE CODE</span>
                    <span className="font-bold text-[#D4AF37] block mt-0.5 font-mono">
                      {digitalPassBooking.tableNumber || digitalPassBooking.table?.tableNumber || 'T3'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-[#C5A880] uppercase tracking-wide block">DATE</span>
                    <span className="font-bold text-white block mt-0.5">
                      {digitalPassBooking.date || new Date(digitalPassBooking.bookingDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-[#C5A880] uppercase tracking-wide block">TIME</span>
                    <span className="font-bold text-white block mt-0.5">{digitalPassBooking.time || digitalPassBooking.bookingTime}</span>
                  </div>
                </div>

                {/* Barcode representation */}
                <div className="space-y-1.5">
                  <div className="bg-white p-4 rounded-2xl inline-block shadow-lg border border-[#D4AF37]/20">
                    <div className="flex flex-col items-center gap-3">
                      {/* Barcode SVG */}
                      <svg width="180" height="40" className="text-black">
                        <g fill="black">
                          <rect x="0" y="0" width="3" height="40" />
                          <rect x="5" y="0" width="1" height="40" />
                          <rect x="8" y="0" width="4" height="40" />
                          <rect x="15" y="0" width="2" height="40" />
                          <rect x="20" y="0" width="1" height="40" />
                          <rect x="24" y="0" width="3" height="40" />
                          <rect x="30" y="0" width="5" height="40" />
                          <rect x="38" y="0" width="2" height="40" />
                          <rect x="42" y="0" width="1" height="40" />
                          <rect x="46" y="0" width="4" height="40" />
                          <rect x="52" y="0" width="2" height="40" />
                          <rect x="56" y="0" width="1" height="40" />
                          <rect x="60" y="0" width="6" height="40" />
                          <rect x="68" y="0" width="2" height="40" />
                          <rect x="74" y="0" width="1" height="40" />
                          <rect x="78" y="0" width="3" height="40" />
                          <rect x="84" y="0" width="4" height="40" />
                          <rect x="90" y="0" width="1" height="40" />
                          <rect x="94" y="0" width="2" height="40" />
                          <rect x="98" y="0" width="5" height="40" />
                          <rect x="105" y="0" width="1" height="40" />
                          <rect x="108" y="0" width="3" height="40" />
                          <rect x="114" y="0" width="2" height="40" />
                          <rect x="120" y="0" width="6" height="40" />
                          <rect x="128" y="0" width="1" height="40" />
                          <rect x="132" y="0" width="3" height="40" />
                          <rect x="138" y="0" width="4" height="40" />
                          <rect x="144" y="0" width="2" height="40" />
                          <rect x="148" y="0" width="1" height="40" />
                          <rect x="152" y="0" width="5" height="40" />
                          <rect x="160" y="0" width="2" height="40" />
                          <rect x="164" y="0" width="3" height="40" />
                          <rect x="170" y="0" width="1" height="40" />
                          <rect x="174" y="0" width="4" height="40" />
                        </g>
                      </svg>
                      
                      <span className="text-[8px] font-mono text-stone-500 tracking-[0.25em]">
                        *{digitalPassBooking.id.slice(0, 8).toUpperCase()}-{digitalPassBooking.tableNumber || 'T3'}*
                      </span>
                    </div>
                  </div>
                  <p className="text-[8px] text-[#C5A880] tracking-wide uppercase font-bold">
                    Scan at Reception for instant table allocation
                  </p>
                </div>

                {/* Footer instructions */}
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="flex items-start gap-2.5 text-left text-[10px] text-stone-400 font-light leading-relaxed">
                    <Info size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>
                      Please present this pass on your phone upon arrival. Table reservations are held for a grace period of 15 minutes.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${digitalPassBooking.id.slice(0, 8).toUpperCase()}-${digitalPassBooking.tableNumber || 'T3'}`);
                      showToast('Check-in ID copied to clipboard!');
                    }}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C5A880] hover:from-[#FAF6EE] hover:to-[#FAF6EE] text-[#2C1B18] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Copy Check-in ID
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Dashboard;
