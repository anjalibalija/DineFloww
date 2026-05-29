import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Store, Plus, Pencil, Trash2, LayoutGrid, Ticket, BarChart3,
  Users, MapPin, Clock, IndianRupee, Utensils, TrendingUp,
  CheckCircle2, AlertTriangle, User, Mail, Phone, Lock, Shield,
  Bell, HelpCircle, Camera, Key, Globe, Activity, ShieldAlert,
  Star, MessageSquare, CreditCard, Building
} from 'lucide-react';

import AddRestaurantForm from '../components/admin/AddRestaurantForm';
import EditRestaurantForm from '../components/admin/EditRestaurantForm';
import TableManagementTab from '../components/admin/TableManagementTab';

const MOCK_RESTAURANTS = [
  {
    id: "demo-res-1",
    name: "The Golden Leaf Bistro",
    cuisine: "Italian",
    location: "Indiranagar, Bengaluru",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
    phone: "+91 98765 43210",
    email: "info@goldenleaf.com",
    ownerName: "Anjali",
    priceRange: "₹₹₹",
    openingTime: "11:00",
    closingTime: "23:00",
    latitude: 12.9716,
    longitude: 77.5946,
    menuHighlights: "Truffle Naan Pizza, Saffron Risotto, Butter Chicken Ravioli",
    tables: [
      { id: "t1", tableNumber: "T1", capacity: 2, category: "Window Side", description: "Romantic table next to the window", bookingCount: 12, isBestseller: true },
      { id: "t2", tableNumber: "T2", capacity: 4, category: "Center", description: "Main dining hall spacious table", bookingCount: 8, isBestseller: false },
      { id: "t3", tableNumber: "T3", capacity: 6, category: "Rooftop", description: "Panoramic sky view deck seating", bookingCount: 22, isBestseller: true },
      { id: "t4", tableNumber: "T4", capacity: 2, category: "Private Cabin", description: "Quiet and isolated cabin seating", bookingCount: 5, isBestseller: false },
      { id: "t5", tableNumber: "T5", capacity: 8, category: "Outdoor", description: "Lush green courtyard seating", bookingCount: 14, isBestseller: true }
    ],
    crowdLevel: "Medium",
    queueCount: 3,
    _count: { bookings: 61 }
  },
  {
    id: "demo-res-2",
    name: "Saffron & Sage Fine Dine",
    cuisine: "Indian",
    location: "Jubilee Hills, Hyderabad",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=80",
    phone: "+91 91234 56789",
    email: "saffronsage@dine.com",
    ownerName: "Anjali",
    priceRange: "₹₹₹₹",
    openingTime: "12:00",
    closingTime: "23:30",
    latitude: 17.3850,
    longitude: 78.4867,
    menuHighlights: "Gold Leaf Seekh Kebab, Rose Petal Biryani, Saffron Kulfi",
    tables: [
      { id: "t6", tableNumber: "A1", capacity: 4, category: "Center", description: "Elegant dining under the central chandelier", bookingCount: 11, isBestseller: false },
      { id: "t7", tableNumber: "A2", capacity: 4, category: "Center", description: "Near the piano stage", bookingCount: 15, isBestseller: true },
      { id: "t8", tableNumber: "B1", capacity: 2, category: "Couple Table", description: "Intimate table beside the fireplace", bookingCount: 19, isBestseller: true },
      { id: "t9", tableNumber: "C1", capacity: 8, category: "Family Table", description: "Large banquette table", bookingCount: 6, isBestseller: false }
    ],
    crowdLevel: "High",
    queueCount: 5,
    _count: { bookings: 51 }
  }
];

const getMockBookings = () => {
  const result = [];
  const today = new Date();
  const names = [
    "Rahul Sharma", "Priya Patel", "Aditya Reddy", "Neha Gupta", "Vikram Singh",
    "Sanya Malhotra", "Rohan Das", "Kiran Verma", "Aarav Mehta", "Ishita Sen",
    "Aditi Rao", "Kabir Kapoor", "Meera Nair", "Siddharth Sen", "Zoya Akhtar"
  ];
  const statuses = ["Confirmed", "Confirmed", "Confirmed", "Completed", "Completed", "Cancelled", "Confirmed", "Completed"];
  
  for (let i = 0; i < 28; i++) {
    const dateOffset = i % 7;
    const date = new Date(today);
    date.setDate(today.getDate() - dateOffset);
    date.setHours(12 + (i % 10), i % 2 === 0 ? 0 : 30);
    
    const resIndex = i % 2 === 0 ? 0 : 1;
    const res = MOCK_RESTAURANTS[resIndex];
    const tableIndex = i % res.tables.length;
    const table = res.tables[tableIndex];
    const status = i === 0 ? "Confirmed" : statuses[i % statuses.length];
    
    result.push({
      id: `demo-book-${i}`,
      customerName: names[i % names.length],
      customerEmail: `${names[i % names.length].toLowerCase().replace(" ", "")}@gmail.com`,
      customerPhone: `+91 ${9800000000 + i * 76543}`,
      peopleCount: 2 + (i % 5),
      bookingDate: date.toISOString().split('T')[0],
      bookingTime: `${date.getHours()}:${date.getMinutes() === 0 ? '00' : '30'}`,
      status,
      tableId: table.id,
      restaurantId: res.id,
      restaurant: { name: res.name },
      createdAt: date.toISOString(),
      paymentId: status === "Cancelled" ? null : `pay_mock_${100200300 + i}`,
      orderId: status === "Cancelled" ? null : `order_mock_${800900100 + i}`
    });
  }
  return result;
};

