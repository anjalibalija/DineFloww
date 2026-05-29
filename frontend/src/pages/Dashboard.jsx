import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Calendar, Clock, MapPin, Users, Ticket, CheckCircle2, Sparkles, 
  Star, ArrowRight, ArrowLeft, Eye, Trash2, AlertCircle, LogOut, Compass, X, User, Phone, Mail,
  Camera, Edit3, BookOpen, Lock, Save, Award, Bell, HelpCircle, Shield, Globe, ShieldAlert, Activity, Map, CreditCard, Receipt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardMap from '../components/DashboardMap';

const Dashboard = () => {
  const { user, logout, loadUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState('reservations');
  
  // Custom Modals / States
  const [reviewRestaurant, setReviewRestaurant] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(null);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  
  // Toast notifications
  const [toastMsg, setToastMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);



  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const fetchUserData = useCallback(async () => {
    try {
      const [bookingsRes, couponsRes, favoritesRes, reviewsRes, restaurantsRes] = await Promise.all([
        axios.get('/api/bookings/my'),
        axios.get('/api/coupons/my'),
        axios.get('/api/favorites'),
        axios.get('/api/reviews/my'),
        axios.get('/api/restaurants')
      ]);
      setBookings(bookingsRes.data.data);
      setCoupons(couponsRes.data.data);
      setFavorites(favoritesRes.data.data);
      setMyReviews(reviewsRes.data.data);
      setAllRestaurants(restaurantsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);



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



  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-cream-100">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-serif text-xl text-stone-900">Loading your dining vault...</p>
      </div>
    );
  }

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

  const getExistingReview = (restaurantId) => myReviews.find(r => r.restaurantId === restaurantId);

  return (
    <div className="min-h-screen bg-cream-100/50 py-10 px-4 md:px-8">
      <div className="container mx-auto max-w-6xl">
        
        {/* Back to Dashboard Button */}
        <div className="mb-6">
          <Link 
            to="/restaurants" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-brown-700/60 hover:text-gold-600 transition-colors group cursor-pointer"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

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

        {/* Glassmorphic Hero section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 p-6 md:p-8 text-cream-100 shadow-2xl border border-stone-800/80 mb-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute left-1/4 -bottom-10 h-48 w-48 rounded-full bg-gold-600/5 blur-2xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg border-2 border-gold-500/30 overflow-hidden shrink-0">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-serif font-black text-stone-900">{user?.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-white">Welcome, {user?.name}</h1>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-stone-400 pt-1">
                <span className="flex items-center gap-1"><MapPin size={12} /> Local Diner</span>
                <span className="h-1.5 w-1.5 rounded-full bg-stone-700" />
                <span>Email: {user?.email}</span>
                {user?.phone && (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-stone-700" />
                    <span>Phone: {user.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-200 mb-8 gap-4 pb-2">
          <div className="flex flex-wrap gap-2 md:gap-5">
            {[
              { id: 'reservations', label: `Upcoming (${upcomingBookings.length})`, icon: Calendar },
              { id: 'history', label: `Dining History (${pastBookings.length})`, icon: BookOpen },
              { id: 'nearby', label: 'Nearby Map', icon: Map },
              { id: 'favorites', label: `Favorites (${favorites.length})`, icon: Star },
              { id: 'reviews', label: `My Reviews (${myReviews.length})`, icon: Star },
              { id: 'rewards', label: `My Coupons (${coupons.length})`, icon: Ticket },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`pb-3 text-sm md:text-base font-serif font-black tracking-wide transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                    activeSubTab === tab.id
                      ? 'border-amber-600 text-amber-600'
                      : 'border-transparent text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {/* RESERVATIONS TAB */}
          {activeSubTab === 'reservations' && (
            <div className="space-y-6">
              {upcomingBookings.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center shadow-sm max-w-xl mx-auto">
                  <Calendar size={48} className="mx-auto text-stone-300 mb-4" />
                  <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">No Upcoming Dining Plans</h3>
                  <p className="text-stone-600 text-sm">You don't have any bookings scheduled.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingBookings.map((booking) => (
                    <motion.div 
                      key={booking.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group relative"
                    >
                      <div className="p-6 pb-4 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="text-xl font-serif font-black text-stone-900 group-hover:text-amber-600 transition-colors">
                              {booking.restaurant?.name}
                            </h3>
                            <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                              <MapPin size={12} className="text-amber-600" /> {booking.restaurant?.location}
                            </p>
                          </div>
                          <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 size={12} /> {booking.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs bg-cream-100/70 p-4 rounded-2xl border border-cream-200/50">
                          <div className="flex items-center gap-2 text-stone-800">
                            <Calendar size={14} className="text-amber-600" />
                            <span>{new Date(booking.bookingDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-stone-800">
                            <Clock size={14} className="text-amber-600" />
                            <span>{booking.bookingTime}</span>
                          </div>
                          <div className="flex items-center gap-2 text-stone-800">
                            <Users size={14} className="text-amber-600" />
                            <span>{booking.peopleCount} Diners</span>
                          </div>
                          <div className="flex items-center gap-2 text-stone-900 font-bold">
                            <Award size={14} className="text-amber-600" />
                            <span>Table {booking.table?.tableNumber} ({booking.table?.category})</span>
                          </div>
                          <div className="col-span-2 border-t border-stone-200/60 pt-2.5 mt-1.5 flex items-center justify-between text-[11px] text-stone-700">
                            <div className="flex items-center gap-1.5 font-medium">
                              <CreditCard size={13} className="text-emerald-600" />
                              <span>Payment Status: <strong className="text-emerald-700 font-bold">Paid</strong></span>
                            </div>
                            <div className="flex items-center gap-1 opacity-80">
                              <Receipt size={12} className="text-amber-600" />
                              <span>₹99.00 {booking.paymentId ? `(ID: ${booking.paymentId})` : '(Pre-Authorized)'}</span>
                            </div>
                          </div>
                        </div>

                        {booking.specialRequest && (
                          <div className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                            <span className="font-bold text-stone-700 block mb-0.5">Special Requests:</span>
                            "{booking.specialRequest}"
                          </div>
                        )}
                      </div>

                      <div className="bg-stone-50/80 px-6 py-4 border-t border-stone-100 flex items-center justify-between gap-3">
                        <Link 
                          to={`/restaurants/${booking.restaurantId}/blueprint`}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
                        >
                          <Eye size={14} /> View Table Blueprint
                        </Link>
                        <button 
                          onClick={() => setCancelBookingId(booking.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-bold border border-red-200 hover:border-red-600 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* DINING HISTORY TAB */}
          {activeSubTab === 'history' && (
            <div className="space-y-6">
              {pastBookings.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center shadow-sm max-w-xl mx-auto">
                  <BookOpen size={48} className="mx-auto text-stone-300 mb-4" />
                  <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">No Dining History</h3>
                  <p className="text-stone-600 text-sm">You haven&apos;t completed any dining visits yet. Explore restaurants and book a table to begin your culinary journey!</p>
                  <Link to="/restaurants" className="mt-5 inline-block bg-stone-900 text-gold-500 hover:bg-gold-500 hover:text-stone-950 font-bold px-6 py-2.5 rounded-full transition-colors text-xs">
                    Explore Restaurants
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pastBookings.map((booking) => {
                    const review = getExistingReview(booking.restaurantId);
                    return (
                      <motion.div 
                        key={booking.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
                      >
                        <div className="p-6 pb-4 space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h3 className="text-xl font-serif font-black text-stone-900 group-hover:text-amber-600 transition-colors">
                                {booking.restaurant?.name}
                              </h3>
                              <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                                <MapPin size={12} className="text-amber-600" /> {booking.restaurant?.location}
                              </p>
                            </div>
                            <span className="bg-stone-100 text-stone-600 text-xs px-2.5 py-1 rounded-full font-bold border border-stone-200">
                              Completed
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs bg-cream-100/70 p-4 rounded-2xl border border-cream-200/50">
                            <div className="flex items-center gap-2 text-stone-800">
                              <Calendar size={14} className="text-amber-600" />
                              <span>{new Date(booking.bookingDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-stone-800">
                              <Clock size={14} className="text-amber-600" />
                              <span>{booking.bookingTime}</span>
                            </div>
                            <div className="flex items-center gap-2 text-stone-800">
                              <Users size={14} className="text-amber-600" />
                              <span>{booking.peopleCount} Diners</span>
                            </div>
                             <div className="flex items-center gap-2 text-stone-900 font-bold">
                               <Award size={14} className="text-amber-600" />
                               <span>Table {booking.table?.tableNumber}</span>
                             </div>
                             <div className="col-span-2 border-t border-stone-200/60 pt-2.5 mt-1.5 flex items-center justify-between text-[11px] text-stone-700">
                               <div className="flex items-center gap-1.5 font-medium">
                                 <CreditCard size={13} className="text-emerald-600" />
                                 <span>Payment Status: <strong className="text-emerald-700 font-bold">Paid</strong></span>
                               </div>
                               <div className="flex items-center gap-1 opacity-80">
                                 <Receipt size={12} className="text-amber-600" />
                                 <span>₹99.00 {booking.paymentId ? `(ID: ${booking.paymentId})` : '(Pre-Authorized)'}</span>
                               </div>
                             </div>
                           </div>
                         </div>

                        <div className="bg-stone-50/80 px-6 py-4 border-t border-stone-100 flex items-center justify-between gap-3">
                          <span className="text-xs text-stone-500">
                            Visited on {new Date(booking.bookingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <button 
                            onClick={() => handleOpenReviewModal(booking.restaurant, review)}
                            className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1.5 cursor-pointer border border-amber-200 hover:border-amber-600 px-3 py-1.5 rounded-lg bg-white"
                          >
                            <Star size={13} className="fill-amber-500 text-amber-500" />
                            {review ? 'Edit Review' : 'Rate & Review'}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MY FAVORITES TAB */}
          {activeSubTab === 'favorites' && (
            <div className="space-y-6">
              {favorites.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center shadow-sm max-w-xl mx-auto">
                  <Star size={48} className="mx-auto text-stone-300 mb-4" />
                  <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">No Bookmarked Restaurants</h3>
                  <p className="text-stone-600 text-sm">Add restaurants to your favorites to access them instantly from your dashboard.</p>
                  <Link to="/restaurants" className="mt-5 inline-block bg-stone-900 text-gold-500 hover:bg-gold-500 hover:text-stone-955 font-bold px-6 py-2.5 rounded-full transition-colors text-xs">
                    Find Restaurants
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((fav) => (
                    <motion.div
                      key={fav.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group relative"
                    >
                      <div className="h-40 overflow-hidden bg-stone-100 relative">
                        <img 
                          src={fav.restaurant?.image && fav.restaurant.image !== 'no-photo.jpg' ? fav.restaurant.image : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600'} 
                          alt={fav.restaurant?.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-amber-400 border border-white/10 flex items-center gap-1">
                          ★ {fav.restaurant?.rating || 'New'}
                        </div>
                      </div>

                      <div className="p-5 flex-grow space-y-2">
                        <h3 className="text-lg font-serif font-black text-stone-900 line-clamp-1">{fav.restaurant?.name}</h3>
                        <p className="text-xs text-stone-500 flex items-center gap-1">
                          <MapPin size={11} className="text-amber-600" /> {fav.restaurant?.location}
                        </p>
                        <span className="inline-block bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-amber-100">
                          {fav.restaurant?.cuisine}
                        </span>
                      </div>

                      <div className="px-5 py-4 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between gap-3">
                        <button 
                          onClick={() => handleRemoveFavorite(fav.restaurantId)}
                          className="text-stone-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                          title="Remove from favorites"
                        >
                          <Trash2 size={16} />
                        </button>
                        <Link 
                          to={`/restaurants/${fav.restaurantId}`}
                          className="bg-stone-900 text-amber-400 hover:bg-amber-500 hover:text-stone-900 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          Book Table
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MY REVIEWS TAB */}
          {activeSubTab === 'reviews' && (
            <div className="space-y-6">
              {myReviews.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center shadow-sm max-w-xl mx-auto">
                  <Star size={48} className="mx-auto text-stone-300 mb-4" />
                  <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">No Reviews Found</h3>
                  <p className="text-stone-600 text-sm">You haven&apos;t left any feedback or reviews for restaurants yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myReviews.map((rev) => (
                    <motion.div 
                      key={rev.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h4 className="font-serif font-black text-stone-900 text-lg">{rev.restaurant?.name}</h4>
                            <p className="text-[10px] text-stone-400 mt-0.5">{new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-600">
                            ★ {rev.rating}
                          </div>
                        </div>
                        <p className="text-stone-600 text-xs italic leading-relaxed font-light">&ldquo;{rev.comment}&rdquo;</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REWARDS & COUPONS TAB */}
          {activeSubTab === 'rewards' && (
            <div className="space-y-6">
              {coupons.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center shadow-sm max-w-xl mx-auto">
                  <Ticket size={48} className="mx-auto text-stone-300 mb-4" />
                  <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">No Active Coupons</h3>
                  <p className="text-stone-600 text-sm">Play puzzle games at restaurants with long queues (crowd counts above 5) to earn discount coupons!</p>
                  <Link to="/restaurants" className="mt-5 inline-block bg-stone-900 text-gold-500 hover:bg-gold-500 hover:text-stone-950 font-bold px-6 py-2.5 rounded-full transition-colors text-xs">
                    Browse Restaurants
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {coupons.map((coupon) => (
                    <motion.div
                      key={coupon.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between group relative"
                    >
                      <div className="h-1 bg-gradient-to-r from-stone-900 to-amber-900" />
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <Ticket size={20} className="text-amber-600" />
                          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Dine Flow Discount</span>
                        </div>
                        <div>
                          <h3 className="text-3xl font-serif font-black text-stone-900">{coupon.discount}% OFF</h3>
                          <p className="text-xs text-stone-500 mt-1">Applicable to your total queue order bill at checkout.</p>
                        </div>
                        
                        <div className="bg-cream-100/50 border border-dashed border-stone-300 p-3.5 rounded-xl flex items-center justify-between gap-3 text-center">
                          <span className="font-mono text-sm font-bold text-stone-900 tracking-wider select-all">{coupon.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.code)}
                            className="text-[10px] font-bold text-amber-600 hover:text-amber-700 transition-colors uppercase cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-stone-50 px-6 py-3 border-t border-stone-100 flex justify-between items-center text-[10px] text-stone-400">
                        <span>Expiry: {new Date(coupon.expiry).toLocaleDateString()}</span>
                        <span className={coupon.isUsed ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>
                          {coupon.isUsed ? 'Redeemed' : 'Active'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NEARBY MAP TAB */}
          {activeSubTab === 'nearby' && (
            <div className="space-y-6">
              <DashboardMap restaurants={allRestaurants} />
            </div>
          )}
        </div>

      </div>

      {/* MODAL: RATE & REVIEW */}
      <AnimatePresence>
        {reviewRestaurant && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full relative border border-stone-200"
            >
              <button 
                onClick={handleCloseReviewModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-600 mx-auto">
                  <Star size={32} className="fill-amber-500 text-amber-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-black text-stone-900">Leave Feedback</h3>
                  <p className="text-stone-500 text-xs mt-1">Review your dining experience at <strong>{reviewRestaurant.name}</strong></p>
                </div>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-5 mt-6">
                <div className="space-y-1.5 text-center">
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Select Rating</label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="text-2xl hover:scale-125 transition-transform duration-100 cursor-pointer"
                      >
                        <Star 
                          className={`w-8 h-8 ${
                            star <= (hoverRating || rating)
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Write Review</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    rows={4}
                    maxLength={500}
                    placeholder="Describe the dishes, service quality, table arrangement..."
                    className="w-full border border-stone-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-cream-100/30 resize-none font-light leading-relaxed"
                  />
                  <div className="text-right text-[10px] text-stone-400 font-light">{comment.length}/500 chars</div>
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
                    className="flex-1 py-3 rounded-xl bg-stone-900 text-gold-500 text-xs font-bold hover:bg-amber-600 hover:text-stone-950 transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-1"
                  >
                    {submittingReview ? 'Submitting...' : 'Save Review'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: CANCEL BOOKING CONFIRMATION */}
      <AnimatePresence>
        {cancelBookingId && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-sm w-full text-center border border-stone-200"
            >
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
                <AlertCircle size={28} className="text-red-500 animate-bounce" />
              </div>
              <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">Cancel Reservation?</h3>
              <p className="text-sm text-stone-600 mb-6 font-light leading-relaxed">
                Are you sure you want to cancel this booking? This table release is immediate and cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setCancelBookingId(null)}
                  className="flex-grow py-3 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  No, Keep Booking
                </button>
                <button 
                  onClick={handleCancelBooking} 
                  disabled={cancelling}
                  className="flex-grow py-3 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {cancelling ? 'Releasing Table...' : 'Yes, Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
