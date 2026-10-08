const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const vocabularyRoutes = require('./vocabularyRoutes');
const adminRoutes = require('./adminRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const learningRoutes = require('./learningRoutes');
const reviewRoutes = require('./reviewRoutes');
const mistakeRoutes = require('./mistakeRoutes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vocabulary', vocabularyRoutes);
router.use('/admin', adminRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/learning', learningRoutes);
router.use('/reviews', reviewRoutes);
router.use('/mistakes', mistakeRoutes);

module.exports = router;
