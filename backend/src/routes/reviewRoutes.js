const express = require('express');
const {
  getDueReviews,
  getSrsStats,
  submitReview,
  enrollVocab,
  enrollAllVocab
} = require('../controllers/reviewController');
const authGuard = require('../middlewares/authGuard');

const router = express.Router();

router.use(authGuard);

router.get('/due', getDueReviews);
router.get('/stats', getSrsStats);
router.post('/submit', submitReview);
router.post('/enroll', enrollVocab);
router.post('/enroll-all', enrollAllVocab);

module.exports = router;
