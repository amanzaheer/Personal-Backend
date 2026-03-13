const express = require('express');
const router = express.Router();
const {
  createGallery,
  getGallery,
  getGalleryItem,
  updateGallery,
  deleteGallery,
} = require('../controllers/galleryController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const upload = require('../middleware/upload');

router.get('/', getGallery);
router.get('/:id', getGalleryItem);
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), createGallery);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), updateGallery);
router.delete('/:id', authMiddleware, adminMiddleware, deleteGallery);

module.exports = router;
