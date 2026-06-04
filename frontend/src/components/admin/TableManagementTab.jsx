import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, LayoutGrid, Move, Save, ChevronRight, ChevronLeft, Sparkles, AlertTriangle, HelpCircle, CheckCircle2, Wand2 } from 'lucide-react';
import axios from 'axios';

const CATEGORY_OPTIONS = ['Rooftop', 'Window Side', 'Corner Side', 'Center', 'Courtyard', 'Private Cabin', 'Family Table', 'Couple Table', 'Outdoor', 'Bar Area'];

// Helper to space table layouts on a 100x100 grid based on physical zones
const calculateLayoutPositionsLocal = (tablesList) => {
  const updated = tablesList.map(t => ({ ...t }));
  
  const windowTables = updated.filter(t => (t.category || '').toLowerCase().includes('window'));
  const rooftopTables = updated.filter(t => (t.category || '').toLowerCase().includes('rooftop'));
  const indoorTables = updated.filter(t => (t.category || '').toLowerCase().includes('indoor') || (!t.category.toLowerCase().includes('window') && !t.category.toLowerCase().includes('rooftop')));
  
  // Window Side: Top center row, y = 11%
  if (windowTables.length > 0) {
    const count = windowTables.length;
    windowTables.forEach((t, idx) => {
      const x = count > 1 ? 34 + idx * (28 / (count - 1)) : 48;
      t.positionX = Math.round(x * 10) / 10;
      t.positionY = 11.0;
    });
  }
  
  // Rooftop Dining: x = 85%, y spreads vertically from 11% to 75%
  if (rooftopTables.length > 0) {
    const count = rooftopTables.length;
    rooftopTables.forEach((t, idx) => {
      const y = count > 1 ? 11 + idx * (64 / (count - 1)) : 11;
      t.positionX = 85.0;
      t.positionY = Math.round(y * 10) / 10;
    });
  }
  
  // Indoor Seating (Main Dining Hall): center grid
  if (indoorTables.length > 0) {
    const count = indoorTables.length;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const xStep = cols > 1 ? (28 / (cols - 1)) : 28;
    const yStep = rows > 1 ? (38 / (rows - 1)) : 38;
    
    indoorTables.forEach((t, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = cols > 1 ? 34 + col * xStep : 48;
      const y = rows > 1 ? 38 + row * yStep : 57;
      t.positionX = Math.round(x * 10) / 10;
      t.positionY = Math.round(y * 10) / 10;
    });
  }
  
  return updated;
};

