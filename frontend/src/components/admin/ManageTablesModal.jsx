import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, LayoutGrid, Move, Save, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import axios from 'axios';

const CATEGORY_OPTIONS = ['Rooftop', 'Window Side', 'Corner Side', 'Center', 'Courtyard', 'Private Cabin', 'Family Table', 'Couple Table', 'Outdoor', 'Bar Area'];

// ─── Blueprint Editor (drag & drop positioning) ────────────────────────────
const BlueprintEditor = ({ tables, restaurantId, onSavePositions }) => {
  const floorRef = useRef(null);
  const [positions, setPositions] = useState(() => {
    const map = {};
    tables.forEach(t => {
      map[t.id] = {
        x: t.positionX > 0 ? t.positionX : Math.random() * 70 + 10,
        y: t.positionY > 0 ? t.positionY : Math.random() * 70 + 10
      };
    });
    return map;
  });
  const [dragging, setDragging] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const handleAIArrange = async () => {
    setOptimizing(true);
    try {
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
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-brown-800 uppercase tracking-widest flex items-center gap-2">
            <Move size={14} /> Floor Plan Editor
          </p>
          <p className="text-xs text-brown-600/60 mt-0.5">Drag tables to position them on the floor plan</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAIArrange}
            disabled={optimizing || saving || tables.length === 0}
            className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-600 text-brown-900 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md"
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
            className="flex items-center gap-1.5 bg-brown-900 text-cream-100 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gold-500 hover:text-brown-900 transition-colors disabled:opacity-50 cursor-pointer"
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
        {/* Room landmarks removed */}

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
        <span>Size = capacity</span>
      </div>
    </div>
  );
};

