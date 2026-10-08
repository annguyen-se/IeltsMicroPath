const express = require('express');
const { getVocabularies, getVocabularyById } = require('../controllers/vocabularyController');
const authGuard = require('../middlewares/authGuard');

const router = express.Router();

router.use(authGuard); // Requires login

router.get('/', getVocabularies);
router.get('/:id', getVocabularyById);

module.exports = router;
