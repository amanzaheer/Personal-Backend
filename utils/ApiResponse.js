/**
 * Standardized API response helper
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', data = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: data || undefined,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
