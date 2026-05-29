import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AiChatbot from './components/AiChatbot';

// Pages
import LandingPage from './pages/LandingPage';
import RoleSelectPage from './pages/RoleSelectPage';
import UserAuthPage from './pages/UserAuthPage';
import AdminAuthPage from './pages/AdminAuthPage';
import RestaurantListing from './pages/RestaurantListing';
import RestaurantDetail from './pages/RestaurantDetail';
import TableBlueprintPage from './pages/TableBlueprintPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import PuzzlePage from './pages/PuzzlePage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProfilePage from './pages/AdminProfilePage';

// Private route: requires any logged-in user
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-brown-900 font-serif text-2xl">Loading...</div>;
  return user ? children : <Navigate to="/auth" />;
};

// Admin-only route: requires logged-in user with role='admin'
const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-brown-900 font-serif text-2xl">Loading...</div>;
  if (!user) return <Navigate to="/admin/signin" />;
  if (!isAdmin) return <Navigate to="/restaurants" />;
  return children;
};

// Guest-only route: redirects logged-in users to their dashboard
const GuestRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-brown-900 font-serif text-2xl">Loading...</div>;
  if (user) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/restaurants'} replace />;
  }
  return children;
};

// User-only route: requires logged-in user with role='user'
const UserRoute = ({ children }) => {
  const { user, loading, isUser } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-brown-900 font-serif text-2xl">Loading...</div>;
  if (!user) return <Navigate to="/user/signin" />;
  if (!isUser) return <Navigate to="/admin/dashboard" />;
  return children;
};

let isInitialLoad = true;

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialLoad) {
      isInitialLoad = false;
      // Scroll to top on fresh load/refresh
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />

          {/* Guest-only auth routes — redirect to dashboard if already logged in */}
          <Route path="/auth" element={<GuestRoute><RoleSelectPage /></GuestRoute>} />
          <Route path="/user/signup" element={<GuestRoute><UserAuthPage /></GuestRoute>} />
          <Route path="/user/signin" element={<GuestRoute><UserAuthPage /></GuestRoute>} />
          <Route path="/admin/signup" element={<GuestRoute><AdminAuthPage /></GuestRoute>} />
          <Route path="/admin/signin" element={<GuestRoute><AdminAuthPage /></GuestRoute>} />

          <Route path="/restaurants" element={<RestaurantListing />} />
          <Route path="/restaurants/:id" element={<RestaurantDetail />} />

          {/* User routes */}
          <Route path="/restaurants/:id/blueprint" element={
            <PrivateRoute>
              <TableBlueprintPage />
            </PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <UserRoute>
              <Dashboard />
            </UserRoute>
          } />
          <Route path="/profile" element={
            <UserRoute>
              <ProfilePage />
            </UserRoute>
          } />
          <Route path="/puzzle" element={
            <PrivateRoute>
              <PuzzlePage />
            </PrivateRoute>
          } />

          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/profile" element={
            <AdminRoute>
              <AdminProfilePage />
            </AdminRoute>
          } />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
      <AiChatbot />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
