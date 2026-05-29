import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Calendar, Clock, Users } from 'lucide-react';
import axios from 'axios';

const ViewBookingsModal = ({ restaurant, onClose }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get('/api/bookings/admin/all');
        // Filter to this specific restaurant
        const filtered = res.data.data.filter(b => b.restaurant?.name === restaurant.name);
        setBookings(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [restaurant]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8 py-5 rounded-t-3xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-brown-900">Bookings</h2>
            <p className="text-sm text-brown-700/60">{restaurant.name} — {bookings.length} reservations</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-50 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors cursor-pointer"><X size={18} /></button>
        </div>

        <div className="px-8 py-6">
          {loading ? (
            <div className="text-center py-10 text-brown-500 text-sm">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-10">
              <Calendar size={36} className="mx-auto text-brown-300 mb-3" />
              <p className="text-brown-500 text-sm">No bookings for this restaurant yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-brown-800">
                <thead className="bg-cream-100 text-brown-900 font-serif">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-xl">Customer</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Table</th>
                    <th className="px-4 py-3">Guests</th>
                    <th className="px-4 py-3">Risk</th>
                    <th className="px-4 py-3 rounded-tr-xl">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className="border-b border-cream-100 hover:bg-cream-50 transition-colors">
                      <td className="px-4 py-3 font-medium">{b.user?.name || 'N/A'}</td>
                      <td className="px-4 py-3 flex items-center gap-1"><Calendar size={13} className="text-gold-500" /> {new Date(b.bookingDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><Clock size={13} className="inline text-gold-500 mr-1" />{b.bookingTime}</td>
                      <td className="px-4 py-3">{b.table?.tableNumber} <span className="text-brown-500">({b.table?.category})</span></td>
                      <td className="px-4 py-3"><Users size={13} className="inline text-gold-500 mr-1" />{b.peopleCount}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          const risk = b.noShowRisk || 15;
                          let color = "bg-green-100 text-green-800";
                          let label = "Low";
                          if (risk >= 50) {
                            color = "bg-red-100 text-red-800";
                            label = "High";
                          } else if (risk >= 25) {
                            color = "bg-orange-100 text-orange-800";
                            label = "Medium";
                          }
                          return (
                            <span className={`${color} text-xs px-2 py-0.5 rounded-full font-bold`}>
                              {label} ({risk}%)
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium inline-flex items-center gap-1">
                          <CheckCircle2 size={11} /> {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ViewBookingsModal;
