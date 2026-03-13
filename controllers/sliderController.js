const Slider = require('../models/Slider');
const { successResponse, errorResponse } = require('../utils/ApiResponse');

const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// @desc    Create slider
// @route   POST /api/sliders
// @access  Private/Admin
exports.createSlider = async (req, res, next) => {
  try {
    const { title, description, buttonText, buttonLink, order, status } = req.body;

    const image = req.files?.image?.[0] ? req.files.image[0].path.replace(/\\/g, '/') : undefined;
    const icon = req.files?.icon?.[0] ? req.files.icon[0].path.replace(/\\/g, '/') : undefined;
    const images = req.files?.images
      ? req.files.images.map((f) => f.path.replace(/\\/g, '/'))
      : [];

    const slider = await Slider.create({
      title: title || 'Untitled',
      description,
      image,
      icon,
      images,
      buttonText,
      buttonLink,
      order: order || 0,
      status: status || 'active',
    });

    return successResponse(res, 201, 'Slider created successfully', { slider });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sliders
// @route   GET /api/sliders
// @access  Public
exports.getSliders = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const [sliders, total] = await Promise.all([
      Slider.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Slider.countDocuments(filter),
    ]);

    return successResponse(res, 200, 'Success', {
      sliders,
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

// @desc    Get single slider
// @route   GET /api/sliders/:id
// @access  Public
exports.getSlider = async (req, res, next) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) {
      return errorResponse(res, 404, 'Slider not found');
    }
    return successResponse(res, 200, 'Success', { slider });
  } catch (error) {
    next(error);
  }
};

// @desc    Update slider
// @route   PUT /api/sliders/:id
// @access  Private/Admin
exports.updateSlider = async (req, res, next) => {
  try {
    const { title, description, buttonText, buttonLink, order, status } = req.body;
    const fieldsToUpdate = {};

    if (title !== undefined) fieldsToUpdate.title = title;
    if (description !== undefined) fieldsToUpdate.description = description;
    if (buttonText !== undefined) fieldsToUpdate.buttonText = buttonText;
    if (buttonLink !== undefined) fieldsToUpdate.buttonLink = buttonLink;
    if (order !== undefined) fieldsToUpdate.order = order;
    if (status !== undefined) fieldsToUpdate.status = status;

    if (req.files?.image?.[0]) {
      fieldsToUpdate.image = req.files.image[0].path.replace(/\\/g, '/');
    }
    if (req.files?.icon?.[0]) {
      fieldsToUpdate.icon = req.files.icon[0].path.replace(/\\/g, '/');
    }
    if (req.files?.images?.length) {
      fieldsToUpdate.images = req.files.images.map((f) => f.path.replace(/\\/g, '/'));
    }

    const slider = await Slider.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!slider) {
      return errorResponse(res, 404, 'Slider not found');
    }

    return successResponse(res, 200, 'Slider updated successfully', { slider });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete slider
// @route   DELETE /api/sliders/:id
// @access  Private/Admin
exports.deleteSlider = async (req, res, next) => {
  try {
    const slider = await Slider.findByIdAndDelete(req.params.id);
    if (!slider) {
      return errorResponse(res, 404, 'Slider not found');
    }
    return successResponse(res, 200, 'Slider deleted successfully');
  } catch (error) {
    next(error);
  }
};
