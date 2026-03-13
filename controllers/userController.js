const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/ApiResponse');

const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [users, total] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(),
    ]);

    return successResponse(res, 200, 'Success', {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    return successResponse(res, 200, 'Success', { user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, membershipStatus } = req.body;
    const fieldsToUpdate = {};

    if (name !== undefined) fieldsToUpdate.name = name;
    if (email !== undefined) fieldsToUpdate.email = email;
    if (membershipStatus !== undefined) fieldsToUpdate.membershipStatus = membershipStatus;

    const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'User updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    return successResponse(res, 200, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/users/role/:id
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || !['admin', 'member', 'user'].includes(role)) {
      return errorResponse(res, 400, 'Please provide a valid role (admin, member, user)');
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'Role updated successfully', { user });
  } catch (error) {
    next(error);
  }
};
