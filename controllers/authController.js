const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/ApiResponse');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 400, 'Please provide name, email and password');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, 'User already exists with this email');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
    });

    const token = user.getSignedJwtToken();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      membershipStatus: user.membershipStatus,
      createdAt: user.createdAt,
    };

    return successResponse(res, 201, 'Registration successful', {
      user: userData,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide email and password');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    const token = user.getSignedJwtToken();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      membershipStatus: user.membershipStatus,
      createdAt: user.createdAt,
    };

    return successResponse(res, 200, 'Login successful', {
      user: userData,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      membershipStatus: user.membershipStatus,
      createdAt: user.createdAt,
    };
    return successResponse(res, 200, 'Success', { user: userData });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const fieldsToUpdate = {};

    if (name) fieldsToUpdate.name = name;
    if (email) fieldsToUpdate.email = email;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return errorResponse(res, 400, 'Please provide at least one field to update');
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      membershipStatus: user.membershipStatus,
      createdAt: user.createdAt,
    };

    return successResponse(res, 200, 'Profile updated successfully', { user: userData });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return errorResponse(
        res,
        400,
        'Please provide current password, new password and confirm password'
      );
    }

    if (newPassword.length < 8) {
      return errorResponse(
        res,
        400,
        'New password must be at least 8 characters long'
      );
    }

    if (newPassword !== confirmPassword) {
      return errorResponse(
        res,
        400,
        'New password and confirm password do not match'
      );
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 401, 'Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      return errorResponse(
        res,
        400,
        'Current password and new password should not be the same'
      );
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (client-side token invalidation - this endpoint for consistency)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    return successResponse(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};
