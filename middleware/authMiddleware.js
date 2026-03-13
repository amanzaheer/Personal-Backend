const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/ApiResponse');

const authMiddleware = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 401, 'Not authorized to access this route');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return errorResponse(res, 401, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Invalid or expired token');
    }
    return errorResponse(res, 500, 'Server error');
  }
};

module.exports = authMiddleware;
