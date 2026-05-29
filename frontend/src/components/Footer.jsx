import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, Phone, MapPin, X, BookOpen, Send, Sparkles, User, 
  MessageSquare, Shield, FileText 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Footer = () => {
  const [activeModal, setActiveModal] = useState(null);
  
  // Newsletter subscription states
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subError, setSubError] = useState('');

  // Contact Form states
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isContactSending, setIsContactSending] = useState(false);
  const [isContactSent, setIsContactSent] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setSubError('Please enter a valid email address.');
      return;
    }
    setSubError('');
    setIsSubscribed(true);
    setEmail('');
    setTimeout(() => {
      setIsSubscribed(false);
    }, 5000);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    
    setIsContactSending(true);
    
    // Simulate API request to send email/save message
    setTimeout(() => {
      setIsContactSending(false);
      setIsContactSent(true);
      // Reset fields after 4 seconds and close/reset
      setTimeout(() => {
        setIsContactSent(false);
        setContactName('');
        setContactEmail('');
        setContactMessage('');
        setActiveModal(null);
      }, 4000);
    }, 1500);
  };
  return (
    <footer className="bg-brown-900 text-cream-200 py-12 mt-20 relative">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-serif text-2xl text-gold-500 mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-gold-400 animate-pulse" /> Dine Flow
          </h3>
          <p className="text-sm opacity-80 leading-relaxed">
            Elevating your dining experience with AI-powered recommendations, interactive blueprints, and gamified rewards.
          </p>
        </div>
        
        <div>
          <h4 className="font-bold mb-4 text-gold-400">Quick Links</h4>
          <ul className="space-y-2.5 text-sm opacity-80">
            <li>
              <Link to="/restaurants" className="hover:text-gold-500 transition-colors">
                Find a Restaurant
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-gold-500 transition-colors">
                Sign Up
              </Link>
            </li>
            <li>
              <button 
                onClick={() => setActiveModal('story')} 
                className="hover:text-gold-500 transition-colors bg-transparent border-none outline-none text-left p-0 cursor-pointer block text-cream-200 text-sm font-normal"
              >
                Our Story
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveModal('contact')} 
                className="hover:text-gold-500 transition-colors bg-transparent border-none outline-none text-left p-0 cursor-pointer block text-cream-200 text-sm font-normal"
              >
                Contact Us
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Social, Copyright and Legal Links Row */}
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-cream-200/20 flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
        <div className="opacity-60 text-center md:text-left">
          &copy; {new Date().getFullYear()} Dine Flow. All rights reserved.
        </div>
        
        {/* Social Icons */}
        <div className="flex gap-4">
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-cream-200/5 hover:bg-gold-500 hover:text-brown-900 hover:scale-110 transition-all flex items-center justify-center text-cream-200">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-cream-200/5 hover:bg-gold-500 hover:text-brown-900 hover:scale-110 transition-all flex items-center justify-center text-cream-200">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-cream-200/5 hover:bg-gold-500 hover:text-brown-900 hover:scale-110 transition-all flex items-center justify-center text-cream-200">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-cream-200/5 hover:bg-gold-500 hover:text-brown-900 hover:scale-110 transition-all flex items-center justify-center text-cream-200">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
          </a>
        </div>

        {/* Legal Links */}
        <div className="flex gap-6 opacity-60">
          <button 
            onClick={() => setActiveModal('privacy')} 
            className="hover:text-gold-500 transition-colors bg-transparent border-none outline-none cursor-pointer text-sm text-cream-200 font-normal"
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => setActiveModal('terms')} 
            className="hover:text-gold-500 transition-colors bg-transparent border-none outline-none cursor-pointer text-sm text-cream-200 font-normal"
          >
            Terms of Service
          </button>
        </div>
      </div>

      {/* Info Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isContactSending) {
                  setActiveModal(null);
                  setIsContactSent(false);
                }
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-cream-200 z-10 text-brown-900 overflow-hidden"
            >
              {!isContactSending && (
                <button 
                  onClick={() => {
                    setActiveModal(null);
                    setIsContactSent(false);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-brown-900 transition cursor-pointer p-1"
                >
                  <X size={20} />
                </button>
              )}

              {activeModal === 'story' && (
                <div className="space-y-4">
                  <div className="bg-gold-500/10 w-12 h-12 rounded-full flex items-center justify-center text-gold-600 mb-2">
                    <BookOpen size={24} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-brown-900">Our Story</h3>
                  <p className="text-sm text-brown-700 leading-relaxed">
                    DineFlow was born from a passion for gastronomy and technology. We believe dining out should be a seamless experience from the moment you plan it. 
                  </p>
                  <p className="text-sm text-brown-700 leading-relaxed">
                    Our platform bridges the gap between restaurants and food enthusiasts by combining high-fidelity 3D seating maps, AI recommendations tailored to your exact taste, and fun gamified wait-times. We empower you to reserve not just a time, but your exact preferred table layout.
                  </p>
                </div>
              )}

              {activeModal === 'contact' && (
                <div className="space-y-4">
                  <div className="bg-gold-500/10 w-12 h-12 rounded-full flex items-center justify-center text-gold-600 mb-2">
                    <Mail size={24} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-brown-900">Contact Us</h3>
                  
                  {isContactSent ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-8 text-center space-y-3"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto text-2xl">
                        ✓
                      </div>
                      <h4 className="text-xl font-bold text-green-600">Message Sent!</h4>
                      <p className="text-sm text-brown-700 max-w-sm mx-auto leading-relaxed">
                        Thank you, <span className="font-bold">{contactName}</span>! Your message has been received. Our team will contact you at <span className="font-semibold text-brown-900">{contactEmail}</span> within 24 hours.
                      </p>
                    </motion.div>
                  ) : isContactSending ? (
                    <div className="py-12 text-center space-y-4">
                      <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-sm text-brown-600 font-medium">Sending message securely...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      {/* Left: Contact Info */}
                      <div className="md:col-span-2 space-y-4 text-xs">
                        <p className="text-brown-700 leading-relaxed font-light">
                          Feel free to drop us a line or visit our office. We are available 24/7.
                        </p>
                        <div className="space-y-3.5 pt-2">
                          <div className="flex items-center gap-2.5 text-brown-800">
                            <Mail size={16} className="text-gold-600 shrink-0" />
                            <span className="break-all">support@dineflow.com</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-brown-800">
                            <Phone size={16} className="text-gold-600 shrink-0" />
                            <span>+91 98765 43210</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-brown-800">
                            <MapPin size={16} className="text-gold-600 shrink-0" />
                            <span className="leading-tight">Cyber City, Gurugram, India</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Contact Form */}
                      <form onSubmit={handleContactSubmit} className="md:col-span-3 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-brown-700 mb-1 flex items-center gap-1">
                            <User size={12} className="text-gold-600" /> Full Name
                          </label>
                          <input 
                            type="text" 
                            required
                            placeholder="Your Name"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            autoComplete="one-time-code"
                            className="w-full px-3 py-1.5 border border-cream-300 rounded-xl text-xs outline-none focus:border-gold-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-brown-700 mb-1 flex items-center gap-1">
                            <Mail size={12} className="text-gold-600" /> Email Address
                          </label>
                          <input 
                            type="email" 
                            required
                            placeholder="name@example.com"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            autoComplete="one-time-code"
                            className="w-full px-3 py-1.5 border border-cream-300 rounded-xl text-xs outline-none focus:border-gold-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-brown-700 mb-1 flex items-center gap-1">
                            <MessageSquare size={12} className="text-gold-600" /> Your Message
                          </label>
                          <textarea 
                            required
                            rows={3}
                            placeholder="How can we help you?"
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            className="w-full px-3 py-1.5 border border-cream-300 rounded-xl text-xs outline-none focus:border-gold-500 transition-colors resize-none"
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="w-full bg-brown-900 text-gold-500 py-2 rounded-xl text-xs font-bold hover:bg-brown-800 transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
                        >
                          <Send size={12} /> Send Message
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {activeModal === 'privacy' && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="bg-gold-500/10 w-12 h-12 rounded-full flex items-center justify-center text-gold-600 mb-2">
                    <Shield size={24} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-brown-900">Privacy Policy</h3>
                  <p className="text-xs text-brown-700 leading-relaxed">
                    At DineFlow, accessible from support@dineflow.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by DineFlow and how we use it.
                  </p>
                  <h4 className="font-bold text-sm text-brown-800">Information Collection & Usage</h4>
                  <p className="text-xs text-brown-700 leading-relaxed">
                    We collect personal information such as name, email address, and booking details during registration and booking checkout. This data is utilized solely to secure table bookings, authenticate accounts, and improve your dining experiences.
                  </p>
                  <h4 className="font-bold text-sm text-brown-800">Consent</h4>
                  <p className="text-xs text-brown-700 leading-relaxed">
                    By registering or booking through DineFlow, you consent to our collection, processing, and storage of your booking details under our secure cloud servers.
                  </p>
                </div>
              )}

              {activeModal === 'terms' && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="bg-gold-500/10 w-12 h-12 rounded-full flex items-center justify-center text-gold-600 mb-2">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-brown-900">Terms of Service</h3>
                  <p className="text-xs text-brown-700 leading-relaxed">
                    Welcome to DineFlow! These terms and conditions outline the rules and regulations for the use of DineFlow's reservation application.
                  </p>
                  <h4 className="font-bold text-sm text-brown-800">Booking & Cancellation Policy</h4>
                  <p className="text-xs text-brown-700 leading-relaxed">
                    By reserving a table, you agree to arrive within 15 minutes of your booking time. If you run late, please contact the restaurant. DineFlow is not responsible for cancellations due to late arrivals.
                  </p>
                  <h4 className="font-bold text-sm text-brown-800">Payment Processors</h4>
                  <p className="text-xs text-brown-700 leading-relaxed">
                    All payment processing is handled securely by Razorpay. Refund terms are strictly governed by the respective restaurant’s rules and terms.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </footer>
  );
};

export default Footer;
