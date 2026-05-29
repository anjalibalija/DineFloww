import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Star, MapPin, Users, BrainCircuit, Clock, Utensils, Search, Sparkles, Heart, Check, Trash2, IndianRupee, X, Gamepad2, Gift, Trophy, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RestaurantMap from '../components/RestaurantMap';
import { useAuth } from '../context/AuthContext';

const RestaurantDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDishes, setSelectedDishes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(null);
  const [reviewComment, setReviewComment] = useState('');

  const menuItems = useMemo(() => {
    if (!restaurant?.menuHighlights) return [];
    // Split by either comma or newline
    const itemsList = restaurant.menuHighlights.split(/[,\n]+/).map(h => h.trim()).filter(Boolean);
    return itemsList.map(h => {
      const regex = /(.*?)(?:\((.*?)\))?:\s*(.*)/;
      const match = h.match(regex);
      if (match) {
        const category = match[2] ? match[2].trim() : 'Signature';
        const lowerName = match[1].toLowerCase();
        // Dynamically assign vegetarian classification
        const isVeg = !lowerName.includes('chicken') && !lowerName.includes('salmon') && !lowerName.includes('fish') && !lowerName.includes('mutton') && !lowerName.includes('meat') && !lowerName.includes('egg') && !lowerName.includes('pepperoni') && !lowerName.includes('bacon');
        return {
          name: match[1].trim(),
          category: category.charAt(0).toUpperCase() + category.slice(1),
          price: match[3].trim(),
          isVeg,
          isChefSpecial: lowerName.includes('truffle') || lowerName.includes('special') || lowerName.includes('decadence') || lowerName.includes('martini')
        };
      }
      return { name: h.trim(), category: 'Signature', price: '', isVeg: true, isChefSpecial: false };
    });
  }, [restaurant?.menuHighlights]);

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map(item => item.category));
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesTab = activeTab === 'All' || item.category === activeTab;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [menuItems, activeTab, searchQuery]);

  const toggleSelectDish = (dish) => {
    setSelectedDishes(prev => {
      const exists = prev.find(d => d.name === dish.name);
      if (exists) {
        return prev.filter(d => d.name !== dish.name);
      } else {
        return [...prev, dish];
      }
    });
  };

  const toggleFavorite = (name) => {
    setFavorites(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await axios.get(`/api/restaurants/${id}`);
        setRestaurant(res.data.data);
        
        // Simulate fetching AI prediction
        const aiRes = await axios.post('/api/ai/crowd-prediction', { restaurantId: id });
        setAiPrediction(aiRes.data.data);

        // Load reviews from backend API
        const reviewsRes = await axios.get(`/api/reviews/restaurant/${id}`);
        setReviews(reviewsRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [id]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return restaurant?.rating || 0;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews, restaurant?.rating]);

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!reviewComment) return;

    if (!user) {
      alert('You must be logged in to leave a review.');
      return;
    }

    try {
      const res = await axios.post('/api/reviews', {
        restaurantId: id,
        rating: userRating,
        comment: reviewComment
      });

      if (res.data.success) {
        // reload reviews
        const reviewsRes = await axios.get(`/api/reviews/restaurant/${id}`);
        setReviews(reviewsRes.data.data);
        
        // Reset fields & close modal
        setReviewComment('');
        setUserRating(5);
        setShowReviewModal(false);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit review.');
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center font-serif text-2xl text-brown-900">Loading details...</div>;
  if (!restaurant) return <div className="min-h-[60vh] flex items-center justify-center font-serif text-xl text-red-500">Restaurant not found.</div>;

  return (
    <div>
      {/* Hero Header */}
      <div className="relative h-[50vh] bg-brown-900 overflow-hidden">
        
        {/* Back to Dashboard Link overlay */}
        <div className="absolute top-6 left-6 z-20">
          <Link 
            to="/restaurants" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900/80 backdrop-blur-md border border-gold-500/20 text-xs font-semibold text-gold-500 hover:bg-gold-500 hover:text-stone-950 transition-all shadow-md group cursor-pointer"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

        <img 
          src={restaurant.image ? restaurant.image : "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"} 
          alt={restaurant.name}
          className="w-full h-full object-cover filter brightness-[0.5]"
        />
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <span className="bg-gold-500 text-brown-900 px-3 py-1 rounded text-sm font-bold uppercase tracking-wider mb-4 inline-block">
                {restaurant.cuisine}
              </span>
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-cream-100 mb-4">{restaurant.name}</h1>
              <div className="flex items-center gap-6 text-cream-200">
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-gold-500" />
                  {restaurant.location}
                </div>
                <div className="flex items-center gap-2">
                  <Star size={20} className="text-gold-500 fill-gold-500" />
                  <span className="font-bold">{averageRating}</span> / 5.0
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee size={18} className="text-gold-500" />
                  <span>
                    {restaurant.priceRange ? restaurant.priceRange.replace(/\$/g, '₹') : '₹₹'}{' '}
                    <span className="text-sm opacity-80">
                      ({
                        restaurant.priceRange === '₹' ? 'Budget: Under ₹250' :
                        restaurant.priceRange === '₹₹' ? 'Moderate: ₹250–₹750' :
                        restaurant.priceRange === '₹₹₹' ? 'Premium: ₹750–₹1,500' :
                        'Fine Dining: ₹1,500+'
                      } per person)
                    </span>
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Queue Game Banner ── */}
      <AnimatePresence>
        {restaurant.queueCount > 5 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative overflow-hidden bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950 border-b border-amber-900/30"
          >
            {/* Floating orbs */}
            <div className="absolute -left-10 top-0 w-40 h-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            <div className="absolute right-20 -bottom-6 w-32 h-32 rounded-full bg-amber-600/10 blur-2xl pointer-events-none" />

            <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                {/* Pulsing icon */}
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 relative">
                    <Gamepad2 size={22} className="text-stone-900" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-serif font-black text-lg">Queue is busy!</span>
                    <span className="bg-red-500/20 border border-red-400/30 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {restaurant.queueCount} waiting
                    </span>
                  </div>
                  <p className="text-stone-400 text-sm">
                    Play a quick game &amp; win <span className="text-amber-400 font-bold">20–30% off</span> your bill while you wait!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2">
                  {['🍕','🃏','🏆'].map((e, i) => (
                    <motion.span
                      key={i}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                      className="text-xl"
                    >{e}</motion.span>
                  ))}
                </div>
                <Link
                  to="/puzzle"
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 px-6 py-2.5 rounded-full font-black text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 group"
                >
                  <Gift size={15} className="group-hover:rotate-12 transition-transform" />
                  Play &amp; Win Coupon
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="text-3xl font-serif font-bold text-brown-900 mb-4">About</h2>
              <p className="text-lg text-brown-700 leading-relaxed">
                {restaurant.description}
              </p>
            </section>

            {/* Culinary Menu Card Option */}
            {menuItems.length > 0 && (
              <section className="bg-cream-50/30 p-6 rounded-2xl border border-gold-500/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-gold-500/30 transition-all duration-300">
                <div>
                  <h3 className="font-serif font-bold text-brown-900 text-xl flex items-center gap-2">
                    <Utensils className="text-gold-500" size={20} /> Culinary Menu
                  </h3>
                  <p className="text-sm text-brown-600 mt-1">Explore our chef-curated selections, digitalized and structured with AI.</p>
                </div>
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="bg-brown-900 text-gold-500 px-6 py-2.5 rounded-full font-bold hover:bg-gold-500 hover:text-brown-900 transition-all text-sm shadow-md"
                >
                  View Menu
                </button>
              </section>
            )}

            {/* Location & Directions Map */}
            {restaurant.latitude && restaurant.longitude && (
              <section className="bg-white p-6 rounded-2xl border border-gold-500/10 shadow-sm">
                <RestaurantMap 
                  latitude={restaurant.latitude} 
                  longitude={restaurant.longitude} 
                  name={restaurant.name} 
                  address={restaurant.location} 
                />
              </section>
            )}

            {/* Customer Reviews & Ratings */}
            <section className="bg-white p-6 rounded-2xl border border-gold-500/10 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-brown-900">Customer Ratings & Reviews</h3>
                  <p className="text-sm text-brown-600">Hear what other diners have to say about their experience.</p>
                </div>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="bg-brown-900 text-gold-500 px-6 py-2.5 rounded-full font-bold hover:bg-gold-500 hover:text-brown-900 transition-all text-sm shadow-md cursor-pointer"
                >
                  Write a Review
                </button>
              </div>

              {/* Summary Scorecard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-cream-50/20 p-6 rounded-2xl border border-gold-500/5">
                <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-gold-500/10">
                  <span className="text-5xl font-bold font-serif text-brown-900">{averageRating}</span>
                  <div className="flex gap-1 my-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={18}
                        className={
                          star <= Math.round(averageRating)
                            ? 'text-gold-500 fill-gold-500'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-xs text-brown-600 font-medium">Based on {reviews.length} reviews</span>
                </div>

                <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter((r) => r.rating === stars).length;
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <span className="w-12 text-brown-700 font-semibold flex items-center gap-0.5 justify-end">
                          {stars} <Star size={10} className="text-gold-500 fill-gold-500" />
                        </span>
                        <div className="flex-grow h-2 bg-cream-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-brown-600 font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {reviews.length === 0 ? (
                   <p className="text-center text-sm text-brown-500 py-6">No reviews yet. Be the first to write one!</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-xl border border-cream-200 bg-white shadow-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-brown-900 text-sm">{rev.user?.name || 'Guest User'}</h4>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={12}
                                className={
                                  star <= rev.rating
                                    ? 'text-gold-500 fill-gold-500'
                                    : 'text-gray-200'
                                }
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-brown-500 font-light">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-brown-700 leading-relaxed font-light">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Premium Menu Modal */}
            <AnimatePresence>
              {isMenuOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white max-w-4xl w-full max-h-[85vh] overflow-hidden rounded-3xl border border-gold-500/20 shadow-2xl flex flex-col"
                  >
                    {/* Modal Header */}
                    <div className="p-6 border-b border-gold-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-cream-50/20">
                      <div>
                        <span className="text-xs uppercase font-bold tracking-wider text-gold-600">Menu highlights</span>
                        <h3 className="text-2xl font-serif font-bold text-brown-900 mt-0.5">{restaurant.name} Menu</h3>
                      </div>
                      
                      {/* Search & Close */}
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-grow sm:flex-grow-0 sm:w-60">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
                          <input
                            type="text"
                            placeholder="Search dishes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoComplete="one-time-code"
                            className="w-full pl-8 pr-4 py-1.5 rounded-full border border-gold-500/20 bg-white text-xs text-brown-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
                          />
                        </div>
                        <button
                          onClick={() => setIsMenuOpen(false)}
                          className="bg-brown-900 text-cream-100 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-gold-500 hover:text-brown-900 transition-all"
                        >
                          Close
                        </button>
                      </div>
                    </div>

                    {/* Category Tabs inside Modal */}
                    {categories.length > 2 && (
                      <div className="px-6 py-3 border-b border-gold-500/5 bg-cream-50/10 flex gap-2 overflow-x-auto scrollbar-none">
                        {categories.map((cat, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveTab(cat)}
                            className={`px-4 py-1 rounded-full text-[11px] font-semibold tracking-wider transition-all duration-300 shrink-0 ${
                              activeTab === cat
                                ? 'bg-brown-900 text-gold-500 shadow-sm'
                                : 'bg-cream-50/50 hover:bg-cream-100/50 text-brown-700 border border-gold-500/10'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Modal Body - Scrollable Dishes Grid */}
                    <div className="p-6 overflow-y-auto max-h-[50vh] space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredItems.map((dish) => {
                          const isSelected = selectedDishes.some(d => d.name === dish.name);
                          const isFav = favorites.includes(dish.name);
                          
                          return (
                            <div
                              key={dish.name}
                              className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                                isSelected
                                  ? 'bg-gold-50/40 border-gold-500'
                                  : 'bg-cream-50/10 border-gold-500/10 hover:border-gold-500/25'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                                    dish.isVeg ? 'text-green-700 bg-green-500/10' : 'text-red-700 bg-red-500/10'
                                  }`}>
                                    <span className={`w-1 h-1 rounded-full ${dish.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                    {dish.isVeg ? 'VEG' : 'NON-VEG'}
                                  </span>
                                  <span className="text-[8px] uppercase font-bold tracking-wider text-brown-600 bg-brown-500/10 px-1.5 py-0.5 rounded-full">
                                    {dish.category}
                                  </span>
                                  {dish.isChefSpecial && (
                                    <span className="text-[8px] font-bold tracking-wider text-gold-700 bg-gold-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                      <Sparkles size={8} className="fill-gold-500" /> SPECIAL
                                    </span>
                                  )}
                                </div>
                                <button 
                                  onClick={() => toggleFavorite(dish.name)}
                                  className="text-brown-400 hover:text-red-500 transition-colors p-0.5"
                                >
                                  <Heart size={14} className={isFav ? 'fill-red-500 text-red-500' : ''} />
                                </button>
                              </div>

                              <h4 className="font-serif font-bold text-brown-900 text-base leading-tight">
                                {dish.name}
                              </h4>

                              <div className="mt-4 flex justify-between items-center pt-2 border-t border-gold-500/5">
                                <span className="text-gold-600 font-bold text-base">
                                  {dish.price ? (dish.price.startsWith('₹') ? dish.price : `₹${dish.price}`) : 'Price on Ask'}
                                </span>
                                <button
                                  onClick={() => toggleSelectDish(dish)}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-0.5 transition-all ${
                                    isSelected
                                      ? 'bg-gold-500 text-brown-900'
                                      : 'bg-brown-900 text-cream-100 hover:bg-gold-500 hover:text-brown-900'
                                  }`}
                                >
                                  {isSelected ? <><Check size={10} strokeWidth={3} /> Selected</> : <>+ Pre-Order</>}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {filteredItems.length === 0 && (
                        <div className="py-12 text-center text-brown-500 italic text-sm">
                          No dishes found matching your search.
                        </div>
                      )}
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 border-t border-gold-500/10 bg-cream-50/10 flex justify-between items-center text-xs">
                      <span className="text-brown-600">
                        {selectedDishes.length > 0 
                          ? `${selectedDishes.length} item(s) selected for pre-order` 
                          : 'Select items to add to your pre-order request'}
                      </span>
                      <button
                        onClick={() => setIsMenuOpen(false)}
                        className="bg-brown-900 text-gold-500 px-5 py-2 rounded-full font-bold hover:bg-gold-500 hover:text-brown-900 transition-all"
                      >
                        Done
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* AI Insights Section */}
            {aiPrediction && (
              <section className="bg-cream-200 p-8 rounded-2xl border border-gold-500/30 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-gold-500/20">
                  <BrainCircuit size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <BrainCircuit size={24} className="text-gold-500" />
                    <h2 className="text-2xl font-serif font-bold text-brown-900">Dine Flow Insights</h2>
                  </div>
                  <p className="text-brown-800 font-medium mb-2">{aiPrediction.message}</p>
                  
                  {aiPrediction.isQueueTooLong && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <Clock className="text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-red-700">Long Queue Predicted</h4>
                        <p className="text-sm text-red-600 mt-1">
                          Play our exclusive puzzle while you wait to earn a 20% - 30% discount on your bill!
                        </p>
                        <Link to="/puzzle" className="mt-3 inline-block bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition">
                          Play Puzzle & Earn Discount
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-cream-200 sticky top-24">
              <h3 className="text-2xl font-serif font-bold text-brown-900 mb-6">Reserve a Table</h3>
              
              <div className="space-y-4 mb-8 text-brown-800">
                <div className="flex justify-between pb-4 border-b border-gray-100">
                  <span className="flex items-center gap-2"><Users size={18} /> Current Crowd</span>
                  <span className="font-bold">{restaurant.crowdLevel}</span>
                </div>
                <div className="flex justify-between pb-4 border-b border-gray-100">
                  <span className="flex items-center gap-2"><Clock size={18} /> Waitlist</span>
                  <span className="font-bold">{restaurant.queueCount} people</span>
                </div>
              </div>

              <Link 
                to={`/restaurants/${restaurant.id}/blueprint`}
                state={{ preOrder: selectedDishes }}
                className="block w-full bg-brown-900 text-cream-100 text-center py-4 rounded-lg font-bold hover:bg-gold-500 hover:text-brown-900 transition-colors shadow-lg shadow-brown-900/20"
              >
                View Table Blueprint
              </Link>
              <p className="text-center text-xs text-brown-500 mt-4">
                Select your exact seating location on our interactive floor plan.
              </p>

              {/* Pre-Order Summary in Sidebar */}
              {selectedDishes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-xl bg-gold-50/50 border border-gold-500/20 text-sm text-brown-900"
                >
                  <h4 className="font-bold flex items-center gap-1.5 mb-2 text-xs uppercase tracking-wider text-gold-700">
                    <Check size={14} /> Selected Pre-Order
                  </h4>
                  <ul className="space-y-1.5 text-xs">
                    {selectedDishes.map((dish, idx) => (
                      <li key={idx} className="flex justify-between items-center text-brown-800">
                        <span className="truncate max-w-[150px]">• {dish.name}</span>
                        <span className="font-semibold text-gold-600 shrink-0">
                          {dish.price ? (dish.price.startsWith('₹') ? dish.price : `₹${dish.price}`) : 'Ask'}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 text-[10px] text-brown-600/70 border-t border-gold-500/10 pt-2 flex justify-between items-center">
                    <span>Pre-order ready upon arrival.</span>
                    <button 
                      onClick={() => setSelectedDishes([])}
                      className="text-red-500 hover:underline flex items-center gap-0.5"
                    >
                      <Trash2 size={10} /> Clear
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Write a Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white max-w-md w-full p-8 rounded-3xl border border-gold-500/20 shadow-2xl space-y-4 text-brown-900 relative"
            >
              <button
                onClick={() => setShowReviewModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-brown-900 transition cursor-pointer p-1"
              >
                <X size={20} />
              </button>

              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-gold-600 font-sans">Share your thoughts</span>
                <h3 className="text-2xl font-serif font-bold text-brown-900 mt-0.5">Write a Review</h3>
              </div>

              <form onSubmit={handleAddReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brown-700 mb-2 font-sans">
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setUserRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="text-2xl transition cursor-pointer focus:outline-none"
                      >
                        <Star
                          size={28}
                          className={
                            star <= (hoverRating || userRating)
                              ? 'text-gold-500 fill-gold-500 scale-110 transition-transform'
                              : 'text-gray-300'
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-cream-100/50 p-3 rounded-xl border border-cream-200">
                  <span className="text-xs text-brown-500 font-sans block">Posting as</span>
                  <span className="text-sm font-bold text-brown-900 font-sans">{user?.name || 'Guest User'}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brown-700 mb-1 font-sans">
                    Review Comments
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="What did you like or dislike about your experience?"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-4 py-2 border border-cream-300 rounded-xl text-sm outline-none focus:border-gold-500 transition-colors resize-none font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brown-900 text-gold-500 py-3 rounded-xl text-sm font-bold hover:bg-brown-800 transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2 font-sans"
                >
                  Submit Review
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestaurantDetail;
