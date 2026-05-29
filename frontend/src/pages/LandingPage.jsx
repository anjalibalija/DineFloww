import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Utensils, MapPin, BrainCircuit, ScanLine, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate(isAdmin ? '/admin/dashboard' : '/restaurants', { replace: true });
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading || user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream-100">
        <div className="w-12 h-12 border-4 border-amber-650 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-serif text-xl text-stone-900">Redirecting to your dining vault...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-cream-100">

      {/* Main Split Layout Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden py-8 lg:py-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="container mx-auto px-6 w-full max-w-7xl relative z-10 pt-10 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9 }}
              className="lg:col-span-5 flex flex-col text-left space-y-8"
            >
              {/* Category tag */}
              <motion.span 
                whileHover={{ scale: 1.05, x: 10 }}
                className="text-[#D4AF37] text-sm md:text-base font-mono tracking-[0.2em] uppercase flex items-center gap-2 cursor-default"
              >
                ✦ Elevate Your Experience
              </motion.span>

              {/* Title structured exactly like reference layout */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-brown-900 leading-[1.1] uppercase tracking-tight select-none">
                CLAIM YOUR <span className="text-[#D4AF37]/80 inline-flex items-center gap-1">✦</span> <br />
                <span className="text-[#D4AF37]">PERFECT TABLE</span>
              </h1>

              {/* Quote block */}
              <p className="text-xl md:text-2xl text-brown-900 italic font-light pl-6 border-l-2 border-[#D4AF37] select-none leading-relaxed">
                "Don't just book a time. Claim your perfect table."
              </p>

              {/* Concise description */}
              <p className="text-base md:text-xl text-brown-700/80 font-light leading-relaxed select-none max-w-xl">
                Experience seamless dining with interactive visual floor plans. Pick your exact spot—whether it's the cozy window seat or the vibrant center table—powered by intelligent AI recommendations.
              </p>

              {/* Action Button styled high contrast with Sign Up text */}
              <div className="pt-4">
                <Link 
                  to="/auth" 
                  className="group relative bg-brown-900 text-cream-100 hover:bg-gold-500 hover:text-brown-900 px-10 py-4 rounded-full font-bold text-sm md:text-base uppercase tracking-[0.15em] transition-all duration-300 shadow-[0_10px_30px_rgba(62,39,35,0.25)] inline-flex items-center gap-3 overflow-hidden"
                >
                  <span className="relative z-10">Sign Up Now</span>
                  <motion.div 
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
                    className="relative z-10"
                  >
                    →
                  </motion.div>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                </Link>
              </div>
            </motion.div>

            {/* Right Graphic Image Column */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
              transition={{ 
                duration: 0.9, 
                delay: 0.15,
                y: {
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              className="lg:col-span-7 w-full h-[400px] sm:h-[500px] lg:h-[600px] flex items-center justify-end relative select-none lg:-mr-8 group perspective-1000 mt-8 lg:mt-0"
            >
              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-[#D4AF37]/20 blur-[100px] rounded-full scale-75 group-hover:scale-100 transition-transform duration-1000 pointer-events-none"></div>
              

              <motion.div 
                whileHover={{ rotateY: -3, rotateX: 3, scale: 1.02 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full relative rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-[#D4AF37]/30 z-10"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10 pointer-events-none"></div>
                <img 
                  src="/images/luxury_dining_hero.png" 
                  alt="Luxury Dining Interior" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000"
                />
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>



      {/* Features Section */}
      <section className="py-16 lg:py-20 bg-[#FDFBF7] text-brown-900 relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brown-900/10 to-transparent"></div>
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-[#25150d]">Why DineFlow?</h2>
            <p className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto font-light">Discover a new level of convenience and luxury when planning your next culinary adventure.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -8, scale: 1.02 }} 
              className="bg-white p-8 lg:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-cream-200 transition-all cursor-default group"
            >
              <div className="bg-brown-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-gold-500 group-hover:rotate-6 transition-transform">
                <MapPin size={32} />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-3 text-[#25150d]">Interactive Blueprints</h3>
              <p className="opacity-75 leading-relaxed">Don't just book a table; choose your exact spot. Window side? Rooftop? Our visual floor plan lets you decide instantly.</p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }} 
              className="bg-white p-8 lg:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-cream-200 transition-all cursor-default group"
            >
              <div className="bg-brown-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-gold-500 group-hover:-rotate-6 transition-transform">
                <BrainCircuit size={32} />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-3 text-[#25150d]">AI Dining Assistant</h3>
              <p className="opacity-75 leading-relaxed">Get personalized recommendations based on real-time crowd predictions and your highly unique dining preferences.</p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8, scale: 1.02 }} 
              className="bg-white p-8 lg:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-cream-200 transition-all cursor-default group"
            >
              <div className="bg-brown-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-gold-500 group-hover:rotate-12 transition-transform">
                <Sparkles size={32} />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-3 text-[#25150d]">Gamified Rewards</h3>
              <p className="opacity-75 leading-relaxed">Wait times are fun again. Solve logic puzzles while you wait and earn exclusive discount coupons to spend.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-16 lg:py-20 bg-[#FDFBF7] text-brown-900 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="text-center mb-12">
            <span className="text-[#D4AF37] font-semibold tracking-[0.2em] text-sm uppercase block mb-3">Next-Gen Intelligence</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-brown-900 mb-4">Core AI Capabilities</h2>
            <p className="text-brown-700 opacity-80 max-w-2xl mx-auto font-light text-lg">DineFlow integrates state-of-the-art AI systems to elevate both customer booking and restaurant administration.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* AI Dining & Table Matcher */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white border border-cream-200 p-8 rounded-2xl flex flex-col justify-between hover:border-gold-500/30 transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.02)]"
            >
              <div>
                <div className="bg-gold-500/10 text-gold-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold-500 group-hover:text-brown-900 transition-all duration-300">
                  <BrainCircuit size={24} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-brown-900 mb-3">AI Dining Matcher</h3>
                <p className="text-brown-700/80 leading-relaxed mb-6">
                  Analyzes reservation profiles, table ambiance characteristics, and group sizes to deliver highly personalized table suggestions matching exact diner preferences.
                </p>
              </div>
              <div className="flex items-center text-xs text-gold-600 font-mono gap-1 border-t border-cream-200 pt-4">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Active Matcher Engine
              </div>
            </motion.div>

            {/* AI Menu Digitization */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white border border-cream-200 p-8 rounded-2xl flex flex-col justify-between hover:border-gold-500/30 transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.02)]"
            >
              <div>
                <div className="bg-gold-500/10 text-gold-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold-500 group-hover:text-brown-900 transition-all duration-300">
                  <ScanLine size={24} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-brown-900 mb-3">Gemini Menu Scanner</h3>
                <p className="text-brown-700/80 leading-relaxed mb-6">
                  Allows admins to upload handwritten or printed menu cards. Using advanced computer vision via Gemini AI, it instantly extracts menu item descriptions and pricing structure.
                </p>
              </div>
              <div className="flex items-center text-xs text-gold-600 font-mono gap-1 border-t border-cream-200 pt-4">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Gemini Vision Integration
              </div>
            </motion.div>

            {/* AI Geocoding */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white border border-cream-200 p-8 rounded-2xl flex flex-col justify-between hover:border-gold-500/30 transition-all duration-300 group shadow-[0_8px_30px_rgb(0,0,0,0.02)]"
            >
              <div>
                <div className="bg-gold-500/10 text-gold-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold-500 group-hover:text-brown-900 transition-all duration-300">
                  <Compass size={24} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-brown-900 mb-3">AI Address Geocoder</h3>
                <p className="text-brown-700/80 leading-relaxed mb-6">
                  Automatically translates text locations into precise geolocated coordinates (latitude and longitude) during restaurant setup, enabling distance-based restaurant queries.
                </p>
              </div>
              <div className="flex items-center text-xs text-gold-600 font-mono gap-1 border-t border-cream-200 pt-4">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Geocoding API Active
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
