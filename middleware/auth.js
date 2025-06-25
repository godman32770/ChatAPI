// chat-api/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('Authorization');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Extract the token part if it's in "Bearer <token>" format
  const tokenParts = token.split(' ');
  const actualToken = tokenParts.length === 2 && tokenParts[0] === 'Bearer' ? tokenParts[1] : token;

  // Verify token
  try {
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    req.user = decoded.user; // Attach user payload to request
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
