const prisma = require('../prisma/client');
const crypto = require('crypto');

const PUZZLES = [
  { id: '1', question: "I am always hungry, I must always be fed. The finger I touch, will soon turn red. What am I?", hint: "Think about elements.", answer: "fire" },
  { id: '2', question: "The more of them you take, the more you leave behind. What are they?", hint: "You make them when you walk.", answer: "footsteps" },
  { id: '3', question: "I have keys but no locks. I have space but no room. You can enter but can't go outside. What am I?", hint: "You are using it right now to type.", answer: "keyboard" },
  { id: '4', question: "What runs all around a backyard, yet never moves?", hint: "It bounds your property.", answer: "fence" },
  { id: '5', question: "What has hands but cannot clap?", hint: "It tells the time.", answer: "clock" },
  { id: '6', question: "What has a head and a tail but no body?", hint: "It's a form of currency.", answer: "coin" },
  { id: '7', question: "What is full of holes but still holds water?", hint: "You use it in the kitchen or bath.", answer: "sponge" },
  { id: '8', question: "What belongs to you, but other people use it more than you do?", hint: "It's how people address you.", answer: "name" },
  { id: '9', question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", hint: "Mountains do this.", answer: "echo" },
  { id: '10', question: "What gets wetter as it dries?", hint: "You use it after a shower.", answer: "towel" }
];

exports.getPuzzle = (req, res) => {
  const randomPuzzle = PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
  res.status(200).json({
    success: true,
    data: { id: randomPuzzle.id, question: randomPuzzle.question, hint: randomPuzzle.hint }
  });
};

exports.verifyPuzzle = (req, res) => {
  const { puzzleId, answer } = req.body;
  if (!answer) return res.status(400).json({ success: false, message: 'Answer is required' });
  if (!puzzleId) {
    if (answer.toLowerCase().trim() === 'fire') return res.status(200).json({ success: true, message: 'Correct answer!' });
    return res.status(400).json({ success: false, message: 'Incorrect answer. Try again!' });
  }
  const puzzle = PUZZLES.find(p => p.id === puzzleId);
  if (!puzzle) return res.status(404).json({ success: false, message: 'Puzzle not found' });
  if (answer.toLowerCase().trim() === puzzle.answer.toLowerCase()) {
    res.status(200).json({ success: true, message: 'Correct answer!' });
  } else {
    res.status(400).json({ success: false, message: 'Incorrect answer. Try again!' });
  }
};

exports.generateCoupon = async (req, res) => {
  try {
    // Prevent spamming: only 1 game coupon per 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCoupon = await prisma.coupon.findFirst({
      where: { userId: req.user.id, createdAt: { gt: oneDayAgo } }
    });
    if (recentCoupon) {
      return res.status(400).json({
        success: false,
        message: 'You already claimed a coupon in the last 24 hours. Come back tomorrow!'
      });
    }

    const code = 'WAIT' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const discount = Math.floor(Math.random() * 11) + 20; // 20–30%
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    const coupon = await prisma.coupon.create({
      data: { code, discount, userId: req.user.id, expiry }
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getMyCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { userId: req.user.id, isUsed: false, expiry: { gt: new Date() } },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
