const express = require('express');
const router = express.Router();
const {
  createSlider,
  getSliders,
  getSlider,
  updateSlider,
  deleteSlider,
} = require('../controllers/sliderController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const upload = require('../middleware/upload');

router.get('/', getSliders);
router.get('/:id', getSlider);
const uploadSliders = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'icon', maxCount: 1 },
  { name: 'images', maxCount: 10 },
]);

router.post('/', authMiddleware, adminMiddleware, uploadSliders, createSlider);
router.put('/:id', authMiddleware, adminMiddleware, uploadSliders, updateSlider);
router.delete('/:id', authMiddleware, adminMiddleware, deleteSlider);

module.exports = router;
