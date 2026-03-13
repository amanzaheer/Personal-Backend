const express = require('express');
const router = express.Router();
const {
  createPayment,
  createPaymentIntent,
  createPaymentIntentGuest,
  completeGuestPayment,
  webhook,
  getPaymentHistory,
  syncPaymentsFromStripe,
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/create', authMiddleware, createPayment);
router.post('/intent', authMiddleware, createPaymentIntent);
router.post('/intent-guest', createPaymentIntentGuest);
router.post('/complete-guest', completeGuestPayment);
router.post('/webhook', webhook);
router.get('/history', authMiddleware, getPaymentHistory);
router.post('/sync', authMiddleware, adminMiddleware, syncPaymentsFromStripe);

module.exports = router;