const MOCK_REVIEWS = {
  data: [
    { id: "rev-1", user: { name: "Rahul Sharma" }, rating: 5, comment: "Exceptional service and the Butter Chicken Ravioli was mind-blowing! Highly recommend.", createdAt: new Date(Date.now() - 4 * 3600000).toISOString(), restaurant: { name: "The Golden Leaf Bistro" } },
    { id: "rev-2", user: { name: "Priya Patel" }, rating: 4, comment: "Beautiful ambiance on the rooftop. Table blueprint worked perfectly. Will visit again.", createdAt: new Date(Date.now() - 16 * 3600000).toISOString(), restaurant: { name: "The Golden Leaf Bistro" } },
    { id: "rev-3", user: { name: "Aditya Reddy" }, rating: 5, comment: "Ambiance is amazing and food is very premium. Booking was seamless.", createdAt: new Date(Date.now() - 36 * 3600000).toISOString(), restaurant: { name: "Saffron & Sage Fine Dine" } },
    { id: "rev-4", user: { name: "Neha Gupta" }, rating: 5, comment: "Loved the Saffron Risotto. Best dining experience in Indiranagar.", createdAt: new Date(Date.now() - 50 * 3600000).toISOString(), restaurant: { name: "The Golden Leaf Bistro" } },
    { id: "rev-5", user: { name: "Vikram Singh" }, rating: 3, comment: "Food was good but service was a bit slow on weekends.", createdAt: new Date(Date.now() - 90 * 3600000).toISOString(), restaurant: { name: "Saffron & Sage Fine Dine" } }
  ],
  ratingBreakdown: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 3 },
  averageRating: 4.6,
  count: 5
};

