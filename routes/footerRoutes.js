const express = require('express');
const router = express.Router();
const {
  getFooter,
  createFooter,
  updateFooter,
  deleteFooter,
} = require('../controllers/footerController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const upload = require('../middleware/upload');

router.get('/', getFooter);
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  upload.any(),
  createFooter
);
router.put(
  '/',
  authMiddleware,
  adminMiddleware,
  upload.any(),
  updateFooter
);
router.delete('/', authMiddleware, adminMiddleware, deleteFooter);

module.exports = router;