// ─── Main Modal ─────────────────────────────────────────────────────────────
const ManageTablesModal = ({ restaurant, onClose, onSuccess }) => {
  const [tables, setTables] = useState(restaurant.tables || []);
  const [newTable, setNewTable] = useState({ tableNumber: '', category: 'Center', capacity: '2', description: '' });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [tab, setTab] = useState('list'); // 'list' | 'blueprint'

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

      const res = await axios.post(`/api/restaurants/${restaurant.id}/tables`, {
        restaurantId: restaurant.id,
        tableNumber: newTable.tableNumber,
        category: newTable.category,
        capacity: parseInt(newTable.capacity, 10),
        description: newTable.description || '',
        positionX: defaultX,
        positionY: defaultY
      });
      setTables([...tables, res.data.data]);
      setNewTable({ tableNumber: '', category: 'Center', capacity: '2', description: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add table.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (tableId) => {
    setDeletingId(tableId);
    try {
      await axios.delete(`/api/tables/${tableId}`);
      setTables(tables.filter(t => t.id !== tableId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete table.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8 py-5 rounded-t-3xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-brown-900">Manage Tables & Blueprint</h2>
            <p className="text-sm text-brown-700/60">{restaurant.name} — {tables.length} table{tables.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => { onSuccess(); onClose(); }}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-50 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="px-8 py-6">
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-red-50 text-red-600 text-sm text-center py-2.5 px-4 rounded-xl border border-red-100 mb-4">{error}</motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-cream-100 p-1 rounded-xl">
            <button
              onClick={() => setTab('list')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${tab === 'list' ? 'bg-white text-brown-900 shadow-sm' : 'text-brown-600 hover:text-brown-900'}`}
            >
              <LayoutGrid size={15} /> Table List
            </button>
            <button
              onClick={() => setTab('blueprint')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${tab === 'blueprint' ? 'bg-white text-brown-900 shadow-sm' : 'text-brown-600 hover:text-brown-900'}`}
            >
              <Move size={15} /> Floor Plan Editor
            </button>
          </div>

          {/* TABLE LIST TAB */}
          {tab === 'list' && (
            <>
              {/* Add new table */}
              <div className="bg-cream-100 rounded-2xl p-5 mb-6 space-y-3">
                <p className="text-xs font-bold text-brown-800 uppercase tracking-widest flex items-center gap-2">
                  <Plus size={14} /> Add New Table
                </p>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-3 flex flex-col gap-1">
                    <label className="text-[10px] text-brown-600/70 font-bold uppercase">Table #</label>
                    <input
                      value={newTable.tableNumber}
                      onChange={e => setNewTable({ ...newTable, tableNumber: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleAdd()}
                      autoComplete="one-time-code"
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                      placeholder="e.g. T1"
                    />
                  </div>
                  <div className="col-span-4 flex flex-col gap-1">
                    <label className="text-[10px] text-brown-600/70 font-bold uppercase">Category</label>
                    <select
                      value={newTable.category}
                      onChange={e => setNewTable({ ...newTable, category: e.target.value })}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 appearance-none cursor-pointer"
                    >
                      {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] text-brown-600/70 font-bold uppercase">Seats</label>
                    <input
                      type="number" min="1" max="20"
                      value={newTable.capacity}
                      onChange={e => setNewTable({ ...newTable, capacity: e.target.value })}
                      autoComplete="one-time-code"
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                      placeholder="Seats"
                    />
                  </div>
                  <div className="col-span-3 flex items-end">
                    <button
                      onClick={handleAdd}
                      disabled={adding}
                      className="w-full bg-brown-900 text-cream-100 rounded-xl text-sm font-bold hover:bg-gold-500 hover:text-brown-900 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1 py-2"
                    >
                      {adding
                        ? <div className="w-4 h-4 border-2 border-cream-100/30 border-t-cream-100 rounded-full animate-spin" />
                        : <><Plus size={14} /> Add Table</>
                      }
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 pt-1 border-t border-brown-900/5">
                  <label className="text-[10px] text-brown-600/70 font-bold uppercase">Table Description (Ambiance, view details, etc.)</label>
                  <input
                    value={newTable.description}
                    onChange={e => setNewTable({ ...newTable, description: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    autoComplete="one-time-code"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                    placeholder="e.g., Cozy window seat with a panoramic view of the botanical gardens."
                  />
                </div>
              </div>

              {/* Existing tables list */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {tables.length === 0 ? (
                  <div className="text-center py-10 text-brown-500">
                    <LayoutGrid size={36} className="mx-auto text-brown-300 mb-3" />
                    <p className="text-sm">No tables yet. Add your first table above.</p>
                  </div>
                ) : tables.map(table => (
                  <motion.div key={table.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 hover:bg-cream-100/50 transition-colors">
                    <div className="flex flex-col gap-1 w-[70%] text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-brown-900 w-10">{table.tableNumber}</span>
                        <span className="text-xs bg-cream-200 text-brown-800 px-2.5 py-1 rounded-full font-medium">{table.category}</span>
                        <span className="text-sm text-brown-700">{table.capacity} seats</span>
                      </div>
                      {table.description && (
                        <p className="text-[11px] text-brown-600/70 italic pl-13">"{table.description}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {table.isBestseller && <span className="text-[10px] bg-gold-500/10 text-gold-500 px-2 py-0.5 rounded-full font-semibold">⭐ Bestseller</span>}
                      <span className="text-xs text-brown-500">{table.bookingCount} bookings</span>
                      <button
                        onClick={() => handleDelete(table.id)}
                        disabled={deletingId === table.id}
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {deletingId === table.id
                          ? <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Prompt to go to blueprint editor */}
              {tables.length > 0 && (
                <button
                  onClick={() => setTab('blueprint')}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-brown-700 bg-cream-100 hover:bg-cream-200 transition-colors cursor-pointer"
                >
                  <Move size={14} /> Go to Floor Plan Editor <ChevronRight size={14} />
                </button>
              )}
            </>
          )}

          {/* BLUEPRINT EDITOR TAB */}
          {tab === 'blueprint' && (
            <>
              <BlueprintEditor
                tables={tables}
                restaurantId={restaurant.id}
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
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-brown-700 bg-cream-100 hover:bg-cream-200 transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} /> Back to Table List
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ManageTablesModal;
