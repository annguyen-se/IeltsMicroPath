const express = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const authGuard = require('../middlewares/authGuard');

const router = express.Router();

router.use(authGuard);

router.get('/', getDashboard);

module.exports = router;
