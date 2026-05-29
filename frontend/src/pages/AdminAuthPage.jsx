import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Mail, Lock, User, Eye, EyeOff, ChevronRight, Shield, ArrowLeft, Phone, Sparkles, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';

const supportsWebkitTextSecurity = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('-webkit-text-security', 'disc');

const AdminAuthPage = () => {
  const location = useLocation();
  const isSignUpPath = location.pathname === '/admin/signup';

  const [isLogin, setIsLogin] = useState(!isSignUpPath);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signup Success state
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [devVerificationLink, setDevVerificationLink] = useState('');

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const checkPasswordStrength = (pass) => {
    const reqs = {
      length: pass.length >= 6,
      hasUpper: /[A-Z]/.test(pass),
      hasNumber: /[0-9]/.test(pass),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pass)
    };

    const count = Object.values(reqs).filter(Boolean).length;
    let strength = 'Weak';
    let color = 'bg-red-500';
    let width = 'w-1/3';
    
    if (count === 4) {
      strength = 'Strong';
      color = 'bg-green-500';
      width = 'w-full';
    } else if (count >= 2) {
      strength = 'Medium';
      color = 'bg-yellow-500';
      width = 'w-2/3';
    }

    return { reqs, strength, color, width, count };
  };

  const strengthData = checkPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password, 'admin');
        navigate('/admin/dashboard');
      } else {
        if (strengthData.count < 4) {
          setError('Please satisfy all password strength requirements.');
          setIsSubmitting(false);
          return;
        }
        await signup(name, email, password, 'admin', phone);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setSignupSuccess(false);
    navigate(isLogin ? '/admin/signup' : '/admin/signin', { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background — warm dining theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-gold-50/30" />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gold-500/8 blur-3xl" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-3xl" 
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold-500/3 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-xl"
      >
        {/* Back to role selection */}
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-base text-brown-700/60 hover:text-gold-500 font-medium mb-8 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to role selection
        </Link>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-brown-900/10 border border-white/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-gold-500/5 to-transparent rounded-bl-[100%] pointer-events-none" />

          <AnimatePresence mode="wait">
            {/* 1. Signup Success State */}
            {signupSuccess ? (
              <motion.div
                key="signup-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-8 text-center space-y-6"
              >
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500 border border-green-100">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold font-serif text-brown-900">Registration Successful!</h3>
                  {email && !/[a-zA-Z]/.test(email) ? (
                    <p className="text-base text-brown-700/70 mt-2">
                      Your owner account has been created successfully with phone number <span className="font-semibold text-brown-900">{email}</span>.
                    </p>
                  ) : (
                    <>
                      <p className="text-base text-brown-700/70 mt-2">
                        We have sent a verification email to <span className="font-semibold text-brown-900">{email}</span>.
                      </p>
                      <p className="text-sm text-brown-600/60 mt-1">
                        Please click the verification link inside the email to activate your account.
                      </p>
                    </>
                  )}
                </div>

                {devVerificationLink && email && /[a-zA-Z]/.test(email) && (
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-left space-y-2 mt-4">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles size={12} /> Local Development Helper
                    </p>
                    <p className="text-[11px] text-amber-700/80">
                      Since SMTP is mock in dev mode, you can verify your email instantly by clicking below:
                    </p>
                    <a
                      href={devVerificationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block w-full text-center bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition-colors shadow-sm"
                    >
                      Verify Email Address Now
                    </a>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSignupSuccess(false);
                    setIsLogin(true);
                    setError('');
                  }}
                  className="w-full bg-brown-900 text-cream-100 py-3 rounded-xl font-bold text-sm hover:bg-gold-500 hover:text-brown-900 transition-colors shadow-md"
                >
                  Proceed to Sign In
                </button>
              </motion.div>
            ) : (
              /* 3. Normal Sign In / Sign Up form */
              <motion.div
                key="auth-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Header */}
                <div className="px-10 pt-10 pb-4 text-center">
                  <div className="inline-flex items-center gap-2 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-gold-50 border border-gold-500/20 flex items-center justify-center shadow-sm">
                      <Store size={28} className="text-gold-500" />
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 bg-gold-500/10 text-gold-500 px-5 py-2 rounded-full text-sm font-bold tracking-widest uppercase mb-6 border border-gold-500/20">
                    <Shield size={16} />
                    Restaurant Owner Portal
                  </div>

                  <h2 className="text-4xl md:text-5xl font-extrabold font-serif text-brown-900 mb-3">
                    {isLogin ? 'Owner Sign In' : 'Register Your Restaurant'}
                  </h2>
                  <p className="text-base md:text-lg text-brown-700/70 font-light">
                    {isLogin
                      ? 'Access your restaurant management dashboard.'
                      : 'Create an owner account to manage your restaurant on Dine Flow.'}
                  </p>
                </div>

                {/* Form */}
                <form className="px-8 pb-8 pt-6 space-y-4 text-left" onSubmit={handleSubmit} autoComplete="off">
                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="bg-red-50 text-red-600 text-sm text-center py-3 px-4 rounded-xl border border-red-100"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Name field (signup only) */}
                  <AnimatePresence>
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label htmlFor="admin-auth-name" className="block text-sm font-semibold text-brown-700/60 uppercase tracking-widest mb-2">
                          Full Name
                        </label>
                        <div className="relative mb-4">
                          <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            id="admin-auth-name"
                            type="text"
                            required={!isLogin}
                            autoComplete="one-time-code"
                            className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl text-brown-900 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 transition-all bg-white capitalize"
                            placeholder="Your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '))}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email or Phone Number */}
                  <div>
                    <label htmlFor="admin-auth-email" className="block text-sm font-semibold text-brown-700/60 uppercase tracking-widest mb-2">
                      Email Address or Phone Number
                    </label>
                    <div className="relative">
                      {email.length > 0 && !/[a-zA-Z]/.test(email) ? (
                        <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      ) : (
                        <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      )}
                      <input
                        id="admin-auth-email"
                        type="text"
                        required
                        autoComplete="one-time-code"
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl text-brown-900 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 transition-all bg-white"
                        placeholder="owner@restaurant.com or +91 XXXXX XXXXX"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="admin-auth-password" className="block text-sm font-semibold text-brown-700/60 uppercase tracking-widest mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="admin-auth-password"
                        type={supportsWebkitTextSecurity ? 'text' : (showPassword ? 'text' : 'password')}
                        required
                        autoComplete={supportsWebkitTextSecurity ? 'one-time-code' : (isLogin ? 'current-password' : 'new-password')}
                        style={supportsWebkitTextSecurity ? { WebkitTextSecurity: showPassword ? 'none' : 'disc' } : {}}
                        className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl text-brown-900 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 transition-all bg-white"
                        placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brown-700 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    {/* Real-time Password Strength Check for Sign Up */}
                    {!isLogin && password.length > 0 && (
                      <div className="mt-6 p-5 bg-cream-100/30 border border-cream-200/50 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-brown-700">Password Strength:</span>
                          <span className={`font-bold uppercase tracking-wider ${
                            strengthData.strength === 'Strong' ? 'text-green-600' :
                            strengthData.strength === 'Medium' ? 'text-yellow-600' : 'text-red-500'
                          }`}>
                            {strengthData.strength}
                          </span>
                        </div>
                        {/* Progress meter bar */}
                        <div className="h-2 w-full bg-cream-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${strengthData.color} ${strengthData.width}`} />
                        </div>

                        {/* Complexity criteria checks */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs md:text-sm font-medium text-brown-600/80">
                          <div className="flex items-center gap-1.5">
                            <span className={strengthData.reqs.length ? 'text-green-500 font-bold' : 'text-gray-300'}>
                              {strengthData.reqs.length ? '✓' : '•'}
                            </span>
                            <span>At least 6 Characters</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={strengthData.reqs.hasUpper ? 'text-green-500 font-bold' : 'text-gray-300'}>
                              {strengthData.reqs.hasUpper ? '✓' : '•'}
                            </span>
                            <span>At least 1 Uppercase</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={strengthData.reqs.hasNumber ? 'text-green-500 font-bold' : 'text-gray-300'}>
                              {strengthData.reqs.hasNumber ? '✓' : '•'}
                            </span>
                            <span>At least 1 Number</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={strengthData.reqs.hasSpecial ? 'text-green-500 font-bold' : 'text-gray-300'}>
                              {strengthData.reqs.hasSpecial ? '✓' : '•'}
                            </span>
                            <span>At least 1 Special Char</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting || (!isLogin && strengthData.count < 4)}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl text-lg font-bold transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer bg-gradient-to-r from-gold-500 to-yellow-400 text-brown-900 hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] mt-8 uppercase tracking-widest"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-brown-900/30 border-t-brown-900 rounded-full animate-spin" />
                    ) : (
                      <>
                        {isLogin ? 'Sign In to Dashboard' : 'Create Owner Account'}
                        <ChevronRight size={20} />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Footer toggle */}
                <div className="px-10 pb-10 -mt-2">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white/80 px-6 py-1 rounded-full text-sm font-bold text-gray-400 border border-gray-100 uppercase">or</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={switchMode}
                    className="mt-6 w-full text-center text-base text-brown-700/70 hover:text-gold-500 font-medium transition-colors cursor-pointer"
                  >
                    {isLogin ? (
                      <>New restaurant owner? <span className="text-gold-500 font-semibold">Register here</span></>
                    ) : (
                      <>Already registered? <span className="text-gold-500 font-semibold">Sign in</span></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-sm text-brown-700/40 mt-8 tracking-wide">
          Restaurant Owner Portal — Powered by Dine Flow
        </p>
      </motion.div>
    </div>
  );
};

export default AdminAuthPage;
