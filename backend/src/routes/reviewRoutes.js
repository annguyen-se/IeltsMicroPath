const express = require('express');
const { getDueReviews, getSrsStats, submitReview } = require('../controllers/reviewController');
const authGuard = require('../middlewares/authGuard');

const router = express.Router();

router.use(authGuard);

router.get('/due', getDueReviews);
router.get('/stats', getSrsStats);
router.post('/submit', submitReview);

module.exports = router;
