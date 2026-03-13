const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    buttonText: {
      type: String,
      trim: true,
    },
    buttonLink: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Slider', sliderSchema);
