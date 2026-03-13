const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/update-profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);
router.post('/logout', authMiddleware, logout);

module.exports = router;
