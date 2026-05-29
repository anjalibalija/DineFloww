import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Utensils, Store, ArrowRight, Sparkles, ArrowLeft } from 'lucide-react';

const RoleSelectPage = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background with animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-brown-900/5 via-transparent to-gold-500/5" />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gold-500/8 blur-3xl" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-brown-900/8 blur-3xl" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-6xl"
      >
        {/* Back to Home */}
        <Link
          to="/"
          className="absolute -top-12 left-0 lg:left-4 inline-flex items-center gap-2 text-base text-brown-700/60 hover:text-gold-500 font-medium transition-colors group z-20"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-16 pt-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 text-gold-600 px-6 py-2.5 rounded-full text-sm md:text-base font-bold mb-8 uppercase tracking-widest"
          >
            <Sparkles size={18} />
            Welcome to Dine Flow
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-5xl md:text-6xl lg:text-[5rem] font-serif font-bold text-brown-900 mb-6 leading-tight"
          >
            How would you like to <span className="text-gold-500 relative inline-block">continue<span className="absolute bottom-2 left-0 w-full h-2 bg-gold-500/20 -z-10"></span></span>?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-brown-700/80 text-xl md:text-2xl max-w-2xl mx-auto font-light"
          >
            Choose your experience — discover world-class restaurants or manage your own premium dining space.
          </motion.p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* User Card */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            whileHover={{ y: -12, scale: 1.02 }}
            className="group"
          >
            <Link
              to="/user/signin"
              id="role-select-user"
              className="block bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-xl shadow-brown-900/5 border border-white/60 p-10 lg:p-14 transition-all duration-500 relative overflow-hidden h-full group-hover:shadow-2xl group-hover:shadow-gold-500/10 group-hover:border-gold-500/30"
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-gold-500/10 to-transparent rounded-bl-[100%] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl bg-gradient-to-br from-amber-100 to-gold-50 border border-gold-500/20 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-sm">
                  <Utensils className="text-gold-500 w-10 h-10 lg:w-12 lg:h-12" />
                </div>

                <h2 className="text-3xl lg:text-4xl font-serif font-bold text-brown-900 mb-4">
                  Continue as Diner
                </h2>
                <p className="text-brown-700/70 text-lg lg:text-xl mb-10 leading-relaxed font-light">
                  Discover exceptional restaurants, browse interactive 3D floor plans, and secure your perfect table in seconds.
                </p>

                <ul className="space-y-4 mb-12">
                  {['Browse curated luxury restaurants', 'Interactive table blueprints', 'Book specific tables instantly', 'Earn rewards & waitlist coupons'].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-base lg:text-lg text-brown-700/80 font-light">
                      <div className="w-2 h-2 rounded-full bg-gold-500 shadow-sm" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-3 text-gold-500 font-bold text-lg lg:text-xl group-hover:gap-5 transition-all duration-300">
                  Sign in as Customer <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Admin Card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            whileHover={{ y: -12, scale: 1.02 }}
            className="group"
          >
            <Link
              to="/admin/signin"
              id="role-select-admin"
              className="block bg-brown-900/[0.03] backdrop-blur-2xl rounded-[2.5rem] shadow-xl shadow-brown-900/5 border border-brown-900/10 p-10 lg:p-14 transition-all duration-500 relative overflow-hidden h-full hover:shadow-2xl hover:shadow-brown-900/10 hover:border-brown-900/20 hover:bg-brown-900/[0.06]"
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-brown-900/10 to-transparent rounded-bl-[100%] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brown-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl bg-gradient-to-br from-stone-200 to-stone-100 border border-stone-300/50 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500 shadow-sm">
                  <Store className="text-brown-800 w-10 h-10 lg:w-12 lg:h-12" />
                </div>

                <h2 className="text-3xl lg:text-4xl font-serif font-bold text-brown-900 mb-4">
                  Continue as Owner
                </h2>
                <p className="text-brown-700/70 text-lg lg:text-xl mb-10 leading-relaxed font-light">
                  Manage your entire restaurant floor, monitor real-time bookings, and track analytics from a powerful dashboard.
                </p>

                <ul className="space-y-4 mb-12">
                  {['Digitize & manage restaurants', 'Configure physical table layouts', 'Track live bookings & queue', 'Advanced bestseller analytics'].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-base lg:text-lg text-brown-700/80 font-light">
                      <div className="w-2 h-2 rounded-full bg-brown-800 shadow-sm" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-3 text-brown-800 font-bold text-lg lg:text-xl group-hover:gap-5 transition-all duration-300">
                  Sign in as Owner <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-center text-sm text-brown-700/50 mt-12 tracking-wide"
        >
          By continuing, you agree to Dine Flow&apos;s Terms of Service and Privacy Policy.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default RoleSelectPage;
