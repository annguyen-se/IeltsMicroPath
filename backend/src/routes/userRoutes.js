const express = require('express');
const { getProfile, updateProfile } = require('../controllers/userController');
const authGuard = require('../middlewares/authGuard');

const router = express.Router();

router.use(authGuard); // All user profile routes require authentication

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

module.exports = router;
