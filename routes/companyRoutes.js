const express = require('express');
const router = express.Router();
const {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
} = require('../controllers/companyController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const upload = require('../middleware/upload');

router.get('/', getCompanies);
router.get('/:id', getCompany);
router.post('/', authMiddleware, adminMiddleware, upload.single('logo'), createCompany);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('logo'), updateCompany);
router.delete('/:id', authMiddleware, adminMiddleware, deleteCompany);

module.exports = router;
