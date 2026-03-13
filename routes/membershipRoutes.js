const express = require('express');
const router = express.Router();
const {
  subscribe,
  getStatus,
  getAllMemberships,
  updateMembership,
  deleteMembership,
} = require('../controllers/membershipController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/subscribe', authMiddleware, subscribe);
router.get('/status', authMiddleware, getStatus);
router.get('/all', authMiddleware, adminMiddleware, getAllMemberships);
router.put('/:id', authMiddleware, adminMiddleware, updateMembership);
router.delete('/:id', authMiddleware, adminMiddleware, deleteMembership);

module.exports = router;
