const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Gallery', gallerySchema);
