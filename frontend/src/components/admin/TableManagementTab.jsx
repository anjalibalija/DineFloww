import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, LayoutGrid, Move, Save, ChevronRight, ChevronLeft, Sparkles, AlertTriangle, HelpCircle } from 'lucide-react';
import axios from 'axios';

const CATEGORY_OPTIONS = ['Rooftop', 'Window Side', 'Corner Side', 'Center', 'Courtyard', 'Private Cabin', 'Family Table', 'Couple Table', 'Outdoor', 'Bar Area'];

// ─── Blueprint Editor (drag & drop positioning) ────────────────────────────
const BlueprintEditor = ({ tables, restaurantId, onSavePositions, isDemoMode = false }) => {
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
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 1200));
        const newPositions = {};
        tables.forEach((t, idx) => {
          newPositions[t.id] = {
            x: 10 + (idx % 4) * 22 + Math.random() * 5,
            y: 15 + Math.floor(idx / 4) * 25 + Math.random() * 5
          };
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
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 800));
        setSaved(true);
        onSavePositions(positions);
        setTimeout(() => setSaved(false), 2500);
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
  const [tab, setTab] = useState('list'); // 'list' | 'blueprint'

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
    </div>
  );
};

export default TableManagementTab;
