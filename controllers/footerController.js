const Footer = require('../models/Footer');
const { successResponse, errorResponse } = require('../utils/ApiResponse');
const { toWebPath } = require('../utils/uploadPath');

// @desc    Get footer (single document - one footer per site)
// @route   GET /api/footer
// @access  Public
exports.getFooter = async (req, res, next) => {
  try {
    const footer = await Footer.findOne().sort({ createdAt: -1 }).lean();
    if (!footer) {
      return successResponse(res, 200, 'Success', {
        footer: { email: '', phone: '', address: '', socialLinks: [] },
      });
    }
    if (footer.socialLinks && footer.socialLinks.length) {
      footer.socialLinks = footer.socialLinks.map((s) => ({
        ...s,
        icon: s.icon ? toWebPath(s.icon, 'image') : s.icon,
      }));
    }
    return successResponse(res, 200, 'Success', { footer });
  } catch (error) {
    next(error);
  }
};

// @desc    Create footer
// @route   POST /api/footer
// @access  Private/Admin
exports.createFooter = async (req, res, next) => {
  try {
    const existing = await Footer.findOne();
    if (existing) {
      return errorResponse(res, 400, 'Footer already exists. Use PUT to update.');
    }

    const { email, phone, address, socialLinks: socialLinksRaw } = req.body;
    let socialLinks = [];
    if (socialLinksRaw) {
      try {
        socialLinks = typeof socialLinksRaw === 'string' ? JSON.parse(socialLinksRaw) : socialLinksRaw;
      } catch {
        return errorResponse(res, 400, 'Invalid socialLinks JSON');
      }
    }

    const fileByIndex = {};
    if (req.files && req.files.length) {
      req.files.forEach((f) => {
        const m = f.fieldname && f.fieldname.match(/^icon_(\d+)$/);
        if (m) fileByIndex[parseInt(m[1], 10)] = f;
      });
    }
    socialLinks = socialLinks.map((s, i) => ({
      name: s.name || 'other',
      link: s.link || '',
      sortOrder: s.sortOrder ?? i,
      icon: fileByIndex[i] ? toWebPath(fileByIndex[i].path, 'image') : s.icon || '',
    }));

    const footer = await Footer.create({
      email: email || '',
      phone: phone || '',
      address: address || '',
      socialLinks,
    });

    if (footer.socialLinks && footer.socialLinks.length) {
      footer.socialLinks = footer.socialLinks.map((s) => ({
        ...s.toObject ? s.toObject() : s,
        icon: s.icon ? toWebPath(s.icon, 'image') : s.icon,
      }));
    }

    return successResponse(res, 201, 'Footer created successfully', { footer });
  } catch (error) {
    next(error);
  }
};

// @desc    Update footer
// @route   PUT /api/footer
// @access  Private/Admin
exports.updateFooter = async (req, res, next) => {
  try {
    let footer = await Footer.findOne();
    if (!footer) {
      return errorResponse(res, 404, 'Footer not found. Use POST to create.');
    }

    const { email, phone, address, socialLinks: socialLinksRaw } = req.body;
    let socialLinks = footer.socialLinks || [];
    if (socialLinksRaw !== undefined) {
      try {
        const parsed =
          typeof socialLinksRaw === 'string' ? JSON.parse(socialLinksRaw) : socialLinksRaw;
        if (Array.isArray(parsed)) socialLinks = parsed;
      } catch {
        return errorResponse(res, 400, 'Invalid socialLinks JSON');
      }
    }

    const fileByIndex = {};
    if (req.files && req.files.length) {
      req.files.forEach((f) => {
        const m = f.fieldname && f.fieldname.match(/^icon_(\d+)$/);
        if (m) fileByIndex[parseInt(m[1], 10)] = f;
      });
    }
    const existingLinks = footer.socialLinks || [];
    socialLinks = socialLinks.map((s, i) => ({
      name: s.name || 'other',
      link: s.link || '',
      sortOrder: s.sortOrder ?? i,
      icon: fileByIndex[i]
        ? toWebPath(fileByIndex[i].path, 'image')
        : (s.icon || existingLinks[i]?.icon || ''),
    }));

    footer.email = email !== undefined ? email : footer.email;
    footer.phone = phone !== undefined ? phone : footer.phone;
    footer.address = address !== undefined ? address : footer.address;
    footer.socialLinks = socialLinks;
    await footer.save();

    if (footer.socialLinks && footer.socialLinks.length) {
      footer.socialLinks = footer.socialLinks.map((s) => ({
        ...s.toObject ? s.toObject() : s,
        icon: s.icon ? toWebPath(s.icon, 'image') : s.icon,
      }));
    }

    return successResponse(res, 200, 'Footer updated successfully', { footer });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete footer
// @route   DELETE /api/footer
// @access  Private/Admin
exports.deleteFooter = async (req, res, next) => {
  try {
    const footer = await Footer.findOneAndDelete();
    if (!footer) {
      return errorResponse(res, 404, 'Footer not found');
    }
    return successResponse(res, 200, 'Footer deleted successfully');
  } catch (error) {
    next(error);
  }
};
