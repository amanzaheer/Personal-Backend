const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const membershipRoutes = require('./membershipRoutes');
const paymentRoutes = require('./paymentRoutes');
const sliderRoutes = require('./sliderRoutes');
const bookRoutes = require('./bookRoutes');
const galleryRoutes = require('./galleryRoutes');
const companyRoutes = require('./companyRoutes');
const footerRoutes = require('./footerRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/membership', membershipRoutes);
router.use('/payment', paymentRoutes);
router.use('/sliders', sliderRoutes);
router.use('/books', bookRoutes);
router.use('/gallery', galleryRoutes);
router.use('/companies', companyRoutes);
router.use('/footer', footerRoutes);

module.exports = router;