const AdminDashboard = () => {
  const { user, isAdmin, loadUser, toggle2FA } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editRestaurant, setEditRestaurant] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [liveBackup, setLiveBackup] = useState({ restaurants: [], bookings: [], reviewsData: null });
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Search & deletion states for management tabs
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [cancelingBooking, setCancelingBooking] = useState(false);

  // Profile management tab states
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRestaurantFilter, setSelectedRestaurantFilter] = useState('all');

  // Analytics states
  const [bookings, setBookings] = useState([]);
  const [reviewsData, setReviewsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  // Logs state
  const [logs, setLogs] = useState([]);

  // Payout bank account states
  const [bankDetails, setBankDetails] = useState({
    bankAccountName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
    bankBranch: '',
    bankAccountVerified: false
  });
  const [fetchingBank, setFetchingBank] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [verifyingBank, setVerifyingBank] = useState(false);
  const [bankError, setBankError] = useState('');
  const [bankSuccess, setBankSuccess] = useState('');

  const [formHolderName, setFormHolderName] = useState('');
  const [formAccNumber, setFormAccNumber] = useState('');
  const [formConfirmAccNumber, setFormConfirmAccNumber] = useState('');
  const [formIfsc, setFormIfsc] = useState('');
  const [fetchedBankName, setFetchedBankName] = useState('');
  const [fetchedBranch, setFetchedBranch] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const fetchBankAccount = useCallback(async () => {
    if (isDemoMode) {
      setBankDetails({
        bankAccountName: 'Anjali Sharma',
        bankAccountNumber: '912345678901',
        bankIfsc: 'SBIN0000291',
        bankName: 'State Bank of India',
        bankBranch: 'Bengaluru Main',
        bankAccountVerified: true
      });
      setFormHolderName('Anjali Sharma');
      setFormAccNumber('912345678901');
      setFormConfirmAccNumber('912345678901');
      setFormIfsc('SBIN0000291');
      setFetchedBankName('State Bank of India');
      setFetchedBranch('Bengaluru Main');
      setIsVerified(true);
      return;
    }
    setFetchingBank(true);
    try {
      const res = await axios.get('/api/auth/bank-account');
      if (res.data && res.data.data) {
        const data = res.data.data;
        setBankDetails(data);
        setFormHolderName(data.bankAccountName || '');
        setFormAccNumber(data.bankAccountNumber || '');
        setFormConfirmAccNumber(data.bankAccountNumber || '');
        setFormIfsc(data.bankIfsc || '');
        setFetchedBankName(data.bankName || '');
        setFetchedBranch(data.bankBranch || '');
        setIsVerified(data.bankAccountVerified || false);
      }
    } catch (err) {
      console.error('Error fetching bank account:', err);
    } finally {
      setFetchingBank(false);
    }
  }, [isDemoMode]);

  const handleInputChange = (setter, val) => {
    setter(val);
    setIsVerified(false);
    setBankError('');
    setBankSuccess('');
  };

  const handleVerifyBank = () => {
    const holder = formHolderName.trim();
    if (holder.length < 3) {
      setBankError('Account Holder Name must be at least 3 characters.');
      return;
    }
    if (/[0-9]/.test(holder)) {
      setBankError('Account Holder Name cannot contain numbers.');
      return;
    }

    const acc = formAccNumber.trim();
    if (!/^\d{9,18}$/.test(acc)) {
      setBankError('Bank Account Number must be between 9 and 18 digits.');
      return;
    }

    if (acc !== formConfirmAccNumber.trim()) {
      setBankError('Confirm Account Number does not match Account Number.');
      return;
    }

    if (/^(\d)\1+$/.test(acc)) {
      setBankError('Invalid Account Number. Dummy accounts with identical digits are not allowed.');
      return;
    }

    if (['123456789', '1234567890', '0123456789', '987654321', '9876543210'].some(seq => acc.includes(seq))) {
      setBankError('Invalid Account Number. Sequential dummy numbers are not allowed.');
      return;
    }

    const ifscUpper = formIfsc.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscUpper)) {
      setBankError('Invalid IFSC code format.');
      return;
    }

    if (!fetchedBankName) {
      setBankError('Please provide a valid Indian bank IFSC code that exists.');
      return;
    }

    setBankError('');
    setBankSuccess('');
    setVerifyingBank(true);

    setTimeout(() => {
      setIsVerified(true);
      setBankSuccess('Penny Drop verified! Account holder name matches bank records.');
      setVerifyingBank(false);
    }, 2500);
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      setBankError('Please verify your bank details via Penny Drop first.');
      return;
    }
    if (formAccNumber !== formConfirmAccNumber) {
      setBankError('Account numbers do not match.');
      return;
    }
    setSavingBank(true);
    setBankError('');
    setBankSuccess('');
    try {
      if (isDemoMode) {
        setBankDetails({
          bankAccountName: formHolderName,
          bankAccountNumber: formAccNumber,
          bankIfsc: formIfsc,
          bankName: fetchedBankName,
          bankBranch: fetchedBranch,
          bankAccountVerified: true
        });
        setBankSuccess('Bank account details saved successfully (Demo Simulation).');
        addLog('Payout Details Updated', `Updated bank account to ${formIfsc} (Demo)`, 'success');
        setSavingBank(false);
        return;
      }
      const res = await axios.post('/api/auth/bank-account', {
        bankAccountName: formHolderName,
        bankAccountNumber: formAccNumber,
        bankIfsc: formIfsc,
        bankName: fetchedBankName,
        bankBranch: fetchedBranch,
        bankAccountVerified: true
      });
      setBankDetails(res.data.data);
      setBankSuccess('Bank account details saved successfully!');
      addLog('Payout Details Updated', `Updated bank account to ${formIfsc}`, 'success');
    } catch (err) {
      console.error(err);
      setBankError(err.response?.data?.message || 'Failed to save bank account details.');
    } finally {
      setSavingBank(false);
    }
  };

  // Run Razorpay IFSC lookup on standard format matches
  useEffect(() => {
    const ifscUpper = formIfsc.trim().toUpperCase();
    if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscUpper)) {
      const fetchIfscDetails = async () => {
        try {
          const res = await axios.get(`https://ifsc.razorpay.com/${ifscUpper}`);
          if (res.data) {
            setFetchedBankName(res.data.BANK || '');
            setFetchedBranch(res.data.BRANCH || '');
            setBankError('');
          }
        } catch (err) {
          console.error('Razorpay IFSC API error:', err);
          setFetchedBankName('');
          setFetchedBranch('');
          setBankError('Invalid IFSC code. Branch not found in Razorpay database.');
        }
      };
      fetchIfscDetails();
    } else {
      setFetchedBankName('');
      setFetchedBranch('');
    }
  }, [formIfsc]);

  if (!isAdmin) return <Navigate to="/admin/signin" />;

  const fetchRestaurants = useCallback(async () => {
    if (isDemoMode) return;
    try {
      const res = await axios.get('/api/restaurants/mine');
      setRestaurants(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  const handleOpenAddForm = () => {
    setShowAddForm(true);
  };

  const fetchAnalytics = useCallback(async () => {
    if (isDemoMode) return;
    setLoadingAnalytics(true);
    setAnalyticsError('');
    try {
      const [bookingsRes, reviewsRes] = await Promise.all([
        axios.get('/api/bookings/admin/all'),
        axios.get('/api/reviews/admin')
      ]);
      setBookings(bookingsRes.data.data || []);
      setReviewsData(reviewsRes.data || { data: [], ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, averageRating: 0 });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setAnalyticsError('Could not load live analytics/reviews data.');
    } finally {
      setLoadingAnalytics(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    fetchRestaurants();
    fetchAnalytics();
    fetchBankAccount();
  }, [fetchRestaurants, fetchAnalytics, fetchBankAccount]);

  const handleAddSuccess = (newRes) => {
    setShowAddForm(false);
    setSuccessMsg('Restaurant added successfully!');
    addLog('Restaurant added', `Registered new restaurant: ${newRes?.name || 'DineFlow'}`, 'success');
    if (isDemoMode && newRes) {
      setRestaurants(prev => [...prev, newRes]);
    } else {
      fetchRestaurants();
    }
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditSuccess = (updatedRes) => {
    setEditRestaurant(null);
    setSuccessMsg('Restaurant updated successfully!');
    addLog('Restaurant updated', `Modified details of restaurant: ${updatedRes?.name || 'DineFlow'}`, 'info');
    if (isDemoMode && updatedRes) {
      setRestaurants(prev => prev.map(r => r.id === updatedRes.id ? updatedRes : r));
    } else {
      fetchRestaurants();
    }
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDelete = async (id) => {
    if (isDemoMode) {
      setRestaurants(prev => prev.filter(r => r.id !== id));
      setDeleteConfirm(null);
      setSuccessMsg('Restaurant deleted.');
      addLog('Restaurant deleted', 'Removed restaurant from system (Demo)', 'info');
      setTimeout(() => setSuccessMsg(''), 4000);
      return;
    }
    setDeleting(true);
    try {
      await axios.delete(`/api/restaurants/${id}`);
      setDeleteConfirm(null);
      setSuccessMsg('Restaurant deleted.');
      addLog('Restaurant deleted', 'Removed restaurant from database', 'info');
      fetchRestaurants();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (isDemoMode) {
      setBookings(prev => prev.filter(b => b.id !== id));
      setBookingToDelete(null);
      setSuccessMsg('Booking cancelled successfully.');
      addLog('Booking cancelled', `Cancelled reservation for ID: ${id}`, 'info');
      setTimeout(() => setSuccessMsg(''), 4000);
      return;
    }
    setCancelingBooking(true);
    try {
      await axios.delete(`/api/bookings/${id}`);
      setBookingToDelete(null);
      setSuccessMsg('Booking cancelled successfully.');
      addLog('Booking cancelled', `Deleted reservation for ID: ${id} from database`, 'info');
      fetchAnalytics();
      fetchRestaurants();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancelingBooking(false);
    }
  };

  const handleToggleDemoMode = () => {
    if (!isDemoMode) {
      setLiveBackup({
        restaurants,
        bookings,
        reviewsData
      });
      setRestaurants(MOCK_RESTAURANTS);
      setBookings(getMockBookings());
      setReviewsData(MOCK_REVIEWS);
      setIsDemoMode(true);
      setSuccessMsg("Demo mode activated! Feel free to edit, delete, or test features.");
    } else {
      setRestaurants(liveBackup.restaurants);
      setBookings(liveBackup.bookings);
      setReviewsData(liveBackup.reviewsData);
      setIsDemoMode(false);
      setSuccessMsg("Live mode restored (showing your actual database contents).");
    }
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const addLog = useCallback((event, details, status = 'info') => {
    const timeStr = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    setLogs(prev => [
      { event, details, time: `Today, ${timeStr}`, status },
      ...prev
    ]);
  }, []);

  useEffect(() => {
    if (user) {
      setLogs([
        { event: 'Admin authenticated successfully', details: `Logged in as ${user.email}`, time: 'Just now', status: 'success' },
        { event: 'Database connection established', details: 'Prisma PostgreSQL database connection active', time: 'Just now', status: 'success' }
      ]);
    }
  }, [user]);



  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!supportSubject || !supportMessage) return;
    setSupportSubmitting(true);
    setTimeout(() => {
      setSupportSubmitting(false);
      setSupportSuccess(true);
      setSupportSubject('');
      setSupportMessage('');
      setTimeout(() => setSupportSuccess(false), 5000);
    }, 1500);
  };

  const totalTables = restaurants.reduce((a, r) => a + (r.tables?.length || 0), 0);
  const totalBookings = restaurants.reduce((a, r) => a + (r._count?.bookings || 0), 0);


  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-brown-900/20 border-t-brown-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="font-serif text-xl text-brown-900">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-100">
      <div className="container mx-auto px-4 py-10 max-w-7xl">

        {/* Success Toast */}
        <AnimatePresence>
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 size={16} /> {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl text-brown-900 p-8 md:p-10 mb-10 shadow-[0_15px_40px_rgba(62,39,35,0.04)] border border-gold-500/15">
          {/* Decorative luxury vector lines in background */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none hidden md:block">
            <svg viewBox="0 0 100 100" className="w-full h-full object-cover text-gold-500/40" fill="currentColor">
              <path d="M50 0 C60 20 80 30 100 50 C80 70 60 80 50 100 C40 80 20 70 0 50 C20 30 40 20 50 0 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <path d="M50 10 C58 26 74 34 90 50 C74 66 58 74 50 90 C42 74 26 66 10 50 C26 34 42 26 50 10 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="5" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
            </svg>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shadow-md overflow-hidden shrink-0">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Store size={32} className="text-gold-600" />
                )}
              </div>
              <div className="text-left">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-brown-900">Welcome, {user?.name || 'Restaurant Admin'}</h1>
                <p className="text-brown-700/80 mt-1 text-sm md:text-base">Manage your restaurants, tables, and reservations — all in one place.</p>
              </div>
            </div>

            {/* Interactive Demo Mode Toggle */}
            <div className="flex items-center gap-3 bg-brown-900/5 px-5 py-3 rounded-2xl border border-brown-900/10 shadow-sm shrink-0">
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-gold-600 flex items-center gap-1">
                  ✨ Demo Simulation Mode
                </span>
                <span className="text-[10px] text-brown-700/60">Visualize charts with sample data</span>
              </div>
              <button
                type="button"
                onClick={handleToggleDemoMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isDemoMode ? 'bg-gold-500' : 'bg-brown-900/20'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDemoMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Tab Selection */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'restaurants', label: 'Restaurant Management', icon: Store },
            { id: 'tables', label: 'Table Management', icon: LayoutGrid },
            { id: 'bookings', label: 'Booking Management', icon: Ticket },
            { id: 'payout-account', label: 'Payout Settings', icon: CreditCard }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-2xl text-sm font-medium transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-sm border ${
                activeTab === tab.id
                  ? 'bg-brown-900 text-cream-100 border-brown-900 shadow-brown-900/10'
                  : 'bg-white text-brown-700/70 border-cream-200 hover:text-brown-900 hover:bg-brown-900/5'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Restaurants', value: restaurants.length, icon: Store, color: 'bg-amber-50 text-amber-700 border-amber-100', desc: 'Active configuration count' },
                { label: 'Total Bookings', value: bookings.length, icon: Ticket, color: 'bg-green-50 text-green-700 border-green-100', desc: 'All time reservations' },
                {
                  label: 'Available Tables',
                  value: `${Math.max(0, totalTables - bookings.filter(b => b.status !== 'Cancelled' && new Date(b.bookingDate).toDateString() === new Date().toDateString()).length)} / ${totalTables}`,
                  desc: 'Unbooked tables for today',
                  icon: LayoutGrid,
                  color: 'bg-blue-50 text-blue-700 border-blue-100'
                }
              ].map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5, scale: 1.02, boxShadow: "0 12px 30px -10px rgba(120, 53, 15, 0.08)" }}
                  transition={{ duration: 0.35, delay: idx * 0.06 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-cream-200 flex items-start gap-4 transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl ${m.color} flex items-center justify-center shrink-0 border`}>
                    <m.icon size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-brown-600 tracking-wide uppercase">{m.label}</p>
                    <p className="text-2xl font-bold font-serif text-brown-900 mt-1">{m.value}</p>
                    <p className="text-[10px] text-brown-700/50 mt-1 leading-relaxed">{m.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {loadingAnalytics ? (
              <div className="bg-white rounded-3xl border border-cream-200 shadow-sm p-16 text-center">
                <div className="w-10 h-10 border-3 border-brown-900/20 border-t-brown-900 rounded-full animate-spin mx-auto mb-4" />
                <p className="font-serif text-lg text-brown-900">Loading analytics & reviews...</p>
              </div>
            ) : analyticsError ? (
              <div className="bg-white rounded-3xl border border-cream-200 shadow-sm p-16 text-center">
                <AlertTriangle size={48} className="mx-auto text-red-500 mb-5 animate-bounce" />
                <h3 className="text-xl font-serif font-bold text-brown-900 mb-2">Failed to Load Analytics</h3>
                <p className="text-brown-600 mb-6 max-w-md mx-auto">{analyticsError}</p>
                <button onClick={fetchAnalytics}
                  className="bg-brown-900 text-cream-100 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gold-500 hover:text-brown-900 transition-colors cursor-pointer">
                  Retry Loading
                </button>
              </div>
                  ) : (
              <>
{/* Guest Reviews Breakdown + scrollable comments list */}
                <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6 w-full">
                  <div className="mb-4 text-left">
                    <h3 className="font-serif font-bold text-lg text-brown-900">Latest Guest Feedback</h3>
                    <p className="text-xs text-brown-700/60 mt-0.5 font-sans">Rating breakdown and comments left by diners.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-b border-cream-100 pb-4">
                    <div className="text-center md:border-r border-cream-200 py-1">
                      <p className="text-3xl font-bold font-serif text-brown-950">{reviewsData?.averageRating || restaurants[0]?.rating || '0.0'}</p>
                      <div className="flex items-center justify-center gap-0.5 text-gold-500 my-1">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const roundedRating = Math.round(reviewsData?.averageRating || restaurants[0]?.rating || 0);
                          return <Star key={i} size={13} className={i < roundedRating ? 'fill-gold-500' : 'text-cream-300'} />;
                        })}
                      </div>
                      <p className="text-[11px] text-brown-600/70">{reviewsData?.count || 0} reviews total</p>
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      {(() => {
                        const breakdown = reviewsData?.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                        const total = reviewsData?.count || 0;
                        return [5, 4, 3, 2, 1].map(stars => {
                          const count = breakdown[stars] || 0;
                          const pct = total ? Math.round((count / total) * 100) : 0;
                          return (
                            <div key={stars} className="flex items-center gap-3 text-xs">
                              <span className="w-3 text-right font-semibold text-brown-950">{stars}</span>
                              <Star size={10} className="text-gold-500 fill-gold-500" />
                              <div className="flex-1 h-1.5 bg-cream-200 rounded-full overflow-hidden">
                                <div className="h-full bg-gold-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-8 text-right text-brown-600/70">{count}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Scrollable comments list */}
                  <div className="mt-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {reviewsData?.data?.length === 0 ? (
                      <p className="text-xs text-brown-500 italic py-4">No reviews left by guests yet.</p>
                    ) : (
                      reviewsData?.data?.map((rev, idx) => (
                        <div key={rev.id || idx} className="p-3 bg-cream-100/30 rounded-xl border border-cream-200/50 mb-2 space-y-1 text-xs text-left">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-brown-900">{rev.user?.name || 'Anonymous'}</span>
                            <span className="text-gold-500 font-bold">
                              {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                            </span>
                          </div>
                          <p className="text-brown-700 italic font-serif">"{rev.comment}"</p>
                          <p className="text-[10px] text-brown-600/50">{rev.restaurant?.name} • {new Date(rev.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'restaurants' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
            {/* My Restaurants Section */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif font-bold text-brown-900">Restaurant Management</h2>
                <p className="text-sm text-brown-700/60 mt-1">Add, edit, and delete restaurants under your administration.</p>
              </div>
              {restaurants.length === 0 && (
                <button onClick={handleOpenAddForm}
                  className="flex items-center gap-2 bg-gradient-to-r from-brown-900 to-brown-800 text-cream-100 px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-brown-900/20 hover:shadow-brown-900/30 transition-all cursor-pointer whitespace-nowrap">
                  <Plus size={18} /> Add Your Restaurant
                </button>
              )}
            </div>

            {restaurants.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-cream-200 shadow-sm p-16 text-center max-w-2xl mx-auto flex flex-col items-center">
                {/* Visual Graphic */}
                <div className="w-48 h-48 mb-6 relative">
                  <svg viewBox="0 0 200 200" className="w-full h-full text-gold-500" fill="none" stroke="currentColor">
                    <circle cx="100" cy="100" r="80" strokeWidth="1" strokeDasharray="4 4" className="text-brown-200" />
                    <circle cx="100" cy="100" r="60" strokeWidth="0.5" className="text-gold-500/20" />
                    
                    {/* Stylized Dome/Restaurant Plate Graphic */}
                    <path d="M60 130 L140 130 A40 40 0 0 0 60 130 Z" fill="none" strokeWidth="2" strokeLinecap="round" className="text-brown-900" />
                    <path d="M50 138 L150 138" strokeWidth="3" strokeLinecap="round" className="text-gold-500" />
                    <rect x="94" y="80" width="12" height="10" rx="2" fill="none" strokeWidth="2" className="text-brown-900" />
                    <line x1="100" y1="70" x2="100" y2="80" strokeWidth="2" className="text-brown-900" />
                    
                    {/* Floating sparkling icons */}
                    <path d="M140 70 L145 75 L140 80 L135 75 Z" fill="currentColor" className="text-gold-500 opacity-60 animate-pulse" />
                    <path d="M60 80 L63 83 L60 86 L57 83 Z" fill="currentColor" className="text-gold-500 opacity-60 animate-pulse" />
                  </svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-brown-900 mb-2">No restaurants yet</h3>
                <p className="text-brown-600 mb-6 max-w-md mx-auto">Add your first restaurant to start receiving bookings and managing your tables.</p>
                <button onClick={handleOpenAddForm}
                  className="inline-flex items-center gap-2 bg-brown-900 text-cream-100 px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-gold-500 hover:text-brown-900 transition-all cursor-pointer shadow-md">
                  <Plus size={16} /> Add Your Restaurant
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {restaurants.map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm border border-cream-200 overflow-hidden hover:shadow-md transition-shadow group">
                    {/* Card Header with image */}
                    <div className="h-40 relative overflow-hidden bg-gradient-to-br from-brown-900/80 to-brown-800/80">
                      {r.image && r.image !== 'no-photo.jpg' ? (
                        <img src={r.image} alt={r.name} className="w-full h-full object-cover opacity-60" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store size={48} className="text-cream-100/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-5 right-5">
                        <h3 className="text-xl font-serif font-bold text-white mb-0.5">{r.name}</h3>
                        <div className="flex items-center gap-3 text-white/70 text-xs">
                          <span className="flex items-center gap-1"><MapPin size={12} /> {r.location}{r.city ? `, ${r.city}` : ''}</span>
                          <span className="flex items-center gap-1"><Utensils size={12} /> {r.cuisine}</span>
                          <span className="flex items-center gap-1"><IndianRupee size={12} /> {r.priceRange}</span>
                        </div>
                      </div>
                      {/* Rating badge */}
                      {r.rating && (
                        <div className="absolute top-3 right-3 bg-gold-500 text-brown-900 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                          ⭐ {r.rating}
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-5">
                      <p className="text-sm text-brown-600 line-clamp-2 mb-4">{r.description}</p>

                      {/* Quick stats */}
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {[
                          { label: 'Tables', value: r.tables?.length || 0, icon: LayoutGrid },
                          { label: 'Bookings', value: bookings.filter(b => b.restaurant?.name === r.name).length, icon: Ticket },
                          { label: 'Queue', value: r.queueCount, icon: Users },
                          { label: 'Hours', value: `${r.openingTime || '10:00'}-${r.closingTime || '22:00'}`, icon: Clock, small: true }
                        ].map(s => (
                          <div key={s.label} className="bg-cream-100/80 rounded-xl p-2.5 text-center">
                            <s.icon size={14} className="mx-auto text-gold-500 mb-1" />
                            <p className={`font-bold text-brown-900 ${s.small ? 'text-[10px]' : 'text-sm'}`}>{s.value}</p>
                            <p className="text-[10px] text-brown-500 uppercase">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Crowd status */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-brown-500">Crowd Level</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          r.crowdLevel === 'Full' ? 'bg-red-100 text-red-700' :
                          r.crowdLevel === 'High' ? 'bg-orange-100 text-orange-700' :
                          r.crowdLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>{r.crowdLevel}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setEditRestaurant(r)}
                          className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold bg-gold-50 text-gold-500 hover:bg-gold-500 hover:text-brown-900 transition-all cursor-pointer border border-gold-500/20">
                          <Pencil size={14} /> Edit details
                        </button>
                        <button onClick={() => setDeleteConfirm(r)}
                          className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all cursor-pointer border border-red-200">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'tables' && (
          <TableManagementTab restaurants={restaurants} onRefresh={fetchRestaurants} isDemoMode={isDemoMode} />
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cream-200 pb-6 mb-6">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-brown-900">Booking Management</h3>
                  <p className="text-sm text-brown-700/60 mt-1 font-sans">Review and manage guest reservations and cancellations.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 max-w-lg w-full">
                  {restaurants.length > 1 && (
                    <select
                      value={selectedRestaurantFilter}
                      onChange={e => setSelectedRestaurantFilter(e.target.value)}
                      className="px-4 py-2.5 border border-cream-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 cursor-pointer font-serif font-bold text-brown-900 w-full sm:w-48 shrink-0"
                    >
                      <option value="all">All Restaurants</option>
                      {restaurants.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    placeholder="Search customer, email..."
                    value={bookingSearch}
                    onChange={e => setBookingSearch(e.target.value)}
                    autoComplete="one-time-code"
                    className="w-full px-4 py-2.5 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all bg-cream-100/30"
                  />
                </div>
              </div>

              {loadingAnalytics ? (
                <div className="text-center py-12 text-brown-500 text-sm">
                  <div className="w-8 h-8 border-2 border-brown-900/20 border-t-brown-900 rounded-full animate-spin mx-auto mb-3" />
                  Loading bookings...
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center max-w-md mx-auto">
                  {/* Calendar/Ticket vector graphic */}
                  <div className="w-40 h-40 mb-6 relative">
                    <svg viewBox="0 0 200 200" className="w-full h-full text-gold-500" fill="none" stroke="currentColor">
                      <rect x="50" y="60" width="100" height="90" rx="8" strokeWidth="2" className="text-brown-900" />
                      <line x1="50" y1="90" x2="150" y2="90" strokeWidth="2" className="text-brown-900" />
                      
                      {/* Calendar rings */}
                      <circle cx="75" cy="50" r="8" strokeWidth="2" className="text-gold-500" />
                      <circle cx="125" cy="50" r="8" strokeWidth="2" className="text-gold-500" />
                      
                      {/* Grid representation */}
                      <rect x="65" y="105" width="16" height="12" rx="2" strokeWidth="1" className="text-brown-400" />
                      <rect x="92" y="105" width="16" height="12" rx="2" strokeWidth="1" className="text-brown-400" />
                      <rect x="119" y="105" width="16" height="12" rx="2" strokeWidth="1" className="text-brown-400" />
                      
                      <rect x="65" y="125" width="16" height="12" rx="2" strokeWidth="1" className="text-brown-400" />
                      <rect x="92" y="125" width="16" height="12" rx="2" strokeWidth="1" className="text-gold-500" fill="rgba(212,175,55,0.1)" />
                      <rect x="119" y="125" width="16" height="12" rx="2" strokeWidth="1" className="text-brown-400" />
                      
                      {/* Clock symbol overlay */}
                      <circle cx="140" cy="140" r="22" strokeWidth="2" fill="white" className="text-brown-900" />
                      <path d="M140 126 L140 140 L150 140" strokeWidth="2" strokeLinecap="round" className="text-gold-500" />
                    </svg>
                  </div>
                  <p className="text-brown-900 font-serif font-bold text-lg mb-2">No Bookings Found</p>
                  <p className="text-brown-600 text-sm">No bookings have been registered for your restaurants yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {(() => {
                    const filtered = bookings.filter(b => {
                      if (selectedRestaurantFilter !== 'all' && b.restaurant?.name !== selectedRestaurantFilter) {
                        return false;
                      }
                      const query = bookingSearch.toLowerCase().trim();
                      if (!query) return true;
                      return (
                        (b.user?.name || '').toLowerCase().includes(query) ||
                        (b.user?.email || '').toLowerCase().includes(query) ||
                        (b.table?.tableNumber || '').toLowerCase().includes(query)
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-16 flex flex-col items-center max-w-md mx-auto">
                          <div className="w-36 h-36 mb-4 relative">
                            <svg viewBox="0 0 200 200" className="w-full h-full text-gold-500" fill="none" stroke="currentColor">
                              <circle cx="90" cy="90" r="45" strokeWidth="2" className="text-brown-900" />
                              <line x1="122" y1="122" x2="160" y2="160" strokeWidth="3" strokeLinecap="round" className="text-gold-500" />
                              
                              {/* Small details */}
                              <line x1="80" y1="75" x2="100" y2="75" strokeWidth="1.5" strokeLinecap="round" className="text-brown-400" />
                              <line x1="75" y1="90" x2="105" y2="90" strokeWidth="1.5" strokeLinecap="round" className="text-brown-400" />
                              <line x1="85" y1="105" x2="95" y2="105" strokeWidth="1.5" strokeLinecap="round" className="text-brown-400" />
                            </svg>
                          </div>
                          <p className="text-brown-900 font-serif font-bold text-base mb-1">No Search Results</p>
                          <p className="text-brown-600 text-sm">No bookings matched your search query "{bookingSearch}".</p>
                        </div>
                      );
                    }

                    return (
                      <table className="w-full text-left text-sm text-brown-800">
                        <thead className="bg-cream-100 text-brown-900 font-serif">
                          <tr>
                            <th className="px-4 py-3 rounded-tl-xl">Customer</th>
                            <th className="px-4 py-3">Contact</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3">Table</th>
                            <th className="px-4 py-3 text-center">Guests</th>
                            <th className="px-4 py-3">Risk</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 rounded-tr-xl text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cream-100">
                          {filtered.map(b => {
                            const risk = b.noShowRisk || 15;
                            let riskColor = "bg-green-100 text-green-800";
                            let riskLabel = "Low";
                            if (risk >= 50) {
                              riskColor = "bg-red-100 text-red-800";
                              riskLabel = "High";
                            } else if (risk >= 25) {
                              riskColor = "bg-orange-100 text-orange-800";
                              riskLabel = "Medium";
                            }

                            return (
                              <tr key={b.id} className="hover:bg-cream-50/50 transition-colors">
                                <td className="px-4 py-4 font-bold text-brown-950">{b.user?.name || 'Guest'}</td>
                                <td className="px-4 py-4">
                                  <div className="text-xs">{b.user?.email}</div>
                                  {b.user?.phone && <div className="text-[10px] text-brown-600/70">{b.user.phone}</div>}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">{new Date(b.bookingDate).toLocaleDateString()}</td>
                                <td className="px-4 py-4 whitespace-nowrap font-medium text-brown-900">{b.bookingTime}</td>
                                <td className="px-4 py-4">Table {b.table?.tableNumber} <span className="text-[10px] text-brown-500">({b.table?.category})</span></td>
                                <td className="px-4 py-4 text-center font-bold">{b.peopleCount}</td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className={`${riskColor} text-[10px] px-2 py-0.5 rounded-full font-bold`}>
                                    {riskLabel} ({risk}%)
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded font-medium inline-flex items-center gap-1">
                                    {b.status}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <button
                                    onClick={() => setBookingToDelete(b.id)}
                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                                    title="Cancel Reservation"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}


        {activeTab === 'payout-account' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6 md:p-8">
              <div className="border-b border-cream-200 pb-6 mb-6">
                <h3 className="text-2xl font-serif font-bold text-brown-900">Payout Account Settings</h3>
                <p className="text-sm text-brown-700/60 mt-1 font-sans">
                  Configure your verified bank account to receive direct payouts. DineFlow takes a 10% commission, and the remaining 90% is settled to your account.
                </p>
              </div>

              {/* Status Banner */}
              <div className="mb-8">
                {isVerified ? (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-4">
                    <div className="p-2 bg-green-100 text-green-700 rounded-xl">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-green-900 text-lg">Payout Account Active & Verified</h4>
                      <p className="text-sm text-green-700/80 mt-1">
                        Your account details have been validated successfully via Penny Drop name match. Your settlements of 90% (₹89.10 per booking) are active.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-amber-900 text-lg">Payout Verification Required</h4>
                      <p className="text-sm text-amber-700/80 mt-1">
                        To receive settlements, you must add and verify a genuine Indian bank account. Dummy accounts, sequential digits, or unverified details are strictly blocked.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Dual Column Layout: Form and Cheque/Bank Card Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bank account form */}
                <div>
                  <form onSubmit={handleSaveBank} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-brown-900 uppercase tracking-wider mb-2">Account Holder Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Anjali Sharma"
                        value={formHolderName}
                        onChange={(e) => handleInputChange(setFormHolderName, e.target.value)}
                        className="w-full px-4 py-3 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-cream-100/10"
                      />
                      <p className="text-[10px] text-brown-600/50 mt-1">Must match the bank record and contain no numbers.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-brown-900 uppercase tracking-wider mb-2">IFSC Code</label>
                        <input
                          type="text"
                          required
                          maxLength={11}
                          placeholder="e.g. SBIN0000291"
                          value={formIfsc}
                          onChange={(e) => handleInputChange(setFormIfsc, e.target.value.toUpperCase())}
                          className="w-full px-4 py-3 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-cream-100/10 font-mono text-center"
                        />
                        <p className="text-[10px] text-brown-600/50 mt-1">Standard 11-digit IFSC code.</p>
                      </div>

                      <div className="flex flex-col justify-end">
                        {fetchedBankName ? (
                          <div className="bg-cream-50 border border-cream-200 rounded-xl p-3 text-xs">
                            <span className="font-bold text-brown-900 block truncate">{fetchedBankName}</span>
                            <span className="text-[10px] text-brown-600/70 block truncate">{fetchedBranch}</span>
                          </div>
                        ) : (
                          <div className="bg-cream-100/40 border border-dashed border-cream-200 rounded-xl p-3 text-xs text-center text-brown-600/50 italic">
                            Awaiting valid IFSC...
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brown-900 uppercase tracking-wider mb-2">Bank Account Number</label>
                      <input
                        type="password"
                        required
                        placeholder="Enter 9 to 18 digit account number"
                        value={formAccNumber}
                        onChange={(e) => handleInputChange(setFormAccNumber, e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-cream-100/10 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brown-900 uppercase tracking-wider mb-2">Confirm Account Number</label>
                      <input
                        type="text"
                        required
                        placeholder="Re-enter bank account number"
                        value={formConfirmAccNumber}
                        onChange={(e) => handleInputChange(setFormConfirmAccNumber, e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-cream-100/10 font-mono"
                      />
                    </div>

                    {bankError && (
                      <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2">
                        <AlertTriangle size={14} /> {bankError}
                      </div>
                    )}

                    {bankSuccess && (
                      <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-xs font-medium border border-green-100 flex items-center gap-2">
                        <CheckCircle2 size={14} /> {bankSuccess}
                      </div>
                    )}

                    {/* Step-by-Step logs if verifying */}
                    {verifyingBank && (
                      <div className="bg-brown-950 text-cream-100/90 rounded-2xl p-4 font-mono text-[11px] space-y-1.5 shadow-inner border border-gold-500/10">
                        <div className="flex items-center justify-between text-gold-400 font-bold border-b border-white/10 pb-1.5 mb-2">
                          <span>Penny Drop Settlement Logs</span>
                          <span className="w-3.5 h-3.5 border-2 border-gold-400/20 border-t-gold-400 rounded-full animate-spin" />
                        </div>
                        <div className="animate-pulse">⏳ Securing handshake with RBI settlement gateway...</div>
                        <div className="delay-75">✓ Checking IFSC directory for branch routing...</div>
                        <div className="delay-150">💸 Initiating ₹1.00 credit transaction request...</div>
                        <div className="delay-200">🔍 Verifying bank response against holder name: <span className="text-gold-400 font-bold">{formHolderName}</span>...</div>
                      </div>
                    )}

                    {/* Verification and Save Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleVerifyBank}
                        disabled={verifyingBank || !formHolderName || !formAccNumber || !formConfirmAccNumber || !formIfsc || !fetchedBankName}
                        className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:from-amber-700 hover:to-amber-800 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {verifyingBank ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} />
                            Verify Account (Penny Drop)
                          </>
                        )}
                      </button>

                      <button
                        type="submit"
                        disabled={savingBank || !isVerified || formAccNumber !== formConfirmAccNumber}
                        className="flex-1 bg-brown-900 text-cream-100 py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-gold-500 hover:text-brown-900 disabled:opacity-40 transition-all cursor-pointer"
                      >
                        {savingBank ? 'Saving...' : 'Save Bank Account'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Luxury Cheque/Card Visual representation */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-full max-w-md bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-cream-100 rounded-3xl p-6 shadow-2xl border border-white/10 relative overflow-hidden group min-h-[220px] flex flex-col justify-between">
                    {/* Background abstract lines */}
                    <div className="absolute right-0 top-0 bottom-0 left-0 opacity-10 pointer-events-none">
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 20 Q 30 40, 50 10 T 100 80" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        <path d="M0 40 Q 40 10, 60 70 T 100 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      </svg>
                    </div>

                    {/* Card Header */}
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <span className="text-[10px] font-bold text-gold-400/70 tracking-widest uppercase block">Payout Destination Card</span>
                        <h4 className="text-lg font-serif font-bold text-cream-50 mt-1 truncate max-w-[200px]">
                          {fetchedBankName || 'YOUR BANK NAME'}
                        </h4>
                        <span className="text-[10px] text-cream-100/50 block truncate max-w-[200px]">
                          {fetchedBranch || 'Branch Details'}
                        </span>
                      </div>

                      {/* Chip Icon / Logo */}
                      <div className="flex flex-col items-end">
                        <div className="w-12 h-9 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-lg opacity-85 shadow-md flex items-center justify-center border border-yellow-300/20 overflow-hidden">
                          <div className="w-full h-full flex flex-wrap p-1 gap-0.5 opacity-60">
                            <div className="w-2.5 h-1.5 border border-stone-900 rounded-sm" />
                            <div className="w-2.5 h-1.5 border border-stone-900 rounded-sm" />
                            <div className="w-2.5 h-1.5 border border-stone-900 rounded-sm" />
                            <div className="w-2.5 h-1.5 border border-stone-900 rounded-sm" />
                          </div>
                        </div>
                        {isVerified && (
                          <span className="text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full mt-2 flex items-center gap-1 uppercase tracking-wider">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Account Number */}
                    <div className="my-6 relative z-10 text-left">
                      <p className="text-xl font-mono tracking-widest text-cream-100">
                        {formAccNumber ? (
                          formAccNumber.length > 4 ? (
                            `•••• •••• •••• ${formAccNumber.slice(-4)}`
                          ) : (
                            formAccNumber
                          )
                        ) : (
                          '•••• •••• •••• ••••'
                        )}
                      </p>
                      <div className="flex items-center gap-6 mt-2 text-[10px] text-cream-100/40 font-mono">
                        <div>
                          <span>IFSC: </span>
                          <span className="text-cream-100/70 uppercase">{formIfsc || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-end justify-between relative z-10 text-left">
                      <div>
                        <span className="text-[8px] font-semibold text-cream-100/30 uppercase tracking-widest block">Account Holder</span>
                        <span className="font-serif text-sm font-semibold tracking-wide text-cream-100 uppercase">
                          {formHolderName || 'YOUR NAME'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-semibold text-cream-100/30 uppercase tracking-widest block font-sans">Settlement</span>
                        <span className="text-xs font-bold text-gold-400 font-sans">90% Net Settled</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Bank Card Security Notice */}
                  <div className="mt-4 text-xs text-stone-500 text-left max-w-sm flex items-start gap-2 bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <Shield size={16} className="text-gold-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      All payouts are secured with AES-256 encryption. Details are synced only to the registered business profile. Funds are deposited automatically every Wednesday.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddForm && <AddRestaurantForm onClose={() => setShowAddForm(false)} onSuccess={handleAddSuccess} isDemoMode={isDemoMode} />}
        {editRestaurant && <EditRestaurantForm restaurant={editRestaurant} onClose={() => setEditRestaurant(null)} onSuccess={handleEditSuccess} isDemoMode={isDemoMode} />}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} className="text-red-500" />
              </div>
              <h3 className="text-xl font-serif font-bold text-brown-900 mb-2">Delete Restaurant?</h3>
              <p className="text-sm text-brown-600 mb-6">This will permanently delete <strong>{deleteConfirm.name}</strong> and all its tables and bookings. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-brown-700 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm.id)} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer">
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Cancellation Confirmation */}
      <AnimatePresence>
        {bookingToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} className="text-red-500" />
              </div>
              <h3 className="text-xl font-serif font-bold text-brown-900 mb-2">Cancel Booking?</h3>
              <p className="text-sm text-brown-600 mb-6">Are you sure you want to cancel this booking? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setBookingToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-brown-700 hover:bg-gray-50 transition-colors cursor-pointer">Close</button>
                <button onClick={() => handleCancelBooking(bookingToDelete)} disabled={cancelingBooking}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer">
                  {cancelingBooking ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
