const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Attaches req.user if a valid token is present. Does not 401 if no token or invalid.
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) req.user = user;
    next();
  } catch {
    next();
  }
};

module.exports = optionalAuth;
