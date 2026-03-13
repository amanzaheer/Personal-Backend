const { errorResponse } = require('../utils/ApiResponse');

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return errorResponse(res, 403, 'Access denied. Admin only.');
};

module.exports = adminMiddleware;
