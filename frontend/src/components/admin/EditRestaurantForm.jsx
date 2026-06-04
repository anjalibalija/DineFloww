import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Building2, User, Mail, Phone, MapPin, Globe, Clock, Utensils, 
  IndianRupee, ImageIcon, FileText, LayoutGrid, Users, 
  ListOrdered, ChevronDown, ChevronUp, Plus, Trash2, Check, ShieldCheck, 
  Sparkles, Link as LinkIcon, Info, HelpCircle, Settings2
} from 'lucide-react';
import axios from 'axios';

const RESTAURANT_TYPES = ['Cafe', 'Casual Dining', 'Fine Dining', 'Quick Service', 'Buffet', 'Cloud Kitchen'];
const CUISINE_OPTIONS = ['South Indian', 'North Indian', 'Chinese', 'Continental', 'Italian', 'Cafe', 'Fast Food', 'Desserts', 'Beverages'];
const PRICE_CATEGORIES = ['Budget', 'Mid-range', 'Premium', 'Luxury'];
const AMENITY_OPTIONS = ['Parking', 'Free WiFi', 'Air Conditioning', 'Card Payments', 'UPI Payments', 'Wheelchair Accessible', 'Power Backup', 'EV Charging', 'Pet Friendly', 'Kids Friendly'];
const HIGHLIGHT_OPTIONS = ['Rooftop Dining', 'Window View', 'Family Friendly', 'Pure Vegetarian', 'Live Music', 'Cozy Ambience', 'Open Air Seating', 'Romantic Dining', 'Group Friendly', 'Natural Light Seating', 'Indoor Seating'];
const GALLERY_CATEGORIES = ['Exterior', 'Interior', 'Food', 'Rooftop', 'Seating Area', 'Events'];