// ─── Blueprint Editor (drag & drop positioning) ────────────────────────────
const BlueprintEditor = ({ tables, restaurantId, onSavePositions, isDemoMode = false, isWizardMode = false }) => {
  const floorRef = useRef(null);
  const [positions, setPositions] = useState({});
  const [dragging, setDragging] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    const map = {};
    tables.forEach(t => {
      map[t.id] = {
        x: t.positionX > 0 ? t.positionX : Math.random() * 70 + 10,
        y: t.positionY > 0 ? t.positionY : Math.random() * 70 + 10
      };
    });
    setPositions(map);
  }, [tables]);

  const handleAIArrange = async () => {
    setOptimizing(true);
    try {
      if (isDemoMode || isWizardMode) {
        await new Promise(r => setTimeout(r, 1000));
        const newPositions = {};
        const arranged = calculateLayoutPositionsLocal(tables);
        arranged.forEach(t => {
          newPositions[t.id] = { x: t.positionX, y: t.positionY };
        });
        setPositions(newPositions);
        onSavePositions(newPositions);
        return;
      }
      const res = await axios.post('/api/ai/optimize-layout', { restaurantId });
      const updatedTables = res.data.data;
      
      const newPositions = {};
      updatedTables.forEach(t => {
        newPositions[t.id] = { x: t.positionX, y: t.positionY };
      });
      setPositions(newPositions);
      onSavePositions(newPositions);
    } catch (err) {
      console.error(err);
      alert('Failed to optimize layout. Please try again.');
    } finally {
      setOptimizing(false);
    }
  };

  const handleMouseDown = (e, tableId) => {
    e.preventDefault();
    setDragging(tableId);
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !floorRef.current) return;
    const rect = floorRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 5), 92);
    const y = Math.min(Math.max(((e.clientY - rect.top) / rect.height) * 100, 5), 92);
    setPositions(prev => ({ ...prev, [dragging]: { x, y } }));
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isDemoMode || isWizardMode) {
        await new Promise(r => setTimeout(r, 600));
        setSaved(true);
        onSavePositions(positions);
        setTimeout(() => setSaved(false), 2000);
        return;
      }
      await Promise.all(
        tables.map(t =>
          axios.put(`/api/tables/${t.id}`, {
            positionX: positions[t.id]?.x ?? t.positionX,
            positionY: positions[t.id]?.y ?? t.positionY
          })
        )
      );
      setSaved(true);
      onSavePositions(positions);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save positions', err);
    } finally {
      setSaving(false);
    }
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-bold text-brown-800 uppercase tracking-widest flex items-center gap-2">
            <Move size={14} /> Floor Plan Editor
          </p>
          <p className="text-xs text-brown-600/60 mt-0.5 font-sans">Drag tables to position them on the floor plan</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAIArrange}
            disabled={optimizing || saving || tables.length === 0}
            className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-600 text-brown-900 px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md"
          >
            {optimizing ? (
              <div className="w-3.5 h-3.5 border-2 border-brown-900/30 border-t-brown-900 rounded-full animate-spin" />
            ) : (
              <><Sparkles size={13} /> AI Auto-Arrange</>
            )}
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || optimizing || tables.length === 0}
            className="flex items-center gap-1.5 bg-brown-900 text-cream-100 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gold-500 hover:text-brown-900 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-cream-100/30 border-t-cream-100 rounded-full animate-spin" />
            ) : saved ? (
              <><span>✓</span> Saved!</>
            ) : (
              <><Save size={13} /> Save Positions</>
            )}
          </button>
        </div>
      </div>

      {/* Floor plan canvas */}
      <div
        ref={floorRef}
        className="bg-brown-900 rounded-2xl relative overflow-hidden select-none border-4 border-brown-800 shadow-inner"
        style={{
          height: '420px',
          backgroundImage: 'radial-gradient(rgba(212, 175, 55, 0.15) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {tables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-cream-200/30 text-sm bg-black/20 px-4 py-2 rounded-xl">Add tables to place them on the floor plan</p>
          </div>
        )}

        {tables.map(table => {
          const pos = positions[table.id] || { x: 50, y: 50 };
          const size = 44 + table.capacity * 8;
          const isDragging = dragging === table.id;

          return (
            <div
              key={table.id}
              onMouseDown={e => handleMouseDown(e, table.id)}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${size}px`,
                height: `${size}px`,
                transform: 'translate(-50%, -50%)',
                cursor: isDragging ? 'grabbing' : 'grab',
                zIndex: isDragging ? 20 : 10,
              }}
              className={`rounded-full flex flex-col items-center justify-center shadow-lg transition-shadow
                ${isDragging
                  ? 'bg-gold-500 ring-4 ring-white shadow-2xl scale-105'
                  : 'bg-cream-100/90 hover:bg-white ring-2 ring-white/20 hover:ring-gold-500/60'
                }`}
            >
              <span className="font-bold text-brown-900 text-xs leading-none">{table.tableNumber}</span>
              <span className="text-brown-700/60 text-[9px] leading-none mt-0.5">{table.capacity}p</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-brown-600/70 justify-center">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-cream-100 border border-gray-300 inline-block" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gold-500 inline-block" /> Dragging</span>
        <span className="font-sans text-[11px]">Size scales with seating capacity</span>
      </div>
    </div>
  );
};

// ─── Main Tab Component ─────────────────────────────────────────────────────
const TableManagementTab = ({ restaurants, onRefresh, isDemoMode = false }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const restaurant = restaurants[selectedIdx] || null;
  
  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState({ tableNumber: '', category: 'Center', capacity: '2', description: '' });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [tab, setTab] = useState('list'); // 'list' | 'blueprint' | 'wizard'

  // ─── Setup Wizard States ──────────────────────────────────────────────────
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardAreas, setWizardAreas] = useState([
    { name: 'Indoor Seating', description: 'Main dining hall under warm luxury chandelier lighting.' },
    { name: 'Rooftop Dining', description: 'Scenic open-air patio tables with dynamic skyline views.' },
    { name: 'Window Side', description: 'Cozy alcove window tables overlooking botanical gardens.' }
  ]);
  const [wizardTableTypes, setWizardTableTypes] = useState([
    { capacity: 2, quantity: 4 },
    { capacity: 4, quantity: 6 },
    { capacity: 6, quantity: 2 }
  ]);
  
  // Default allocations matching:
  // Indoor: 6 tables (2 of 2-seaters, 4 of 4-seaters)
  // Rooftop: 4 tables (2 of 2-seaters, 2 of 4-seaters)
  // Window Side: 2 tables (2 of 6-seaters)
  const [wizardAllocations, setWizardAllocations] = useState({
    '2-Indoor Seating': 2,
    '2-Rooftop Dining': 2,
    '2-Window Side': 0,
    '4-Indoor Seating': 4,
    '4-Rooftop Dining': 2,
    '4-Window Side': 0,
    '6-Indoor Seating': 0,
    '6-Rooftop Dining': 0,
    '6-Window Side': 2
  });

  const [wizardInventory, setWizardInventory] = useState([]);
  const [wizardSaving, setWizardSaving] = useState(false);

  const getRandomDescription = (capacity, area) => {
    const descriptions = {
      2: {
        'Indoor Seating': [
          'Cozy indoor table ideal for intimate date nights and deep conversations.',
          'Elegant table next to the wine cellar, perfect for a couple.'
        ],
        'Rooftop Dining': [
          'Romantic open-air seating offering starlit sky views.',
          'High-top table at the terrace edge, enjoying cool breezes.'
        ],
        'Window Side': [
          'Intimate window alcove overlooking the garden walk.',
          'Bright window-side seating, great for morning brunch.'
        ]
      },
      4: {
        'Indoor Seating': [
          'Grand dining table situated under the central crystal chandelier.',
          'Comfortable leather booth table, popular for business lunches.'
        ],
        'Rooftop Dining': [
          'Spacious rooftop table near the live acoustic band stage.',
          'Scenic deck seating under warm fairy lights.'
        ],
        'Window Side': [
          'Prime window-side seating with double aspect corner view.',
          'Comfortable dining table right next to the grand floor-to-ceiling glass panel windows.'
        ]
      },
      6: {
        'Indoor Seating': [
          'Large family banquette table offering plush seating and swift service.',
          'Prestige dining table set in a semi-private wood-paneled corner.'
        ],
        'Rooftop Dining': [
          'Premium high-capacity patio table under a luxury cabana.',
          'Grand sky-view dining table perfect for birthday celebrations.'
        ],
        'Window Side': [
          'Elegant large window table with panoramic view of the botanical gardens.',
          'Grand panoramic window-side table, perfect for family dinners.'
        ]
      }
    };

    const areaKey = Object.keys(descriptions[capacity] || {}).find(k => area.toLowerCase().includes(k.toLowerCase().split(' ')[0])) || Object.keys(descriptions[capacity] || {})[0];
    const list = descriptions[capacity]?.[areaKey] || ['Premium dining table offering superb hospitality.'];
    return list[Math.floor(Math.random() * list.length)];
  };

  const generateInventory = () => {
    const list = [];
    let tableNum = 1;
    wizardAreas.forEach(area => {
      wizardTableTypes.forEach(type => {
        const qty = wizardAllocations[`${type.capacity}-${area.name}`] || 0;
        for (let i = 0; i < qty; i++) {
          list.push({
            id: `temp-t-${tableNum}`,
            tableNumber: `T${tableNum}`,
            category: area.name,
            capacity: type.capacity,
            description: getRandomDescription(type.capacity, area.name),
            isBestseller: type.capacity === 6 || (type.capacity === 4 && tableNum % 2 === 0)
          });
          tableNum++;
        }
      });
    });
    const positioned = calculateLayoutPositionsLocal(list);
    setWizardInventory(positioned);
  };

  const handleAllocationChange = (capacity, areaName, val) => {
    const parsed = parseInt(val, 10) || 0;
    setWizardAllocations(prev => ({
      ...prev,
      [`${capacity}-${areaName}`]: Math.max(0, parsed)
    }));
  };

  const getAssignedQuantityForType = (capacity) => {
    return wizardAreas.reduce((sum, area) => sum + (wizardAllocations[`${capacity}-${area.name}`] || 0), 0);
  };

  const getAssignedQuantityForArea = (areaName) => {
    return wizardTableTypes.reduce((sum, type) => sum + (wizardAllocations[`${type.capacity}-${areaName}`] || 0), 0);
  };

  const handleSaveWizardLayout = async () => {
    setWizardSaving(true);
    setError('');
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 1200));
        setWizardStep(6);
        onRefresh();
        return;
      }
      
      const payload = {
        restaurantId: restaurant.id,
        tables: wizardInventory.map(t => ({
          tableNumber: t.tableNumber,
          category: t.category,
          capacity: t.capacity,
          description: t.description,
          positionX: t.positionX,
          positionY: t.positionY,
          isBestseller: t.isBestseller
        })),
        seatingAreas: wizardAreas,
        tableTypes: wizardTableTypes
      };

      await axios.post(`/api/restaurants/${restaurant.id}/tables/bulk`, payload);
      setWizardStep(6);
      onRefresh();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save seating setup layout.');
    } finally {
      setWizardSaving(false);
    }
  };

  // Update tables when selected restaurant changes
  useEffect(() => {
    if (restaurant) {
      setTables(restaurant.tables || []);
    } else {
      setTables([]);
    }
  }, [restaurant]);

  const handleAdd = async () => {
    if (!newTable.tableNumber || !newTable.capacity) {
      setError('Table number and capacity are required.');
      return;
    }
    setError('');
    setAdding(true);
    try {
      // Assign a default spread position for the new table
      const defaultX = 15 + (tables.length % 5) * 18;
      const defaultY = 15 + Math.floor(tables.length / 5) * 25;

      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 600));
        const mockNewTable = {
          id: `demo-table-${Date.now()}`,
          restaurantId: restaurant.id,
          tableNumber: newTable.tableNumber,
          category: newTable.category,
          capacity: parseInt(newTable.capacity, 10),
          description: newTable.description || '',
          positionX: defaultX,
          positionY: defaultY,
          bookingCount: 0,
          isBestseller: false
        };
        const updatedTables = [...tables, mockNewTable];
        setTables(updatedTables);
        restaurant.tables = updatedTables;
        setNewTable({ tableNumber: '', category: 'Center', capacity: '2', description: '' });
        onRefresh();
        return;
      }

      const res = await axios.post(`/api/restaurants/${restaurant.id}/tables`, {
        restaurantId: restaurant.id,
        tableNumber: newTable.tableNumber,
        category: newTable.category,
        capacity: parseInt(newTable.capacity, 10),
        description: newTable.description || '',
        positionX: defaultX,
        positionY: defaultY
      });
      
      const updatedTables = [...tables, res.data.data];
      setTables(updatedTables);
      setNewTable({ tableNumber: '', category: 'Center', capacity: '2', description: '' });
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add table.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (tableId) => {
    setDeletingId(tableId);
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 400));
        const updatedTables = tables.filter(t => t.id !== tableId);
        setTables(updatedTables);
        restaurant.tables = updatedTables;
        onRefresh();
        return;
      }
      await axios.delete(`/api/tables/${tableId}`);
      setTables(tables.filter(t => t.id !== tableId));
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete table.');
    } finally {
      setDeletingId(null);
    }
  };

  if (restaurants.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-cream-200 shadow-sm p-16 text-center animate-fade-in max-w-2xl mx-auto flex flex-col items-center">
        {/* Visual Blueprint illustration */}
        <div className="w-48 h-48 mb-6 relative">
          <svg viewBox="0 0 200 200" className="w-full h-full text-gold-500" fill="none" stroke="currentColor">
            <rect x="40" y="40" width="120" height="120" rx="10" strokeWidth="2" className="text-brown-900" />
            <path d="M40 80 L160 80" strokeWidth="1" strokeDasharray="4 4" className="text-brown-300" />
            <path d="M40 120 L160 120" strokeWidth="1" strokeDasharray="4 4" className="text-brown-300" />
            <path d="M80 40 L80 160" strokeWidth="1" strokeDasharray="4 4" className="text-brown-300" />
            <path d="M120 40 L120 160" strokeWidth="1" strokeDasharray="4 4" className="text-brown-300" />
            
            {/* Draw a table representation */}
            <circle cx="100" cy="100" r="20" strokeWidth="2" fill="white" className="text-brown-900" />
            <circle cx="100" cy="70" r="6" strokeWidth="1.5" className="text-gold-500" />
            <circle cx="100" cy="130" r="6" strokeWidth="1.5" className="text-gold-500" />
            <circle cx="70" cy="100" r="6" strokeWidth="1.5" className="text-gold-500" />
            <circle cx="130" cy="100" r="6" strokeWidth="1.5" className="text-gold-500" />
          </svg>
        </div>
        <h3 className="text-xl font-serif font-bold text-brown-900 mb-2">No Restaurant Profiles Found</h3>
        <p className="text-brown-600 mb-6 max-w-md mx-auto font-sans">Please add a restaurant first in the "Restaurant Management" tab to configure dining tables.</p>
      </div>
    );
  }

  const totalCap = tables.reduce((sum, t) => sum + t.capacity, 0) || 0;
  const bestsellers = tables.filter(t => t.isBestseller).length || 0;

  return (
    <div className="bg-white rounded-3xl border border-cream-200 shadow-sm p-6 md:p-8 animate-fade-in space-y-6">
      {/* Selector header if multiple restaurants */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cream-100 pb-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-brown-900">Table Management</h2>
          <p className="text-sm text-brown-700/60 mt-1 font-sans">Configure floor blueprints, seating categories, and layout details.</p>
        </div>
        {restaurants.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brown-700 uppercase tracking-wider font-sans">Restaurant:</span>
            <select
              value={selectedIdx}
              onChange={(e) => setSelectedIdx(parseInt(e.target.value, 10))}
              className="px-4 py-2.5 border border-cream-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 cursor-pointer font-serif font-bold text-brown-900"
            >
              {restaurants.map((r, idx) => (
                <option key={r.id} value={idx}>{r.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm text-center py-2.5 px-4 rounded-xl border border-red-100 flex items-center justify-center gap-2">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-cream-100/40 rounded-xl p-4 border border-cream-200/50">
          <p className="text-xs text-brown-600 font-semibold uppercase tracking-wider font-sans">Total Tables</p>
          <p className="text-2xl font-bold font-serif text-brown-900 mt-1">{tables.length}</p>
        </div>
        <div className="bg-cream-100/40 rounded-xl p-4 border border-cream-200/50">
          <p className="text-xs text-brown-600 font-semibold uppercase tracking-wider font-sans">Total Seating Capacity</p>
          <p className="text-2xl font-bold font-serif text-brown-900 mt-1">{totalCap} guests</p>
        </div>
        <div className="bg-cream-100/40 rounded-xl p-4 border border-cream-200/50">
          <p className="text-xs text-brown-600 font-semibold uppercase tracking-wider font-sans">Bestseller Tables</p>
          <p className="text-2xl font-bold font-serif text-brown-900 mt-1">{bestsellers} popular</p>
        </div>
      </div>

      {/* Editor/List Tabs */}
      <div className="flex gap-2 bg-cream-100 p-1 rounded-xl">
        <button
          onClick={() => setTab('list')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${tab === 'list' ? 'bg-white text-brown-900 shadow-sm' : 'text-brown-500 hover:text-brown-900'}`}
        >
          <LayoutGrid size={15} /> Table Setup & List
        </button>
        <button
          onClick={() => setTab('blueprint')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${tab === 'blueprint' ? 'bg-white text-brown-900 shadow-sm' : 'text-brown-500 hover:text-brown-900'}`}
        >
          <Move size={15} /> Floor Plan Editor
        </button>
        <button
          onClick={() => setTab('wizard')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${tab === 'wizard' ? 'bg-white text-brown-900 shadow-sm' : 'text-brown-500 hover:text-brown-900'}`}
        >
          <Sparkles size={15} className="text-gold-500 animate-pulse" /> Restaurant Setup Flow
        </button>
      </div>

      {/* TABLE LIST TAB */}
      {tab === 'list' && (
        <div className="space-y-6">
          {/* Add new table */}
          <div className="bg-cream-100/60 rounded-2xl p-5 border border-cream-200/40 space-y-4">
            <p className="text-xs font-bold text-brown-800 uppercase tracking-widest flex items-center gap-2">
              <Plus size={14} /> Add New Dining Table
            </p>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-3 flex flex-col gap-1.5">
                <label className="text-[10px] text-brown-700/60 font-bold uppercase tracking-wider font-sans">Table Number</label>
                <input
                  value={newTable.tableNumber}
                  onChange={e => setNewTable({ ...newTable, tableNumber: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  autoComplete="one-time-code"
                  className="w-full px-3 py-2.5 border border-cream-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 text-brown-900"
                  placeholder="e.g. Table 1"
                />
              </div>
              <div className="md:col-span-4 flex flex-col gap-1.5">
                <label className="text-[10px] text-brown-700/60 font-bold uppercase tracking-wider font-sans">Category/Zone</label>
                <select
                  value={newTable.category}
                  onChange={e => setNewTable({ ...newTable, category: e.target.value })}
                  className="w-full px-3 py-2.5 border border-cream-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 appearance-none cursor-pointer text-brown-900"
                >
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-[10px] text-brown-700/60 font-bold uppercase tracking-wider font-sans">Capacity (Seats)</label>
                <input
                  type="number" min="1" max="20"
                  value={newTable.capacity}
                  onChange={e => setNewTable({ ...newTable, capacity: e.target.value })}
                  autoComplete="one-time-code"
                  className="w-full px-3 py-2.5 border border-cream-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 text-brown-900"
                  placeholder="2"
                />
              </div>
              <div className="md:col-span-3 flex items-end">
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="w-full bg-brown-900 text-cream-100 rounded-xl text-xs font-bold hover:bg-gold-500 hover:text-brown-900 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 py-3 shadow-md"
                >
                  {adding ? (
                    <div className="w-4 h-4 border-2 border-cream-100/30 border-t-cream-100 rounded-full animate-spin" />
                  ) : (
                    <><Plus size={14} /> Add Table</>
                  )}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 pt-3 border-t border-brown-900/5">
              <label className="text-[10px] text-brown-700/60 font-bold uppercase tracking-wider font-sans">Table Description / Ambiance details</label>
              <input
                value={newTable.description}
                onChange={e => setNewTable({ ...newTable, description: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                autoComplete="one-time-code"
                className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 text-brown-900"
                placeholder="e.g. Cozy window seat with a panoramic view of the botanical gardens."
              />
            </div>
          </div>

          {/* Existing tables list */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {tables.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-cream-200 rounded-2xl bg-cream-50/10 flex flex-col items-center">
                <div className="w-24 h-24 mb-4 text-gold-500">
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor">
                    <circle cx="50" cy="50" r="30" strokeWidth="1.5" strokeDasharray="3 3" className="text-brown-300" />
                    <rect x="38" y="38" width="24" height="24" rx="4" strokeWidth="2" className="text-brown-900" />
                    <circle cx="50" cy="24" r="4" strokeWidth="1.5" className="text-gold-500" />
                    <circle cx="50" cy="76" r="4" strokeWidth="1.5" className="text-gold-500" />
                  </svg>
                </div>
                <p className="text-brown-900 font-serif font-bold text-sm">No Tables Configured</p>
                <p className="text-xs text-brown-500 font-sans mt-0.5">Add your first table using the form above to build your floor plan.</p>
              </div>
            ) : (
              tables.map(table => (
                <motion.div key={table.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center justify-between bg-white border border-cream-200 rounded-2xl px-4 py-3 hover:bg-cream-100/30 transition-colors shadow-sm">
                  <div className="flex flex-col gap-1 w-[70%] text-left">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-bold text-brown-900 font-serif">Table {table.tableNumber}</span>
                      <span className="text-[10px] bg-cream-200 text-brown-800 px-2 py-0.5 rounded-full font-bold font-sans uppercase">{table.category}</span>
                      <span className="text-xs text-brown-600 font-medium font-sans">{table.capacity} Seats</span>
                    </div>
                    {table.description && (
                      <p className="text-[11px] text-brown-600/70 italic font-sans">"{table.description}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {table.isBestseller && (
                      <span className="text-[9px] bg-gold-500/10 text-gold-600 border border-gold-500/25 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-sans">⭐ Bestseller</span>
                    )}
                    <span className="text-xs text-brown-500 font-sans font-semibold shrink-0">{table.bookingCount} bookings</span>
                    <button
                      onClick={() => handleDelete(table.id)}
                      disabled={deletingId === table.id}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {deletingId === table.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {tables.length > 0 && (
            <button
              onClick={() => setTab('blueprint')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-brown-800 bg-cream-100 hover:bg-cream-200 transition-colors cursor-pointer border border-cream-200/50 shadow-sm"
            >
              <Move size={14} /> View Layout in Floor Plan Editor <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* BLUEPRINT EDITOR TAB */}
      {tab === 'blueprint' && (
        <div className="space-y-4">
          <BlueprintEditor
            tables={tables}
            restaurantId={restaurant.id}
            isDemoMode={isDemoMode}
            onSavePositions={(positions) => {
              setTables(prev => prev.map(t => ({
                ...t,
                positionX: positions[t.id]?.x ?? t.positionX,
                positionY: positions[t.id]?.y ?? t.positionY
              })));
            }}
          />
          <button
            onClick={() => setTab('list')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-brown-800 bg-cream-100 hover:bg-cream-200 transition-colors cursor-pointer border border-cream-200/50 shadow-sm"
          >
            <ChevronLeft size={14} /> Back to Table List
          </button>
        </div>
      )}

      {/* RESTAURANT SETUP FLOW WIZARD */}
      {tab === 'wizard' && (
        <div className="space-y-6">
          {/* Step tracker header */}
          <div className="bg-cream-100/50 border border-cream-200/50 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-left">
              <span className="text-[10px] bg-gold-500 text-brown-900 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Step {wizardStep} of 6</span>
              <h3 className="font-serif font-bold text-brown-900 text-base mt-1">
                {wizardStep === 1 && "1️⃣ Create Dining Areas / Zones"}
                {wizardStep === 2 && "2️⃣ Configure Table Capacities & Quantities"}
                {wizardStep === 3 && "3️⃣ Allocate Tables to Seating Zones"}
                {wizardStep === 4 && "4️⃣ Auto-Generated Inventory Preview"}
                {wizardStep === 5 && "5️⃣ Spaced Out Floor Plan Grid Layout"}
                {wizardStep === 6 && "6️⃣ Ready For Reservations!"}
              </h3>
            </div>
            {/* Horizontal indicators */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6].map(s => (
                <div key={s} className="flex items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border
                    ${wizardStep === s
                      ? 'bg-brown-900 text-cream-100 border-brown-900 ring-2 ring-gold-500/30'
                      : s < wizardStep
                      ? 'bg-gold-500 text-brown-900 border-gold-500'
                      : 'bg-white text-brown-500 border-cream-200'}`}
                  >
                    {s}
                  </div>
                  {s < 6 && <div className={`w-4 h-0.5 ${s < wizardStep ? 'bg-gold-500' : 'bg-cream-200'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1: CREATE AREAS */}
          {wizardStep === 1 && (
            <div className="bg-cream-100/30 border border-cream-200/50 rounded-2xl p-5 space-y-4 text-left">
              <div>
                <h4 className="font-serif font-bold text-brown-900">Define Dining Areas</h4>
                <p className="text-xs text-brown-600 font-sans mt-0.5">Define physical zones in your restaurant (e.g. Indoor, Rooftop, Window Side).</p>
              </div>

              <div className="space-y-3">
                {wizardAreas.map((area, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white border border-cream-200 p-3 rounded-xl shadow-sm animate-fade-in">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-brown-500 font-bold uppercase tracking-wider block mb-1">Zone Name</label>
                        <input
                          type="text"
                          value={area.name}
                          onChange={e => {
                            const updated = [...wizardAreas];
                            updated[idx].name = e.target.value;
                            setWizardAreas(updated);
                          }}
                          placeholder="Area Name (e.g. Indoor Seating)"
                          className="px-3 py-2 w-full border border-cream-200 rounded-lg text-sm bg-cream-50/10 focus:outline-none focus:ring-2 focus:ring-gold-500/20 text-brown-900 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brown-500 font-bold uppercase tracking-wider block mb-1">Description</label>
                        <input
                          type="text"
                          value={area.description || ''}
                          onChange={e => {
                            const updated = [...wizardAreas];
                            updated[idx].description = e.target.value;
                            setWizardAreas(updated);
                          }}
                          placeholder="Description (e.g. Cozy tables next to windows)"
                          className="px-3 py-2 w-full border border-cream-200 rounded-lg text-sm bg-cream-50/10 focus:outline-none focus:ring-2 focus:ring-gold-500/20 text-brown-800"
                        />
                      </div>
                    </div>
                    <div className="flex items-end h-full pt-6">
                      <button
                        onClick={() => {
                          if (wizardAreas.length <= 1) return;
                          setWizardAreas(wizardAreas.filter((_, i) => i !== idx));
                        }}
                        className="p-2.5 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setWizardAreas([...wizardAreas, { name: '', description: '' }])}
                  className="flex items-center gap-1.5 text-xs font-bold text-brown-900 bg-cream-200 hover:bg-gold-500/20 px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-cream-300"
                >
                  <Plus size={14} /> Add Seating Area
                </button>
                <button
                  onClick={() => setWizardStep(2)}
                  disabled={wizardAreas.some(a => !a.name.trim())}
                  className="flex items-center gap-1 bg-brown-900 text-cream-100 hover:bg-gold-500 hover:text-brown-900 px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-45 cursor-pointer shadow-md"
                >
                  Next: Configure Table Types <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CONFIGURE TABLE TYPES */}
          {wizardStep === 2 && (
            <div className="bg-cream-100/30 border border-cream-200/50 rounded-2xl p-5 space-y-4 text-left">
              <div>
                <h4 className="font-serif font-bold text-brown-900">Define Table Layouts</h4>
                <p className="text-xs text-brown-600 font-sans mt-0.5">Specify how many tables you have of each guest capacity (e.g. 2-seaters, 4-seaters, etc.).</p>
              </div>

              <div className="space-y-3">
                {wizardTableTypes.map((type, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white border border-cream-200 p-3 rounded-xl shadow-sm animate-fade-in">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-brown-600 font-bold w-20 uppercase">Capacity</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={type.capacity}
                          onChange={e => {
                            const updated = [...wizardTableTypes];
                            updated[idx].capacity = parseInt(e.target.value, 10) || 1;
                            setWizardTableTypes(updated);
                          }}
                          className="px-3 py-2 border border-cream-200 rounded-lg text-sm bg-cream-50/10 focus:outline-none focus:ring-2 focus:ring-gold-500/20 text-brown-900 font-bold w-full"
                        />
                        <span className="text-xs text-brown-500 shrink-0">guests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-brown-600 font-bold w-20 uppercase">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={type.quantity}
                          onChange={e => {
                            const updated = [...wizardTableTypes];
                            updated[idx].quantity = parseInt(e.target.value, 10) || 1;
                            setWizardTableTypes(updated);
                          }}
                          className="px-3 py-2 border border-cream-200 rounded-lg text-sm bg-cream-50/10 focus:outline-none focus:ring-2 focus:ring-gold-500/20 text-brown-900 font-bold w-full"
                        />
                        <span className="text-xs text-brown-500 shrink-0">tables</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (wizardTableTypes.length <= 1) return;
                        setWizardTableTypes(wizardTableTypes.filter((_, i) => i !== idx));
                      }}
                      className="p-2.5 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Total Configured Tables Status */}
              <div className="bg-cream-100 p-3.5 rounded-xl border border-cream-200/50 flex items-center justify-between text-xs text-brown-800">
                <span className="font-sans font-bold uppercase tracking-wider text-[10px]">Total Configured Dining Tables:</span>
                <span className="text-base font-black font-serif text-brown-900">
                  {wizardTableTypes.reduce((a, b) => a + b.quantity, 0)} tables
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="flex items-center gap-1 text-xs font-bold text-brown-850 bg-cream-250 hover:bg-cream-300 px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-cream-300"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <button
                    onClick={() => setWizardTableTypes([...wizardTableTypes, { capacity: 2, quantity: 1 }])}
                    className="flex items-center gap-1.5 text-xs font-bold text-brown-905 bg-cream-200 hover:bg-gold-500/20 px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-cream-300"
                  >
                    <Plus size={14} /> Add Table Type
                  </button>
                </div>
                <button
                  onClick={() => setWizardStep(3)}
                  disabled={wizardTableTypes.some(t => !t.capacity || !t.quantity)}
                  className="flex items-center gap-1 bg-brown-900 text-cream-100 hover:bg-gold-500 hover:text-brown-900 px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-45 cursor-pointer shadow-md"
                >
                  Next: Assign to Areas <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ALLOCATE TABLES TO AREAS */}
          {wizardStep === 3 && (() => {
            const indoorAssigned = getAssignedQuantityForArea('Indoor Seating');
            const rooftopAssigned = getAssignedQuantityForArea('Rooftop Dining');
            const windowAssigned = getAssignedQuantityForArea('Window Side');
            
            const totalRemaining = wizardTableTypes.reduce((sum, type) => {
              return sum + (type.quantity - getAssignedQuantityForType(type.capacity));
            }, 0);

            const isAllAllocated = totalRemaining === 0;

            return (
              <div className="bg-cream-100/30 border border-cream-200/50 rounded-2xl p-5 space-y-4 text-left">
                <div>
                  <h4 className="font-serif font-bold text-brown-900">Allocate Seating Layout Matrices</h4>
                  <p className="text-xs text-brown-600 font-sans mt-0.5">Assign how many of each table type go into your created dining areas.</p>
                </div>

                <div className="overflow-x-auto border border-cream-200 rounded-xl bg-white p-3 shadow-inner">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-cream-200">
                        <th className="py-2 text-[10px] font-bold text-brown-600 uppercase tracking-wider">Table Size</th>
                        <th className="py-2 text-[10px] font-bold text-brown-600 uppercase tracking-wider text-center">Qty Configured</th>
                        {wizardAreas.map(area => (
                          <th key={area.name} className="py-2 text-[10px] font-bold text-brown-600 uppercase tracking-wider text-center">{area.name}</th>
                        ))}
                        <th className="py-2 text-[10px] font-bold text-brown-600 uppercase tracking-wider text-center">Unassigned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wizardTableTypes.map(type => {
                        const assigned = getAssignedQuantityForType(type.capacity);
                        const remaining = type.quantity - assigned;
                        return (
                          <tr key={type.capacity} className="border-b border-cream-100">
                            <td className="py-3.5 text-sm font-bold text-brown-950">{type.capacity} Seater</td>
                            <td className="py-3.5 text-sm text-center text-brown-600 font-bold">{type.quantity}</td>
                            {wizardAreas.map(area => {
                              const key = `${type.capacity}-${area.name}`;
                              const val = wizardAllocations[key] ?? 0;
                              return (
                                <td key={area.name} className="py-3.5 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max={type.quantity}
                                    value={val}
                                    onChange={e => handleAllocationChange(type.capacity, area.name, e.target.value)}
                                    className="w-16 px-2.5 py-1.5 text-center border border-cream-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 text-brown-900 font-extrabold shadow-sm"
                                  />
                                </td>
                              );
                            })}
                            <td className="py-3.5 text-center">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${remaining === 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {remaining === 0 ? '✓ All Set' : `${remaining} left`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Matrix totals footer row */}
                      <tr className="bg-cream-100/30">
                        <td className="py-3 text-xs font-serif font-black text-brown-900 uppercase">Total Tables Assigned</td>
                        <td className="py-3 text-sm text-center text-brown-900 font-black">
                          {wizardTableTypes.reduce((a, b) => a + b.quantity, 0)}
                        </td>
                        {wizardAreas.map(area => {
                          const total = getAssignedQuantityForArea(area.name);
                          return (
                            <td key={area.name} className="py-3 text-center text-sm font-black text-brown-900">
                              {total} tables
                            </td>
                          );
                        })}
                        <td className="py-3 text-center text-xs font-bold text-brown-750">
                          Allocated: {wizardTableTypes.reduce((a, b) => a + getAssignedQuantityForType(b.capacity), 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Target Zone Limits Validation Banner */}
                <div className="bg-white border border-cream-200 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] font-bold text-brown-700 uppercase tracking-widest block">🎯 Setup Constraints Check:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between
                      ${indoorAssigned === 6 ? 'bg-green-50/50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                      <span>Indoor: 6 Tables</span>
                      <span className="font-extrabold">{indoorAssigned} / 6</span>
                    </div>
                    <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between
                      ${rooftopAssigned === 4 ? 'bg-green-50/50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                      <span>Rooftop: 4 Tables</span>
                      <span className="font-extrabold">{rooftopAssigned} / 4</span>
                    </div>
                    <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between
                      ${windowAssigned === 2 ? 'bg-green-50/50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                      <span>Window Side: 2 Tables</span>
                      <span className="font-extrabold">{windowAssigned} / 2</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="flex items-center gap-1 text-xs font-bold text-brown-800 bg-cream-200 hover:bg-cream-300 px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-cream-300"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <button
                    onClick={() => {
                      generateInventory();
                      setWizardStep(4);
                    }}
                    disabled={!isAllAllocated}
                    className="flex items-center gap-1 bg-brown-900 text-cream-100 hover:bg-gold-500 hover:text-brown-900 px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-45 cursor-pointer shadow-md"
                  >
                    Next: Generate Inventory <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* STEP 4: AUTO GENERATE INVENTORY */}
          {wizardStep === 4 && (
            <div className="bg-cream-100/30 border border-cream-200/50 rounded-2xl p-5 space-y-4 text-left">
              <div>
                <h4 className="font-serif font-bold text-brown-900">Generated Table Inventory (T1–T12)</h4>
                <p className="text-xs text-brown-600 font-sans mt-0.5">Review the automatically generated catalog codes, seating sizes, and descriptions.</p>
              </div>

              {/* Scrollable table details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {wizardInventory.map((table, idx) => (
                  <div key={idx} className="bg-white border border-cream-200 p-3 rounded-xl shadow-sm flex items-center justify-between animate-fade-in">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-brown-900 text-sm font-serif">Table {table.tableNumber}</span>
                        <span className="text-[9px] bg-cream-200 text-brown-800 px-2 py-0.5 rounded-full font-bold uppercase">{table.category}</span>
                      </div>
                      <p className="text-[10px] text-brown-500 italic mt-1">"{table.description}"</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs bg-gold-500/10 text-gold-600 border border-gold-500/25 px-2.5 py-1 rounded-lg font-extrabold block">{table.capacity} Seats</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setWizardStep(3)}
                  className="flex items-center gap-1 text-xs font-bold text-brown-800 bg-cream-200 hover:bg-cream-300 px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-cream-300"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  onClick={() => setWizardStep(5)}
                  className="flex items-center gap-1 bg-brown-900 text-cream-100 hover:bg-gold-500 hover:text-brown-900 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Next: Generate Floor Plan <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: GENERATE FLOOR PLAN */}
          {wizardStep === 5 && (
            <div className="bg-cream-100/30 border border-cream-200/50 rounded-2xl p-5 space-y-4 text-left">
              <div>
                <h4 className="font-serif font-bold text-brown-900">Blueprint Editor Positioning Grid</h4>
                <p className="text-xs text-brown-600 font-sans mt-0.5">Tables have been arranged cleanly on their relative zone grids. Feel free to drag to customize.</p>
              </div>

              <div className="border border-cream-200 rounded-2xl p-4 bg-white shadow-sm">
                <BlueprintEditor
                  tables={wizardInventory}
                  restaurantId={restaurant.id}
                  isDemoMode={isDemoMode}
                  isWizardMode={true}
                  onSavePositions={(positions) => {
                    setWizardInventory(prev => prev.map(t => ({
                      ...t,
                      positionX: positions[t.id]?.x ?? t.positionX,
                      positionY: positions[t.id]?.y ?? t.positionY
                    })));
                  }}
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setWizardStep(4)}
                  className="flex items-center gap-1 text-xs font-bold text-brown-850 bg-cream-250 hover:bg-cream-300 px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-cream-300"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  onClick={handleSaveWizardLayout}
                  disabled={wizardSaving}
                  className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-600 text-brown-900 px-6 py-3.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
                >
                  {wizardSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-brown-900/30 border-t-brown-900 rounded-full animate-spin" />
                      Saving Setup Layout...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Save & Ready For Reservations!
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: READY FOR RESERVATIONS */}
          {wizardStep === 6 && (
            <div className="bg-cream-100/30 border border-cream-200/50 rounded-3xl p-8 max-w-xl mx-auto space-y-6 text-center animate-fade-in flex flex-col items-center">
              <div className="w-20 h-20 bg-green-50 text-green-600 border border-green-200 rounded-full flex items-center justify-center shadow-md animate-bounce">
                <CheckCircle2 size={42} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-brown-900">Configuration Complete!</h3>
                <p className="text-sm text-brown-700/80 font-sans max-w-sm mx-auto">
                  Your seating zones, capacity structures, and T1–T12 floor blueprint layout have been initialized successfully.
                </p>
              </div>

              {/* Layout Summary details card */}
              <div className="w-full bg-white border border-cream-200 rounded-2xl p-4 text-left grid grid-cols-3 gap-3 shadow-inner">
                <div className="text-center border-r border-cream-100">
                  <p className="text-[10px] text-brown-600 font-bold uppercase">Areas</p>
                  <p className="text-xl font-bold font-serif text-brown-900 mt-1">{wizardAreas.length}</p>
                </div>
                <div className="text-center border-r border-cream-100">
                  <p className="text-[10px] text-brown-600 font-bold uppercase">Tables Created</p>
                  <p className="text-xl font-bold font-serif text-brown-900 mt-1">{wizardInventory.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-brown-600 font-bold uppercase">Total Seats</p>
                  <p className="text-xl font-bold font-serif text-brown-900 mt-1">
                    {wizardInventory.reduce((sum, t) => sum + t.capacity, 0)} guests
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => {
                    setWizardStep(1);
                    setTab('list');
                  }}
                  className="flex-1 bg-brown-900 text-cream-100 hover:bg-gold-500 hover:text-brown-900 py-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Return to Table List
                </button>
                <button
                  onClick={() => {
                    setWizardStep(1);
                    setTab('blueprint');
                  }}
                  className="flex-1 bg-cream-200 text-brown-900 hover:bg-cream-300 py-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-cream-300"
                >
                  View Floor Blueprint Editor
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TableManagementTab;
