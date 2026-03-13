const Company = require('../models/Company');
const { successResponse, errorResponse } = require('../utils/ApiResponse');
const { toWebPath } = require('../utils/uploadPath');

const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// @desc    Create company
// @route   POST /api/companies
// @access  Private/Admin
exports.createCompany = async (req, res, next) => {
  try {
    const { name, website, description, type } = req.body;

    const logo = req.file ? toWebPath(req.file.path, 'image') : undefined;

    if (!name || !type) {
      return errorResponse(res, 400, 'Name and type (work/partner) are required');
    }

    const company = await Company.create({
      name,
      logo,
      website,
      description,
      type,
    });

    return successResponse(res, 201, 'Company created successfully', { company });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all companies
// @route   GET /api/companies
// @access  Public
exports.getCompanies = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { type } = req.query;

    const filter = {};
    if (type) filter.type = type;

    const [companies, total] = await Promise.all([
      Company.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Company.countDocuments(filter),
    ]);
    companies.forEach((c) => {
      if (c.logo) c.logo = toWebPath(c.logo, 'image');
    });

    return successResponse(res, 200, 'Success', {
      companies,
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

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Public
exports.getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id).lean();
    if (!company) {
      return errorResponse(res, 404, 'Company not found');
    }
    if (company.logo) company.logo = toWebPath(company.logo, 'image');
    return successResponse(res, 200, 'Success', { company });
  } catch (error) {
    next(error);
  }
};

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private/Admin
exports.updateCompany = async (req, res, next) => {
  try {
    const { name, website, description, type } = req.body;
    const fieldsToUpdate = {};

    if (name !== undefined) fieldsToUpdate.name = name;
    if (website !== undefined) fieldsToUpdate.website = website;
    if (description !== undefined) fieldsToUpdate.description = description;
    if (type !== undefined) fieldsToUpdate.type = type;

    if (req.file) {
      fieldsToUpdate.logo = toWebPath(req.file.path, 'image');
    }

    const company = await Company.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!company) {
      return errorResponse(res, 404, 'Company not found');
    }

    return successResponse(res, 200, 'Company updated successfully', { company });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private/Admin
exports.deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return errorResponse(res, 404, 'Company not found');
    }
    return successResponse(res, 200, 'Company deleted successfully');
  } catch (error) {
    next(error);
  }
};
