const Membership = require('../models/Membership');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/ApiResponse');

const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// @desc    Subscribe to membership
// @route   POST /api/membership/subscribe
// @access  Private
exports.subscribe = async (req, res, next) => {
  try {
    const { planName, price, endDate, paymentId } = req.body;

    if (!planName || !price || !endDate) {
      return errorResponse(res, 400, 'Please provide planName, price and endDate');
    }

    const membership = await Membership.create({
      userId: req.user.id,
      planName,
      price,
      endDate: new Date(endDate),
      paymentId: paymentId || undefined,
    });

    await User.findByIdAndUpdate(req.user.id, { membershipStatus: 'active' });

    const populatedMembership = await Membership.findById(membership._id).populate(
      'userId',
      'name email'
    );

    return successResponse(res, 201, 'Subscription successful', {
      membership: populatedMembership,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's membership status
// @route   GET /api/membership/status
// @access  Private
exports.getStatus = async (req, res, next) => {
  try {
    const membership = await Membership.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    if (!membership) {
      return successResponse(res, 200, 'No active membership', {
        membership: null,
        status: 'inactive',
      });
    }

    const isExpired = new Date() > new Date(membership.endDate);
    if (isExpired) {
      await Membership.findByIdAndUpdate(membership._id, { status: 'expired' });
      await User.findByIdAndUpdate(req.user.id, { membershipStatus: 'inactive' });
    }

    return successResponse(res, 200, 'Success', {
      membership,
      status: membership.status,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all memberships (Admin only)
// @route   GET /api/membership/all
// @access  Private/Admin
exports.getAllMemberships = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [memberships, total] = await Promise.all([
      Membership.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Membership.countDocuments(),
    ]);

    return successResponse(res, 200, 'Success', {
      memberships,
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

// @desc    Update membership
// @route   PUT /api/membership/:id
// @access  Private/Admin
exports.updateMembership = async (req, res, next) => {
  try {
    const { planName, price, status, startDate, endDate } = req.body;
    const fieldsToUpdate = {};

    if (planName !== undefined) fieldsToUpdate.planName = planName;
    if (price !== undefined) fieldsToUpdate.price = price;
    if (status !== undefined) fieldsToUpdate.status = status;
    if (startDate !== undefined) fieldsToUpdate.startDate = startDate;
    if (endDate !== undefined) fieldsToUpdate.endDate = endDate;

    const membership = await Membership.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!membership) {
      return errorResponse(res, 404, 'Membership not found');
    }

    if (status === 'expired') {
      await User.findByIdAndUpdate(membership.userId._id, { membershipStatus: 'inactive' });
    } else if (status === 'active') {
      await User.findByIdAndUpdate(membership.userId._id, { membershipStatus: 'active' });
    }

    return successResponse(res, 200, 'Membership updated successfully', { membership });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete membership
// @route   DELETE /api/membership/:id
// @access  Private/Admin
exports.deleteMembership = async (req, res, next) => {
  try {
    const membership = await Membership.findById(req.params.id);
    if (!membership) {
      return errorResponse(res, 404, 'Membership not found');
    }

    await Membership.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(membership.userId, { membershipStatus: 'inactive' });

    return successResponse(res, 200, 'Membership deleted successfully');
  } catch (error) {
    next(error);
  }
};
