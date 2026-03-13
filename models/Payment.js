const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      trim: true,
    },
    currency: {
      type: String,
      trim: true,
    },
    stripePaymentIntentId: {
      type: String,
      trim: true,
    },
    cardBrand: {
      type: String,
      trim: true,
    },
    cardLast4: {
      type: String,
      trim: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