const SectionHeader = ({ id, label, icon: Icon, active, onClick, count = 0 }) => (
  <button 
    type="button"
    onClick={() => onClick(id)}
    className={`w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-gray-50 border-b border-gray-100 transition-colors text-left font-serif font-bold text-brown-900 cursor-pointer ${active ? 'rounded-t-2xl' : 'rounded-2xl'}`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-gold-500 text-brown-900' : 'bg-cream-100 text-brown-800'}`}>
        <Icon size={16} />
      </div>
      <span>{label}</span>
      {count > 0 && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-500/20 text-brown-900 font-sans font-bold">{count}</span>
      )}
    </div>
    {active ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
  </button>
);

const FormField = ({ label, icon: Icon, name, type = 'text', placeholder, required, value, onChange, error }) => (
  <div className="col-span-2 sm:col-span-1">
    <label className="block text-xs font-semibold text-brown-700/60 uppercase tracking-wider mb-1.5">{label}{required && ' *'}</label>
    <div className="relative">
      {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
      <input 
        name={name} 
        type={type} 
        value={value} 
        onChange={onChange} 
        required={required} 
        placeholder={placeholder} 
        className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 border ${error ? 'border-red-400 focus:ring-red-500/20' : 'border-gray-200 focus:ring-gold-500/30'} rounded-xl text-sm text-brown-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-gold-500 transition-all bg-white`}
      />
    </div>
    {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
  </div>
);

const EditRestaurantForm = ({ restaurant, onClose, onSuccess, isDemoMode = false }) => {
  // Backward compatibility initialization parser
  const parseInitialState = () => {
    let initCuisines = [];
    if (restaurant.cuisines && restaurant.cuisines.length > 0) {
      initCuisines = restaurant.cuisines;
    } else if (restaurant.cuisine) {
      initCuisines = restaurant.cuisine.split(',').map(c => c.trim()).filter(Boolean);
    }

    let initMenu = [];
    if (restaurant.menuHighlights) {
      if (Array.isArray(restaurant.menuHighlights)) {
        initMenu = restaurant.menuHighlights;
      } else if (typeof restaurant.menuHighlights === 'string') {
        initMenu = restaurant.menuHighlights.split('\n').map(h => h.trim().replace(/^\*\s*/, '')).filter(Boolean);
      }
    }

    let initHighlights = [];
    if (restaurant.highlights && restaurant.highlights.length > 0) {
      initHighlights = restaurant.highlights;
    } else if (restaurant.tableCategories) {
      initHighlights = restaurant.tableCategories.split(',').map(h => h.trim()).filter(Boolean);
    }

    const defaultHours = [
      { day: 'Monday', open: '10:00', close: '22:00', closed: false, is24h: false, hasSplitShift: false, open2: '17:00', close2: '23:00' },
      { day: 'Tuesday', open: '10:00', close: '22:00', closed: false, is24h: false, hasSplitShift: false, open2: '17:00', close2: '23:00' },
      { day: 'Wednesday', open: '10:00', close: '22:00', closed: false, is24h: false, hasSplitShift: false, open2: '17:00', close2: '23:00' },
      { day: 'Thursday', open: '10:00', close: '22:00', closed: false, is24h: false, hasSplitShift: false, open2: '17:00', close2: '23:00' },
      { day: 'Friday', open: '10:00', close: '22:00', closed: false, is24h: false, hasSplitShift: false, open2: '17:00', close2: '23:00' },
      { day: 'Saturday', open: '10:00', close: '22:00', closed: false, is24h: false, hasSplitShift: false, open2: '17:00', close2: '23:00' },
      { day: 'Sunday', open: '10:00', close: '22:00', closed: false, is24h: false, hasSplitShift: false, open2: '17:00', close2: '23:00' }
    ];
    let initHours = restaurant.operatingHours || defaultHours;
    // Map split shift values if they exist
    initHours = initHours.map(d => ({
      ...d,
      is24h: d.is24h || false,
      hasSplitShift: d.hasSplitShift || false,
      open2: d.open2 || '17:00',
      close2: d.close2 || '23:00'
    }));

    let initSeating = restaurant.seatingAreas || [
      { name: 'Indoor Seating', description: 'Cozy and elegant indoor dining room', image: '', hasAirPurifier: false, premiumCharge: 0 }
    ];
    initSeating = initSeating.map(a => ({
      ...a,
      hasAirPurifier: a.hasAirPurifier || false,
      premiumCharge: a.premiumCharge || 0
    }));

    let initTables = restaurant.tableTypes || [
      { name: '2 Seater', capacity: 2, quantity: 4, seatingArea: 'Indoor Seating', shape: 'Square', isVip: false, isBestseller: false },
      { name: '4 Seater', capacity: 4, quantity: 6, seatingArea: 'Indoor Seating', shape: 'Square', isVip: false, isBestseller: false }
    ];
    initTables = initTables.map(t => ({
      ...t,
      shape: t.shape || 'Square',
      isVip: t.isVip || false,
      isBestseller: t.isBestseller || false
    }));

    let initCover = restaurant.coverImage || restaurant.image || 'no-photo.jpg';
    let initGallery = restaurant.gallery || [];
    let initSocials = restaurant.socialLinks || {};

    return {
      name: restaurant.name || '',
      tagline: restaurant.tagline || '',
      restaurantType: restaurant.restaurantType || 'Casual Dining',
      ownerName: restaurant.ownerName || '',
      email: restaurant.email || '',
      phone: restaurant.phone || '',
      description: restaurant.description || '',
      establishedYear: restaurant.establishedYear || '',
      
      location: restaurant.location || '',
      city: restaurant.city || '',
      state: restaurant.state || '',
      pincode: restaurant.pincode || '',
      latitude: restaurant.latitude ?? '',
      longitude: restaurant.longitude ?? '',
      googleMapsUrl: initSocials.googleMaps || '',
      
      cuisines: initCuisines,
      operatingHours: initHours,
      
      avgCostForTwo: restaurant.avgCostForTwo || '',
      priceCategory: restaurant.priceCategory || 'Mid-range',
      
      seatingAreas: initSeating,
      tableTypes: initTables,
      
      amenities: restaurant.amenities || [],
      highlights: initHighlights,
      customHighlight: '',
      
      menuHighlights: initMenu,
      customMenuHighlight: '',
      
      coverImage: initCover,
      gallery: initGallery
    };
  };

  const [form, setForm] = useState(parseInitialState);

  // Single active section state for accordion mode
  const [activeSection, setActiveSection] = useState('info');

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [menuImage, setMenuImage] = useState(null);
  const [digitizing, setDigitizing] = useState(false);

  const toggleSection = (section) => {
    setActiveSection(prev => prev === section ? '' : section);
  };

  const handleFieldChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };

  const detectCoordinates = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(prev => ({
          ...prev,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude)
        }));
        showToast("Location coordinates loaded!");
      },
      (error) => {
        alert("Unable to retrieve coordinates: " + error.message);
      }
    );
  };

  const showToast = (message) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Cuisines Multi-Select
  const toggleCuisine = (cuisine) => {
    setForm(prev => {
      const list = prev.cuisines.includes(cuisine) 
        ? prev.cuisines.filter(c => c !== cuisine)
        : [...prev.cuisines, cuisine];
      return { ...prev, cuisines: list };
    });
  };

  // Operating Hours
  const handleHourChange = (index, field, value) => {
    setForm(prev => {
      const list = [...prev.operatingHours];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, operatingHours: list };
    });
  };

  const copyTimingToAllDays = () => {
    const monday = form.operatingHours[0];
    setForm(prev => ({
      ...prev,
      operatingHours: prev.operatingHours.map(d => ({
        ...d,
        open: monday.open,
        close: monday.close,
        closed: monday.closed,
        is24h: monday.is24h,
        hasSplitShift: monday.hasSplitShift,
        open2: monday.open2,
        close2: monday.close2
      }))
    }));
    showToast("Copied Monday's hours (with advanced settings) to all days!");
  };

  // Seating Areas Dynamic List
  const addSeatingArea = () => {
    setForm(prev => ({
      ...prev,
      seatingAreas: [...prev.seatingAreas, { name: '', description: '', image: '', hasAirPurifier: false, premiumCharge: 0 }]
    }));
  };

  const removeSeatingArea = (index) => {
    setForm(prev => ({
      ...prev,
      seatingAreas: prev.seatingAreas.filter((_, i) => i !== index)
    }));
  };

  const handleSeatingAreaChange = (index, field, value) => {
    setForm(prev => {
      const list = [...prev.seatingAreas];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, seatingAreas: list };
    });
  };

  // Table Types Dynamic List
  const addTableType = () => {
    setForm(prev => ({
      ...prev,
      tableTypes: [...prev.tableTypes, { name: '', capacity: 2, quantity: 1, seatingArea: 'Indoor Seating', shape: 'Square', isVip: false, isBestseller: false }]
    }));
  };

  const removeTableType = (index) => {
    setForm(prev => ({
      ...prev,
      tableTypes: prev.tableTypes.filter((_, i) => i !== index)
    }));
  };

  const handleTableTypeChange = (index, field, value) => {
    setForm(prev => {
      const list = [...prev.tableTypes];
      list[index] = { ...list[index], [field]: field === 'capacity' || field === 'quantity' ? parseInt(value) || 0 : value };
      return { ...prev, tableTypes: list };
    });
  };

  // Amenities & Highlights Multi-Select
  const toggleAmenity = (item) => {
    setForm(prev => {
      const list = prev.amenities.includes(item) 
        ? prev.amenities.filter(i => i !== item)
        : [...prev.amenities, item];
      return { ...prev, amenities: list };
    });
  };

  const toggleHighlight = (item) => {
    setForm(prev => {
      const list = prev.highlights.includes(item) 
        ? prev.highlights.filter(i => i !== item)
        : [...prev.highlights, item];
      return { ...prev, highlights: list };
    });
  };

  const addCustomHighlight = () => {
    const tag = form.customHighlight.trim();
    if (!tag) return;
    if (!form.highlights.includes(tag)) {
      setForm(prev => ({
        ...prev,
        highlights: [...prev.highlights, tag],
        customHighlight: ''
      }));
    }
  };

  // Menu Highlights
  const addMenuHighlight = () => {
    const tag = form.customMenuHighlight.trim();
    if (!tag) return;
    if (!form.menuHighlights.includes(tag)) {
      setForm(prev => ({
        ...prev,
        menuHighlights: [...prev.menuHighlights, tag],
        customMenuHighlight: ''
      }));
    }
  };

  const removeMenuHighlight = (tag) => {
    setForm(prev => ({
      ...prev,
      menuHighlights: prev.menuHighlights.filter(t => t !== tag)
    }));
  };

  // Image Upload Logic
  const compressImage = (file, callback) => {
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
        callback(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleImageFile = (e, type, index = null) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'cover') {
      compressImage(files[0], (base64) => {
        setForm(prev => ({ ...prev, coverImage: base64 }));
      });
    } else if (type === 'gallery') {
      Array.from(files).forEach(file => {
        compressImage(file, (base64) => {
          setForm(prev => ({
            ...prev,
            gallery: [...prev.gallery, { url: base64, category: 'Food' }]
          }));
        });
      });
    } else if (type === 'seating' && index !== null) {
      compressImage(files[0], (base64) => {
        setForm(prev => {
          const list = [...prev.seatingAreas];
          list[index] = { ...list[index], image: base64 };
          return { ...prev, seatingAreas: list };
        });
      });
    }
  };

  const handleMenuImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    compressImage(file, (base64) => {
      setMenuImage({
        base64,
        mimeType: 'image/jpeg'
      });
    });
  };

  const digitizeMenu = async () => {
    if (!menuImage) return;
    setDigitizing(true);
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 1200));
        const items = [
          { name: "Special Dabeli", description: "Spiced potato mixture in pav buns topped with pomegranate and sev", price: 100, category: "Chats" },
          { name: "Raaj Kachori", description: "Large crispy puri filled with potatoes, sprouts, yogurt, chutneys, and sev", price: 90, category: "Chats" },
          { name: "Samosa Chat", description: "Crushed samosas topped with warm chickpeas, chutneys, and yogurt", price: 80, category: "Chats" }
        ];
        const highlightsArray = items.map(item => {
          const descPart = item.description ? ` - ${item.description}` : '';
          return `${item.name} (${item.category}): ₹${item.price}${descPart}`;
        });
        setForm(prev => ({
          ...prev,
          menuHighlights: [...prev.menuHighlights, ...highlightsArray]
        }));
        setMenuImage(null);
        showToast("Digitized menu items successfully!");
        return;
      }
      const res = await axios.post('/api/ai/digitize-menu', {
        base64Image: menuImage.base64,
        mimeType: menuImage.mimeType,
        restaurantId: restaurant.id
      });
      
      const items = res.data.data;
      const highlightsArray = items.map(item => {
        const descPart = item.description ? ` - ${item.description}` : '';
        return `${item.name} (${item.category}): ₹${item.price}${descPart}`;
      });
      setForm(prev => ({
        ...prev,
        menuHighlights: [...prev.menuHighlights, ...highlightsArray]
      }));
      setMenuImage(null);
      showToast("Digitized menu items successfully!");
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Please try again.';
      alert(`Failed to digitize menu: ${errMsg}`);
    } finally {
      setDigitizing(false);
    }
  };

  const removeGalleryImage = (index) => {
    setForm(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const setAsCoverImage = (url) => {
    setForm(prev => ({ ...prev, coverImage: url }));
    showToast("Updated cover photo!");
  };

  const changeGalleryCategory = (index, category) => {
    setForm(prev => {
      const list = [...prev.gallery];
      list[index] = { ...list[index], category };
      return { ...prev, gallery: list };
    });
  };

  // Form Validation
  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Restaurant name is required';
    if (!form.location.trim()) newErrors.location = 'Address location is required';
    if (!form.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
    if (!form.email.trim()) newErrors.email = 'Email address is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    if (form.cuisines.length === 0) newErrors.cuisines = 'Select at least one cuisine';
    if (!form.coverImage) newErrors.coverImage = 'Cover photo is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    if (!validateForm()) {
      setGlobalError('Please correct the validation errors in the highlighted sections.');
      setActiveSection('info');
      return;
    }

    setSubmitting(true);
    try {
      await axios.put(`/api/restaurants/${restaurant.id}`, form);
      onSuccess();
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Failed to update restaurant. Please verify all details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 backdrop-blur-sm overflow-y-auto py-6 px-4"
    >
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        exit={{ opacity: 0, y: 30 }}
        className="bg-cream-50 rounded-3xl shadow-2xl w-full max-w-4xl relative overflow-hidden"
      >
        {/* Toast Notifier */}
        <AnimatePresence>
          {successToast && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-brown-900 text-cream-100 text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-gold-500/20"
            >
              <Check size={14} className="text-gold-500" />
              <span>{successToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-bold text-brown-900">Edit Restaurant</h2>
            <p className="text-xs text-brown-700/60">Configure your structured profile, layouts, amenities, and timings.</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Main Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pb-24 space-y-4">
          
          <AnimatePresence>
            {globalError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 text-red-600 text-xs font-semibold p-4 rounded-2xl border border-red-100 text-center"
              >
                {globalError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 1. RESTAURANT INFORMATION */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <SectionHeader id="info" label="Restaurant Information" icon={Building2} active={activeSection === 'info'} onClick={toggleSection} />
            <AnimatePresence>
              {activeSection === 'info' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6 border-t border-gray-50 grid grid-cols-2 gap-4"
                >
                  <FormField label="Restaurant Name" icon={Building2} name="name" required placeholder="e.g. The Saffron Lounge" value={form.name} onChange={handleFieldChange} error={errors.name} />
                  <FormField label="Tagline / Short description" icon={Utensils} name="tagline" placeholder="e.g. Fine Indian Culinary Artistry" value={form.tagline} onChange={handleFieldChange} />
                  
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-brown-700/60 uppercase tracking-wider mb-1.5 font-sans">Restaurant Type</label>
                    <select 
                      name="restaurantType" 
                      value={form.restaurantType} 
                      onChange={handleFieldChange}
                      className="w-full pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm text-brown-900 bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 cursor-pointer"
                    >
                      {RESTAURANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <FormField label="Established Year" icon={Clock} name="establishedYear" type="number" placeholder="e.g. 2021" value={form.establishedYear} onChange={handleFieldChange} />
                  <FormField label="Owner Name" icon={User} name="ownerName" required placeholder="Full Name" value={form.ownerName} onChange={handleFieldChange} error={errors.ownerName} />
                  <FormField label="Email Address" icon={Mail} name="email" type="email" required placeholder="contact@restaurant.com" value={form.email} onChange={handleFieldChange} error={errors.email} />
                  <FormField label="Phone Number" icon={Phone} name="phone" required placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={handleFieldChange} error={errors.phone} />
                  
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-brown-700/60 uppercase tracking-wider mb-1.5 font-sans">About Restaurant</label>
                    <textarea 
                      name="description" 
                      rows={3} 
                      placeholder="Tell customers about your kitchen, dining room, chefs, and atmosphere..."
                      value={form.description} 
                      onChange={handleFieldChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-brown-900 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 resize-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. LOCATION */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <SectionHeader id="location" label="Location & Coordinates" icon={MapPin} active={activeSection === 'location'} onClick={toggleSection} />
            <AnimatePresence>
              {activeSection === 'location' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6 border-t border-gray-50 grid grid-cols-2 gap-4"
                >
                  <div className="col-span-2">
                    <FormField label="Street Address" icon={MapPin} name="location" required placeholder="e.g. 12th Main Road, Indiranagar" value={form.location} onChange={handleFieldChange} error={errors.location} />
                  </div>
                  <FormField label="City" name="city" placeholder="e.g. Bengaluru" value={form.city} onChange={handleFieldChange} />
                  <FormField label="State" name="state" placeholder="e.g. Karnataka" value={form.state} onChange={handleFieldChange} />
                  <FormField label="Pincode" name="pincode" placeholder="e.g. 560038" value={form.pincode} onChange={handleFieldChange} />
                  <FormField label="Google Maps link" icon={LinkIcon} name="googleMapsUrl" placeholder="https://maps.google.com/..." value={form.googleMapsUrl} onChange={handleFieldChange} />

                  <div className="col-span-2 bg-gray-50 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brown-900 flex items-center gap-1.5"><Globe size={14} /> GPS Geocoding Coordinates</span>
                      <button 
                        type="button" 
                        onClick={detectCoordinates}
                        className="px-3 py-1.5 bg-brown-900 hover:bg-gold-500 hover:text-brown-900 text-cream-100 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        Auto-Detect Live Coordinates
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Latitude" name="latitude" type="number" placeholder="e.g. 12.9716" value={form.latitude} onChange={handleFieldChange} />
                      <FormField label="Longitude" name="longitude" type="number" placeholder="e.g. 77.5946" value={form.longitude} onChange={handleFieldChange} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. CUISINES */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <SectionHeader id="cuisines" label="Cuisines" icon={Utensils} active={activeSection === 'cuisines'} onClick={toggleSection} count={form.cuisines.length} />
            <AnimatePresence>
              {activeSection === 'cuisines' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6 border-t border-gray-50 space-y-3"
                >
                  <label className="block text-xs font-semibold text-brown-700/60 uppercase tracking-wider">Select cuisines served *</label>
                  {errors.cuisines && <span className="text-xs text-red-500 font-bold block">{errors.cuisines}</span>}
                  
                  <div className="flex flex-wrap gap-2">
                    {CUISINE_OPTIONS.map(c => {
                      const selected = form.cuisines.includes(c);
                      return (
                        <button
                          type="button"
                          key={c}
                          onClick={() => toggleCuisine(c)}
                          className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            selected 
                              ? 'bg-gold-500 text-brown-900 border-gold-600 shadow-sm' 
                              : 'bg-white border-gray-200 text-brown-800 hover:border-gold-500 hover:bg-gold-50/20'
                          }`}
                        >
                          {selected && <Check size={12} />}
                          <span>{c}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 4. OPERATING HOURS */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <SectionHeader id="hours" label="Operating Hours" icon={Clock} active={activeSection === 'hours'} onClick={toggleSection} />
            <AnimatePresence>
              {activeSection === 'hours' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6 border-t border-gray-50 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-brown-700/60 font-semibold flex items-center gap-1.5"><Info size={14} /> Weekly business timings</span>
                    <button 
                      type="button" 
                      onClick={copyTimingToAllDays}
                      className="text-xs text-gold-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Copy Monday's Hours to All Days
                    </button>
                  </div>

                  <div className="space-y-3">
                    {form.operatingHours.map((d, index) => (
                      <div key={d.day} className="flex flex-col bg-gray-50/50 border border-gray-100 p-4 rounded-xl gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-brown-900 w-24">{d.day}</span>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1 text-xs text-brown-850 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={d.closed} 
                                onChange={(e) => handleHourChange(index, 'closed', e.target.checked)}
                                className="rounded accent-gold-500" 
                              />
                              <span className="font-semibold text-gray-500">Closed</span>
                            </label>
                            
                            <label className="flex items-center gap-1 text-xs text-brown-850 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={d.is24h || false} 
                                disabled={d.closed}
                                onChange={(e) => handleHourChange(index, 'is24h', e.target.checked)}
                                className="rounded accent-gold-500" 
                              />
                              <span className="font-bold text-gold-600">24 Hours Open (Adv)</span>
                            </label>

                            <label className="flex items-center gap-1 text-xs text-brown-850 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={d.hasSplitShift || false} 
                                disabled={d.closed || d.is24h}
                                onChange={(e) => handleHourChange(index, 'hasSplitShift', e.target.checked)}
                                className="rounded accent-gold-500" 
                              />
                              <span className="font-semibold text-brown-700 hover:text-gold-600 transition-colors">Split Shifts (Adv)</span>
                            </label>
                          </div>
                        </div>

                        {!d.closed && !d.is24h && (
                          <div className="bg-white p-3 rounded-xl border border-gray-100 flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-brown-700">Slot 1:</span>
                              <input 
                                type="time" 
                                value={d.open} 
                                onChange={(e) => handleHourChange(index, 'open', e.target.value)}
                                className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-brown-900 focus:outline-none" 
                              />
                              <span className="text-xs text-gray-400">to</span>
                              <input 
                                type="time" 
                                value={d.close} 
                                onChange={(e) => handleHourChange(index, 'close', e.target.value)}
                                className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-brown-900 focus:outline-none" 
                              />
                            </div>

                            {d.hasSplitShift && (
                              <div className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
                                <span className="text-xs font-semibold text-brown-700">Slot 2 (Dinner):</span>
                                <input 
                                  type="time" 
                                  value={d.open2} 
                                  onChange={(e) => handleHourChange(index, 'open2', e.target.value)}
                                  className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-brown-900 focus:outline-none" 
                                />
                                <span className="text-xs text-gray-400">to</span>
                                <input 
                                  type="time" 
                                  value={d.close2} 
                                  onChange={(e) => handleHourChange(index, 'close2', e.target.value)}
                                  className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-brown-900 focus:outline-none" 
                                />
                              </div>
                            )}
                          </div>
                        )}
                        {!d.closed && d.is24h && (
                          <div className="bg-gold-500/10 border border-gold-500/20 text-gold-700 text-xs px-3 py-2 rounded-xl font-semibold">
                            🕒 Restaurant is open 24 hours continuously on this day.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 5. PRICING */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <SectionHeader id="pricing" label="Pricing" icon={IndianRupee} active={activeSection === 'pricing'} onClick={toggleSection} />
            <AnimatePresence>
              {activeSection === 'pricing' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6 border-t border-gray-50 grid grid-cols-2 gap-4"
                >
                  <FormField label="Average Cost for Two (₹)" icon={IndianRupee} name="avgCostForTwo" type="number" placeholder="e.g. 1200" value={form.avgCostForTwo} onChange={handleFieldChange} />
                  
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-brown-700/60 uppercase tracking-wider mb-1.5 font-sans">Price Category</label>
                    <select 
                      name="priceCategory" 
                      value={form.priceCategory} 
                      onChange={handleFieldChange}
                      className="w-full pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm text-brown-900 bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 cursor-pointer"
                    >
                      {PRICE_CATEGORIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 6. COMBINED SEATING LAYOUT & TABLES */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <SectionHeader id="tables" label="Seating Layout & Tables" icon={LayoutGrid} active={activeSection === 'tables'} onClick={toggleSection} count={form.tableTypes.length} />
            <AnimatePresence>
              {activeSection === 'tables' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6 border-t border-gray-50 space-y-6"
                >
                  {/* Seating Areas Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h3 className="text-xs font-bold text-brown-900 uppercase tracking-wider flex items-center gap-1"><LayoutGrid size={14} className="text-gold-500" /> Seating Areas</h3>
                      <button 
                        type="button" 
                        onClick={addSeatingArea}
                        className="px-2.5 py-1.5 border border-brown-900 hover:bg-brown-900 hover:text-cream-100 text-brown-900 text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus size={12} /> Add Area
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {form.seatingAreas.map((area, index) => (
                        <div key={index} className="border border-gray-100 p-4 rounded-xl bg-gray-50/50 relative space-y-3 shadow-sm">
                          <button 
                            type="button" 
                            onClick={() => removeSeatingArea(index)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                          
                          <div className="space-y-2.5">
                            <input 
                              type="text"
                              placeholder="Area Name (e.g. Rooftop, Private Room)"
                              value={area.name}
                              onChange={(e) => handleSeatingAreaChange(index, 'name', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-brown-900 focus:outline-none"
                            />
                            <input 
                              type="text"
                              placeholder="Description"
                              value={area.description}
                              onChange={(e) => handleSeatingAreaChange(index, 'description', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-brown-800 focus:outline-none"
                            />
                            
                            {/* ADVANCED SEATING FEATURE */}
                            <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2 text-[10px]">
                              <label className="flex items-center gap-1 text-brown-800 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={area.hasAirPurifier || false} 
                                  onChange={(e) => handleSeatingAreaChange(index, 'hasAirPurifier', e.target.checked)}
                                  className="rounded accent-gold-500 scale-75" 
                                />
                                <span className="font-semibold">Air Purifier / Clean AC (Adv)</span>
                              </label>
                              <div className="flex items-center gap-1 font-semibold">
                                <span>Premium Fee (Adv): ₹</span>
                                <input 
                                  type="number"
                                  placeholder="0"
                                  value={area.premiumCharge || ''}
                                  onChange={(e) => handleSeatingAreaChange(index, 'premiumCharge', parseInt(e.target.value) || 0)}
                                  className="w-10 border border-gray-200 rounded text-center text-[10px] py-0.5 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Table Types & Capacity Section */}
                  <div className="space-y-4 border-t border-gray-100 pt-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h3 className="text-xs font-bold text-brown-900 uppercase tracking-wider flex items-center gap-1"><Users size={14} className="text-gold-500" /> Table Types & Capacity</h3>
                      <button 
                        type="button" 
                        onClick={addTableType}
                        className="px-2.5 py-1.5 border border-brown-900 hover:bg-brown-900 hover:text-cream-100 text-brown-900 text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus size={12} /> Add Table Row
                      </button>
                    </div>

                    <div className="space-y-4">
                      {form.tableTypes.map((table, index) => (
                        <div key={index} className="border border-gray-100 p-4 rounded-xl bg-gray-50/50 relative space-y-4 shadow-sm">
                          <button 
                            type="button" 
                            onClick={() => removeTableType(index)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>

                          {/* Base Inputs row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-brown-700/60 uppercase mb-1">Table Name</label>
                              <input 
                                type="text" 
                                placeholder="e.g. 2 Seater Cozy" 
                                value={table.name} 
                                onChange={(e) => handleTableTypeChange(index, 'name', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-brown-900 bg-white" 
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-brown-700/60 uppercase mb-1">Capacity (Pax)</label>
                              <input 
                                type="number" 
                                placeholder="2" 
                                value={table.capacity} 
                                onChange={(e) => handleTableTypeChange(index, 'capacity', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-brown-900 bg-white" 
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-brown-700/60 uppercase mb-1">Quantity</label>
                              <input 
                                type="number" 
                                placeholder="4" 
                                value={table.quantity} 
                                onChange={(e) => handleTableTypeChange(index, 'quantity', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-brown-900 bg-white" 
                              />
                            </div>

                            {/* Seating Area Selection: 2 Checkboxes (mutually exclusive) */}
                            <div>
                              <label className="block text-[10px] font-bold text-brown-700/60 uppercase mb-2">Seating Area Option</label>
                              <div className="flex flex-col gap-1.5 mt-0.5">
                                <label className="flex items-center gap-1.5 text-xs text-brown-850 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={table.seatingArea === 'Indoor Seating'} 
                                    onChange={() => handleTableTypeChange(index, 'seatingArea', 'Indoor Seating')}
                                    className="rounded accent-gold-500 scale-90" 
                                  />
                                  <span className="font-semibold text-brown-800">Indoor Seating</span>
                                </label>
                                <label className="flex items-center gap-1.5 text-xs text-brown-850 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={!table.seatingArea || table.seatingArea === '' || table.seatingArea === 'None / Floating'} 
                                    onChange={() => handleTableTypeChange(index, 'seatingArea', '')}
                                    className="rounded accent-gold-500 scale-90" 
                                  />
                                  <span className="text-gray-500 italic">None / Floating</span>
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* ADVANCED TABLE FEATURE */}
                          <div className="flex flex-wrap gap-4 items-center bg-white border border-gray-100 p-2.5 rounded-lg text-[10px] font-semibold text-brown-800">
                            <span className="text-gold-600 font-bold flex items-center gap-1"><Sparkles size={11} /> Advanced Features:</span>
                            
                            <div className="flex items-center gap-1">
                              <span>Shape:</span>
                              <select
                                value={table.shape || 'Square'}
                                onChange={(e) => handleTableTypeChange(index, 'shape', e.target.value)}
                                className="border border-gray-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                              >
                                <option value="Square">Square</option>
                                <option value="Round">Round</option>
                                <option value="Rectangular">Rectangular</option>
                              </select>
                            </div>

                            <label className="flex items-center gap-1 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={table.isVip || false} 
                                onChange={(e) => handleTableTypeChange(index, 'isVip', e.target.checked)}
                                className="rounded accent-gold-500 scale-75" 
                              />
                              <span>VIP Class</span>
                            </label>

                            <label className="flex items-center gap-1 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={table.isBestseller || false} 
                                onChange={(e) => handleTableTypeChange(index, 'isBestseller', e.target.checked)}
                                className="rounded accent-gold-500 scale-75" 
                              />
                              <span>Bestseller badge</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 7. AMENITIES & HIGHLIGHTS */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <SectionHeader id="amenities" label="Amenities & Ambience Highlights" icon={Sparkles} active={activeSection === 'amenities'} onClick={toggleSection} />
            <AnimatePresence>
              {activeSection === 'amenities' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6 border-t border-gray-50 space-y-5"
                >
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-brown-800 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={14} /> Restaurant Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {AMENITY_OPTIONS.map(item => {
                        const selected = form.amenities.includes(item);
                        return (
                          <button
                            type="button"
                            key={item}
                            onClick={() => toggleAmenity(item)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              selected 
                                ? 'bg-brown-900 text-cream-100 border-brown-900 shadow-sm' 
                                : 'bg-white border-gray-200 text-brown-800 hover:border-gold-500 hover:bg-gold-50/20'
                            }`}
                          >
                            {selected && <Check size={12} />}
                            <span>{item}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-brown-800 uppercase tracking-widest flex items-center gap-1.5"><Sparkles size={14} /> Ambience Highlights & Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {HIGHLIGHT_OPTIONS.map(item => {
                        const selected = form.highlights.includes(item);
                        return (
                          <button
                            type="button"
                            key={item}
                            onClick={() => toggleHighlight(item)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              selected 
                                ? 'bg-gold-500 text-brown-900 border-gold-600 shadow-sm' 
                                : 'bg-white border-gray-200 text-brown-800 hover:border-gold-500 hover:bg-gold-50/20'
                            }`}
                          >
                            {selected && <Check size={12} />}
                            <span>{item}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 items-center mt-3 max-w-sm">
                      <input 
                        type="text" 
                        name="customHighlight"
                        value={form.customHighlight}
                        onChange={handleFieldChange}
                        placeholder="Add custom highlight..."
                        className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/20 w-full"
                      />
                      <button 
                        type="button" 
                        onClick={addCustomHighlight}
                        className="px-3 py-1.5 bg-brown-900 text-cream-100 text-xs font-semibold rounded-xl cursor-pointer hover:bg-gold-500 hover:text-brown-900 transition-all flex items-center gap-1"
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 8. MENU HIGHLIGHTS */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <SectionHeader id="menu" label="Menu Highlights" icon={FileText} active={activeSection === 'menu'} onClick={toggleSection} count={form.menuHighlights.length} />
            <AnimatePresence>
              {activeSection === 'menu' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6 border-t border-gray-50 space-y-4"
                >
                  <div className="flex gap-2 items-center max-w-lg">
                    <input 
                      type="text" 
                      name="customMenuHighlight"
                      value={form.customMenuHighlight}
                      onChange={handleFieldChange}
                      placeholder="e.g. Mysore Masala Dosa (Breakfast): ₹120 - Saffron ghee roasted"
                      className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/20 w-full"
                    />
                    <button 
                      type="button" 
                      onClick={addMenuHighlight}
                      className="px-3 py-2 bg-brown-900 text-cream-100 text-xs font-semibold rounded-xl cursor-pointer hover:bg-gold-500 hover:text-brown-900 transition-all flex items-center gap-1 shrink-0"
                    >
                      <Plus size={12} /> Add Dish
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {form.menuHighlights.map(tag => (
                      <div 
                        key={tag}
                        className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-brown-900 flex items-center gap-2"
                      >
                        <span>{tag}</span>
                        <button 
                          type="button"
                          onClick={() => removeMenuHighlight(tag)}
                          className="text-gray-400 hover:text-red-500 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {form.menuHighlights.length === 0 && (
                      <span className="text-xs text-gray-400 italic">No dishes added. Type a dish description above and click Add.</span>
                    )}
                  </div>

                  {/* AI Menu Digitizer */}
                  <div className="bg-gold-50/40 border border-gold-500/15 p-4 rounded-xl space-y-2 mt-4">
                    <h4 className="font-bold text-brown-900 text-xs flex items-center gap-1">
                      <Sparkles size={14} className="text-gold-500" /> AI Menu Digitizer (Beta)
                    </h4>
                    <p className="text-[10px] text-brown-700/80">Upload a photo of your physical menu to extract items directly using Google Gemini AI.</p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleMenuImageUpload}
                        className="hidden" 
                        id="menu-file-upload"
                      />
                      <label 
                        htmlFor="menu-file-upload"
                        className="px-3 py-2 border border-gray-200 bg-white text-brown-900 text-xs font-semibold rounded-xl hover:bg-gray-50 cursor-pointer"
                      >
                        {menuImage ? "Change Photo" : "Upload Menu Photo"}
                      </label>
                      {menuImage && (
                        <button
                          type="button"
                          onClick={digitizeMenu}
                          disabled={digitizing}
                          className="px-3 py-2 bg-brown-900 text-cream-100 text-xs font-bold rounded-xl cursor-pointer hover:bg-gold-500 hover:text-brown-900 disabled:opacity-50 transition-all flex items-center gap-1.5"
                        >
                          {digitizing ? (
                            <div className="w-3.5 h-3.5 border-2 border-cream-100/30 border-t-cream-100 rounded-full animate-spin" />
                          ) : (
                            <Sparkles size={12} />
                          )}
                          <span>Digitize with AI</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 9. GALLERY */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <SectionHeader id="gallery" label="Photo Gallery & Cover Photo" icon={ImageIcon} active={activeSection === 'gallery'} onClick={toggleSection} count={form.gallery.length} />
            <AnimatePresence>
              {activeSection === 'gallery' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6 border-t border-gray-50 space-y-6"
                >
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-brown-800 uppercase tracking-widest">Cover Photo *</label>
                    {errors.coverImage && <span className="text-xs text-red-500 block font-bold">{errors.coverImage}</span>}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageFile(e, 'cover')}
                      className="hidden" 
                      id="cover-upload-btn"
                    />
                    
                    <div className="relative w-full h-48 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gold-500 transition-all overflow-hidden bg-gray-50 flex items-center justify-center group cursor-pointer">
                      {form.coverImage ? (
                        <>
                          <img src={form.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                          <div 
                            onClick={() => document.getElementById('cover-upload-btn').click()}
                            className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1"
                          >
                            <ImageIcon size={22} className="text-gold-500" />
                            <span className="text-xs font-semibold">Change Cover Image</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setForm(prev => ({ ...prev, coverImage: '' }));
                            }}
                            className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors z-10 shadow-lg cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <div 
                          onClick={() => document.getElementById('cover-upload-btn').click()}
                          className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 hover:text-gold-500 transition-colors p-4 text-center"
                        >
                          <ImageIcon size={30} className="mb-1 text-gray-300 group-hover:text-gold-500" />
                          <span className="text-xs font-bold text-brown-900/80">Click to Upload Cover Image</span>
                          <span className="text-[10px] text-gray-400 mt-1">Supports JPEG, PNG, WEBP</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-brown-800 uppercase tracking-widest">Multi-Image Gallery</label>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={(e) => handleImageFile(e, 'gallery')}
                        className="hidden" 
                        id="gallery-upload-btn"
                      />
                      <label
                        htmlFor="gallery-upload-btn"
                        className="px-3 py-1.5 border border-brown-900 hover:bg-brown-900 hover:text-cream-100 text-brown-900 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus size={14} /> Add Gallery Images
                      </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {form.gallery.map((img, index) => (
                        <div key={index} className="relative group rounded-xl border border-gray-100 overflow-hidden shadow-sm aspect-video bg-gray-50 flex flex-col justify-between">
                          <img src={img.url} alt="Gallery item" className="w-full h-20 object-cover" />
                          <div className="absolute top-1 right-1 flex gap-1">
                            <button
                              type="button"
                              onClick={() => setAsCoverImage(img.url)}
                              className="bg-white/90 hover:bg-gold-500 text-brown-900 rounded-full p-1 transition-colors cursor-pointer"
                              title="Set as Cover Image"
                            >
                              <Check size={10} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(index)}
                              className="bg-white/90 hover:bg-red-500 hover:text-white text-gray-500 rounded-full p-1 transition-colors cursor-pointer"
                            >
                              <X size={10} />
                            </button>
                          </div>

                          <select
                            value={img.category}
                            onChange={(e) => changeGalleryCategory(index, e.target.value)}
                            className="w-full border-t border-gray-100 text-[10px] py-1 px-1.5 text-brown-800 bg-white focus:outline-none focus:ring-0 cursor-pointer"
                          >
                            {GALLERY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </form>

        {/* Sticky Action Footer */}
        <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3 z-20">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 font-semibold text-xs text-brown-900 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-yellow-400 text-brown-900 font-bold text-xs rounded-xl shadow-lg hover:shadow-xl hover:from-yellow-400 hover:to-gold-500 disabled:opacity-60 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-brown-900/30 border-t-brown-900 rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>

      </motion.div>
    </motion.div>
  );
};

export default EditRestaurantForm;
