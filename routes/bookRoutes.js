const express = require('express');
const router = express.Router();
const {
  createBook,
  getBooks,
  getBook,
  readBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const optionalAuth = require('../middleware/optionalAuth');
const upload = require('../middleware/upload');

const bookUpload = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'bookFile', maxCount: 1 },
]);

router.get('/', optionalAuth, getBooks);
router.get('/read/:id', authMiddleware, readBook);
router.get('/:id', getBook);
router.post('/', authMiddleware, adminMiddleware, bookUpload, createBook);
router.put('/:id', authMiddleware, adminMiddleware, bookUpload, updateBook);
router.delete('/:id', authMiddleware, adminMiddleware, deleteBook);

module.exports = router;
