const Gallery = require('../models/Gallery');
const { successResponse, errorResponse } = require('../utils/ApiResponse');
const { toWebPath } = require('../utils/uploadPath');

const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// @desc    Create gallery item
// @route   POST /api/gallery
// @access  Private/Admin
exports.createGallery = async (req, res, next) => {
  try {
    const { title, type } = req.body;

    const image = req.file ? toWebPath(req.file.path, 'image') : undefined;

    if (!image) {
      return errorResponse(res, 400, 'Image is required');
    }

    const gallery = await Gallery.create({
      title: title || 'Untitled',
      image,
      type: type || 'image',
    });

    return successResponse(res, 201, 'Gallery item created successfully', { gallery });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all gallery items
// @route   GET /api/gallery
// @access  Public
exports.getGallery = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { type } = req.query;

    const filter = {};
    if (type) filter.type = type;

    const [gallery, total] = await Promise.all([
      Gallery.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Gallery.countDocuments(filter),
    ]);

    return successResponse(res, 200, 'Success', {
      gallery,
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

// @desc    Get single gallery item
// @route   GET /api/gallery/:id
// @access  Public
exports.getGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.findById(req.params.id).lean();
    if (!item) {
      return errorResponse(res, 404, 'Gallery item not found');
    }
    if (item.image) item.image = toWebPath(item.image, 'image');
    return successResponse(res, 200, 'Success', { gallery: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Update gallery item
// @route   PUT /api/gallery/:id
// @access  Private/Admin
exports.updateGallery = async (req, res, next) => {
  try {
    const { title, type } = req.body;
    const fieldsToUpdate = {};

    if (title !== undefined) fieldsToUpdate.title = title;
    if (type !== undefined) fieldsToUpdate.type = type;

    if (req.file) {
      fieldsToUpdate.image = toWebPath(req.file.path, 'image');
    }

    const gallery = await Gallery.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!gallery) {
      return errorResponse(res, 404, 'Gallery item not found');
    }

    return successResponse(res, 200, 'Gallery item updated successfully', { gallery });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete gallery item
// @route   DELETE /api/gallery/:id
// @access  Private/Admin
exports.deleteGallery = async (req, res, next) => {
  try {
    const gallery = await Gallery.findByIdAndDelete(req.params.id);
    if (!gallery) {
      return errorResponse(res, 404, 'Gallery item not found');
    }
    return successResponse(res, 200, 'Gallery item deleted successfully');
  } catch (error) {
    next(error);
  }
};
