const mongoose = require('mongoose');

const socialLinkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Social link name is required'],
      trim: true,
      // e.g. whatsapp, facebook, tiktok, instagram, twitter, youtube, linkedin, telegram, etc.
    },
    link: {
      type: String,
      required: [true, 'Social link URL is required'],
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const footerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    socialLinks: [socialLinkSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Footer', footerSchema);
