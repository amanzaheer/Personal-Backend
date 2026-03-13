const crypto = require('crypto');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const User = require('../models/User');
const stripe = require('../config/stripe');
const { successResponse, errorResponse } = require('../utils/ApiResponse');
const { sendPasswordEmail } = require('../utils/emailService');

const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// @desc    Create Stripe Checkout Session for reading a book (hosted page)
// @route   POST /api/payment/create
// @access  Private
exports.createPayment = async (req, res, next) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return errorResponse(
        res,
        500,
        'Stripe is not configured. Please set STRIPE_SECRET_KEY in .env'
      );
    }

    const { amount, currency, bookId, description } = req.body;

    if (!amount || amount <= 0) {
      return errorResponse(res, 400, 'Please provide a valid amount');
    }

    const finalCurrency =
      (currency || process.env.STRIPE_CURRENCY || 'usd').toLowerCase();

    // Stripe expects amount in the smallest currency unit (e.g. cents)
    const amountInMinorUnit = Math.round(Number(amount) * 100);

    const transactionId = `TXN_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const payment = await Payment.create({
      userId: req.user.id,
      amount,
      paymentMethod: 'stripe',
      paymentStatus: 'pending',
      transactionId,
      currency: finalCurrency,
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: finalCurrency,
            unit_amount: amountInMinorUnit,
            product_data: {
              name: description || 'Book access',
              metadata: {
                bookId: bookId || '',
              },
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        transactionId,
        userId: String(req.user.id),
        bookId: bookId || '',
      },
      success_url:
        process.env.FRONTEND_URL +
        '/payment-success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.FRONTEND_URL + '/payment-cancelled',
    });

    return successResponse(res, 201, 'Stripe session created', {
      checkoutUrl: session.url,
      sessionId: session.id,
      transactionId,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Stripe Payment Intent for embedded card form
// @route   POST /api/payment/intent
// @access  Private
exports.createPaymentIntent = async (req, res, next) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return errorResponse(
        res,
        500,
        'Stripe is not configured. Please set STRIPE_SECRET_KEY in .env'
      );
    }

    const { amount, currency, bookId, description } = req.body;

    if (!amount || amount <= 0) {
      return errorResponse(res, 400, 'Please provide a valid amount');
    }

    const finalCurrency =
      (currency || process.env.STRIPE_CURRENCY || 'usd').toLowerCase();

    const amountInMinorUnit = Math.round(Number(amount) * 100);

    const transactionId = `TXN_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const payment = await Payment.create({
      userId: req.user.id,
      amount,
      paymentMethod: 'stripe',
      paymentStatus: 'pending',
      transactionId,
      currency: finalCurrency,
      bookId: bookId || null,
    });

    const intent = await stripe.paymentIntents.create({
      amount: amountInMinorUnit,
      currency: finalCurrency,
      metadata: {
        transactionId,
        userId: String(req.user.id),
        bookId: bookId || '',
        description: description || 'Book access',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    payment.stripePaymentIntentId = intent.id;
    await payment.save();

    return successResponse(res, 201, 'Stripe payment intent created', {
      clientSecret: intent.client_secret,
      transactionId,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Payment Intent for guest (no auth): find or create user by email, then create intent
// @route   POST /api/payment/intent-guest
// @access  Public
exports.createPaymentIntentGuest = async (req, res, next) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return errorResponse(
        res,
        500,
        'Stripe is not configured. Please set STRIPE_SECRET_KEY in .env'
      );
    }

    const { name, email, amount, currency, bookId, description } = req.body;

    if (!name || !email || !email.match(/^\S+@\S+\.\S+$/)) {
      return errorResponse(res, 400, 'Please provide a valid name and email');
    }
    if (!amount || amount <= 0) {
      return errorResponse(res, 400, 'Please provide a valid amount');
    }

    const finalCurrency =
      (currency || process.env.STRIPE_CURRENCY || 'usd').toLowerCase();
    const amountInMinorUnit = Math.round(Number(amount) * 100);
    const transactionId = `TXN_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    let credentialsSent = false;
    if (!user) {
      const temporaryPassword = crypto.randomBytes(8).toString('hex');
      user = await User.create({
        name: (name || '').trim(),
        email: email.toLowerCase().trim(),
        password: temporaryPassword,
        role: 'user',
      });
      await sendPasswordEmail(user.email, user.name, temporaryPassword);
      credentialsSent = true;
    }

    const payment = await Payment.create({
      userId: user._id,
      amount: Number(amount),
      paymentMethod: 'stripe',
      paymentStatus: 'pending',
      transactionId,
      currency: finalCurrency,
      bookId:
        bookId && mongoose.Types.ObjectId.isValid(bookId)
          ? new mongoose.Types.ObjectId(bookId)
          : null,
    });

    const intent = await stripe.paymentIntents.create({
      amount: amountInMinorUnit,
      currency: finalCurrency,
      metadata: {
        transactionId,
        userId: String(user._id),
        bookId: bookId || '',
        description: description || 'Book access',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    payment.stripePaymentIntentId = intent.id;
    await payment.save();

    return successResponse(res, 201, 'Payment intent created', {
      clientSecret: intent.client_secret,
      transactionId,
      credentialsSent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    After guest payment succeeded: verify payment and return JWT for auto-login
// @route   POST /api/payment/complete-guest
// @access  Public
exports.completeGuestPayment = async (req, res, next) => {
  try {
    const { email, transactionId } = req.body;

    if (!email || !transactionId) {
      return errorResponse(res, 400, 'Please provide email and transactionId');
    }

    let payment = await Payment.findOne({ transactionId });
    if (!payment) {
      return errorResponse(res, 404, 'Payment not found');
    }

    if (payment.paymentStatus !== 'success') {
      if (payment.stripePaymentIntentId) {
        try {
          const intent = await stripe.paymentIntents.retrieve(
            payment.stripePaymentIntentId
          );
          if (intent.status === 'succeeded') {
            payment.paymentStatus = 'success';
            const charge = intent.charges?.data?.[0];
            const card = charge?.payment_method_details?.card;
            if (card) {
              payment.cardBrand = card.brand;
              payment.cardLast4 = card.last4;
            }
            payment.currency = intent.currency || payment.currency;
            await payment.save();
          }
        } catch (e) {
          // ignore
        }
      }
      if (payment.paymentStatus !== 'success') {
        return errorResponse(res, 400, 'Payment not yet confirmed. Please wait a moment and try again.');
      }
    }

    const user = await User.findById(payment.userId);
    if (!user || user.email.toLowerCase() !== email.toLowerCase().trim()) {
      return errorResponse(res, 403, 'Invalid email for this payment');
    }

    const token = user.getSignedJwtToken();
    const userData = {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      membershipStatus: user.membershipStatus,
      createdAt: user.createdAt,
    };

    return successResponse(res, 200, 'Account created and payment complete', {
      user: userData,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stripe webhook (to update payment status)
// @route   POST /api/payment/webhook
// @access  Public
exports.webhook = async (req, res, next) => {
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return errorResponse(
        res,
        500,
        'Stripe webhook secret not configured on server'
      );
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      const rawBody = req.rawBody || req.body;
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const transactionId = session.metadata?.transactionId;

      if (transactionId) {
        const payment = await Payment.findOne({ transactionId });
        if (payment) {
          payment.paymentStatus = 'success';
          payment.transactionId = transactionId;
          await payment.save();
        }
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      const transactionId = session.metadata?.transactionId;

      if (transactionId) {
        const payment = await Payment.findOne({ transactionId });
        if (payment && payment.paymentStatus === 'pending') {
          payment.paymentStatus = 'failed';
          await payment.save();
        }
      }
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const transactionId = intent.metadata?.transactionId;

      if (transactionId) {
        const payment = await Payment.findOne({ transactionId });
        if (payment) {
          const charge = intent.charges?.data?.[0];
          const card = charge?.payment_method_details?.card;

          payment.paymentStatus = 'success';
          payment.stripePaymentIntentId = intent.id;
          payment.currency = intent.currency || payment.currency;
          if (card) {
            payment.cardBrand = card.brand;
            payment.cardLast4 = card.last4;
          }
          await payment.save();
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      const transactionId = intent.metadata?.transactionId;

      if (transactionId) {
        const payment = await Payment.findOne({ transactionId });
        if (payment && payment.paymentStatus === 'pending') {
          payment.paymentStatus = 'failed';
          payment.stripePaymentIntentId = intent.id;
          payment.currency = intent.currency || payment.currency;
          await payment.save();
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment history
// @route   GET /api/payment/history
// @access  Private
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    // Admin sees all payments; others see only their own
    const query =
      req.user.role === 'admin' ? {} : { userId: req.user.id };

    const [payments, total] = await Promise.all([
      Payment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments(query),
    ]);

    return successResponse(res, 200, 'Success', {
      payments,
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

// @desc    Sync latest payment statuses from Stripe
// @route   POST /api/payment/sync
// @access  Private (admin or current user)
exports.syncPaymentsFromStripe = async (req, res, next) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return errorResponse(
        res,
        500,
        'Stripe is not configured. Please set STRIPE_SECRET_KEY in .env'
      );
    }

    // Fetch recent payment intents from Stripe (you can adjust limit or date filter)
    const intents = await stripe.paymentIntents.list({
      limit: 100,
    });

    let updatedCount = 0;

    for (const intent of intents.data) {
      const transactionId = intent.metadata?.transactionId;
      if (!transactionId) continue;

      const payment = await Payment.findOne({ transactionId });
      if (!payment) continue;

      const charge = intent.charges?.data?.[0];
      const card = charge?.payment_method_details?.card;

      const newStatus =
        intent.status === 'succeeded'
          ? 'success'
          : intent.status === 'processing'
          ? 'pending'
          : intent.status === 'requires_payment_method' ||
            intent.status === 'canceled'
          ? 'failed'
          : payment.paymentStatus;

      const shouldUpdate =
        payment.paymentStatus !== newStatus ||
        !payment.stripePaymentIntentId ||
        !payment.cardLast4;

      if (!shouldUpdate) continue;

      payment.paymentStatus = newStatus;
      payment.stripePaymentIntentId = intent.id;
      payment.currency = intent.currency || payment.currency;

      if (card) {
        payment.cardBrand = card.brand;
        payment.cardLast4 = card.last4;
      }

      await payment.save();
      updatedCount += 1;
    }

    return successResponse(res, 200, 'Synced payments from Stripe', {
      updatedCount,
    });
  } catch (error) {
    next(error);
  }
};
