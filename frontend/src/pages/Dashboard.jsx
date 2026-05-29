import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Calendar, Clock, MapPin, Users, Ticket, CheckCircle2, Sparkles,
  Star, ArrowRight, Eye, Trash2, AlertCircle, X,
  Award, BookOpen, Map, CreditCard, Receipt,
  LayoutDashboard, Heart, MessageSquare, Gift, ChevronRight, TrendingUp, Utensils
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'reservations', label: 'Reservations', icon: Calendar },
  { id: 'history', label: 'History', icon: BookOpen },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'reviews', label: 'My Reviews', icon: MessageSquare },
  { id: 'rewards', label: 'Coupons', icon: Gift },
];

// Stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const Dashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Navigation
  const [activeTab, setActiveTab] = useState('overview');

  // Review modal
  const [reviewRestaurant, setReviewRestaurant] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(null);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Cancel modal
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const fetchUserData = useCallback(async () => {
    try {
      const [bookingsRes, couponsRes, favoritesRes, reviewsRes] = await Promise.all([
        axios.get('/api/bookings/my'),
        axios.get('/api/coupons/my'),
        axios.get('/api/favorites'),
        axios.get('/api/reviews/my')
      ]);
      setBookings(bookingsRes.data.data);
      setCoupons(couponsRes.data.data);
      setFavorites(favoritesRes.data.data);
      setMyReviews(reviewsRes.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Booking logic
  const handleCancelBooking = async () => {
    if (!cancelBookingId) return;
    setCancelling(true);
    try {
      await axios.delete(`/api/bookings/${cancelBookingId}`);
      setBookings(prev => prev.filter(b => b.id !== cancelBookingId));
      setCancelBookingId(null);
      showToast('Your reservation has been cancelled successfully.');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to cancel reservation.');
    } finally {
      setCancelling(false);
    }
  };

  const handleRemoveFavorite = async (restaurantId) => {
    try {
      await axios.post(`/api/favorites/${restaurantId}`);
      setFavorites(prev => prev.filter(fav => fav.restaurantId !== restaurantId));
      showToast('Removed from favorites.');
    } catch (err) {
      console.error(err);
      showToast('Failed to toggle favorite.');
    }
  };

  const handleOpenReviewModal = (restaurant, existingReview = null) => {
    setReviewRestaurant(restaurant);
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment);
    } else {
      setRating(5);
      setComment('');
    }
  };

  const handleCloseReviewModal = () => {
    setReviewRestaurant(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewRestaurant) return;
    setSubmittingReview(true);
    try {
      const res = await axios.post('/api/reviews', {
        restaurantId: reviewRestaurant.id,
        rating,
        comment
      });
      if (res.data.success) {
        showToast('Review saved successfully!');
        setReviewRestaurant(null);
        const reviewsRes = await axios.get('/api/reviews/my');
        setMyReviews(reviewsRes.data.data);
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to save review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(''), 3000);
  };

  // Derived data
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBookings = bookings.filter(b => {
    const bDate = new Date(b.bookingDate);
    bDate.setHours(0, 0, 0, 0);
    return bDate >= today;
  });

  const pastBookings = bookings.filter(b => {
    const bDate = new Date(b.bookingDate);
    bDate.setHours(0, 0, 0, 0);
    return bDate < today;
  });

  const activeCoupons = coupons.filter(c => !c.isUsed);

  const getExistingReview = (restaurantId) => myReviews.find(r => r.restaurantId === restaurantId);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-cream-100">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-stone-200 rounded-full" />
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
        </div>
        <p className="font-serif text-xl text-stone-900 mt-6">Preparing your dashboard...</p>
        <p className="text-sm text-stone-400 mt-1">Loading reservations & rewards</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100/50">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-50 bg-stone-900 text-gold-500 border border-gold-500/30 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-sm font-semibold"
          >
            <Sparkles size={16} className="text-gold-400" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex">
        {/* ═══ SIDEBAR ═══ */}
        <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-64px)] sticky top-16 bg-white border-r border-stone-200/80 py-6 px-4 shrink-0">
          {/* User card in sidebar */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 text-cream-100 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md border-2 border-gold-500/30 overflow-hidden shrink-0">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-serif font-black text-stone-900">{user?.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-serif font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-stone-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              // Badge counts
              let badge = null;
              if (item.id === 'reservations') badge = upcomingBookings.length;
              if (item.id === 'history') badge = pastBookings.length;
              if (item.id === 'favorites') badge = favorites.length;
              if (item.id === 'reviews') badge = myReviews.length;
              if (item.id === 'rewards') badge = coupons.length;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group ${
                    isActive
                      ? 'bg-amber-50 text-amber-800 shadow-sm border border-amber-200/60'
                      : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800 border border-transparent'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-amber-600' : 'text-stone-400 group-hover:text-stone-600'} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {badge > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                      isActive ? 'bg-amber-600 text-white' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer CTA */}
          <div className="mt-4 pt-4 border-t border-stone-100">
            <Link
              to="/restaurants"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-900 text-gold-500 hover:bg-amber-600 hover:text-stone-900 text-sm font-bold transition-all duration-200 justify-center shadow-sm"
            >
              <Utensils size={16} />
              Explore Restaurants
            </Link>
          </div>
        </aside>

        {/* ═══ MOBILE NAV (horizontal scroll) ═══ */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 px-2 py-2 flex gap-1 overflow-x-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 min-w-0 px-4 md:px-8 py-8 pb-24 lg:pb-8">
          {/* Page header */}
          <div className="mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-serif font-black text-stone-900 tracking-tight"
            >
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'reservations' && 'My Reservations'}
              {activeTab === 'history' && 'Dining History'}
              {activeTab === 'favorites' && 'My Favorites'}
              {activeTab === 'reviews' && 'My Reviews'}
              {activeTab === 'rewards' && 'Rewards & Coupons'}
            </motion.h1>
            <p className="text-sm text-stone-400 mt-1 font-light">
              {activeTab === 'overview' && `Welcome back, ${user?.name?.split(' ')[0]}. Here's your dining summary.`}
              {activeTab === 'reservations' && `You have ${upcomingBookings.length} upcoming reservation${upcomingBookings.length !== 1 ? 's' : ''}.`}
              {activeTab === 'history' && `${pastBookings.length} past dining experience${pastBookings.length !== 1 ? 's' : ''}.`}
              {activeTab === 'favorites' && `${favorites.length} saved restaurant${favorites.length !== 1 ? 's' : ''}.`}
              {activeTab === 'reviews' && `${myReviews.length} review${myReviews.length !== 1 ? 's' : ''} shared.`}
              {activeTab === 'rewards' && `${activeCoupons.length} active coupon${activeCoupons.length !== 1 ? 's' : ''} available.`}
            </p>
          </div>

          {/* ═══ OVERVIEW TAB ═══ */}
          {activeTab === 'overview' && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
              {/* Stat Cards */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Upcoming', value: upcomingBookings.length, icon: Calendar, color: 'amber', onClick: () => setActiveTab('reservations') },
                  { label: 'Past Visits', value: pastBookings.length, icon: TrendingUp, color: 'emerald', onClick: () => setActiveTab('history') },
                  { label: 'Active Coupons', value: activeCoupons.length, icon: Ticket, color: 'violet', onClick: () => setActiveTab('rewards') },
                  { label: 'Favorites', value: favorites.length, icon: Heart, color: 'rose', onClick: () => setActiveTab('favorites') },
                ].map((stat) => {
                  const Icon = stat.icon;
                  const colorMap = {
                    amber: { bg: 'bg-amber-50', iconBg: 'bg-amber-100', icon: 'text-amber-600', border: 'border-amber-200/60', hover: 'hover:border-amber-300' },
                    emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', icon: 'text-emerald-600', border: 'border-emerald-200/60', hover: 'hover:border-emerald-300' },
                    violet: { bg: 'bg-violet-50', iconBg: 'bg-violet-100', icon: 'text-violet-600', border: 'border-violet-200/60', hover: 'hover:border-violet-300' },
                    rose: { bg: 'bg-rose-50', iconBg: 'bg-rose-100', icon: 'text-rose-600', border: 'border-rose-200/60', hover: 'hover:border-rose-300' },
                  };
                  const c = colorMap[stat.color];
                  return (
                    <button
                      key={stat.label}
                      onClick={stat.onClick}
                      className={`${c.bg} ${c.border} ${c.hover} border rounded-2xl p-5 text-left transition-all duration-200 hover:shadow-md cursor-pointer group`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center`}>
                          <Icon size={20} className={c.icon} />
                        </div>
                        <ChevronRight size={16} className="text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-3xl font-serif font-black text-stone-900">{stat.value}</p>
                      <p className="text-xs text-stone-500 mt-0.5 font-medium">{stat.label}</p>
                    </button>
                  );
                })}
              </motion.div>

              {/* Upcoming Reservations Preview */}
              <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                    <Calendar size={18} className="text-amber-600" />
                    Upcoming Reservations
                  </h2>
                  {upcomingBookings.length > 0 && (
                    <button onClick={() => setActiveTab('reservations')} className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer">
                      View all <ArrowRight size={14} />
                    </button>
                  )}
                </div>

                {upcomingBookings.length === 0 ? (
                  <div className="bg-white p-10 rounded-2xl border border-stone-200 text-center">
                    <Calendar size={40} className="mx-auto text-stone-200 mb-3" />
                    <h3 className="text-base font-serif font-bold text-stone-800 mb-1">No upcoming reservations</h3>
                    <p className="text-xs text-stone-400 mb-4">Browse restaurants and book your next dining experience.</p>
                    <Link to="/restaurants" className="inline-flex items-center gap-1.5 bg-stone-900 text-gold-500 hover:bg-amber-600 hover:text-stone-900 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
                      <Utensils size={14} /> Find Restaurants
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingBookings.slice(0, 2).map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        type="upcoming"
                        onCancel={() => setCancelBookingId(booking.id)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Recent Reviews Preview */}
              {myReviews.length > 0 && (
                <motion.div variants={itemVariants}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                      <MessageSquare size={18} className="text-amber-600" />
                      Recent Reviews
                    </h2>
                    <button onClick={() => setActiveTab('reviews')} className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer">
                      View all <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myReviews.slice(0, 2).map((rev) => (
                      <ReviewCard key={rev.id} review={rev} />
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ═══ RESERVATIONS TAB ═══ */}
          {activeTab === 'reservations' && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
              {upcomingBookings.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No Upcoming Reservations"
                  description="You don't have any bookings scheduled. Explore restaurants and book a table."
                  ctaText="Explore Restaurants"
                  ctaLink="/restaurants"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {upcomingBookings.map((booking) => (
                    <motion.div key={booking.id} variants={itemVariants}>
                      <BookingCard
                        booking={booking}
                        type="upcoming"
                        onCancel={() => setCancelBookingId(booking.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ HISTORY TAB ═══ */}
          {activeTab === 'history' && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
              {pastBookings.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No Dining History"
                  description="You haven't completed any dining visits yet. Start your culinary journey!"
                  ctaText="Explore Restaurants"
                  ctaLink="/restaurants"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {pastBookings.map((booking) => {
                    const review = getExistingReview(booking.restaurantId);
                    return (
                      <motion.div key={booking.id} variants={itemVariants}>
                        <BookingCard
                          booking={booking}
                          type="past"
                          existingReview={review}
                          onReview={() => handleOpenReviewModal(booking.restaurant, review)}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ FAVORITES TAB ═══ */}
          {activeTab === 'favorites' && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
              {favorites.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  title="No Saved Restaurants"
                  description="Add restaurants to your favorites for quick access."
                  ctaText="Find Restaurants"
                  ctaLink="/restaurants"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {favorites.map((fav) => (
                    <motion.div key={fav.id} variants={itemVariants}>
                      <FavoriteCard fav={fav} onRemove={() => handleRemoveFavorite(fav.restaurantId)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ REVIEWS TAB ═══ */}
          {activeTab === 'reviews' && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
              {myReviews.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No Reviews Yet"
                  description="You haven't left any feedback for restaurants. Visit a restaurant and share your experience!"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {myReviews.map((rev) => (
                    <motion.div key={rev.id} variants={itemVariants}>
                      <ReviewCard review={rev} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ REWARDS TAB ═══ */}
          {activeTab === 'rewards' && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
              {coupons.length === 0 ? (
                <EmptyState
                  icon={Gift}
                  title="No Coupons Available"
                  description="Play puzzle games at restaurants with long queues (crowd above 5) to earn discount coupons!"
                  ctaText="Browse Restaurants"
                  ctaLink="/restaurants"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {coupons.map((coupon) => (
                    <motion.div key={coupon.id} variants={itemVariants}>
                      <CouponCard coupon={coupon} onCopy={handleCopyCode} copiedCode={copiedCode} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}


        </main>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Review Modal */}
      <AnimatePresence>
        {reviewRestaurant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full relative border border-stone-200"
            >
              <button
                onClick={handleCloseReviewModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="text-center space-y-3">
                <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 mx-auto">
                  <Star size={28} className="fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-black text-stone-900">Rate Your Experience</h3>
                  <p className="text-stone-500 text-xs mt-1">Share feedback for <strong>{reviewRestaurant.name}</strong></p>
                </div>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-5 mt-6">
                <div className="space-y-2 text-center">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest">Your Rating</label>
                  <div className="flex justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="hover:scale-110 transition-transform duration-100 cursor-pointer p-0.5"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= (hoverRating || rating)
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-stone-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest">Your Review</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    rows={4}
                    maxLength={500}
                    placeholder="Describe the dishes, service, ambiance..."
                    className="w-full border border-stone-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50/50 resize-none font-light leading-relaxed"
                  />
                  <div className="text-right text-[10px] text-stone-300">{comment.length}/500</div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseReviewModal}
                    className="flex-1 py-3 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="flex-1 py-3 rounded-xl bg-stone-900 text-gold-500 text-xs font-bold hover:bg-amber-600 hover:text-stone-950 transition-all disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {submittingReview ? 'Saving...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Booking Modal */}
      <AnimatePresence>
        {cancelBookingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-sm w-full text-center border border-stone-200"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
                <AlertCircle size={28} className="text-red-500" />
              </div>
              <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">Cancel Reservation?</h3>
              <p className="text-sm text-stone-500 mb-6 font-light leading-relaxed">
                This action is immediate and cannot be undone. The table will be released.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelBookingId(null)}
                  className="flex-grow py-3 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="flex-grow py-3 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


/* ═══════════════════════════════════════════
   SUBCOMPONENTS
   ═══════════════════════════════════════════ */

// Booking Card (used for upcoming & past)
const BookingCard = ({ booking, type, onCancel, onReview, existingReview }) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col justify-between">
      {/* Color accent bar */}
      <div className={`h-1 ${type === 'upcoming' ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-stone-300 to-stone-400'}`} />

      <div className="p-5 space-y-4 flex-1">
        {/* Header */}
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-serif font-bold text-stone-900 group-hover:text-amber-700 transition-colors truncate">
              {booking.restaurant?.name}
            </h3>
            <p className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-amber-600 shrink-0" /> {booking.restaurant?.location}
            </p>
          </div>
          <span className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
            type === 'upcoming'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-stone-100 text-stone-500 border border-stone-200'
          }`}>
            <CheckCircle2 size={11} />
            {type === 'upcoming' ? booking.status : 'Completed'}
          </span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs bg-stone-50 p-3.5 rounded-xl">
          <div className="flex items-center gap-2 text-stone-700">
            <Calendar size={13} className="text-amber-600 shrink-0" />
            <span>{new Date(booking.bookingDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-700">
            <Clock size={13} className="text-amber-600 shrink-0" />
            <span>{booking.bookingTime}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-700">
            <Users size={13} className="text-amber-600 shrink-0" />
            <span>{booking.peopleCount} Diners</span>
          </div>
          <div className="flex items-center gap-2 text-stone-800 font-semibold">
            <Award size={13} className="text-amber-600 shrink-0" />
            <span>Table {booking.table?.tableNumber}{booking.table?.category ? ` · ${booking.table.category}` : ''}</span>
          </div>
          <div className="col-span-2 border-t border-stone-200/60 pt-2 mt-1 flex items-center justify-between text-[10px] text-stone-500">
            <div className="flex items-center gap-1.5">
              <CreditCard size={12} className="text-emerald-600" />
              <span>Payment: <strong className="text-emerald-700">Paid</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <Receipt size={11} className="text-amber-600" />
              <span>₹99.00 {booking.paymentId ? `(${booking.paymentId.slice(0, 12)}...)` : ''}</span>
            </div>
          </div>
        </div>

        {/* Special request */}
        {booking.specialRequest && (
          <div className="text-[11px] text-stone-500 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
            <span className="font-bold text-stone-600">Note:</span> "{booking.specialRequest}"
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 py-3.5 border-t border-stone-100 flex items-center justify-between gap-3 bg-stone-50/50">
        {type === 'upcoming' ? (
          <>
            <Link
              to={`/restaurants/${booking.restaurantId}/blueprint`}
              className="text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
            >
              <Eye size={13} /> View Blueprint
            </Link>
            <button
              onClick={onCancel}
              className="text-[11px] text-red-500 hover:text-red-700 font-bold border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors cursor-pointer hover:bg-red-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className="text-[11px] text-stone-400">
              Visited {new Date(booking.bookingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button
              onClick={onReview}
              className="text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1.5 cursor-pointer border border-amber-200 hover:border-amber-400 px-3 py-1.5 rounded-lg bg-white hover:bg-amber-50"
            >
              <Star size={12} className="fill-amber-500 text-amber-500" />
              {existingReview ? 'Edit Review' : 'Rate & Review'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Favorite Card
const FavoriteCard = ({ fav, onRemove }) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col">
      {/* Image */}
      <div className="h-36 overflow-hidden bg-stone-100 relative">
        <img
          src={fav.restaurant?.image && fav.restaurant.image !== 'no-photo.jpg' ? fav.restaurant.image : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600'}
          alt={fav.restaurant?.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-400 border border-white/10 flex items-center gap-1">
          ★ {fav.restaurant?.rating || 'New'}
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="bg-white/90 backdrop-blur text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider text-amber-800 border border-amber-200/50">
            {fav.restaurant?.cuisine}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-grow space-y-1.5">
        <h3 className="text-base font-serif font-bold text-stone-900 line-clamp-1 group-hover:text-amber-700 transition-colors">{fav.restaurant?.name}</h3>
        <p className="text-[11px] text-stone-400 flex items-center gap-1">
          <MapPin size={10} className="text-amber-600" /> {fav.restaurant?.location}
        </p>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-stone-100 flex items-center justify-between gap-3">
        <button
          onClick={onRemove}
          className="text-stone-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
          title="Remove from favorites"
        >
          <Trash2 size={15} />
        </button>
        <Link
          to={`/restaurants/${fav.restaurantId}`}
          className="bg-stone-900 text-amber-400 hover:bg-amber-500 hover:text-stone-900 px-4 py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm cursor-pointer"
        >
          Book Table
        </Link>
      </div>
    </div>
  );
};

// Coupon Card
const CouponCard = ({ coupon, onCopy, copiedCode }) => {
  const isExpired = new Date(coupon.expiry) < new Date();
  const isUsed = coupon.isUsed;
  const isActive = !isExpired && !isUsed;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between ${
      isActive ? 'border-stone-200' : 'border-stone-200 opacity-60'
    }`}>
      {/* Accent bar */}
      <div className={`h-1 ${isActive ? 'bg-gradient-to-r from-amber-500 to-violet-500' : 'bg-stone-300'}`} />

      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Gift size={16} className="text-amber-600" />
          </div>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Dine Flow Reward</span>
        </div>

        <div>
          <h3 className="text-3xl font-serif font-black text-stone-900">{coupon.discount}% OFF</h3>
          <p className="text-[11px] text-stone-400 mt-1">Applicable to your total bill at checkout.</p>
        </div>

        {/* Coupon code */}
        <div className="bg-stone-50 border border-dashed border-stone-300 p-3 rounded-xl flex items-center justify-between gap-3">
          <span className="font-mono text-sm font-bold text-stone-800 tracking-wider select-all">{coupon.code}</span>
          <button
            type="button"
            onClick={() => onCopy(coupon.code)}
            className="text-[10px] font-bold text-amber-600 hover:text-amber-700 transition-colors uppercase cursor-pointer px-2 py-1 rounded-md hover:bg-amber-50"
          >
            {copiedCode === coupon.code ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-stone-100 flex justify-between items-center text-[10px]">
        <span className="text-stone-400">Expires: {new Date(coupon.expiry).toLocaleDateString()}</span>
        <span className={`font-bold ${isUsed ? 'text-red-500' : isExpired ? 'text-stone-400' : 'text-emerald-600'}`}>
          {isUsed ? 'Redeemed' : isExpired ? 'Expired' : 'Active'}
        </span>
      </div>
    </div>
  );
};

// Review Card
const ReviewCard = ({ review }) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h4 className="font-serif font-bold text-stone-900 text-base truncate">{review.restaurant?.name}</h4>
            <p className="text-[10px] text-stone-400 mt-0.5">
              {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-bold text-amber-600 shrink-0">
            <Star size={11} className="fill-amber-500 text-amber-500 mr-0.5" />
            {review.rating}
          </div>
        </div>

        {/* Star visual */}
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={14}
              className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}
            />
          ))}
        </div>

        <p className="text-stone-500 text-xs leading-relaxed font-light">&ldquo;{review.comment}&rdquo;</p>
      </div>
    </div>
  );
};

// Empty State
const EmptyState = ({ icon: Icon, title, description, ctaText, ctaLink }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-12 rounded-2xl border border-stone-200 text-center max-w-lg mx-auto"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stone-50 flex items-center justify-center">
        <Icon size={32} className="text-stone-300" />
      </div>
      <h3 className="text-lg font-serif font-bold text-stone-800 mb-1">{title}</h3>
      <p className="text-xs text-stone-400 mb-5 leading-relaxed max-w-sm mx-auto">{description}</p>
      {ctaText && ctaLink && (
        <Link
          to={ctaLink}
          className="inline-flex items-center gap-1.5 bg-stone-900 text-gold-500 hover:bg-amber-600 hover:text-stone-900 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Utensils size={14} />
          {ctaText}
        </Link>
      )}
    </motion.div>
  );
};

export default Dashboard;
