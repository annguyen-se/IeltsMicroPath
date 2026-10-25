const express = require('express');
const {
  createVocabulary,
  bulkCreateVocabularies,
  updateVocabulary,
  createLesson,
  updateLesson,
  getLessons,
  getLessonById,
  createQuestion,
  importCurriculumBundle
} = require('../controllers/adminController');
const authGuard = require('../middlewares/authGuard');
const roleGuard = require('../middlewares/roleGuard');

const router = express.Router();

// Strict RBAC: All admin CMS routes require valid token and 'admin' role
router.use(authGuard);
router.use(roleGuard('admin'));

// Full Masterplan Curriculum Bundle Import
router.post('/curriculum/bundle', importCurriculumBundle);

// Vocabulary CMS
router.post('/vocabularies', createVocabulary);
router.post('/vocabularies/batch', bulkCreateVocabularies);
router.patch('/vocabularies/:id', updateVocabulary);

// Lessons CMS
router.get('/lessons', getLessons);
router.get('/lessons/:id', getLessonById);
router.post('/lessons', createLesson);
router.patch('/lessons/:id', updateLesson);

// Questions CMS
router.post('/questions', createQuestion);

module.exports = router;
