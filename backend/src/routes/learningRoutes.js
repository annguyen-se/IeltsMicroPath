const express = require('express');
const { getTodayMission, submitSession } = require('../controllers/learningController');
const authGuard = require('../middlewares/authGuard');

const router = express.Router();

router.use(authGuard);

router.get('/today', getTodayMission);
router.post('/submit-session', submitSession);

module.exports = router;
