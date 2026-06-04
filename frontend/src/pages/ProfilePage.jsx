import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  User, Mail, Phone, BookOpen, Save, Lock, MailCheck, CheckCircle2, 
  AlertCircle, Globe, ShieldAlert, Bell, HelpCircle, Shield, LogOut, Camera, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ProfilePage = () => {
  const { user, logout, loadUser } = useAuth();
  
  // Profile form state
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const avatarInputRef = useRef(null);

  // Profile sub-tabs states
  const [profileSubTab, setProfileSubTab] = useState('details');
  const [faqOpen, setFaqOpen] = useState({});
  const [supportSubject, setSupportSubject] = useState('');
  const [supportCategory, setSupportCategory] = useState('Technical');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [supportSubmitting, setSupportSubmitting] = useState(false);

  // Preference Toggles
  const [notifConfirmations, setNotifConfirmations] = useState(true);
  const [notifCoupons, setNotifCoupons] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  // Pre-fill profile form from user context
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
      setProfilePic(user.profilePicture || '');
    }
  }, [user]);

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Image = ev.target.result;
      setProfilePic(base64Image);

      setSavingProfile(true);
      setProfileError('');
      setProfileSuccess('');
      try {
        await axios.put('/api/auth/profile', {
          profilePicture: base64Image
        });
        if (loadUser) await loadUser();
        setProfileSuccess('Profile picture updated successfully!');
        setTimeout(() => setProfileSuccess(''), 4000);
      } catch (err) {
        setProfileError(err.response?.data?.message || 'Failed to update profile picture.');
      } finally {
        setSavingProfile(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      await axios.put('/api/auth/profile', {
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
        profilePicture: profilePic
      });
      if (loadUser) await loadUser();
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleVerifyEmailNow = async () => {
    setVerifyingEmail(true);
    try {
      const res = await axios.post('/api/auth/verify-mine');
      if (res.data.success) {
        if (loadUser) await loadUser();
        alert('Verification email sent! Check your inbox.');
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
            to="/restaurants" 
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
              onClick={() => avatarInputRef.current?.click()}
            >
              {profilePic ? (
                <img src={profilePic} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-serif font-black text-stone-900">{user?.name?.charAt(0).toUpperCase()}</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center text-white text-xs font-semibold">
                <Camera size={16} />
              </div>
              <input type="file" ref={avatarInputRef} accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight text-white">{user?.name}&apos;s Profile Settings</h1>
              <p className="text-sm text-stone-400">View and update your personal account information, notification alerts, and security options.</p>
            </div>
          </div>
        </div>

        {/* Tab Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* ── LEFT SIDEBAR ── */}
          <div className="md:col-span-1 flex flex-col gap-4">
            
            {/* Nav items */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              {[
                { id: 'details', label: 'Profile Details', icon: User },
                { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
                { id: 'support', label: 'Help & Support', icon: HelpCircle },
                { id: 'security', label: 'Privacy & Security', icon: Shield },
              ].map(sub => {
                const Icon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    onClick={() => { setProfileSubTab(sub.id); setProfileError(''); setProfileSuccess(''); }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold border-b border-stone-100 last:border-0 transition-all cursor-pointer ${
                      profileSubTab === sub.id
                        ? 'bg-amber-50 text-amber-600 border-l-4 border-l-amber-500'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={16} className={profileSubTab === sub.id ? 'text-amber-500' : 'text-stone-400'} />
                      {sub.label}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={profileSubTab === sub.id ? 'text-amber-400' : 'text-stone-300'}>
                      <polyline points="9,18 15,12 9,6" />
                    </svg>
                  </button>
                );
              })}
            </div>

            {/* Quick Sign Out Action */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 text-sm font-bold text-stone-500 hover:text-red-600 bg-white hover:bg-red-50 border border-stone-200 hover:border-red-200 rounded-3xl transition-all cursor-pointer group shadow-sm"
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
                className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 md:p-8 min-h-[500px]"
              >
                {/* ── DETAILS SUBTAB ── */}
                {profileSubTab === 'details' && (
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div>
                      <h3 className="text-xl font-serif font-black text-stone-900">Profile Details</h3>
                      <p className="text-xs text-stone-500 mt-1">Manage your public information and login contact credentials.</p>
                    </div>

                    {profileError && (
                      <div className="p-4 bg-red-50 text-red-700 text-sm rounded-2xl flex items-center gap-2 border border-red-100">
                        <AlertCircle size={16} /> {profileError}
                      </div>
                    )}
                    {profileSuccess && (
                      <div className="p-4 bg-emerald-50 text-emerald-700 text-sm rounded-2xl flex items-center gap-2 border border-emerald-100">
                        <CheckCircle2 size={16} /> {profileSuccess}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Full Name</label>
                        <div className="relative group">
                          <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-500 transition-colors" />
                          <input
                            type="text"
                            value={profileName}
                            onChange={e => setProfileName(e.target.value.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '))}
                            required
                            autoComplete="one-time-code"
                            className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50/40 capitalize hover:border-stone-300"
                            placeholder="Your name"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Email Address</label>
                        <div className="relative group">
                          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-500 transition-colors" />
                          <input
                            type="email"
                            value={profileEmail}
                            onChange={e => setProfileEmail(e.target.value)}
                            required
                            autoComplete="one-time-code"
                            className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50/40 hover:border-stone-300"
                            placeholder="you@email.com"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Phone Number</label>
                        <div className="relative group">
                          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-500 transition-colors" />
                          <input
                            type="tel"
                            value={profilePhone}
                            onChange={e => setProfilePhone(e.target.value)}
                            autoComplete="one-time-code"
                            className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50/40 hover:border-stone-300"
                            placeholder="+91 XXXXX XXXXX"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Member Since</label>
                        <div className="relative">
                          <BookOpen size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300" />
                          <input
                            type="text"
                            readOnly
                            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                            className="w-full pl-10 pr-4 py-3 border border-stone-100 rounded-2xl text-sm bg-stone-50 text-stone-400 cursor-not-allowed font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="bg-stone-900 text-amber-400 px-6 py-3 rounded-2xl text-sm font-bold hover:bg-amber-500 hover:text-stone-950 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                      </button>
                    </div>
                  </form>
                )}

                {/* ── NOTIFICATIONS SUBTAB ── */}
                {profileSubTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-serif font-black text-stone-900">Notifications & Alerts</h3>
                      <p className="text-xs text-stone-500 mt-1">Select how and when you want to receive dining notifications.</p>
                    </div>

                    <div className="space-y-0 border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100">
                      {[
                        { id: 'notifConfirmations', state: notifConfirmations, setter: setNotifConfirmations, icon: '📅', title: 'Email Booking Confirmations', desc: 'Receive instant notifications when your table reservation is successfully confirmed.' },
                        { id: 'notifCoupons', state: notifCoupons, setter: setNotifCoupons, icon: '🎫', title: 'Promotional & Discount Alerts', desc: 'Stay updated with new discount coupon opportunities and special dining offers.' },
                        { id: 'notifWeekly', state: notifWeekly, setter: setNotifWeekly, icon: '🍽️', title: 'Weekly Culinary Recommendations', desc: 'Receive curated dining suggestions and top restaurants based on your preferences.' },
                      ].map((toggle) => (
                        <div key={toggle.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-stone-50/40 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="text-xl mt-0.5">{toggle.icon}</span>
                            <div>
                              <p className="text-sm font-bold text-stone-900">{toggle.title}</p>
                              <p className="text-xs text-stone-500 mt-0.5 max-w-md">{toggle.desc}</p>
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => toggle.setter(!toggle.state)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${toggle.state ? 'bg-stone-900' : 'bg-stone-200'}`}
                          >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${toggle.state ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── SUPPORT SUBTAB ── */}
                {profileSubTab === 'support' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-serif font-black text-stone-900">Help & Support</h3>
                      <p className="text-xs text-stone-500 mt-1">Get immediate answers or contact support directly for your reservations.</p>
                    </div>

                    {/* Customer FAQs */}
                    <div className="space-y-2">
                      <h4 className="font-serif font-bold text-stone-900 text-sm mb-3">Frequently Asked Questions</h4>
                      {[
                        { q: 'How do I cancel my table reservation?', a: 'You can cancel any booking up to 2 hours before the scheduled time directly from your Upcoming reservations tab.' },
                        { q: 'How do I play games and earn coupons?', a: 'When a restaurant has a long queue (over 5 people), a "Play & Win" banner will appear on their detail page. Complete the challenge to win!' },
                        { q: 'Is there a dining limit or booking fee?', a: 'Dine Flow is free to use. Restaurants may have their own seat holding policies, but reserving tables through our app incurs no booking fee.' },
                      ].map((faq, idx) => (
                        <div key={idx} className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
                          <button 
                            type="button" 
                            onClick={() => setFaqOpen(prev => ({ ...prev, [idx]: !prev[idx] }))}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-50 transition-colors cursor-pointer"
                          >
                            <span className="text-sm font-bold text-stone-900 pr-4">{faq.q}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-stone-400 shrink-0 transition-transform ${faqOpen[idx] ? 'rotate-180' : ''}`}>
                              <polyline points="6,9 12,15 18,9" />
                            </svg>
                          </button>
                          <AnimatePresence>
                            {faqOpen[idx] && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="px-4 pb-4 pt-0 text-xs text-stone-600 leading-relaxed border-t border-stone-100 bg-stone-50/50">
                                  {faq.a}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    {/* Customer Contact form */}
                    <div className="border border-stone-200 rounded-2xl p-5 space-y-4">
                      <h4 className="font-serif font-bold text-stone-900 text-sm">Contact Support Desk</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Subject</label>
                          <input 
                            type="text" 
                            value={supportSubject} 
                            onChange={e => setSupportSubject(e.target.value)}
                            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-stone-50/20 hover:border-stone-300 transition-all"
                            placeholder="Describe the issue" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Category</label>
                          <select 
                            value={supportCategory} 
                            onChange={e => setSupportCategory(e.target.value)}
                            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer hover:border-stone-300 transition-all"
                          >
                            <option>Technical Support</option>
                            <option>Booking Dispute</option>
                            <option>Coupons & Rewards</option>
                            <option>Feedback</option>
                            <option>Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Message</label>
                        <textarea 
                          rows={4} 
                          value={supportMessage} 
                          onChange={e => setSupportMessage(e.target.value)}
                          className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-stone-50/20 resize-none hover:border-stone-300 transition-all"
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
                          className="bg-stone-900 text-amber-400 hover:bg-amber-500 hover:text-stone-900 px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
                      <h3 className="text-xl font-serif font-black text-stone-900">Privacy & Security</h3>
                      <p className="text-xs text-stone-500 mt-1">Manage account safety parameters and visibility settings.</p>
                    </div>

                    {/* Visibility settings */}
                    <div>
                      <h4 className="text-xs font-bold text-stone-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Globe size={14} className="text-stone-400" /> Visibility Settings
                      </h4>
                      <div className="space-y-0 border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100">
                        <div className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-stone-50/40">
                          <div>
                            <p className="text-sm font-bold text-stone-900">Show Profile in Leaderboards</p>
                            <p className="text-xs text-stone-500 mt-0.5">Let your game highscores and review signatures be visible to other diners.</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setProfileVisibility(!profileVisibility)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${profileVisibility ? 'bg-stone-900' : 'bg-stone-200'}`}
                          >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profileVisibility ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Account Protection */}
                    <div>
                      <h4 className="text-xs font-bold text-stone-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <ShieldAlert size={14} className="text-stone-400" /> Account Protection
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-stone-200 bg-stone-50/30">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                              <Lock size={15} className="text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-stone-900">Password Encryption</p>
                              <p className="text-xs text-stone-500">Secured via industry-standard cryptographically hashed keys</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">Protected</span>
                        </div>

                        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-stone-200 bg-stone-50/30">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${user?.emailVerified ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                              <Mail size={15} className={user?.emailVerified ? 'text-blue-600' : 'text-yellow-600'} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-stone-900">Email Verification</p>
                              <p className="text-xs text-stone-500">{user?.email}</p>
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
                                className="text-xs font-bold text-white bg-stone-900 hover:bg-amber-500 hover:text-stone-900 px-3 py-1 rounded-full cursor-pointer disabled:opacity-50 transition-colors"
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

export default ProfilePage;
