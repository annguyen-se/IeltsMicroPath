const express = require('express');
const { getLessons, getLessonDetail, streamLessonAudio } = require('../controllers/lessonController');
const optionalAuthGuard = require('../middlewares/optionalAuthGuard');

const router = express.Router();

router.use(optionalAuthGuard);

router.get('/', getLessons);
router.get('/:id', getLessonDetail);
router.get('/:id/audio', streamLessonAudio);

module.exports = router;
