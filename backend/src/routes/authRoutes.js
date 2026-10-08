const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const authGuard = require('../middlewares/authGuard');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authGuard, getMe);

module.exports = router;
