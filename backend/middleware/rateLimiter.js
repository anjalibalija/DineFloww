const ipRequestCache = new Map();

// Configure limits: 10 requests max per 1 minute window for auth endpoints
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

exports.authRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();

  if (!ipRequestCache.has(ip)) {
    ipRequestCache.set(ip, []);
  }

  const timestamps = ipRequestCache.get(ip);
  
  // Keep only timestamps within the current window
  const validTimestamps = timestamps.filter(time => now - time < WINDOW_MS);
  
  if (validTimestamps.length >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many login or sign-up attempts. Please try again in 1 minute.'
    });
  }

  validTimestamps.push(now);
  ipRequestCache.set(ip, validTimestamps);
  next();
};
