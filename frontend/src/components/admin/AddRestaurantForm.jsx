import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, User, Mail, Phone, MapPin, Globe, Clock, Utensils, IndianRupee, Image, FileText, LayoutGrid, Users, ListOrdered } from 'lucide-react';
import axios from 'axios';

const CUISINE_OPTIONS = ['Fine Dining', 'Italian', 'Japanese', 'Indian', 'Chinese', 'Mexican', 'Thai', 'French', 'Mediterranean', 'American', 'Korean', 'Other'];
const PRICE_OPTIONS = ['₹', '₹₹', '₹₹₹', '₹₹₹₹'];
const CROWD_OPTIONS = ['Low', 'Medium', 'High', 'Full'];

const Field = ({ label, icon: Icon, name, type = 'text', placeholder, required, half, value, onChange }) => (
  <div className={half ? 'col-span-1' : 'col-span-2'}>
    <label className="block text-xs font-semibold text-brown-700/60 uppercase tracking-wider mb-1.5">{label}{required && ' *'}</label>
    <div className="relative">
      {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
      <input name={name} type={type} value={value} onChange={onChange} required={required} autoComplete="one-time-code"
        className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 border border-gray-200 rounded-xl text-sm text-brown-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 transition-all bg-white`}
        placeholder={placeholder} />
    </div>
  </div>
);

const Select = ({ label, icon: Icon, name, options, half, value, onChange }) => (
  <div className={half ? 'col-span-1' : 'col-span-2'}>
    <label className="block text-xs font-semibold text-brown-700/60 uppercase tracking-wider mb-1.5">{label}</label>
    <div className="relative">
      {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
      <select name={name} value={value} onChange={onChange}
        className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 border border-gray-200 rounded-xl text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 transition-all bg-white appearance-none cursor-pointer`}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  </div>
);

