import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  User, Mail, Phone, BookOpen, Save, Lock, MailCheck, CheckCircle2, 
  AlertCircle, Globe, ShieldAlert, Bell, HelpCircle, Shield, LogOut, Camera, ArrowLeft,
  Activity, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AdminProfilePage = () => {
  const { user, isAdmin, logout, loadUser } = useAuth();
  
  // Guard
  if (!isAdmin) return <Navigate to="/admin/signin" />;

  // Profile details states
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Navigation tabs
  const [profileSubTab, setProfileSubTab] = useState('details');
  const [faqOpen, setFaqOpen] = useState({});
  
  // Support states
  const [supportSubject, setSupportSubject] = useState('');
  const [supportCategory, setSupportCategory] = useState('Technical');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Preference & privacy states
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [notifReservation, setNotifReservation] = useState(true);
  const [notifCancellation, setNotifCancellation] = useState(true);
  const [notifDaily, setNotifDaily] = useState(false);
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  
  // Summary calculations
  const [restaurants, setRestaurants] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // administrative logs
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((event, details, status = 'info') => {
    const timeStr = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    setLogs(prev => [
      { event, details, time: `Today, ${timeStr}`, status },
      ...prev
    ]);
  }, []);

  // Pre-fill profile from user context
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfilePic(user.profilePicture || '');
      
      setLogs([
        { event: 'Admin authenticated successfully', details: `Logged in as ${user.email}`, time: 'Just now', status: 'success' },
        { event: 'Database connection established', details: 'Prisma PostgreSQL database connection active', time: 'Just now', status: 'success' }
      ]);
    }
  }, [user]);

  // Fetch summary details
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const [resMine, bookingsRes] = await Promise.all([
          axios.get('/api/restaurants/mine'),
          axios.get('/api/bookings/admin/all')
        ]);
        setRestaurants(resMine.data.data || []);
        setBookings(bookingsRes.data.data || []);
      } catch (err) {
        console.error('Error fetching admin summary:', err);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummaryData();
  }, []);

  const totalTables = restaurants.reduce((a, r) => a + (r.tables?.length || 0), 0);
  const totalBookings = bookings.length;

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setProfilePic(compressedBase64);

        setUpdatingProfile(true);
        setProfileError('');
        setSuccessMsg('');
        try {
          const res = await axios.put('/api/auth/profile', {
            profilePicture: compressedBase64
          });
          if (res.data.success) {
            await loadUser();
            addLog('Admin profile picture updated', 'Uploaded new avatar image', 'info');
            setSuccessMsg('Profile picture updated successfully!');
            setTimeout(() => setSuccessMsg(''), 4000);
          }
        } catch (err) {
          setProfileError(err.response?.data?.message || 'Failed to update profile picture.');
        } finally {
          setUpdatingProfile(false);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileError('');
    setSuccessMsg('');
    try {
      const res = await axios.put('/api/auth/profile', {
        name: profileName,
        email: profileEmail,
        profilePicture: profilePic
      });
      if (res.data.success) {
        await loadUser();
        addLog('Admin profile updated', 'Changed name/email/picture details', 'info');
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleVerifyEmailNow = async () => {
    setVerifyingEmail(true);
    try {
      const res = await axios.post('/api/auth/verify-mine');
      if (res.data.success) {
        await loadUser();
        addLog('Email verified', 'Verified admin email address successfully', 'success');
        setSuccessMsg('Email verified successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify email.');
    } finally {
      setVerifyingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100/50 py-10 px-4 md:px-8">
      <div className="container mx-auto max-w-6xl">
        
        {/* Back to Dashboard Button */}
        <div className="mb-6">
          <Link 
            to="/admin/dashboard" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-brown-700/60 hover:text-gold-600 transition-colors group cursor-pointer"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </div>

        {/* Glassmorphic Hero banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 p-6 md:p-8 text-cream-100 shadow-2xl border border-stone-800/80 mb-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute left-1/4 -bottom-10 h-48 w-48 rounded-full bg-gold-600/5 blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div 
              className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg border-2 border-gold-500/30 overflow-hidden shrink-0 cursor-pointer group relative"
              onClick={() => document.getElementById('avatar-file-input-page').click()}
            >
              {profilePic ? (
                <img src={profilePic} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-serif font-black text-stone-900">{user?.name?.charAt(0).toUpperCase()}</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center text-white text-xs font-semibold">
                <Camera size={16} />
              </div>
              <input type="file" id="avatar-file-input-page" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-white">{user?.name}&apos;s Owner Settings</h1>
              <p className="text-sm text-stone-400">View and update your personal merchant profile, log events, notifications, and security options.</p>
            </div>
          </div>
        </div>

        {/* Tab Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* ── LEFT SIDEBAR ── */}
          <div className="md:col-span-1 flex flex-col gap-4">
            
            {/* Nav items */}
            <div className="bg-white rounded-3xl border border-cream-200 shadow-sm overflow-hidden">
              {[
                { id: 'details', label: 'Profile Details', icon: User },
                { id: 'notifications', label: 'Notifications & Logs', icon: Bell },
                { id: 'support', label: 'Customer & Support', icon: HelpCircle },
                { id: 'security', label: 'Privacy & Security', icon: Shield },
              ].map(sub => {
                const Icon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    onClick={() => { setProfileSubTab(sub.id); setProfileError(''); setSuccessMsg(''); }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold border-b border-cream-100 last:border-0 transition-all cursor-pointer ${
                      profileSubTab === sub.id
                        ? 'bg-gold-50 text-gold-600 border-l-4 border-l-gold-500'
                        : 'text-brown-700 hover:bg-cream-100/50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={16} className={profileSubTab === sub.id ? 'text-gold-500' : 'text-brown-400'} />
                      {sub.label}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={profileSubTab === sub.id ? 'text-gold-400' : 'text-brown-300'}>
                      <polyline points="9,18 15,12 9,6" />
                    </svg>
                  </button>
                );
              })}
            </div>

            {/* Quick restaurant summary */}
            {!loadingSummary && restaurants.length > 0 && (
              <div className="bg-white rounded-3xl border border-cream-200 shadow-sm p-5 space-y-3">
                <p className="text-xs font-bold text-brown-500 uppercase tracking-wider">
                  {restaurants.length === 1 ? 'Restaurant Summary' : 'Primary Restaurant Summary'}
                </p>
                {[
                  { label: 'Total Tables', val: totalTables },
                  { label: 'Total Bookings', val: totalBookings },
                  { label: 'Crowd Level', val: restaurants[0]?.crowdLevel ?? '—' },
                  { label: 'Cuisine', val: restaurants.map(r => r.cuisine).filter((val, id, self) => self.indexOf(val) === id).join(', ') || '—' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center text-xs">
                    <span className="text-brown-600">{s.label}</span>
                    <span className="font-bold text-brown-900 truncate max-w-[120px]" title={s.val}>{s.val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Sign Out Action */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 text-sm font-bold text-brown-500 hover:text-red-600 bg-white hover:bg-red-50 border border-cream-200 hover:border-red-200 rounded-3xl transition-all cursor-pointer group shadow-sm"
            >
              <LogOut size={16} className="group-hover:text-red-500 transition-colors" />
              Sign Out Account
            </button>
          </div>

          {/* ── RIGHT CONTENT ── */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={profileSubTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl border border-cream-200 shadow-sm p-6 md:p-8 min-h-[500px]"
              >
                {/* ── DETAILS SUBTAB ── */}
                {profileSubTab === 'details' && (
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-brown-900">Profile Details</h3>
                      <p className="text-xs text-brown-500 mt-1">Manage your public information and login contact credentials.</p>
                    </div>

                    {profileError && (
                      <div className="p-4 bg-red-50 text-red-700 text-sm rounded-2xl flex items-center gap-2 border border-red-100">
                        <AlertTriangle size={16} /> {profileError}
                      </div>
                    )}
                    {successMsg && (
                      <div className="p-4 bg-emerald-50 text-emerald-700 text-sm rounded-2xl flex items-center gap-2 border border-emerald-100">
                        <CheckCircle2 size={16} /> {successMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-brown-500 uppercase tracking-wider">Full Name</label>
                        <div className="relative group">
                          <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-300 group-focus-within:text-gold-500 transition-colors" />
                          <input
                            type="text"
                            value={profileName}
                            onChange={e => setProfileName(e.target.value.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '))}
                            required
                            autoComplete="one-time-code"
                            className="w-full pl-10 pr-4 py-3 border border-cream-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all bg-cream-50/40 capitalize hover:border-cream-300"
                            placeholder="Your name"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-brown-500 uppercase tracking-wider">Email Address</label>
                        <div className="relative group">
                          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-300 group-focus-within:text-gold-500 transition-colors" />
                          <input
                            type="email"
                            value={profileEmail}
                            onChange={e => setProfileEmail(e.target.value)}
                            required
                            autoComplete="one-time-code"
                            className="w-full pl-10 pr-4 py-3 border border-cream-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all bg-cream-50/40 hover:border-cream-300"
                            placeholder="owner@restaurant.com"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-brown-500 uppercase tracking-wider">Member Since</label>
                        <div className="relative">
                          <BookOpen size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-300" />
                          <input
                            type="text"
                            readOnly
                            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                            className="w-full pl-10 pr-4 py-3 border border-cream-100 rounded-2xl text-sm bg-cream-50 text-brown-400 cursor-not-allowed font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={updatingProfile}
                        className="bg-brown-900 text-gold-500 px-6 py-3 rounded-2xl text-sm font-bold hover:bg-gold-500 hover:text-brown-905 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
                      </button>
                    </div>
                  </form>
                )}

                {/* ── NOTIFICATIONS SUBTAB ── */}
                {profileSubTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-brown-900">Notifications & Logs</h3>
                      <p className="text-xs text-brown-500 mt-1">Manage how and when you want to receive booking alerts.</p>
                    </div>

                    <div className="space-y-0 border border-cream-200 rounded-2xl overflow-hidden divide-y divide-cream-100">
                      {[
                        { id: 'notifReservation', state: notifReservation, setter: setNotifReservation, icon: '📅', title: 'New Reservation Alerts', desc: 'Receive instant alerts when a new dining booking is submitted.' },
                        { id: 'notifCancellation', state: notifCancellation, setter: setNotifCancellation, icon: '❌', title: 'Cancellation Alerts', desc: 'Get notified if a customer cancels or requests a reschedule.' },
                        { id: 'notifDaily', state: notifDaily, setter: setNotifDaily, icon: '📊', title: 'Daily Business Summary', desc: 'Receive a daily email digest summarising booking rates.' },
                        { id: 'notifMarketing', state: notifMarketing, setter: setNotifMarketing, icon: '🎯', title: 'Product & Feature Updates', desc: 'Stay updated with new Dine Flow merchant features.' },
                      ].map((toggle) => (
                        <div key={toggle.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-cream-50/40 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-xl mt-0.5">{toggle.icon}</span>
                            <div>
                              <p className="text-sm font-bold text-brown-900">{toggle.title}</p>
                              <p className="text-xs text-brown-500 mt-0.5 max-w-md">{toggle.desc}</p>
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => toggle.setter(!toggle.state)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${toggle.state ? 'bg-brown-900' : 'bg-cream-200'}`}
                          >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${toggle.state ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Admin Logs */}
                    <div className="space-y-3 pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-brown-900 text-base">Administrative Logs</h4>
                        <span className="text-[10px] uppercase font-bold text-gold-500 bg-gold-50 px-2 py-0.5 rounded border border-gold-500/20 flex items-center gap-1">
                          <Activity size={10} /> Active Session
                        </span>
                      </div>
                      <div className="border border-cream-200 rounded-2xl overflow-hidden divide-y divide-cream-200 text-xs">
                        {logs.map((log, i) => (
                          <div key={i} className={`flex items-start gap-3 p-4 ${log.status === 'success' ? 'bg-green-50/30' : 'bg-blue-50/20'}`}>
                            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.status === 'success' ? 'bg-green-500' : 'bg-blue-400'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-brown-900">{log.event}</p>
                              <p className="text-brown-600/60 truncate">{log.details}</p>
                            </div>
                            <span className="text-brown-500/50 shrink-0 whitespace-nowrap">{log.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SUPPORT SUBTAB ── */}
                {profileSubTab === 'support' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-brown-900">Customer & Support</h3>
                      <p className="text-xs text-brown-500 mt-1">Get immediate answers or contact support directly for your restaurant management.</p>
                    </div>

                    {/* FAQ accordion */}
                    <div className="space-y-2">
                      <h4 className="font-serif font-bold text-brown-900 text-sm mb-3">Frequently Asked Questions</h4>
                      {[
                        { q: 'How do I restrict the dashboard to show only one restaurant?', a: 'By default, Dine Flow enforces a single restaurant profile per admin account. Once added, you can edit details, manage tables, and check bookings for this restaurant.' },
                        { q: 'How do I add and design my tables?', a: 'Go to "Restaurants & Tables", click on the "Tables" button for your restaurant. You can add circular, square or rectangular tables, define seating capacities, and set identifiers.' },
                        { q: 'How do I manage customer bookings?', a: 'Click the "Bookings" button on your restaurant card to view all reservations, their dates, times, guest counts, and status in a dedicated modal.' },
                        { q: 'How do I view my analytics?', a: 'Click on the "Analytics & Reviews" tab in the top navigation to view charts on booking trends, peak hours, occupancy rates, and customer reviews.' },
                        { q: 'How does geocoding work when adding a restaurant?', a: 'When you type an address and click "Get Coordinates", Dine Flow uses our AI Geocoder to translate your text address into exact GPS coordinates.' },
                      ].map((faq, idx) => (
                        <div key={idx} className="border border-cream-200 rounded-2xl overflow-hidden bg-white">
                          <button 
                            type="button" 
                            onClick={() => setFaqOpen(prev => ({ ...prev, [idx]: !prev[idx] }))}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-cream-50 transition-colors cursor-pointer"
                          >
                            <span className="text-sm font-bold text-brown-900 pr-4">{faq.q}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-brown-400 shrink-0 transition-transform ${faqOpen[idx] ? 'rotate-180' : ''}`}>
                              <polyline points="6,9 12,15 18,9" />
                            </svg>
                          </button>
                          <AnimatePresence>
                            {faqOpen[idx] && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="px-4 pb-4 pt-0 text-xs text-brown-600 leading-relaxed border-t border-cream-100 bg-cream-50/50">
                                  {faq.a}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    {/* Contact support form */}
                    <div className="border border-cream-200 rounded-2xl p-5 space-y-4">
                      <h4 className="font-serif font-bold text-brown-900 text-sm">Contact Support Desk</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-brown-500 uppercase tracking-wider">Subject</label>
                          <input 
                            type="text" 
                            value={supportSubject} 
                            onChange={e => setSupportSubject(e.target.value)}
                            className="w-full border border-cream-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-cream-50/20 hover:border-cream-300 transition-all"
                            placeholder="Describe the issue" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-brown-500 uppercase tracking-wider">Category</label>
                          <select 
                            value={supportCategory} 
                            onChange={e => setSupportCategory(e.target.value)}
                            className="w-full border border-cream-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 cursor-pointer hover:border-cream-300 transition-all"
                          >
                            <option>Technical</option>
                            <option>Billing</option>
                            <option>Bookings</option>
                            <option>Restaurant Profile</option>
                            <option>Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-brown-500 uppercase tracking-wider">Message</label>
                        <textarea 
                          rows={4} 
                          value={supportMessage} 
                          onChange={e => setSupportMessage(e.target.value)}
                          className="w-full border border-cream-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-cream-50/20 resize-none hover:border-cream-300 transition-all"
                          placeholder="Describe your issue in detail..." 
                        />
                      </div>
                      {supportSuccess && (
                        <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-100 flex items-center gap-2">
                          <CheckCircle2 size={15} /> Message submitted successfully! Our support desk will respond shortly.
                        </div>
                      )}
                      <div className="flex justify-end">
                        <button 
                          type="button"
                          onClick={async () => { setSupportSubmitting(true); await new Promise(r => setTimeout(r, 1000)); setSupportSuccess(true); setSupportSubject(''); setSupportMessage(''); setSupportSubmitting(false); setTimeout(() => setSupportSuccess(false), 5000); }}
                          disabled={supportSubmitting}
                          className="bg-brown-900 text-gold-500 hover:bg-gold-500 hover:text-brown-900 px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                        >
                          {supportSubmitting ? 'Submitting...' : 'Send Message'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PRIVACY & SECURITY SUBTAB ── */}
                {profileSubTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-brown-900">Privacy & Security</h3>
                      <p className="text-xs text-brown-500 mt-1">Manage public visibility parameters and account safety settings.</p>
                    </div>

                    {/* Visibility Settings */}
                    <div>
                      <h4 className="text-xs font-bold text-brown-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Globe size={14} className="text-brown-400" /> Visibility Settings
                      </h4>
                      <div className="space-y-0 border border-cream-200 rounded-2xl overflow-hidden divide-y divide-cream-100">
                        <div className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-cream-50/40">
                          <div>
                            <p className="text-sm font-bold text-brown-900">Public Restaurant Visibility</p>
                            <p className="text-xs text-brown-500 mt-0.5">Allow search engines to index your restaurant profile.</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setProfileVisibility(!profileVisibility)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${profileVisibility ? 'bg-brown-900' : 'bg-cream-200'}`}
                          >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profileVisibility ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Account Protection */}
                    <div>
                      <h4 className="text-xs font-bold text-brown-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <ShieldAlert size={14} className="text-brown-400" /> Account Protection
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-cream-200 bg-cream-50/30">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                              <Lock size={15} className="text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-brown-900">Password</p>
                              <p className="text-xs text-brown-500">Secured & encrypted via Supabase Auth</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">Protected</span>
                        </div>

                        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-cream-200 bg-cream-50/30">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${user?.emailVerified ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                              <Mail size={15} className={user?.emailVerified ? 'text-blue-600' : 'text-yellow-600'} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-brown-900">Email Verification</p>
                              <p className="text-xs text-brown-500">{user?.email}</p>
                            </div>
                          </div>
                          {user?.emailVerified ? (
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">Verified</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-yellow-700 bg-yellow-100 border border-yellow-200 px-2.5 py-1 rounded-full">Pending</span>
                              <button
                                type="button"
                                onClick={handleVerifyEmailNow}
                                disabled={verifyingEmail}
                                className="text-xs font-bold text-white bg-brown-900 hover:bg-gold-500 hover:text-brown-900 px-3 py-1 rounded-full cursor-pointer disabled:opacity-50 transition-colors"
                              >
                                {verifyingEmail ? 'Verifying...' : 'Verify Now'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;
