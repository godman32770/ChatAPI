// chat-api/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

// Rate limiting configuration: 20 requests per user per hour
// This applies per IP address by default, but we'll modify it to apply per authenticated user.
// For per-user rate limiting, we will use the req.user.id once authenticated.
// This example uses a simple in-memory store for demonstration. For production,
// consider using a persistent store like Redis.

// The `keyGenerator` function is crucial for per-user rate limiting.
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each authenticated user to 20 requests per `windowMs`
  message: 'Too many requests from this user, please try again after an hour',
  statusCode: 429,
  // Key generator uses the user ID from the JWT payload
  keyGenerator: (req, res) => {
    return req.user ? req.user.id : req.ip; // Fallback to IP if user not authenticated (though this middleware should be after auth)
  },
  handler: (req, res) => {
    res.status(chatLimiter.statusCode).json({
      message: chatLimiter.message,
      retryAfter: Math.ceil(chatLimiter.windowMs / (1000 * 60)) // in minutes
    });
  }
});

module.exports = chatLimiter;