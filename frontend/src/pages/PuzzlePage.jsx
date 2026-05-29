import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Sparkles, Gift, CheckCircle2, XCircle, Gamepad2, Brain, Trophy, Clock, ArrowLeft, RefreshCw, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── Memory Match Game ───────────────────────────────────────────────────────
const FOOD_EMOJIS = ['🍕', '🍣', '🍔', '🍜', '🥗', '🍰', '🍗', '🥩'];
const generateCards = () => {
  const pairs = [...FOOD_EMOJIS, ...FOOD_EMOJIS];
  return pairs.sort(() => Math.random() - 0.5).map((emoji, i) => ({
    id: i, emoji, flipped: false, matched: false
  }));
};

const MemoryGame = ({ onWin }) => {
  const [cards, setCards] = useState(generateCards());
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);

  const handleFlip = (id) => {
    if (locked) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newSelected = [...selected, id];
    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);

    if (newSelected.length === 2) {
      setLocked(true);
      setMoves(m => m + 1);
      const [a, b] = newSelected.map(sid => newCards.find(c => c.id === sid));
      if (a.emoji === b.emoji) {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === a.id || c.id === b.id ? { ...c, matched: true } : c
          ));
          setSelected([]);
          setLocked(false);
          // Check win
          setCards(prev => {
            const updated = prev.map(c =>
              c.id === a.id || c.id === b.id ? { ...c, matched: true } : c
            );
            if (updated.every(c => c.matched)) {
              setTimeout(() => { setWon(true); onWin(); }, 600);
            }
            return updated;
          });
        }, 400);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === a.id || c.id === b.id ? { ...c, flipped: false } : c
          ));
          setSelected([]);
          setLocked(false);
        }, 900);
      }
    } else {
      setSelected(newSelected);
    }
  };

  const reset = () => {
    setCards(generateCards());
    setSelected([]);
    setMoves(0);
    setLocked(false);
    setWon(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-stone-600">
          <Trophy size={16} className="text-amber-500" />
          Moves: <span className="text-amber-600 text-lg">{moves}</span>
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-amber-600 transition-colors cursor-pointer">
          <RefreshCw size={14} /> Restart
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {cards.map(card => (
          <motion.button
            key={card.id}
            onClick={() => handleFlip(card.id)}
            whileHover={!card.flipped && !card.matched ? { scale: 1.05 } : {}}
            whileTap={!card.flipped && !card.matched ? { scale: 0.95 } : {}}
            className={`aspect-square rounded-2xl text-3xl flex items-center justify-center font-bold border-2 transition-all cursor-pointer shadow-sm
              ${card.matched
                ? 'bg-emerald-50 border-emerald-300 shadow-emerald-100'
                : card.flipped
                  ? 'bg-amber-50 border-amber-400 shadow-amber-100'
                  : 'bg-stone-900 border-stone-700 hover:bg-stone-800'
              }`}
          >
            <motion.span
              animate={{ rotateY: card.flipped || card.matched ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {card.flipped || card.matched ? card.emoji : '?'}
            </motion.span>
          </motion.button>
        ))}
      </div>
      <p className="text-center text-xs text-stone-400">Match all food pairs to win your coupon! 🎯</p>
    </div>
  );
};

// ─── Riddle Game ─────────────────────────────────────────────────────────────
const RiddleGame = ({ onWin }) => {
  const [puzzleData, setPuzzleData] = useState(null);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    axios.get('/api/puzzle').then(r => setPuzzleData(r.data.data)).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('checking');
    try {
      const res = await axios.post('/api/puzzle/verify', { puzzleId: puzzleData.id, answer });
      if (res.data.success) {
        setStatus('success');
        onWin();
      }
    } catch {
      setAttempts(a => a + 1);
      setStatus('error');
      setMessage('Not quite! Try again.');
      setTimeout(() => setStatus('idle'), 1500);
    }
  };

  if (!puzzleData) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 p-6 rounded-2xl border border-stone-700/50 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-amber-500/10 blur-xl" />
        <p className="text-lg font-serif font-bold text-white leading-relaxed relative z-10">{puzzleData.question}</p>
        <AnimatePresence>
          {showHint && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-amber-400 text-sm mt-3 italic relative z-10"
            >
              💡 Hint: {puzzleData.hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {attempts >= 2 && !showHint && (
        <button onClick={() => setShowHint(true)} className="text-xs font-bold text-amber-600 hover:text-amber-700 underline underline-offset-4 cursor-pointer">
          Need a hint?
        </button>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Type your answer..."
          autoComplete="one-time-code"
          className="w-full text-center text-xl font-bold px-4 py-3.5 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none text-stone-900 transition-colors bg-stone-50/50"
          required
        />
        <AnimatePresence>
          {status === 'error' && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 text-red-500 text-sm font-semibold">
              <XCircle size={16} /> {message}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          type="submit"
          disabled={status === 'checking'}
          className="w-full bg-gradient-to-r from-stone-900 to-stone-800 text-amber-400 py-3.5 rounded-2xl font-bold hover:from-amber-500 hover:to-amber-600 hover:text-stone-950 transition-all disabled:opacity-60 cursor-pointer shadow-lg"
        >
          {status === 'checking' ? 'Checking...' : 'Submit Answer →'}
        </button>
      </form>
      <p className="text-center text-xs text-stone-400">Attempts: {attempts} · Take your time, there's no time limit!</p>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const PuzzlePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState(null); // 'memory' | 'riddle'
  const [gameWon, setGameWon] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [claiming, setClaiming] = useState(false);

  const handleWin = useCallback(async () => {
    if (gameWon) return;
    setGameWon(true);
    setClaiming(true);
    try {
      const res = await axios.post('/api/coupons/generate');
      setCoupon(res.data.data);
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Could not generate coupon.');
    } finally {
      setClaiming(false);
    }
  }, [gameWon]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 to-stone-900 py-12 px-4">
      <div className="max-w-xl mx-auto">

        {/* Back button */}
        <Link
          to="/restaurants"
          className="inline-flex items-center gap-2 text-stone-400 hover:text-amber-400 transition-colors mb-8 text-sm font-semibold cursor-pointer group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Win celebration screen */}
        <AnimatePresence>
          {gameWon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              {/* Confetti-like particles */}
              {['🎉', '⭐', '🎊', '✨', '🏆', '🎁'].map((e, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 0, x: 0 }}
                  animate={{ opacity: [0, 1, 0], y: -120, x: (i - 2.5) * 50 }}
                  transition={{ delay: i * 0.1, duration: 1.2 }}
                  className="fixed text-3xl pointer-events-none"
                  style={{ left: '50%', top: '40%' }}
                >
                  {e}
                </motion.span>
              ))}

              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30"
              >
                <Trophy size={48} className="text-stone-900" />
              </motion.div>

              <div>
                <h1 className="text-4xl font-serif font-black text-white">You Won! 🎉</h1>
                <p className="text-stone-400 mt-2">Thanks for playing while you wait. Here's your reward:</p>
              </div>

              {claiming && (
                <div className="flex items-center justify-center gap-2 text-amber-400">
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-semibold">Generating your coupon...</span>
                </div>
              )}

              {coupon && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-6 shadow-2xl shadow-amber-500/20 overflow-hidden"
                >
                  {/* Dashed coupon border effect */}
                  <div className="absolute inset-2 rounded-2xl border-2 border-dashed border-amber-300/40 pointer-events-none" />
                  <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />

                  <div className="relative z-10 text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-amber-900 font-bold text-sm uppercase tracking-widest">
                      <Gift size={16} /> Your Exclusive Reward
                    </div>
                    <div className="text-6xl font-black text-stone-900">{coupon.discount}%</div>
                    <div className="text-amber-900 font-bold">OFF your bill</div>
                    <div className="bg-stone-900/20 rounded-xl px-4 py-2 inline-block">
                      <span className="font-mono font-black text-stone-900 text-xl tracking-[0.2em]">{coupon.code}</span>
                    </div>
                    <p className="text-amber-900/80 text-xs">Valid for 7 days · Use at checkout</p>
                  </div>
                </motion.div>
              )}

              {couponError && (
                <div className="bg-red-900/30 border border-red-500/30 text-red-300 p-4 rounded-2xl text-sm">
                  {couponError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  to="/dashboard"
                  className="flex-1 bg-white text-stone-900 py-3 rounded-2xl font-bold text-sm hover:bg-amber-400 transition-colors text-center"
                >
                  View in Dashboard
                </Link>
                <Link
                  to="/restaurants"
                  className="flex-1 bg-stone-800 text-stone-300 py-3 rounded-2xl font-bold text-sm hover:bg-stone-700 transition-colors text-center"
                >
                  Browse Restaurants
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Hub */}
        {!gameWon && (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8 space-y-4"
            >
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-4 py-2 rounded-full">
                <Clock size={13} /> Queue is long — play a game while you wait!
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-black text-white">
                Win a <span className="text-amber-400">Discount</span> Coupon
              </h1>
              <p className="text-stone-400 text-sm leading-relaxed">
                Beat a game and earn <strong className="text-amber-400">20–30% off</strong> your dining bill.<br/>
                Choose your challenge below.
              </p>

              {/* Prize preview */}
              <div className="flex items-center justify-center gap-2">
                {[20, 25, 30].map(d => (
                  <div key={d} className="bg-stone-800/80 border border-stone-700 px-3 py-1.5 rounded-full text-xs font-bold text-amber-400">
                    {d}% OFF
                  </div>
                ))}
                <span className="text-stone-500 text-xs">Random reward</span>
              </div>
            </motion.div>

            {/* Game selection */}
            {!selectedGame && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {[
                  {
                    id: 'memory',
                    icon: '🃏',
                    title: 'Memory Match',
                    desc: 'Flip cards and match pairs of food emojis. Match all 8 pairs to win!',
                    difficulty: 'Easy',
                    diffColor: 'text-emerald-400 bg-emerald-400/10',
                    time: '~2 min'
                  },
                  {
                    id: 'riddle',
                    icon: '🧩',
                    title: 'Riddle Challenge',
                    desc: 'Answer a tricky riddle correctly. Use hints if you get stuck!',
                    difficulty: 'Medium',
                    diffColor: 'text-amber-400 bg-amber-400/10',
                    time: '~1 min'
                  }
                ].map(game => (
                  <motion.button
                    key={game.id}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedGame(game.id)}
                    className="bg-stone-800/60 border border-stone-700/60 hover:border-amber-500/40 rounded-3xl p-6 text-left space-y-4 transition-all cursor-pointer group"
                  >
                    <div className="text-5xl">{game.icon}</div>
                    <div>
                      <h3 className="text-xl font-serif font-black text-white group-hover:text-amber-400 transition-colors">{game.title}</h3>
                      <p className="text-stone-400 text-xs mt-1 leading-relaxed">{game.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${game.diffColor}`}>{game.difficulty}</span>
                      <span className="text-[10px] text-stone-500 flex items-center gap-1"><Clock size={10} />{game.time}</span>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Active game */}
            {selectedGame && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-stone-800/50 border border-stone-700/50 rounded-3xl p-6 md:p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      {selectedGame === 'memory' ? <Gamepad2 size={20} className="text-amber-400" /> : <Brain size={20} className="text-amber-400" />}
                    </div>
                    <div>
                      <h2 className="text-lg font-serif font-black text-white">
                        {selectedGame === 'memory' ? 'Memory Match' : 'Riddle Challenge'}
                      </h2>
                      <p className="text-xs text-stone-500">Win to claim your coupon</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="text-xs text-stone-500 hover:text-stone-300 cursor-pointer transition-colors"
                  >
                    ← Change
                  </button>
                </div>

                {selectedGame === 'memory'
                  ? <MemoryGame onWin={handleWin} />
                  : <RiddleGame onWin={handleWin} />
                }
              </motion.div>
            )}

            {/* Disclaimer */}
            <p className="text-center text-xs text-stone-600 mt-6">
              One coupon per 24 hours per account. Valid for 7 days from issue.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default PuzzlePage;
