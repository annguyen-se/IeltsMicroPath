const express = require('express');
const { getVocabularies, getVocabularyById, getTopics, getParaphrases } = require('../controllers/vocabularyController');
const optionalAuthGuard = require('../middlewares/optionalAuthGuard');

const router = express.Router();

router.use(optionalAuthGuard); // Optional authentication

router.get('/topics', getTopics);
router.get('/paraphrases', getParaphrases);
router.get('/', getVocabularies);
router.get('/:id', getVocabularyById);

module.exports = router;