const AddRestaurantForm = ({ onClose, onSuccess, isDemoMode = false }) => {
  const [form, setForm] = useState({
    name: '', ownerName: '', email: '', phone: '',
    location: '', city: '', state: '', pincode: '',
    latitude: '', longitude: '',
    cuisine: 'Fine Dining', priceRange: '$$',
    openingTime: '10:00', closingTime: '22:00',
    description: '', image: '', menuHighlights: '',
    tableCategories: '', crowdLevel: 'Low', queueCount: '0'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const handleGeocode = async () => {
    if (!form.location) {
      setError('Please fill in the Address field first.');
      return;
    }
    setGeocoding(true);
    setError('');
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 800));
        setForm(prev => ({
          ...prev,
          latitude: "12.9716",
          longitude: "77.5946",
          city: prev.city || "Bengaluru",
          state: prev.state || "Karnataka"
        }));
        return;
      }
      const fullAddress = `${form.location}, ${form.city || ''}, ${form.state || ''} ${form.pincode || ''}`;
      const res = await axios.post('/api/ai/geocode', { address: fullAddress });
      if (res.data.success) {
        const { latitude, longitude, city, state } = res.data.data;
        setForm(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          city: prev.city || city,
          state: prev.state || state
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Geocoding failed. Make sure the address is valid.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleRestaurantImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
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

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setForm(prev => ({ ...prev, image: compressedBase64 }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.description || !form.cuisine || !form.location) {
      setError('Restaurant name, description, cuisine, and address are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 1200));
        const mockNewRes = {
          id: `demo-res-${Date.now()}`,
          name: form.name,
          ownerName: form.ownerName || "Anjali",
          email: form.email || "owner@restaurant.com",
          phone: form.phone || "+91 99999 88888",
          location: form.location,
          city: form.city || "Bengaluru",
          state: form.state || "Karnataka",
          pincode: form.pincode || "560001",
          latitude: form.latitude ? parseFloat(form.latitude) : 12.9716,
          longitude: form.longitude ? parseFloat(form.longitude) : 77.5946,
          priceRange: form.priceRange || "₹₹",
          openingTime: form.openingTime || "10:00",
          closingTime: form.closingTime || "22:00",
          description: form.description,
          image: form.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
          menuHighlights: form.menuHighlights || "",
          tableCategories: form.tableCategories || "",
          rating: 5.0,
          crowdLevel: form.crowdLevel || "Low",
          queueCount: parseInt(form.queueCount || "0", 10),
          tables: [],
          _count: { bookings: 0 }
        };
        onSuccess(mockNewRes);
        return;
      }
      await axios.post('/api/restaurants', form);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add restaurant.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8 py-5 rounded-t-3xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-brown-900">Add Your Restaurant</h2>
            <p className="text-sm text-brown-700/60">Fill in the details below to list your restaurant on Dine Flow.</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-50 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6">
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 text-red-600 text-sm text-center py-3 px-4 rounded-xl border border-red-100 mb-4">{error}</motion.div>
            )}
          </AnimatePresence>

          {/* Section: Basic Info */}
          <p className="text-xs font-bold text-brown-800 uppercase tracking-widest mb-3 flex items-center gap-2"><Building2 size={14} /> Basic Information</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Field label="Restaurant Name" icon={Building2} name="name" placeholder="e.g. The Golden Plate" required half value={form.name} onChange={handleChange} />
            <Field label="Owner Name" icon={User} name="ownerName" placeholder="Full name" half value={form.ownerName} onChange={handleChange} />
            <Field label="Email" icon={Mail} name="email" type="email" placeholder="restaurant@email.com" half value={form.email} onChange={handleChange} />
            <Field label="Phone" icon={Phone} name="phone" placeholder="+91 98765 43210" half value={form.phone} onChange={handleChange} />
          </div>

          {/* Section: Location */}
          <p className="text-xs font-bold text-brown-800 uppercase tracking-widest mb-3 flex items-center gap-2"><MapPin size={14} /> Location</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="col-span-2">
              <Field label="Address" icon={MapPin} name="location" placeholder="Street address" required value={form.location} onChange={handleChange} />
            </div>
            <div className="col-span-2 flex justify-end">
              <button
                type="button"
                onClick={handleGeocode}
                disabled={geocoding}
                className="bg-brown-900 text-gold-500 hover:bg-gold-500 hover:text-brown-900 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {geocoding ? 'Locating...' : 'Auto-Locate Coordinates (AI)'}
              </button>
            </div>
            <Field label="City" name="city" placeholder="City" half value={form.city} onChange={handleChange} />
            <Field label="State" name="state" placeholder="State" half value={form.state} onChange={handleChange} />
            <Field label="Pincode" name="pincode" placeholder="560001" half value={form.pincode} onChange={handleChange} />
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <Field label="Latitude" icon={Globe} name="latitude" type="number" placeholder="12.9716" half value={form.latitude} onChange={handleChange} />
              <Field label="Longitude" icon={Globe} name="longitude" type="number" placeholder="77.5946" half value={form.longitude} onChange={handleChange} />
            </div>
          </div>

          {/* Section: Details */}
          <p className="text-xs font-bold text-brown-800 uppercase tracking-widest mb-3 flex items-center gap-2"><Utensils size={14} /> Restaurant Details</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Select label="Cuisine Type" icon={Utensils} name="cuisine" options={CUISINE_OPTIONS} half value={form.cuisine} onChange={handleChange} />
            <Select label="Price Range" icon={IndianRupee} name="priceRange" options={PRICE_OPTIONS} half value={form.priceRange} onChange={handleChange} />
            <Field label="Opening Time" icon={Clock} name="openingTime" type="time" half value={form.openingTime} onChange={handleChange} />
            <Field label="Closing Time" icon={Clock} name="closingTime" type="time" half value={form.closingTime} onChange={handleChange} />
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-brown-700/60 uppercase tracking-wider mb-1.5">Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} required rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-brown-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 transition-all bg-white resize-none"
                placeholder="Describe your restaurant's ambiance, specialty, and what makes it unique..." />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-brown-700/60 uppercase tracking-wider mb-1.5">Restaurant Photo *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleRestaurantImageUpload}
                className="hidden"
                id="restaurant-photo-upload"
              />
              
              <div className="relative w-full h-48 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gold-500 transition-all overflow-hidden bg-gray-50 flex items-center justify-center group cursor-pointer">
                {form.image ? (
                  <>
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                    <div 
                      onClick={() => document.getElementById('restaurant-photo-upload').click()}
                      className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2"
                    >
                      <Image size={24} className="text-gold-500 animate-pulse" />
                      <span className="text-xs font-semibold">Change Photo</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm(prev => ({ ...prev, image: '' }));
                      }}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors shadow-lg cursor-pointer z-10"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <div 
                    onClick={() => document.getElementById('restaurant-photo-upload').click()}
                    className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 hover:text-gold-500 transition-colors p-6 text-center"
                  >
                    <Image size={36} className="mb-2 text-gray-300 group-hover:text-gold-500 transition-colors" />
                    <span className="text-sm font-bold text-brown-900/80">Click to Upload Photo</span>
                    <span className="text-xs text-gray-400 mt-1">Opens file manager on desktop or gallery on mobile</span>
                    <span className="text-[10px] text-gray-400 mt-2 bg-cream-100 px-2 py-0.5 rounded border border-gray-100">Supports JPG, PNG, WEBP</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Menu & Tables */}
          <p className="text-xs font-bold text-brown-800 uppercase tracking-widest mb-3 flex items-center gap-2"><FileText size={14} /> Menu & Tables</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Field label="Menu Highlights" icon={FileText} name="menuHighlights" placeholder="Truffle Risotto, Sushi Platter, ..." value={form.menuHighlights} onChange={handleChange} />
            <Field label="Table Categories" icon={LayoutGrid} name="tableCategories" placeholder="Rooftop, Window Side, Private Cabin, ..." value={form.tableCategories} onChange={handleChange} />
          </div>

          {/* Section: Status */}
          <p className="text-xs font-bold text-brown-800 uppercase tracking-widest mb-3 flex items-center gap-2"><Users size={14} /> Current Status</p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            <Select label="Crowd Level" icon={Users} name="crowdLevel" options={CROWD_OPTIONS} half value={form.crowdLevel} onChange={handleChange} />
            <Field label="Queue Length" icon={ListOrdered} name="queueCount" type="number" placeholder="0" half value={form.queueCount} onChange={handleChange} />
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-brown-900 to-brown-800 text-cream-100 shadow-lg shadow-brown-900/25 hover:shadow-brown-900/40 disabled:opacity-60 transition-all cursor-pointer flex items-center justify-center gap-2">
            {submitting ? <div className="w-5 h-5 border-2 border-cream-100/30 border-t-cream-100 rounded-full animate-spin" /> : 'Add Restaurant'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddRestaurantForm;
