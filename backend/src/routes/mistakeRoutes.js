const express = require('express');
const { getMistakes, getMistakeStats, retestMistake } = require('../controllers/mistakeController');
const authGuard = require('../middlewares/authGuard');

const router = express.Router();

router.use(authGuard);

router.get('/', getMistakes);
router.get('/stats', getMistakeStats);
router.post('/resolve/:id', retestMistake);

module.exports = router;
