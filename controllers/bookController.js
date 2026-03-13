const mongoose = require('mongoose');
const Book = require('../models/Book');
const Payment = require('../models/Payment');
const path = require('path');
const { successResponse, errorResponse } = require('../utils/ApiResponse');
const stripe = require('../config/stripe');

const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// @desc    Create book
// @route   POST /api/books
// @access  Private/Admin
exports.createBook = async (req, res, next) => {
  try {
    const { title, author, description, isPaid, price } = req.body;

    const coverImage = req.files?.coverImage?.[0]?.path?.replace(/\\/g, '/');
    const bookFile = req.files?.bookFile?.[0]?.path?.replace(/\\/g, '/');

    const book = await Book.create({
      title: title || 'Untitled',
      author: author || 'Unknown',
      description,
      coverImage,
      bookFile,
      isPaid: isPaid === true || isPaid === 'true',
      price: price || 0,
    });

    return successResponse(res, 201, 'Book created successfully', { book });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all books (optional auth: when logged in, adds purchasedByUser per book)
// @route   GET /api/books
// @access  Public
exports.getBooks = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [books, total] = await Promise.all([
      Book.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Book.countDocuments(),
    ]);

    let paidBookIds = [];
    if (req.user) {
      const uid = req.user._id || req.user.id;
      const payments = await Payment.find({
        $or: [{ userId: uid }, { userId: uid?.toString?.() }],
        paymentStatus: 'success',
      })
        .select('bookId')
        .lean();
      paidBookIds = payments
        .map((p) => (p.bookId != null ? String(p.bookId) : null))
        .filter(Boolean);
    }

    const booksWithPurchased = books.map((book) => ({
      ...book,
      purchasedByUser:
        paidBookIds.length > 0 &&
        paidBookIds.includes((book._id || book.id).toString()),
    }));

    return successResponse(res, 200, 'Success', {
      books: booksWithPurchased,
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

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Public
exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return errorResponse(res, 404, 'Book not found');
    }
    return successResponse(res, 200, 'Success', { book });
  } catch (error) {
    next(error);
  }
};

// @desc    Read book (membership-based access)
// @route   GET /api/books/read/:id
// @access  Private
exports.readBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return errorResponse(res, 404, 'Book not found');
    }

    if (!book.bookFile) {
      return errorResponse(res, 404, 'Book file not available');
    }

    const user = req.user;
    const isMember = user.role === 'member' || user.membershipStatus === 'active';

    if (isMember) {
      return successResponse(res, 200, 'Success', {
        bookUrl: `/uploads/books/${path.basename(book.bookFile)}`,
        message: 'Access granted',
      });
    }

    if (book.isPaid) {
      const userId = user._id || user.id;
      const bookIdStr = (book._id || book.id).toString();

      // Find any successful payment for this user+book (type-agnostic match)
      const successPayments = await Payment.find({
        userId,
        paymentStatus: 'success',
      }).lean();

      const paidForBook = successPayments.some((p) => {
        if (!p.bookId) return false;
        return p.bookId.toString() === bookIdStr;
      });

      if (paidForBook) {
        return successResponse(res, 200, 'Success', {
          bookUrl: `/uploads/books/${path.basename(book.bookFile)}`,
          message: 'Access granted (paid)',
        });
      }

      // Payment might still be pending (webhook not run yet); check Stripe
      const pendingPayments = await Payment.find({
        userId,
        paymentStatus: 'pending',
        stripePaymentIntentId: { $exists: true, $ne: '' },
      }).lean();

      const pendingForThisBook = pendingPayments.find((p) => {
        if (!p.bookId) return false;
        return p.bookId.toString() === bookIdStr;
      });

      if (pendingForThisBook && process.env.STRIPE_SECRET_KEY) {
        try {
          const intent = await stripe.paymentIntents.retrieve(
            pendingForThisBook.stripePaymentIntentId
          );
          if (intent.status === 'succeeded') {
            await Payment.updateOne(
              { _id: pendingForThisBook._id },
              {
                $set: {
                  paymentStatus: 'success',
                  ...(intent.charges?.data?.[0]?.payment_method_details?.card && {
                    cardBrand: intent.charges.data[0].payment_method_details.card.brand,
                    cardLast4: intent.charges.data[0].payment_method_details.card.last4,
                  }),
                  ...(intent.currency && { currency: intent.currency }),
                },
              }
            );
            return successResponse(res, 200, 'Success', {
              bookUrl: `/uploads/books/${path.basename(book.bookFile)}`,
              message: 'Access granted (paid)',
            });
          }
        } catch (e) {
          // ignore
        }
      }
      return errorResponse(res, 403, 'This book requires membership or payment');
    }

    return successResponse(res, 200, 'Success', {
      bookUrl: `/uploads/books/${path.basename(book.bookFile)}`,
      message: 'Access granted (free book)',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private/Admin
exports.updateBook = async (req, res, next) => {
  try {
    const { title, author, description, isPaid, price } = req.body;
    const fieldsToUpdate = {};

    if (title !== undefined) fieldsToUpdate.title = title;
    if (author !== undefined) fieldsToUpdate.author = author;
    if (description !== undefined) fieldsToUpdate.description = description;
    if (isPaid !== undefined) fieldsToUpdate.isPaid = isPaid === true || isPaid === 'true';
    if (price !== undefined) fieldsToUpdate.price = price;

    if (req.files?.coverImage?.[0]) {
      fieldsToUpdate.coverImage = req.files.coverImage[0].path.replace(/\\/g, '/');
    }
    if (req.files?.bookFile?.[0]) {
      fieldsToUpdate.bookFile = req.files.bookFile[0].path.replace(/\\/g, '/');
    }

    const book = await Book.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!book) {
      return errorResponse(res, 404, 'Book not found');
    }

    return successResponse(res, 200, 'Book updated successfully', { book });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private/Admin
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return errorResponse(res, 404, 'Book not found');
    }
    return successResponse(res, 200, 'Book deleted successfully');
  } catch (error) {
    next(error);
  }
};
