import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Utensils, LogOut, User, Shield, LogIn, Calendar } from 'lucide-react';

const Navbar = () => {
  const { user, loading, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide user buttons on auth pages
  const isAuthPage = ['/auth', '/user/signin', '/user/signup', '/admin/signin', '/admin/signup', '/profile', '/admin/profile'].includes(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 glassmorphism border-b border-brown-900/10 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-brown-900 hover:text-gold-500 transition">
          <Utensils size={28} />
          <span className="font-serif text-2xl font-bold tracking-wide">Dine Flow</span>
        </Link>

        <div className="flex items-center gap-6">
          {/* While auth is loading or on auth pages, show nothing */}
          {loading || isAuthPage ? null : user ? (
            <>
              {/* Logged-in user links */}
              {!isAdmin && (
                <Link to="/restaurants" className="text-brown-800 hover:text-gold-500 font-medium transition">
                  Restaurants
                </Link>
              )}
              {isAdmin ? (
                <>
                  <Link to="/admin/dashboard" className="text-brown-800 hover:text-gold-500 font-medium transition flex items-center gap-1">
                    <Shield size={16} /> Dashboard
                  </Link>
                  <Link to="/admin/profile" className="text-brown-800 hover:text-gold-500 font-medium transition flex items-center gap-1">
                    <User size={18} /> My Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="text-brown-800 hover:text-gold-500 font-medium transition flex items-center gap-1">
                    <Calendar size={18} /> My Bookings
                  </Link>
                  <Link to="/profile" className="text-brown-800 hover:text-gold-500 font-medium transition flex items-center gap-1">
                    <User size={18} /> My Profile
                  </Link>
                </>
              )}
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1 bg-brown-900 text-cream-100 px-4 py-2 rounded-full hover:bg-gold-500 hover:text-brown-900 transition-colors cursor-pointer"
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

