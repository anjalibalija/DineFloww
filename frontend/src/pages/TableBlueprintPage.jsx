import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, Calendar, Clock, Users, ShieldCheck, CreditCard, IndianRupee, ZoomIn, ZoomOut, RotateCcw, RotateCw, RefreshCw, Eye, Heart, Briefcase, Wine, HelpCircle, AlertCircle, Check, Trash2, Compass, ArrowLeft, Utensils, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// Booking fee in INR (₹99 reservation fee)
const BOOKING_FEE = 99;

// Dynamically load Razorpay script
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const CATEGORY_PREVIEWS = {
  'VIP Private Cabins': {
    image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    description: 'Tucked away in our signature private glass alcoves. Features plush leather booths, dimmable gold lighting, and premium acoustic shielding for absolute privacy.',
    ambiance: 'VIP Cabin · Quiet & Romantic',
    noise: 'Very Low'
  },
  'Window Side (Scenic View)': {
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    description: 'Breathtaking seat right next to the grand floor-to-ceiling glass panel windows. Perfect views of the evening skyline and vibrant streets.',
    ambiance: 'Scenic View · Romantic & Serene',
    noise: 'Low'
  },
  'Bar & Lounge': {
    image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    description: 'Lively high-top seating situated near the central illuminated marble bar counter. Perfect for social groups and viewing live mixologist craft.',
    ambiance: 'Bar Side · Social & Energetic',
    noise: 'Lively'
  },
  'Main Dining Hall': {
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    description: 'At the heart of the restaurant, directly under the grand crystal chandelier. Captures the vibrant dining crowd energy with swift butler access.',
    ambiance: 'Dining Hall · Grand & Classic',
    noise: 'Normal'
  },
  'Rooftop': {
    image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    description: 'Open-air dining experience on our garden terrace. Enjoy the gentle evening breeze, candlelit tables, and starlit sky views.',
    ambiance: 'Rooftop · Open Air & Breezy',
    noise: 'Moderate'
  },
  'Corner Side': {
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    description: 'Cosy, semi-secluded corner table. Offers a relaxed vantage point of the entire restaurant, providing intimacy without complete separation.',
    ambiance: 'Corner · Cozy & Cozy',
    noise: 'Low'
  },
  'Courtyard': {
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    description: 'Seated in our indoor botanical courtyard surrounded by lush cascading ivy and a tranquil stone water fountain.',
    ambiance: 'Courtyard · Botanical & Peaceful',
    noise: 'Very Low'
  },
  'Family Table': {
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    description: 'Spacious round banquet table designed to comfortably accommodate large groups and families, close to child-friendly dining facilities.',
    ambiance: 'Family Hall · Warm & Social',
    noise: 'Normal'
  },
  'Couple Table': {
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    description: 'Intimate candlelit seating designed specifically for couples. Set in a quiet area with soft romantic backlighting.',
    ambiance: 'Couples · Cozy & Intimate',
    noise: 'Low'
  },
  'Outdoor': {
    image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    description: 'Relaxing outdoor seating option. Enjoy your meal in the open air with a pleasant atmosphere.',
    ambiance: 'Outdoor · Fresh Air & Open Sky',
    noise: 'Moderate'
  }
};

const getPreviewData = (category) => {
  const norm = (category || '').toLowerCase();
  if (norm.includes('rooftop')) return CATEGORY_PREVIEWS['Rooftop'];
  if (norm.includes('vip') || norm.includes('cabin') || norm.includes('private')) return CATEGORY_PREVIEWS['VIP Private Cabins'];
  if (norm.includes('window') || norm.includes('scenic')) return CATEGORY_PREVIEWS['Window Side (Scenic View)'];
  if (norm.includes('bar') || norm.includes('lounge')) return CATEGORY_PREVIEWS['Bar & Lounge'];
  if (norm.includes('corner')) return CATEGORY_PREVIEWS['Corner Side'];
  if (norm.includes('courtyard')) return CATEGORY_PREVIEWS['Courtyard'];
  if (norm.includes('family')) return CATEGORY_PREVIEWS['Family Table'];
  if (norm.includes('couple') || norm.includes('romantic')) return CATEGORY_PREVIEWS['Couple Table'];
  if (norm.includes('outdoor')) return CATEGORY_PREVIEWS['Outdoor'];
  return CATEGORY_PREVIEWS['Main Dining Hall'];
};

const getDynamicDescription = (table) => {
  if (!table) return '';
  if (table.description && table.description.trim()) {
    return table.description;
  }
  return 'No specific description provided for this table.';
};

const TableBlueprintPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedDishes, setSelectedDishes] = useState(location.state?.preOrder || []);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const { user } = useAuth();

  const menuItems = useMemo(() => {
    if (!restaurant?.menuHighlights) return [];
    const hasNewlines = restaurant.menuHighlights.includes('\n');
    const itemsList = hasNewlines
      ? restaurant.menuHighlights.split('\n').map(h => h.trim()).filter(Boolean)
      : restaurant.menuHighlights.split(',').map(h => h.trim()).filter(Boolean);

    return itemsList.map(h => {
      const regex = /(.*?)(?:\((.*?)\))?:\s*(?:[₹$])?([^\s-]*)\s*(?:-\s*(.*))?/;
      const match = h.match(regex);
      if (match) {
        const category = match[2] ? match[2].trim() : 'Signature';
        const lowerName = match[1].toLowerCase();
        const isVeg = !lowerName.includes('chicken') && !lowerName.includes('salmon') && !lowerName.includes('fish') && !lowerName.includes('mutton') && !lowerName.includes('meat') && !lowerName.includes('egg') && !lowerName.includes('pepperoni') && !lowerName.includes('bacon');
        return {
          name: match[1].trim(),
          category: category.charAt(0).toUpperCase() + category.slice(1),
          price: match[3].trim(),
          description: match[4] ? match[4].trim() : '',
          isVeg,
          isChefSpecial: lowerName.includes('truffle') || lowerName.includes('special') || lowerName.includes('decadence') || lowerName.includes('martini')
        };
      }
      return { name: h.trim(), category: 'Signature', price: '', description: '', isVeg: true, isChefSpecial: false };
    });
  }, [restaurant?.menuHighlights]);

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map(item => item.category));
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesTab = activeTab === 'All' || item.category === activeTab;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [menuItems, activeTab, searchQuery]);

  const toggleSelectDish = (dish) => {
    setSelectedDishes(prev => {
      const exists = prev.find(d => d.name === dish.name);
      if (exists) {
        return prev.filter(d => d.name !== dish.name);
      } else {
        return [...prev, dish];
      }
    });
  };

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getSensibleDefaultTime = () => {
    const now = new Date();
    let hours = now.getHours() + 1;
    if (hours > 22 || hours < 11) {
      return '19:00';
    }
    return `${String(hours).padStart(2, '0')}:00`;
  };

  const [tables, setTables] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getSensibleDefaultTime());
  const [guests, setGuests] = useState(2);
  const [request, setRequest] = useState('');
  const [manualPreOrder, setManualPreOrder] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // AI Suggestion
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [is3dMode, setIs3dMode] = useState(false);
  const [occasion, setOccasion] = useState('date');

  // Advanced States: 3D Camera Controls
  const [zoom, setZoom] = useState(1.0);
  const [tilt, setTilt] = useState(52); // X axis rotation
  const [spin, setSpin] = useState(-34); // Z axis rotation

  // Advanced States: Interactive Filters
  const [selectedVibe, setSelectedVibe] = useState('romantic');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  // Watch for booking parameter changes to auto-reset invalid selected table
  useEffect(() => {
    if (selectedTable) {
      const isReserved = isTableReserved(selectedTable);
      const isOverCapacity = parseInt(guests, 10) > selectedTable.capacity;
      if (isReserved || isOverCapacity) {
        setSelectedTable(null);
      }
    }
  }, [date, time, guests]);

  const applyVibePreset = (vibe) => {
    setSelectedVibe(vibe);
    let targetOccasion = 'social';
    
    if (vibe === 'romantic') {
      targetOccasion = 'date';
    } else if (vibe === 'scenic') {
      targetOccasion = 'date';
    } else if (vibe === 'quiet') {
      targetOccasion = 'business';
    } else if (vibe === 'social') {
      targetOccasion = 'social';
    } else if (vibe === 'family') {
      targetOccasion = 'family';
    }

    setOccasion(targetOccasion);
    
    // Find highest matching available table
    const availableTables = tables.filter(t => {
      if (isTableReserved(t)) return false;
      if (parseInt(guests, 10) > t.capacity) return false;
      return true;
    });

    if (availableTables.length > 0) {
      let bestTable = null;
      let highestScore = -1;
      
      availableTables.forEach(t => {
        const analysis = getTableMatchAnalysisWithParams(t, targetOccasion, guests);
        if (analysis.score > highestScore) {
          highestScore = analysis.score;
          bestTable = t;
        }
      });
      
      if (bestTable) {
        setSelectedTable(bestTable);
        // Reset camera focus zoom
        setZoom(1.1);
        if (window.innerWidth < 1024) {
          setTimeout(() => {
            document.getElementById('booking-sidebar')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    }
  };

  // Advanced States: Hover Tooltip
  const [hoveredTable, setHoveredTable] = useState(null);

  const getTableMatchAnalysisWithParams = (table, currOccasion, currGuests) => {
    if (!table) return null;
    const cat = (table.category || '').toLowerCase();
    const cap = table.capacity;
    
    let score = 70;
    let reasons = [];

    // Capacity checking
    const guestNum = parseInt(currGuests, 10) || 2;
    if (guestNum === cap) {
      score += 20;
      reasons.push("Perfect capacity match for your party size");
    } else if (guestNum < cap) {
      if (cap - guestNum <= 2) {
        score += 10;
        reasons.push("Comfortably spacious seating");
      } else {
        score += 2;
        reasons.push("Spacious seating (oversized for your party)");
      }
    } else {
      score -= 40;
      reasons.push("Table capacity is too small for your party");
    }

    // Occasion specific checks
    if (currOccasion === 'date') {
      if (cat.includes('window') || cat.includes('couple') || cat.includes('romantic')) {
        score += 15;
        reasons.push("Intimate seating with romantic scenic views");
      } else if (cat.includes('vip') || cat.includes('cabin')) {
        score += 8;
        reasons.push("Private alcove offering excellent personal space");
      } else if (cat.includes('bar') || cat.includes('lounge')) {
        score -= 20;
        reasons.push("Lively bar zone is too energetic for a date");
      } else {
        reasons.push("Standard table in the main dining hall");
      }
    } else if (currOccasion === 'family') {
      if (cat.includes('family') || cat.includes('courtyard')) {
        score += 15;
        reasons.push("Large table in family-friendly courtyard zone");
      } else if (cap < 4) {
        score -= 25;
        reasons.push("Designed for couples; too small for family style");
      } else {
        reasons.push("Spacious seating suitable for family");
      }
    } else if (currOccasion === 'business') {
      if (cat.includes('vip') || cat.includes('cabin') || cat.includes('corner')) {
        score += 15;
        reasons.push("Semi-private area ideal for confidential discussion");
      } else if (cat.includes('bar') || cat.includes('lounge')) {
        score -= 35;
        reasons.push("Bar noise level is not suitable for meetings");
      } else {
        reasons.push("Standard table suitable for quick business meals");
      }
    } else if (currOccasion === 'social') {
      if (cat.includes('bar') || cat.includes('lounge') || cat.includes('rooftop')) {
        score += 20;
        reasons.push("Energetic, interactive bar/lounge vibe");
      } else if (cat.includes('vip') || cat.includes('cabin')) {
        score -= 15;
        reasons.push("VIP cabins are too secluded for social mixing");
      } else {
        reasons.push("Main hall seating close to social buzz");
      }
    }

    // Ambiance features
    if (table.bookingCount > 6) {
      score += 5;
      reasons.push("Highly popular table with top ratings");
    }

    const finalScore = Math.min(Math.max(score, 10), 100);
    return { score: finalScore, reasons };
  };

  const getTableMatchAnalysis = (table) => {
    return getTableMatchAnalysisWithParams(table, occasion, guests);
  };

  // Live Dynamic Availability Checker
  const isTableReserved = (table) => {
    if (!date || !time) {
      // Mock fallback reservations if no date/time input is selected yet
      return table.tableNumber === 'T3' || table.tableNumber === 'T7' || table.tableNumber === 'T10';
    }
    const selectedDateStr = new Date(date).toDateString();
    
    // Check database bookings
    const dbReserved = table.bookings?.some(b => {
      const bDateStr = new Date(b.bookingDate).toDateString();
      return bDateStr === selectedDateStr && b.bookingTime === time;
    });

    if (dbReserved) return true;

    // Dynamically simulate reservations based on selected date & time to make map look "alive"
    const parsedHour = parseInt(time.split(':')[0]) || 18;
    const parsedDay = new Date(date).getDay() || 0;
    
    if (parsedHour >= 19 && parsedHour <= 21) {
      if (table.tableNumber === 'T2' || table.tableNumber === 'T8') return true;
    }
    if (parsedDay === 0 || parsedDay === 6) {
      if (table.tableNumber === 'T1' || table.tableNumber === 'T6') return true;
    }

    return false;
  };

  const getLandmarkRatings = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('vip') || cat.includes('cabin')) {
      return { privacy: 5, scenic: 2, social: 1, service: 5 };
    }
    if (cat.includes('window') || cat.includes('scenic')) {
      return { privacy: 3, scenic: 5, social: 3, service: 4 };
    }
    if (cat.includes('bar') || cat.includes('lounge')) {
      return { privacy: 1, scenic: 2, social: 5, service: 5 };
    }
    if (cat.includes('courtyard')) {
      return { privacy: 4, scenic: 4, social: 2, service: 4 };
    }
    if (cat.includes('family')) {
      return { privacy: 2, scenic: 2, social: 4, service: 4 };
    }
    if (cat.includes('couple') || cat.includes('romantic')) {
      return { privacy: 4, scenic: 3, social: 2, service: 4 };
    }
    if (cat.includes('outdoor') || cat.includes('rooftop')) {
      return { privacy: 3, scenic: 4, social: 3, service: 4 };
    }
    return { privacy: 3, scenic: 3, social: 3, service: 4 };
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5 text-gold-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="text-xs">
            {i < rating ? '★' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tablesRes, restaurantRes, aiRes] = await Promise.all([
          axios.get(`/api/restaurants/${id}/tables`),
          axios.get(`/api/restaurants/${id}`),
          axios.post('/api/ai/table-suggestion', { restaurantId: id })
        ]);

        const rawTables = tablesRes.data.data;
        const allUnpositioned = rawTables.every(t => !t.positionX && !t.positionY);
        const PREDEFINED_POSITIONS = [
          { x: 34.0, y: 11.0 }, // Scenic Window 1
          { x: 48.0, y: 11.0 }, // Scenic Window 2
          { x: 62.0, y: 11.0 }, // Scenic Window 3
          { x: 12.5, y: 45.0 }, // VIP Cabin 1
          { x: 12.5, y: 68.0 }, // VIP Cabin 2
          { x: 85.0, y: 11.0 }, // Bar Lounge 1
          { x: 85.0, y: 75.0 }, // Bar Lounge 2
          { x: 36.0, y: 45.0 }, // Main Dining Center 1
          { x: 62.0, y: 45.0 }, // Main Dining Center 2
          { x: 36.0, y: 68.0 }, // Main Dining Center 3
          { x: 62.0, y: 68.0 }, // Main Dining Center 4
          { x: 49.0, y: 80.0 }  // Main Dining Entrance Center
        ];

        const positionedTables = rawTables.map((t, index) => {
          const isUnpositioned = (allUnpositioned || (!t.positionX && !t.positionY));
          const posX = isUnpositioned 
            ? PREDEFINED_POSITIONS[index % PREDEFINED_POSITIONS.length].x 
            : t.positionX;
          const posY = isUnpositioned 
            ? PREDEFINED_POSITIONS[index % PREDEFINED_POSITIONS.length].y 
            : t.positionY;

          // Align database category with physical visual zones on floor plan as fallback if empty
          let alignedCategory = t.category;
          if (!alignedCategory) {
            if (posX < 25) {
              alignedCategory = 'VIP Private Cabins';
            } else if (posX > 75) {
              alignedCategory = 'Bar & Lounge';
            } else if (posY <= 20) {
              alignedCategory = 'Window Side (Scenic View)';
            } else {
              // Distribute central dining categories based on index to add flavor variety
              const centerCategories = ['Main Dining Hall', 'Courtyard', 'Family Table', 'Couple Table', 'Corner Side', 'Rooftop'];
              alignedCategory = centerCategories[index % centerCategories.length];
            }
          }

          return {
            ...t,
            positionX: posX,
            positionY: posY,
            category: alignedCategory
          };
        });

        setTables(positionedTables);
        setRestaurant(restaurantRes.data.data);
        setAiSuggestion(aiRes.data.data);
      } catch (err) {
        console.error('Failed to fetch blueprint data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const handleResize = () => {
      const parent = document.getElementById('floor-plan-parent');
      if (parent) {
        const parentWidth = parent.clientWidth;
        const computedZoom = Math.min(parentWidth / 740, 1.0);
        setZoom(computedZoom);
      }
    };

    if (!loading) {
      const timer = setTimeout(handleResize, 100);
      window.addEventListener('resize', handleResize);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [loading]);

  const handlePayAndBook = async (e) => {
    e.preventDefault();
    if (!selectedTable) return;

    setIsSubmitting(true);
    setBookingError('');

    try {
      // Step 1: Load Razorpay script
      const loaded = await loadRazorpay();
      if (!loaded) {
        setBookingError('Failed to load payment gateway. Please check your internet connection.');
        setIsSubmitting(false);
        return;
      }

      // Step 2: Create Razorpay order on backend
      const orderRes = await axios.post('/api/payment/create-order', {
        amount: BOOKING_FEE,
        currency: 'INR',
        receipt: `booking_${Date.now()}`
      });

      const order = orderRes.data.data;

      // Step 3: Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Dine Flow',
        description: `Table ${selectedTable.tableNumber} Reservation`,
        image: '/logo.png',
        order_id: order.id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: ''
        },
        notes: {
          restaurantId: id,
          tableId: selectedTable.id
        },
        theme: { color: '#78350f' }, // brown-900
        config: {
          display: {
            blocks: {
              upi: {
                name: 'UPI / QR Code',
                instruments: [
                  {
                    method: 'upi',
                    flows: ['qr', 'intent', 'collect']
                  }
                ]
              }
            },
            sequence: ['block.upi', 'block.other'],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            setBookingError('Payment was cancelled. Your table has not been booked.');
          }
        },
        handler: async (response) => {
          // Step 4: Verify payment + create booking on backend
          try {
            await axios.post('/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              restaurantId: id,
              tableId: selectedTable.id,
              bookingDate: date,
              bookingTime: time,
              peopleCount: guests,
              specialRequest: [
                selectedDishes.length > 0 ? `[Pre-Order: ${selectedDishes.map(d => `${d.name} (${d.price})`).join(', ')}]` : '',
                manualPreOrder ? `[Manual Pre-Order: ${manualPreOrder}]` : '',
                request ? `[Request: ${request}]` : ''
              ].filter(Boolean).join(' | ')
            });
            setPaymentSuccess(true);
            setTimeout(() => navigate('/dashboard'), 2500);
          } catch (err) {
            setBookingError(err.response?.data?.message || 'Payment succeeded but booking failed. Please contact support.');
            setIsSubmitting(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setBookingError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center font-serif text-2xl text-brown-900">
      <div className="flex flex-col items-center gap-3">
        <Sparkles className="animate-spin text-gold-500" size={32} />
        <span>Preparing Interactive Floor Plan...</span>
      </div>
    </div>
  );

  const totalCount = tables.length || 12;
  const reservedCount = tables.filter(t => isTableReserved(t)).length;
  const availableCount = totalCount - reservedCount;
  const percentAvailable = totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 100;

  const isTableMatchFilter = (table) => {
    if (availabilityFilter === 'available' && isTableReserved(table)) {
      return false;
    }

    return true;
  };

  const zoneSummary = {
    vip: { name: 'VIP Glass Cabins', total: 0, available: 0 },
    window: { name: 'Scenic Windows', total: 0, available: 0 },
    bar: { name: 'Cocktail Bar & Lounge', total: 0, available: 0 },
    main: { name: 'Grand Dining Hall', total: 0, available: 0 }
  };

  tables.forEach(t => {
    const cat = (t.category || '').toLowerCase();
    const isReserved = isTableReserved(t);
    let zone = 'main';
    if (cat.includes('vip') || cat.includes('cabin')) zone = 'vip';
    else if (cat.includes('window')) zone = 'window';
    else if (cat.includes('bar') || cat.includes('lounge')) zone = 'bar';

    zoneSummary[zone].total += 1;
    if (!isReserved) {
      zoneSummary[zone].available += 1;
    }
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-brown-900 mb-1">Interactive Floor Plan</h1>
          {restaurant && (
            <p className="text-brown-700/70 font-medium">📍 {restaurant.name}</p>
          )}
        </div>
        
        {/* Toggle Switch */}
        <div className="bg-brown-50 p-1.5 rounded-xl border border-gold-500/10 flex gap-2 self-start md:self-auto shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => setIs3dMode(false)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${!is3dMode ? 'bg-brown-900 text-gold-500 shadow-sm' : 'text-brown-900 hover:bg-gold-500/10'}`}
          >
            2D Standard
          </button>
          <button
            type="button"
            onClick={() => setIs3dMode(true)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${is3dMode ? 'bg-brown-900 text-gold-500 shadow-sm' : 'text-brown-900 hover:bg-gold-500/10'}`}
          >
            <Sparkles size={12} /> 3D Isometric View
          </button>
        </div>
      </div>
      <p className="text-brown-700/60 text-sm mb-8 -mt-2">Select your preferred table, then complete payment to confirm your booking.</p>

      {aiSuggestion && (
        <div className="bg-gradient-to-r from-gold-50/40 via-amber-50/20 to-transparent border border-gold-500/15 p-4 rounded-2xl mb-8 flex items-start gap-4 shadow-sm">
          <div className="bg-brown-900 text-gold-500 p-2.5 rounded-xl shrink-0 shadow">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-brown-900 text-sm">DineFlow Recommendation: {aiSuggestion.suggestedCategory}</h4>
            <p className="text-brown-700/80 text-xs mt-1 leading-relaxed">{aiSuggestion.reason}</p>
          </div>
        </div>
      )}

      {/* Payment Success Banner */}
      <AnimatePresence>
        {paymentSuccess && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-brown-900 text-gold-500 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-base font-semibold border border-gold-500/20">
            <ShieldCheck size={22} className="text-gold-500" /> Payment successful! Booking confirmed. Redirecting...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Parameters & Advanced Filter Controls Panel */}
      <div className="bg-brown-900 text-gold-50 border border-gold-500/20 p-6 rounded-[2.5rem] mb-6 shadow-2xl relative overflow-hidden z-20">
        {/* Subtle decorative background shine */}
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/5 via-transparent to-gold-500/5 pointer-events-none" />
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10">
          {/* 1. Date selection */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold text-gold-500/70 tracking-wider flex items-center gap-1">
              <Calendar size={10} /> Booking Date
            </label>
            <input 
              type="date" 
              required 
              value={date} 
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              autoComplete="one-time-code"
              className="w-full bg-white/10 hover:bg-white/15 border border-gold-500/20 rounded-xl px-3 py-2 text-xs text-white font-semibold outline-none focus:border-gold-500 transition cursor-pointer"
            />
          </div>

          {/* 2. Time selection */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold text-gold-500/70 tracking-wider flex items-center gap-1">
              <Clock size={10} /> Dinner Time
            </label>
            <input 
              type="time" 
              required 
              value={time} 
              onChange={e => setTime(e.target.value)}
              autoComplete="one-time-code"
              className="w-full bg-white/10 hover:bg-white/15 border border-gold-500/20 rounded-xl px-3 py-2 text-xs text-white font-semibold outline-none focus:border-gold-500 transition cursor-pointer"
            />
          </div>

          {/* 3. Guests count */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold text-gold-500/70 tracking-wider flex items-center gap-1">
              <Users size={10} /> Guests
            </label>
            <div className="flex items-center bg-white/10 border border-gold-500/20 rounded-xl overflow-hidden">
              <button 
                type="button" 
                onClick={() => setGuests(g => Math.max(1, g - 1))}
                className="px-2.5 py-2 text-xs font-bold hover:bg-white/5 text-gold-500 cursor-pointer outline-none border-r border-gold-500/10"
              >
                -
              </button>
              <span className="flex-1 text-center text-xs font-bold text-white">{guests}</span>
              <button 
                type="button" 
                onClick={() => setGuests(g => Math.min(12, g + 1))}
                className="px-2.5 py-2 text-xs font-bold hover:bg-white/5 text-gold-500 cursor-pointer outline-none border-l border-gold-500/10"
              >
                +
              </button>
            </div>
          </div>

          {/* 4. Occasion Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold text-gold-500/70 tracking-wider flex items-center gap-1">
              <Compass size={10} /> Occasion
            </label>
            <select 
              value={occasion} 
              onChange={(e) => setOccasion(e.target.value)}
              className="w-full bg-[#2D1B10] border border-gold-500/20 rounded-xl px-3 py-2 text-xs text-white font-semibold outline-none focus:border-gold-500 cursor-pointer hover:bg-[#3d2719] transition"
            >
              <option value="date">💑 Romantic Date</option>
              <option value="family">👪 Family Dinner</option>
              <option value="business">💼 Business Meeting</option>
              <option value="social">🍹 Casual / Social</option>
            </select>
          </div>

          {/* 5. Availability Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold text-gold-500/70 tracking-wider">Status</label>
            <select 
              value={availabilityFilter} 
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full bg-[#2D1B10] border border-gold-500/20 rounded-xl px-3 py-2 text-xs text-white font-semibold outline-none focus:border-gold-500 cursor-pointer hover:bg-[#3d2719] transition"
            >
              <option value="all">Show All</option>
              <option value="available">Available Only</option>
            </select>
          </div>
        </div>

        {/* Separator line inside header panel */}
        <div className="h-px bg-gold-500/10 my-4" />

        {/* Row for Vibe Assistant and 3D Camera reset */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 text-xs">
          {/* Vibe Assistant shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-gold-500 flex items-center gap-1">
              <Sparkles size={12} className="text-gold-500 animate-pulse" /> Vibe Match Finder:
            </span>
            <button 
              type="button"
              onClick={() => applyVibePreset('romantic')} 
              className={`px-3 py-1.5 rounded-full border text-[11px] font-bold cursor-pointer transition-all duration-300 flex items-center gap-1.5 ${
                selectedVibe === 'romantic'
                  ? 'bg-gold-500 text-brown-900 border-gold-500 shadow-md shadow-gold-500/25'
                  : 'bg-white/5 hover:bg-white/10 text-gold-100 border-gold-500/20'
              }`}
            >
              <Heart size={11} className={selectedVibe === 'romantic' ? 'fill-current' : ''} /> Intimate Date
            </button>
            <button 
              type="button"
              onClick={() => applyVibePreset('scenic')} 
              className={`px-3 py-1.5 rounded-full border text-[11px] font-bold cursor-pointer transition-all duration-300 flex items-center gap-1.5 ${
                selectedVibe === 'scenic'
                  ? 'bg-gold-500 text-brown-900 border-gold-500 shadow-md shadow-gold-500/25'
                  : 'bg-white/5 hover:bg-white/10 text-gold-100 border-gold-500/20'
              }`}
            >
              🌅 Skyline Window
            </button>
            <button 
              type="button"
              onClick={() => applyVibePreset('quiet')} 
              className={`px-3 py-1.5 rounded-full border text-[11px] font-bold cursor-pointer transition-all duration-300 flex items-center gap-1.5 ${
                selectedVibe === 'quiet'
                  ? 'bg-gold-500 text-brown-900 border-gold-500 shadow-md shadow-gold-500/25'
                  : 'bg-white/5 hover:bg-white/10 text-gold-100 border-gold-500/20'
              }`}
            >
              <Briefcase size={11} /> Secluded Cabin
            </button>
            <button 
              type="button"
              onClick={() => applyVibePreset('social')} 
              className={`px-3 py-1.5 rounded-full border text-[11px] font-bold cursor-pointer transition-all duration-300 flex items-center gap-1.5 ${
                selectedVibe === 'social'
                  ? 'bg-gold-500 text-brown-900 border-gold-500 shadow-md shadow-gold-500/25'
                  : 'bg-white/5 hover:bg-white/10 text-gold-100 border-gold-500/20'
              }`}
            >
              <Wine size={11} /> Social Bar
            </button>
            <button 
              type="button"
              onClick={() => applyVibePreset('family')} 
              className={`px-3 py-1.5 rounded-full border text-[11px] font-bold cursor-pointer transition-all duration-300 flex items-center gap-1.5 ${
                selectedVibe === 'family'
                  ? 'bg-gold-500 text-brown-900 border-gold-500 shadow-md shadow-gold-500/25'
                  : 'bg-white/5 hover:bg-white/10 text-gold-100 border-gold-500/20'
              }`}
            >
              👪 Courtyard Banquet
            </button>
          </div>

          {/* Camera controls in 3D Mode */}
          {is3dMode ? (
            <div className="flex items-center gap-3 border-t border-gold-500/10 md:border-t-0 pt-2 md:pt-0">
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-bold text-gold-500/50 uppercase mr-1">Zoom</span>
                <button type="button" onClick={() => setZoom(z => Math.max(0.6, z - 0.1))} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 border border-gold-500/25 flex items-center justify-center text-gold-500 cursor-pointer shadow-sm"><ZoomOut size={10} /></button>
                <span className="text-[10px] font-mono font-bold text-white w-8 text-center">{Math.round(zoom * 100)}%</span>
                <button type="button" onClick={() => setZoom(z => Math.min(1.6, z + 0.1))} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 border border-gold-500/25 flex items-center justify-center text-gold-500 cursor-pointer shadow-sm"><ZoomIn size={10} /></button>
              </div>

              <div className="flex items-center gap-1 border-l border-gold-500/10 pl-3">
                <span className="text-[8px] font-bold text-gold-500/50 uppercase mr-1">Rot</span>
                <button type="button" onClick={() => setSpin(s => s - 15)} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 border border-gold-500/25 flex items-center justify-center text-gold-500 cursor-pointer shadow-sm"><RotateCcw size={10} /></button>
                <button type="button" onClick={() => setSpin(s => s + 15)} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 border border-gold-500/25 flex items-center justify-center text-gold-500 cursor-pointer shadow-sm"><RotateCw size={10} /></button>
              </div>

              <div className="flex items-center gap-1 border-l border-gold-500/10 pl-3">
                <span className="text-[8px] font-bold text-gold-500/50 uppercase mr-1">Tilt</span>
                <button type="button" onClick={() => setTilt(t => Math.min(70, t + 5))} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 border border-gold-500/25 flex items-center justify-center text-gold-500 cursor-pointer text-[10px] font-bold shadow-sm">↑</button>
                <button type="button" onClick={() => setTilt(t => Math.max(25, t - 5))} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 border border-gold-500/25 flex items-center justify-center text-gold-500 cursor-pointer text-[10px] font-bold shadow-sm">↓</button>
              </div>

              <button 
                type="button"
                onClick={() => { setZoom(1.0); setTilt(52); setSpin(-34); }}
                className="bg-white/5 hover:bg-white/10 border border-gold-500/25 text-gold-500 text-[8px] uppercase tracking-wider font-bold px-2 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-sm ml-2"
              >
                <RefreshCw size={8} /> Reset
              </button>
            </div>
          ) : (
            <div className="text-[10px] text-gold-500/50 font-medium">
              💡 Tip: Click "3D Isometric View" in the top-right to tilt/spin the floor plan!
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Floor Plan */}
        <div className="lg:col-span-2">
          <div 
            id="floor-plan-parent"
            className="w-full rounded-[2.5rem] bg-gradient-to-br from-[#FAF7F0] via-[#FAF7F0] to-[#FAF6F0] border border-gold-500/10 flex items-center justify-center p-4 md:p-6 relative shadow-inner overflow-hidden select-none"
            style={{
              perspective: is3dMode ? '1400px' : 'none',
              perspectiveOrigin: '50% 30%',
              height: `${520 * zoom}px`,
            }}
          >
            <div
              className="bg-white rounded-[2rem] relative h-[500px] w-[700px] shrink-0 border-4 border-gold-500/20 transition-all duration-500 ease-out shadow-2xl my-4"
              style={{
                backgroundImage: 'radial-gradient(rgba(184, 134, 11, 0.08) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                transformStyle: is3dMode ? 'preserve-3d' : 'flat',
                transform: is3dMode ? `rotateX(${tilt}deg) rotateZ(${spin}deg) scale(${zoom}) translateY(-10px)` : `scale(${zoom})`,
                boxShadow: is3dMode
                  ? 'rgba(74, 44, 24, 0.15) -25px 35px 50px 0px, rgba(212, 175, 55, 0.1) 0px 0px 40px 0px'
                  : '0 25px 50px -12px rgba(74, 44, 24, 0.08)'
              }}
            >
              {/* --- ROOM FLOORING BACKGROUNDS --- */}
              {/* Left VIP Cabins Room: Grid Floor */}
              <div 
                className="absolute top-0 left-0 w-[25%] h-full pointer-events-none select-none border-r border-[#2A180E]/20"
                style={{
                  backgroundColor: '#EBE6DA',
                  backgroundImage: 'linear-gradient(90deg, rgba(42,24,14,0.04) 1px, transparent 1px), linear-gradient(0deg, rgba(42,24,14,0.04) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              />

              {/* Scenic Terrace Room (Top Center): Stone Tile Floor */}
              <div 
                className="absolute top-0 left-[25%] right-[28%] h-[22%] pointer-events-none select-none border-b border-[#2A180E]/20"
                style={{
                  backgroundColor: '#ECEFF1',
                  backgroundImage: 'linear-gradient(90deg, rgba(42,24,14,0.03) 1px, transparent 1px), linear-gradient(0deg, rgba(42,24,14,0.03) 1px, transparent 1px)',
                  backgroundSize: '15px 15px'
                }}
              />

              {/* Cocktail Bar & Lounge (Right): Dark Planks Floor */}
              <div 
                className="absolute top-0 right-0 w-[28%] h-full pointer-events-none select-none border-l border-[#2A180E]/20"
                style={{
                  backgroundColor: '#CFBC9A',
                  backgroundImage: 'repeating-linear-gradient(90deg, rgba(42,24,14,0.04), rgba(42,24,14,0.04) 38px, rgba(42,24,14,0.08) 39px, rgba(42,24,14,0.08) 40px)',
                  backgroundSize: '40px 100%'
                }}
              />

              {/* Main Dining Hall (Center): Light Oak Plank Floor */}
              <div 
                className="absolute top-[22%] left-[25%] right-[28%] bottom-0 pointer-events-none select-none"
                style={{
                  backgroundColor: '#EADCB9',
                  backgroundImage: 'repeating-linear-gradient(90deg, #EADCB9, #EADCB9 38px, #D2C0A0 39px, #D2C0A0 40px, #E5D6BB 41px, #E5D6BB 80px)',
                  backgroundSize: '80px 100%'
                }}
              />

              {/* --- THICK CAD PARTITION WALLS --- */}
              {/* Left VIP Room Divider Wall segments */}
              <div className="absolute top-0 left-[24.5%] w-2.5 h-[120px] bg-[#2A180E] border-x border-[#3E2723]/30 pointer-events-none shadow" />
              <div className="absolute top-[175px] left-[24.5%] w-2.5 h-[210px] bg-[#2A180E] border-x border-[#3E2723]/30 pointer-events-none shadow" />
              <div className="absolute bottom-0 left-[24.5%] w-2.5 h-[65px] bg-[#2A180E] border-x border-[#3E2723]/30 pointer-events-none shadow" />

              {/* Top Scenic Room Divider Wall segments */}
              <div className="absolute top-[21.5%] left-[25%] w-[100px] h-2.5 bg-[#2A180E] border-y border-[#3E2723]/30 pointer-events-none shadow" />
              <div className="absolute top-[21.5%] left-[405px] w-[100px] h-2.5 bg-[#2A180E] border-y border-[#3E2723]/30 pointer-events-none shadow" />

              {/* Right Bar Lounge Divider Wall segments */}
              <div className="absolute top-0 right-[27.5%] w-2.5 h-[230px] bg-[#2A180E] border-x border-[#3E2723]/30 pointer-events-none shadow" />
              <div className="absolute bottom-0 right-[27.5%] w-2.5 h-[150px] bg-[#2A180E] border-x border-[#3E2723]/30 pointer-events-none shadow" />

              {/* Outer Boundary Frame Walls */}
              <div className="absolute inset-0 border-[5px] border-[#2A180E] pointer-events-none rounded-[1.8rem] z-30" />

              {/* --- DOOR SWING ARCS (CAD STYLE) --- */}
              {/* Left VIP Room Door 1 swing */}
              <svg className="absolute w-[55px] h-[55px] overflow-visible pointer-events-none" style={{ left: '25%', top: '120px', transform: 'translate(-100%, 0)' }}>
                <path d="M 55 55 A 55 55 0 0 1 0 0" fill="none" stroke="#B8860B" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="55" y1="55" x2="0" y2="0" stroke="#2A180E" strokeWidth="2.5" />
              </svg>
              {/* Left VIP Room Door 2 swing */}
              <svg className="absolute w-[55px] h-[55px] overflow-visible pointer-events-none" style={{ left: '25%', top: '385px', transform: 'translate(-100%, 0) scaleY(-1)' }}>
                <path d="M 55 55 A 55 55 0 0 1 0 0" fill="none" stroke="#B8860B" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="55" y1="55" x2="0" y2="0" stroke="#2A180E" strokeWidth="2.5" />
              </svg>
              {/* Top Service Room Door swing */}
              <svg className="absolute w-[55px] h-[55px] overflow-visible pointer-events-none" style={{ left: '350px', top: '110px' }}>
                <path d="M 0 0 A 55 55 0 0 0 55 55" fill="none" stroke="#B8860B" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="0" x2="55" y2="55" stroke="#2A180E" strokeWidth="2.5" />
              </svg>
              {/* Right Lounge Entrance archway door swings */}
              <svg className="absolute w-[60px] h-[60px] overflow-visible pointer-events-none" style={{ left: '504px', top: '230px', transform: 'scaleX(-1)' }}>
                <path d="M 0 0 A 60 60 0 0 0 60 60" fill="none" stroke="#B8860B" strokeWidth="0.8" strokeDasharray="2 2" />
                <line x1="0" y1="0" x2="60" y2="60" stroke="#2A180E" strokeWidth="2" />
              </svg>
              <svg className="absolute w-[60px] h-[60px] overflow-visible pointer-events-none" style={{ left: '504px', top: '350px', transform: 'scaleX(-1) scaleY(-1)' }}>
                <path d="M 0 0 A 60 60 0 0 0 60 60" fill="none" stroke="#B8860B" strokeWidth="0.8" strokeDasharray="2 2" />
                <line x1="0" y1="0" x2="60" y2="60" stroke="#2A180E" strokeWidth="2" />
              </svg>

              {/* Bottom Main Double Entrance door swings */}
              <div className="absolute bottom-[5px] left-[35%] right-[35%] h-[35px] pointer-events-none overflow-visible z-20">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 210 35">
                  <path d="M 60 35 A 45 45 0 0 1 15 0" fill="none" stroke="#B8860B" strokeWidth="1" strokeDasharray="3 3" />
                  <path d="M 150 35 A 45 45 0 0 0 195 0" fill="none" stroke="#B8860B" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="60" y1="35" x2="15" y2="0" stroke="#2A180E" strokeWidth="2.5" />
                  <line x1="150" y1="35" x2="195" y2="0" stroke="#2A180E" strokeWidth="2.5" />
                  <circle cx="60" cy="35" r="2.5" fill="#B8860B" />
                  <circle cx="150" cy="35" r="2.5" fill="#B8860B" />
                </svg>
              </div>

              {/* --- CAD DIMENSION GUIDELINES (GOLD/BROWN ACCENT) --- */}
              {/* Left Margin Dimension Line */}
              <div className="absolute left-[15px] top-[15px] bottom-[15px] w-px bg-[#B8860B]/40 pointer-events-none select-none">
                <div className="absolute top-0 left-[-4px] right-[-4px] h-[8px] flex flex-col justify-between py-px">
                  <div className="h-px w-full bg-[#B8860B] rotate-45" />
                </div>
                <div className="absolute bottom-0 left-[-4px] right-[-4px] h-[8px] flex flex-col justify-between py-px">
                  <div className="h-px w-full bg-[#B8860B] rotate-45" />
                </div>
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-[#B8860B]/70 tracking-widest [writing-mode:vertical-lr] whitespace-nowrap">
                  9.60 M
                </span>
              </div>
              {/* Bottom Margin Dimension Line */}
              <div className="absolute left-[15px] right-[15px] bottom-[15px] h-px bg-[#B8860B]/40 pointer-events-none select-none">
                <div className="absolute left-0 top-[-4px] bottom-[-4px] w-[8px] flex justify-between px-px">
                  <div className="w-px h-full bg-[#B8860B] rotate-45" />
                </div>
                <div className="absolute right-0 top-[-4px] bottom-[-4px] w-[8px] flex justify-between px-px">
                  <div className="w-px h-full bg-[#B8860B] rotate-45" />
                </div>
                <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-[#B8860B]/70 tracking-widest whitespace-nowrap">
                  12.80 M
                </span>
              </div>

              {/* --- ARCHITECTURAL COUCHES & FURNITURE --- */}
              {/* Left VIP Lounge Couch: Luxurious L-Couch drawing */}
              <div className="absolute left-[20px] top-[20px] w-[75px] h-[75px] border-r-8 border-b-8 border-[#2A180E]/70 bg-[#F4F1EA] rounded-br-2xl pointer-events-none select-none shadow-sm z-10 flex items-center justify-center">
                <div className="absolute inset-px border-r-2 border-b-2 border-dashed border-[#B8860B]/30" />
                <span className="text-[7px] text-[#2A180E]/50 font-bold uppercase tracking-wider">Lounge</span>
              </div>

              {/* Right Lounge Couch: Cozy Sofa drawing */}
              <div className="absolute right-[20px] bottom-[20px] w-[95px] h-[35px] border-t-8 border-x-4 border-[#2A180E]/70 bg-[#F4F1EA] rounded-t-lg pointer-events-none select-none shadow-sm z-10 flex items-center justify-center">
                <div className="absolute inset-px border-t-2 border-dashed border-[#B8860B]/30" />
                <span className="text-[7px] text-[#2A180E]/50 font-bold uppercase tracking-wider">Lounge Sofa</span>
              </div>
              <div className="absolute right-[50px] bottom-[65px] w-6 h-6 rounded-full border border-dashed border-[#B8860B]/40 bg-[#F4F1EA]/60 pointer-events-none select-none flex items-center justify-center">
                <span className="text-[7px] text-[#B8860B]">☕</span>
              </div>

              {/* Right Cocktail Bar Counter Drawing */}
              <div className="absolute right-[25px] top-[100px] w-[60px] h-[190px] bg-[#FAF8F5] border-2 border-[#2A180E] rounded-l-3xl shadow-md z-10 pointer-events-none flex flex-col justify-between py-6 items-start pl-3 select-none">
                <div className="w-1 bg-[#B8860B]/30 h-[90%] rounded-full" />
                <span className="text-[7px] text-[#2A180E]/60 font-serif font-black uppercase tracking-widest [writing-mode:vertical-lr]">
                  🍸 Cocktail Bar
                </span>
                {/* Back shelf with bottles */}
                <div className="absolute right-0 top-6 bottom-6 w-2 bg-[#2A180E] border-l border-white/20" />
              </div>
              {/* Bar Stools along the counter */}
              {[120, 155, 190, 225, 260].map(y => (
                <div 
                  key={y}
                  className="absolute w-5 h-5 rounded-full bg-[#2A180E] border border-gold-500/40 shadow z-20 pointer-events-none flex items-center justify-center"
                  style={{ right: '90px', top: `${y}px` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#B8860B]/60" />
                </div>
              ))}

              {/* --- DETAILED BOTANICAL POTTED PLANTS (CAD ICONS) --- */}
              {/* Corner plant 1 - Top Left */}
              <div className="absolute left-[15px] top-[110px] w-8 h-8 pointer-events-none select-none z-20">
                <svg className="w-full h-full drop-shadow-md" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="14" fill="#1B4D3E" />
                  <circle cx="16" cy="16" r="8" fill="#2E8B57" />
                  <circle cx="16" cy="16" r="4" fill="#3CB371" />
                  <path d="M16 2 L16 30 M2 16 L30 16 M6 6 L26 26 M6 26 L26 6" stroke="#2A180E" strokeWidth="0.8" opacity="0.3" />
                  <circle cx="16" cy="16" r="6" fill="none" stroke="#D4AF37" strokeWidth="0.8" />
                </svg>
              </div>
              {/* Corner plant 2 - Left Room Divider */}
              <div className="absolute left-[15px] top-[320px] w-8 h-8 pointer-events-none select-none z-20">
                <svg className="w-full h-full drop-shadow-md" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="14" fill="#1B4D3E" />
                  <circle cx="16" cy="16" r="8" fill="#2E8B57" />
                  <circle cx="16" cy="16" r="4" fill="#3CB371" />
                  <path d="M16 2 L16 30 M2 16 L30 16 M6 6 L26 26 M6 26 L26 6" stroke="#2A180E" strokeWidth="0.8" opacity="0.3" />
                  <circle cx="16" cy="16" r="6" fill="none" stroke="#D4AF37" strokeWidth="0.8" />
                </svg>
              </div>
              {/* Central Plant Divider 1 */}
              <div className="absolute left-[24%] bottom-[60px] -translate-x-1/2 w-7 h-7 pointer-events-none select-none z-20">
                <svg className="w-full h-full drop-shadow" viewBox="0 0 28 28">
                  <circle cx="14" cy="14" r="12" fill="#1B4D3E" />
                  <circle cx="14" cy="14" r="7" fill="#2E8B57" />
                  <circle cx="14" cy="14" r="3" fill="#3CB371" />
                  <path d="M14 2 L14 26 M2 14 L26 14" stroke="#2A180E" strokeWidth="0.8" opacity="0.25" />
                  <circle cx="14" cy="14" r="5" fill="none" stroke="#D4AF37" strokeWidth="0.6" />
                </svg>
              </div>
              {/* Central Plant Divider 2 */}
              <div className="absolute right-[27%] bottom-[145px] -translate-x-1/2 w-7 h-7 pointer-events-none select-none z-20">
                <svg className="w-full h-full drop-shadow" viewBox="0 0 28 28">
                  <circle cx="14" cy="14" r="12" fill="#1B4D3E" />
                  <circle cx="14" cy="14" r="7" fill="#2E8B57" />
                  <circle cx="14" cy="14" r="3" fill="#3CB371" />
                  <path d="M14 2 L14 26 M2 14 L26 14" stroke="#2A180E" strokeWidth="0.8" opacity="0.25" />
                  <circle cx="14" cy="14" r="5" fill="none" stroke="#D4AF37" strokeWidth="0.6" />
                </svg>
              </div>

              {tables.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-pulse">
                  <p className="text-brown-700/60 text-sm bg-white/40 border border-gold-500/10 px-4 py-2 rounded-xl">No tables are defined for this restaurant floor.</p>
                </div>
              )}

              {tables.map((table) => {
                const isSelected = selectedTable?.id === table.id;
                const isAiRecommended = table.category === aiSuggestion?.suggestedCategory;
                const isReserved = isTableReserved(table);

                const matchAnalysis = getTableMatchAnalysis(table);
                const isHighlyRecommended = matchAnalysis && matchAnalysis.score >= 90;

                // State color key
                let stateKey = 'available';
                if (isReserved) stateKey = 'reserved';
                else if (isSelected) stateKey = 'selected';

                // Premium wood, leather, and gold dining room palette
                const colors = {
                  available: {
                    table: 'bg-[#FDFBF7] border border-gold-500/30',
                    chairs: 'bg-gold-500',
                    text: 'text-brown-900',
                    extrusionTable: '#EAE2D2',
                    extrusionChairs: '#C59A3F'
                  },
                  reserved: {
                    table: 'bg-gray-50 border border-gray-200/60',
                    chairs: 'bg-gray-200',
                    text: 'text-gray-400',
                    extrusionTable: '#E5E7EB',
                    extrusionChairs: '#D1D5DB'
                  },
                  selected: {
                    table: 'bg-brown-900 border border-gold-500',
                    chairs: 'bg-gold-500',
                    text: 'text-gold-500',
                    extrusionTable: '#1E120A',
                    extrusionChairs: '#C59A3F'
                  }
                }[stateKey];

                const baseSize = 48 + (table.capacity * 6);

                // Table Shape Picker
                let tableShape = 'square';
                const categoryNorm = (table.category || '').toLowerCase();
                if (categoryNorm.includes('vip') || categoryNorm.includes('cabin')) {
                  tableShape = 'booth';
                } else if (categoryNorm.includes('family')) {
                  tableShape = 'round';
                } else if (categoryNorm.includes('window')) {
                  tableShape = 'rectangle';
                } else if (categoryNorm.includes('couple') || categoryNorm.includes('romantic')) {
                  tableShape = 'couple';
                } else if (categoryNorm.includes('bar') || categoryNorm.includes('lounge')) {
                  tableShape = 'bar';
                }

                // Renderers for different shapes
                const renderChairsAndTable = () => {
                  if (tableShape === 'round') {
                    const angles = [0, 60, 120, 180, 240, 300];
                    return (
                      <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
                        {angles.map((deg, i) => {
                          const rad = (deg * Math.PI) / 180;
                          const offset = baseSize * 0.45;
                          const cx = Math.cos(rad) * offset;
                          const cy = Math.sin(rad) * offset;
                          return (
                            <div
                              key={i}
                              className={`absolute w-3 h-3 rounded-full transition-all duration-300 ${colors.chairs}`}
                              style={{
                                left: `calc(50% + ${cx}px)`,
                                top: `calc(50% + ${cy}px)`,
                                transform: `translate(-50%, -50%) ${is3dMode ? 'translateZ(-4px)' : ''}`,
                                transformStyle: is3dMode ? 'preserve-3d' : 'flat',
                                boxShadow: is3dMode ? `0 4px 0px ${colors.extrusionChairs}` : 'none'
                              }}
                            />
                          );
                        })}
                        <div
                          className={`w-[62%] h-[62%] rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-md ${colors.table} ${colors.text} relative overflow-hidden`}
                          style={{
                            transform: is3dMode ? 'translateZ(10px)' : 'none',
                            transformStyle: is3dMode ? 'preserve-3d' : 'flat',
                            boxShadow: is3dMode ? `0 8px 0px ${colors.extrusionTable}` : 'none',
                            border: isSelected && !is3dMode ? '2px solid white' : 'none'
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                            <span className="text-[10px] text-gold-500">🌸</span>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
                            <div className="w-[75%] h-[75%] rounded-full border border-dashed border-current" />
                          </div>
                          <span className="font-bold text-[9px] tracking-tight leading-none mb-0.5 z-10">{table.tableNumber}</span>
                          <span className="text-[7px] font-semibold opacity-85 leading-none z-10">{table.capacity}p</span>
                        </div>
                      </div>
                    );
                  }

                  if (tableShape === 'rectangle') {
                    const pos = [
                      { left: '25%', top: '-3px' },
                      { left: '75%', top: '-3px' },
                      { left: '25%', top: 'calc(100% + 3px)' },
                      { left: '75%', top: 'calc(100% + 3px)' }
                    ];
                    return (
                      <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
                        {pos.map((p, i) => (
                          <div
                            key={i}
                            className={`absolute w-3.5 h-2.5 rounded-t-md transition-all duration-300 ${colors.chairs} border-b border-brown-900/10`}
                            style={{
                              left: p.left,
                              top: p.top,
                              transform: `translate(-50%, -50%) ${is3dMode ? 'translateZ(-4px)' : ''}`,
                              transformStyle: is3dMode ? 'preserve-3d' : 'flat',
                              boxShadow: is3dMode ? `0 4px 0px ${colors.extrusionChairs}` : 'none'
                            }}
                          />
                        ))}
                        <div
                          className={`w-[78%] h-[48%] rounded-lg flex flex-col items-center justify-center transition-all duration-300 shadow-md ${colors.table} ${colors.text} relative overflow-hidden`}
                          style={{
                            transform: is3dMode ? 'translateZ(10px)' : 'none',
                            transformStyle: is3dMode ? 'preserve-3d' : 'flat',
                            boxShadow: is3dMode ? `0 8px 0px ${colors.extrusionTable}` : 'none',
                            border: isSelected && !is3dMode ? '2px solid white' : '1px solid rgba(212,175,55,0.2)'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
                          <div className="absolute -left-2 top-0 w-8 h-12 bg-white/10 skew-x-30 pointer-events-none transform -rotate-12" />
                          <div className="absolute inset-0 flex justify-between items-center px-1.5 pointer-events-none opacity-20">
                            <div className="w-2.5 h-2.5 rounded-full border border-current" />
                            <div className="w-2.5 h-2.5 rounded-full border border-current" />
                          </div>
                          <span className="font-bold text-[9px] tracking-tight leading-none mb-0.5 z-10">{table.tableNumber}</span>
                          <span className="text-[7px] font-semibold opacity-85 leading-none z-10">{table.capacity}p</span>
                        </div>
                      </div>
                    );
                  }

                  if (tableShape === 'couple') {
                    const pos = [
                      { left: '-2px', top: '50%' },
                      { left: 'calc(100% + 2px)', top: '50%' }
                    ];
                    return (
                      <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
                        {pos.map((p, i) => (
                          <div
                            key={i}
                            className={`absolute w-3 h-3 rounded-full transition-all duration-300 ${colors.chairs}`}
                            style={{
                              left: p.left,
                              top: p.top,
                              transform: `translate(-50%, -50%) ${is3dMode ? 'translateZ(-4px)' : ''}`,
                              transformStyle: is3dMode ? 'preserve-3d' : 'flat',
                              boxShadow: is3dMode ? `0 4px 0px ${colors.extrusionChairs}` : 'none'
                            }}
                          />
                        ))}
                        <div
                          className={`w-[55%] h-[55%] rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-md ${colors.table} ${colors.text} relative overflow-hidden`}
                          style={{
                            transform: is3dMode ? 'translateZ(10px)' : 'none',
                            transformStyle: is3dMode ? 'preserve-3d' : 'flat',
                            boxShadow: is3dMode ? `0 8px 0px ${colors.extrusionTable}` : 'none',
                            border: isSelected && !is3dMode ? '2px solid white' : 'none'
                          }}
                        >
                          <div className="absolute w-2 h-2 rounded-full bg-amber-500/40 animate-ping pointer-events-none" />
                          <div className="absolute w-1 h-1 rounded-full bg-orange-500 pointer-events-none" />
                          <div className="absolute inset-0 flex flex-col justify-between items-center py-0.5 pointer-events-none opacity-25">
                            <div className="w-1.5 h-1.5 rounded-full border border-current" />
                            <div className="w-1.5 h-1.5 rounded-full border border-current" />
                          </div>
                          <div className="absolute inset-0 flex justify-between items-center px-1.5 pointer-events-none opacity-30">
                            <span className="text-[5px]">🍷</span>
                            <span className="text-[5px]">🍷</span>
                          </div>
                          <span className="font-bold text-[8px] tracking-tight leading-none mb-0.5 z-10">{table.tableNumber}</span>
                          <span className="text-[5px] font-semibold opacity-85 leading-none z-10">{table.capacity}p</span>
                        </div>
                      </div>
                    );
                  }

                  if (tableShape === 'booth') {
                    return (
                      <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
                        <div
                          className="absolute w-[92%] h-[92%] rounded-full border-[6px] transition-all duration-300"
                          style={{
                            borderColor: stateKey === 'selected' ? '#D4AF37' : stateKey === 'reserved' ? '#9CA3AF' : '#2D1B10',
                            borderBottomColor: 'transparent',
                            transform: `translate(-50%, -50%) rotate(135deg) ${is3dMode ? 'translateZ(-2px)' : ''}`,
                            transformStyle: is3dMode ? 'preserve-3d' : 'flat',
                            boxShadow: is3dMode ? `0 6px 0px ${stateKey === 'selected' ? '#C59A3F' : '#1A0F0A'}` : 'none',
                            left: '50%',
                            top: '50%'
                          }}
                        />
                        <div
                          className="absolute w-[80%] h-[80%] rounded-full border border-gold-500/30"
                          style={{
                            borderBottomColor: 'transparent',
                            transform: `translate(-50%, -50%) rotate(135deg) ${is3dMode ? 'translateZ(-1px)' : ''}`,
                            left: '50%',
                            top: '50%'
                          }}
                        />
                        <div
                          className={`w-[45%] h-[45%] rounded-md flex flex-col items-center justify-center transition-all duration-300 shadow-md ${
                            stateKey === 'selected' ? 'bg-gold-500 text-brown-900' : 'bg-[#3E2723] text-gold-500'
                          } z-10 relative overflow-hidden`}
                          style={{
                            transform: is3dMode ? 'translateZ(10px)' : 'none',
                            transformStyle: is3dMode ? 'preserve-3d' : 'flat',
                            boxShadow: is3dMode ? `0 8px 0px ${stateKey === 'selected' ? '#C59A3F' : '#1E120A'}` : 'none',
                            border: isSelected && !is3dMode ? '2px solid white' : '1px solid rgba(212,175,55,0.4)'
                          }}
                        >
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-500/40 animate-ping pointer-events-none" />
                          <div className="absolute w-1 h-1 rounded-full bg-orange-500 pointer-events-none" />
                          <div className="absolute inset-0 flex justify-between items-center px-1 pointer-events-none opacity-20">
                            <div className="w-1.5 h-1.5 rounded-full border border-current" />
                            <div className="w-1.5 h-1.5 rounded-full border border-current" />
                          </div>
                          <span className="font-bold text-[8px] tracking-tight leading-none mb-0.5 z-10">{table.tableNumber}</span>
                          <span className="text-[6px] font-semibold opacity-85 leading-none z-10">{table.capacity}p</span>
                        </div>
                      </div>
                    );
                  }

                  if (tableShape === 'bar') {
                    const stools = [0, 180];
                    return (
                      <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
                        {stools.map((deg, i) => {
                          const rad = (deg * Math.PI) / 180;
                          const offset = baseSize * 0.42;
                          const cx = Math.cos(rad) * offset;
                          const cy = Math.sin(rad) * offset;
                          return (
                            <div
                              key={i}
                              className={`absolute w-2.5 h-2.5 rounded-full transition-all duration-300 bg-brown-900 border border-gold-500/30`}
                              style={{
                                left: `calc(50% + ${cx}px)`,
                                top: `calc(50% + ${cy}px)`,
                                transform: `translate(-50%, -50%) ${is3dMode ? 'translateZ(-2px)' : ''}`,
                                transformStyle: is3dMode ? 'preserve-3d' : 'flat',
                                boxShadow: is3dMode ? `0 4px 0px #1E120A` : 'none'
                              }}
                            />
                          );
                        })}
                        <div
                          className={`w-[50%] h-[50%] rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-md ${
                            stateKey === 'selected' 
                              ? 'bg-brown-900 text-gold-500 border-2 border-gold-500' 
                              : 'bg-white text-brown-900 border border-gold-500/50'
                          } relative overflow-hidden`}
                          style={{
                            backgroundImage: stateKey !== 'selected' ? 'radial-gradient(rgba(212, 175, 55, 0.15) 1px, transparent 1px)' : 'none',
                            backgroundSize: '8px 8px',
                            transform: is3dMode ? 'translateZ(12px)' : 'none',
                            transformStyle: is3dMode ? 'preserve-3d' : 'flat',
                            boxShadow: is3dMode ? `0 8px 0px ${colors.extrusionTable}` : 'none'
                          }}
                        >
                          <div className="absolute inset-[1px] rounded-full border border-gold-500/20" />
                          <span className="font-bold text-[8px] tracking-tight leading-none mb-0.5 z-10">{table.tableNumber}</span>
                          <span className="text-[6px] font-semibold opacity-85 leading-none z-10">{table.capacity}p</span>
                        </div>
                      </div>
                    );
                  }

                  // Default / Square Table
                  const pos = [
                    { left: '50%', top: '-2px' },
                    { left: '50%', top: 'calc(100% + 2px)' },
                    { left: '-2px', top: '50%' },
                    { left: 'calc(100% + 2px)', top: '50%' }
                  ];
                  return (
                    <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
                      {pos.map((p, i) => (
                        <div
                          key={i}
                          className={`absolute w-3 h-3 rounded-sm transition-all duration-300 ${colors.chairs}`}
                          style={{
                            left: p.left,
                            top: p.top,
                            transform: `translate(-50%, -50%) ${is3dMode ? 'translateZ(-4px)' : ''}`,
                            transformStyle: is3dMode ? 'preserve-3d' : 'flat',
                            boxShadow: is3dMode ? `0 4px 0px ${colors.extrusionChairs}` : 'none'
                          }}
                        />
                      ))}
                      <div
                        className={`w-[55%] h-[55%] rounded-md flex flex-col items-center justify-center transition-all duration-300 shadow-md ${colors.table} ${colors.text} relative overflow-hidden`}
                        style={{
                          transform: is3dMode ? 'translateZ(10px)' : 'none',
                          transformStyle: is3dMode ? 'preserve-3d' : 'flat',
                          boxShadow: is3dMode ? `0 8px 0px ${colors.extrusionTable}` : 'none',
                          border: isSelected && !is3dMode ? '2px solid white' : 'none'
                        }}
                      >
                        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-500/30 animate-pulse pointer-events-none" />
                        <div className="absolute w-0.5 h-0.5 rounded-full bg-orange-400 pointer-events-none" />
                        <div className="absolute inset-0.5 grid grid-cols-2 grid-rows-2 pointer-events-none opacity-15">
                          <div className="w-1.5 h-1.5 rounded-full border border-current justify-self-center align-self-center" />
                          <div className="w-1.5 h-1.5 rounded-full border border-current justify-self-center align-self-center" />
                        </div>
                        <span className="font-bold text-[9px] tracking-tight leading-none mb-0.5 z-10">{table.tableNumber}</span>
                        <span className="text-[7px] font-semibold opacity-85 leading-none z-10">{table.capacity}p</span>
                      </div>
                    </div>
                  );
                };

                const isMatch = isTableMatchFilter(table);

                return (
                  <motion.button
                    key={table.id}
                    disabled={isReserved}
                    whileHover={!isReserved && isMatch ? { 
                      scale: 1.08, 
                      translateZ: is3dMode ? (isSelected ? 38 : 22) : 0,
                      transition: { duration: 0.15 } 
                    } : {}}
                    whileTap={!isReserved && isMatch ? { scale: 0.95 } : {}}
                    onClick={() => {
                      setSelectedTable(table);
                      if (window.innerWidth < 1024) {
                        setTimeout(() => {
                          document.getElementById('booking-sidebar')?.scrollIntoView({ behavior: 'smooth' });
                        }, 50);
                      }
                    }}
                    onMouseEnter={() => isMatch && setHoveredTable(table)}
                    onMouseLeave={() => setHoveredTable(null)}
                    className="absolute bg-transparent transition-all duration-300"
                    style={{
                      left: `${table.positionX}%`,
                      top: `${table.positionY}%`,
                      width: `${baseSize}px`,
                      height: `${baseSize}px`,
                      transform: is3dMode
                        ? `translate3d(-50%, -50%, ${isSelected ? '28px' : '14px'})`
                        : 'translate(-50%, -50%)',
                      transformStyle: is3dMode ? 'preserve-3d' : 'flat',
                      cursor: isReserved ? 'not-allowed' : 'pointer',
                      zIndex: isSelected ? 20 : isReserved ? 5 : 10,
                      opacity: isMatch ? 1 : 0.15,
                      pointerEvents: isMatch ? 'auto' : 'none'
                    }}
                  >
                    {renderChairsAndTable()}
                    
                    {isHighlyRecommended && !isSelected && !isReserved && (
                      <div 
                        className="gold-pulse-ring" 
                        style={{
                          width: `${baseSize + 16}px`,
                          height: `${baseSize + 16}px`,
                          transform: is3dMode ? 'translate3d(-50%, -50%, 6px)' : 'translate(-50%, -50%)'
                        }}
                      />
                    )}

                    {table.isBestseller && !isSelected && !isReserved && (
                      <span 
                        className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full border border-white animate-pulse shadow-md z-30"
                        style={{
                          transform: is3dMode ? 'translateZ(18px)' : 'none'
                        }}
                      />
                    )}
                    {isAiRecommended && !isSelected && !isReserved && (
                      <span 
                        className="absolute -bottom-4 bg-purple-600 text-white text-[7px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap tracking-wide uppercase border border-purple-400/20 shadow-md z-30"
                        style={{
                          transform: is3dMode ? 'translateZ(18px)' : 'none'
                        }}
                      >
                        AI Pick
                      </span>
                    )}
                  </motion.button>
                );
              })}

              {/* Floating Tooltip Card */}
              <AnimatePresence>
                {hoveredTable && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bg-[#1E120A]/95 text-white rounded-2xl p-4 shadow-2xl z-40 border border-gold-500/20 pointer-events-none text-left w-56 font-sans backdrop-blur-md"
                    style={{
                      left: `${hoveredTable.positionX}%`,
                      top: `calc(${hoveredTable.positionY}% - ${(48 + hoveredTable.capacity * 6) / 2}px - 14px)`,
                      transform: 'translate(-50%, -100%)',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <div className="absolute w-3 h-3 bg-[#1E120A]/95 rotate-45 bottom-[-6px] left-1/2 -translate-x-1/2 border-r border-b border-gold-500/20" />
                    <h5 className="font-serif font-bold text-gold-500 text-sm flex items-center justify-between">
                      <span>Table {hoveredTable.tableNumber}</span>
                      <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full font-sans uppercase font-bold tracking-wider text-cream-100">
                        {hoveredTable.capacity} Seats
                      </span>
                    </h5>
                    <p className="text-[9px] text-gold-500/70 mt-1 uppercase font-bold tracking-wider">{hoveredTable.category}</p>
                    <div className="border-t border-white/10 my-2" />
                    <div className="space-y-1 text-[10px] text-white/80">
                      <div className="flex justify-between">
                        <span>Popularity:</span>
                        <span className="font-bold text-gold-500">{hoveredTable.bookingCount || 0} visits</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ambiance:</span>
                        <span className="text-gold-500/80">{getPreviewData(hoveredTable.category)?.ambiance.split('·')[1]?.trim() || 'Cozy'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>AI Match:</span>
                        <span className={`font-bold ${
                          getTableMatchAnalysis(hoveredTable)?.score >= 90 ? 'text-green-400' : 'text-amber-400'
                        }`}>
                          {getTableMatchAnalysis(hoveredTable)?.score}% Match
                        </span>
                      </div>
                    </div>
                    {(hoveredTable.description || getPreviewData(hoveredTable.category)?.description) && (
                      <>
                        <div className="border-t border-white/10 my-2" />
                        <p className="text-[9px] text-cream-100/75 italic line-clamp-2 leading-relaxed">
                          {`"${getDynamicDescription(hoveredTable)}"`}
                        </p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


          </div>
          <div className="flex flex-wrap gap-4 mt-6 text-sm text-brown-700/60 justify-center">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#FDFBF7] border border-gold-500/30 shadow-sm" /> Available</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-brown-900 border border-gold-500 shadow-sm" /> Selected</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-gray-50 border border-gray-200/60 shadow-sm" /> Reserved</div>
            <div className="flex items-center gap-2 relative"><div className="w-4 h-4 rounded-full border-2 border-gold-500 bg-gold-500/20 animate-pulse" /> AI Highly Recommended</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /> Bestseller</div>
          </div>
        </div>

        {/* Booking & Payment Sidebar */}
        <div id="booking-sidebar" className="lg:col-span-1">
          <div className="bg-white rounded-[2rem] shadow-xl border border-gold-500/10 p-6 sticky top-24">
            <h3 className="text-2xl font-serif font-bold text-brown-900 mb-6">Reservation Details</h3>

            {selectedTable ? (
              <form onSubmit={handlePayAndBook} className="space-y-5">
                {/* AI Match Score Card */}
                {(() => {
                  const match = getTableMatchAnalysis(selectedTable);
                  if (!match) return null;
                  return (
                    <div className="p-4 rounded-2xl border border-gold-500/20 bg-gradient-to-r from-gold-50/30 to-amber-50/20 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-brown-950 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-gold-600 animate-pulse" />
                          AI Match Analysis
                        </span>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          match.score >= 90 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : match.score >= 75 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}>
                          {match.score}% Match
                        </span>
                      </div>
                      <div className="space-y-1">
                        {match.reasons.map((r, i) => (
                          <div key={i} className="text-[10px] text-brown-800 flex items-start gap-1">
                            <span className="text-gold-600 font-bold">•</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Table Details Section */}
                <div className="p-4 bg-brown-50/20 rounded-2xl border border-gold-500/10 space-y-2.5">
                  <h4 className="text-xs font-bold text-brown-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Sparkles size={12} className="text-gold-600" />
                    Table Information
                  </h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brown-700/70 font-medium">Table Number</span>
                    <span className="font-bold text-brown-900">Table {selectedTable.tableNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brown-700/70 font-medium">Seating Capacity</span>
                    <span className="font-bold text-brown-900">{selectedTable.capacity} {parseInt(selectedTable.capacity, 10) === 1 ? 'Seat' : 'Seats'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brown-700/70 font-medium">Zone Category</span>
                    <span className="font-bold text-brown-900">{selectedTable.category}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brown-700/70 font-medium">Availability Status</span>
                    <span className={`font-bold ${isTableReserved(selectedTable) ? 'text-red-600' : 'text-green-600'}`}>
                      {isTableReserved(selectedTable) ? 'Reserved / Occupied' : 'Available'}
                    </span>
                  </div>
                  
                  <div className="h-px bg-gold-500/10 my-1" />
                  
                  <div className="text-[11px] text-brown-800 leading-relaxed italic bg-gold-500/5 p-2.5 rounded-xl border border-gold-500/10 text-left">
                    <span className="block text-[8px] font-bold text-gold-600 uppercase tracking-widest not-italic mb-0.5">Description</span>
                    {selectedTable.description && selectedTable.description.trim() ? (
                      `"${selectedTable.description.trim()}"`
                    ) : (
                      <span className="text-stone-400 not-italic">No specific details provided for this table.</span>
                    )}
                  </div>
                </div>

                {/* Pre-Order Summary */}
                {selectedDishes.length > 0 && (
                  <div className="p-3 bg-gold-50/30 rounded-xl border border-gold-500/10 space-y-1 text-left">
                    <div className="flex justify-between items-center">
                      <h5 className="text-[10px] font-bold text-brown-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Wine size={12} className="text-gold-600" />
                        Selected Culinary Pre-Order
                      </h5>
                      <button 
                        type="button"
                        onClick={() => setSelectedDishes([])}
                        className="text-[9px] text-red-500 hover:underline flex items-center gap-0.5"
                      >
                        <Trash2 size={10} /> Clear
                      </button>
                    </div>
                    <div className="space-y-1 mt-1">
                      {selectedDishes.map((dish, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-brown-800">
                          <span>• {dish.name}</span>
                          <span className="font-semibold text-brown-950">
                            {dish.price ? (dish.price.startsWith('₹') ? dish.price : `₹${dish.price}`) : 'Ask'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Booking Summary details (Simplified to Reservation Schedule) */}
                <div className="p-4 bg-brown-50/20 rounded-2xl border border-gold-500/10 space-y-2">
                  <h4 className="text-xs font-bold text-[#2C1B18] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Calendar size={12} className="text-gold-600" />
                    Reservation Schedule
                  </h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brown-700/70 font-medium flex items-center gap-1">Date</span>
                    <span className="font-bold text-brown-900">{new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brown-700/70 font-medium flex items-center gap-1">Time</span>
                    <span className="font-bold text-brown-900">{time}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brown-700/70 font-medium flex items-center gap-1">Party Size</span>
                    <span className="font-bold text-brown-900">{guests} {parseInt(guests, 10) === 1 ? 'Guest' : 'Guests'}</span>
                  </div>
                </div>

                {bookingError && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100">{bookingError}</div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-brown-700/60 uppercase tracking-wider">Pre-Order Dishes (Optional)</label>
                    <button
                      type="button"
                      onClick={() => setIsMenuOpen(true)}
                      className="text-[10px] font-bold text-gold-600 hover:text-gold-500 flex items-center gap-1 cursor-pointer bg-transparent border-0"
                    >
                      <Utensils size={10} /> Browse Culinary Menu
                    </button>
                  </div>
                  <textarea rows="2" value={manualPreOrder} onChange={e => setManualPreOrder(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#e7ddcd] rounded-xl focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 outline-none resize-none text-sm text-brown-900 font-semibold bg-white mb-3"
                    placeholder="Enter dishes you would like to pre-order (e.g. 1x Paneer Tikka, 2x Roti)..." />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brown-700/60 uppercase tracking-wider mb-1">Special Requests (Optional)</label>
                  <textarea rows="2" value={request} onChange={e => setRequest(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#e7ddcd] rounded-xl focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 outline-none resize-none text-sm text-brown-900 font-semibold bg-white"
                    placeholder="Allergies, anniversary, window seat preference..." />
                </div>

                {/* Payment summary */}
                <div className="bg-brown-50/30 rounded-2xl p-4 border border-gold-500/10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-brown-700/70">Reservation Fee</span>
                    <span className="font-bold text-brown-900 flex items-center gap-1"><IndianRupee size={14} />{BOOKING_FEE}</span>
                  </div>
                  <p className="text-[11px] text-brown-700/60">Secure payment via UPI, Cards, NetBanking, or Wallets</p>
                </div>

                <button type="submit" disabled={isSubmitting}
                  className="w-full bg-brown-900 text-gold-500 py-4 rounded-xl font-bold hover:bg-brown-950 transition-all duration-300 shadow-lg hover:shadow-xl flex justify-center items-center gap-2 disabled:opacity-70 cursor-pointer border border-gold-500/10">
                  <CreditCard size={20} className="text-gold-500" />
                  {isSubmitting ? 'Opening Payment...' : `Pay ₹${BOOKING_FEE} & Confirm`}
                </button>

                <p className="text-center text-[11px] text-brown-700/60">
                  🔒 Secured by Razorpay · Supports UPI, Cards & Wallets
                </p>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl border border-gold-500/20 bg-gradient-to-br from-gold-50/40 via-amber-50/20 to-transparent shadow-sm">
                  <h4 className="text-xs font-bold text-brown-950 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Sparkles size={14} className="text-gold-600 animate-pulse" />
                    Finding Your Perfect Ambiance?
                  </h4>
                  <p className="text-xs text-brown-700/80 leading-relaxed mb-3">
                    Use our AI-powered <strong>Vibe Match Finder</strong> at the top to instantly highlight and select the best table for your occasion.
                  </p>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => applyVibePreset('romantic')} 
                      className="flex-1 bg-brown-900 text-gold-500 text-[10px] font-bold py-1.5 px-2.5 rounded-lg border border-gold-500/10 hover:bg-brown-950 transition cursor-pointer text-center"
                    >
                      Try Romance Match
                    </button>
                    <button 
                      type="button" 
                      onClick={() => applyVibePreset('quiet')} 
                      className="flex-1 bg-white text-brown-900 text-[10px] font-bold py-1.5 px-2.5 rounded-lg border border-[#e7ddcd] hover:bg-brown-50 transition cursor-pointer text-center"
                    >
                      Try Secluded Cabin
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-brown-900 uppercase tracking-wider">Floor Zone Guide</h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {Object.values(zoneSummary).map((zone, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-gold-500/5 bg-brown-50/10">
                        <div>
                          <p className="text-xs font-bold text-brown-900">{zone.name}</p>
                          <p className="text-[10px] text-brown-700/60 font-medium">
                            {zone.available} of {zone.total} tables available
                          </p>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          zone.available > 0 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {zone.available > 0 ? 'Seats Available' : 'Fully Booked'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-48 flex flex-col items-center justify-center text-center text-brown-700/60 p-6 border-2 border-dashed border-gold-500/15 bg-brown-50/5 rounded-2xl">
                  <Sparkles size={24} className="text-gold-500/40 mb-3 animate-pulse" />
                  <p className="text-xs font-medium leading-relaxed">Select a table on the architectural map to load the interactive Seat View Simulator & confirm booking.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Premium Culinary Menu Modal */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white max-w-4xl w-full max-h-[85vh] overflow-hidden rounded-3xl border border-gold-500/20 shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gold-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-cream-50/20 text-left">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-gold-600">Menu Highlights</span>
                  <h3 className="text-2xl font-serif font-bold text-brown-900 mt-0.5">{restaurant?.name || 'Restaurant'} Menu</h3>
                </div>
                
                {/* Search & Close */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-grow sm:flex-grow-0 sm:w-60">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
                    <input
                      type="text"
                      placeholder="Search dishes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoComplete="one-time-code"
                      className="w-full pl-8 pr-4 py-1.5 rounded-full border border-gold-500/20 bg-white text-xs text-brown-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-brown-900 text-[#f5efe4] px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gold-500 hover:text-brown-900 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Category Tabs inside Modal */}
              {categories.length > 2 && (
                <div className="px-6 py-3 border-b border-gold-500/5 bg-cream-50/10 flex gap-2 overflow-x-auto scrollbar-none">
                  {categories.map((cat, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveTab(cat)}
                      className={`px-4 py-1 rounded-full text-[11px] font-semibold tracking-wider transition-all duration-300 shrink-0 ${
                        activeTab === cat
                          ? 'bg-brown-900 text-gold-500 shadow-sm'
                          : 'bg-cream-50/50 hover:bg-cream-100/50 text-brown-700 border border-gold-500/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Modal Body - Scrollable Dishes Grid */}
              <div className="p-6 overflow-y-auto max-h-[50vh] space-y-4 text-left">
                {menuItems.length === 0 ? (
                  <div className="py-16 text-center text-brown-700/60 italic text-sm">
                    No menu items configured yet. Owners can upload a menu photo from the Admin Dashboard.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredItems.map((dish) => {
                        const isSelected = selectedDishes.some(d => d.name === dish.name);
                        
                        return (
                          <div
                            key={dish.name}
                            className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                              isSelected
                                ? 'bg-gold-50/40 border-gold-500'
                                : 'bg-cream-50/10 border-gold-500/10 hover:border-gold-500/25'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                                  dish.isVeg ? 'text-green-700 bg-green-500/10' : 'text-red-700 bg-red-500/10'
                                }`}>
                                  <span className={`w-1 h-1 rounded-full ${dish.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                  {dish.isVeg ? 'VEG' : 'NON-VEG'}
                                </span>
                                <span className="text-[8px] uppercase font-bold tracking-wider text-brown-600 bg-brown-500/10 px-1.5 py-0.5 rounded-full">
                                  {dish.category}
                                </span>
                                {dish.isChefSpecial && (
                                  <span className="text-[8px] font-bold tracking-wider text-gold-700 bg-gold-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <Sparkles size={8} className="fill-gold-500" /> SPECIAL
                                  </span>
                                )}
                              </div>
                            </div>

                            <h4 className="font-serif font-bold text-brown-900 text-base leading-tight">
                              {dish.name}
                            </h4>
                            {dish.description && (
                              <p className="text-xs text-brown-700/60 mt-1 leading-relaxed">{dish.description}</p>
                            )}

                            <div className="mt-4 flex justify-between items-center pt-2 border-t border-gold-500/5">
                              <span className="text-gold-600 font-bold text-base">
                                {dish.price ? (dish.price.startsWith('₹') ? dish.price : `₹${dish.price}`) : 'Price on Ask'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleSelectDish(dish)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-0.5 transition-all ${
                                  isSelected
                                    ? 'bg-gold-500 text-brown-900'
                                    : 'bg-brown-900 text-cream-100 hover:bg-gold-500 hover:text-brown-900'
                                }`}
                              >
                                {isSelected ? <><Check size={10} strokeWidth={3} /> Selected</> : <>+ Pre-Order</>}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {filteredItems.length === 0 && (
                      <div className="py-12 text-center text-brown-500 italic text-sm">
                        No dishes found matching your search.
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gold-500/10 bg-cream-50/10 flex justify-between items-center text-xs">
                <span className="text-brown-600">
                  {selectedDishes.length > 0 
                    ? `${selectedDishes.length} item(s) selected for pre-order` 
                    : 'Select items to add to your pre-order request'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="bg-brown-900 text-gold-500 px-5 py-2 rounded-full font-bold hover:bg-gold-500 hover:text-brown-900 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TableBlueprintPage;
