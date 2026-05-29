import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Set default axios header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      loadUser();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data.data);
      localStorage.setItem('role', res.data.data.role);
    } catch (err) {
      console.error(err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, role) => {
    const payload = { email, password };
    if (role) payload.role = role;
    const res = await axios.post('/api/auth/login', payload);
    if (!res.data.require2FA) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('role', res.data.user.role);
    }
    return res.data;
  };

  const signup = async (name, email, password, role = 'user', phone = '') => {
    const res = await axios.post('/api/auth/signup', { name, email, password, role, phone });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('role', res.data.user.role);
    return res.data;
  };

  const verifyOtp = async (email, otpCode) => {
    const res = await axios.post('/api/auth/verify-otp', { email, otpCode });
    if (res.data.token && res.data.user) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('role', res.data.user.role);
    }
    return res.data;
  };

  const toggle2FA = async (enabled) => {
    const res = await axios.post('/api/auth/toggle-2fa', { enabled });
    setUser(prev => prev ? { ...prev, twoFactorEnabled: enabled } : null);
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  };

  const isAdmin = user?.role === 'admin';
  const isUser = user?.role === 'user';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, verifyOtp, toggle2FA, isAdmin, isUser, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};
