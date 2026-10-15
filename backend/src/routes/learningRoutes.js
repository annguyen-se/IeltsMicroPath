const express = require('express');
const { getTodayMission, submitSession, submitTyping, checkWriting } = require('../controllers/learningController');
const authGuard = require('../middlewares/authGuard');
const optionalAuthGuard = require('../middlewares/optionalAuthGuard');

const router = express.Router();

router.post('/writing-check', optionalAuthGuard, checkWriting);

router.use(authGuard);

router.get('/today', getTodayMission);
router.post('/submit-session', submitSession);
router.post('/typing-session', submitTyping);

module.exports = router;
