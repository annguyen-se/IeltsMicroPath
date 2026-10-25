const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Lesson = require('../models/Lesson');
const Question = require('../models/Question');

async function fixLessons() {
  await connectDB();
  console.log('[Cleanup] Đang rà soát các bài học trong database...');

  const lessons = await Lesson.find({});
  let convertedToTheory = 0;
  let deletedCount = 0;
  let fixedSkillCount = 0;

  for (const lesson of lessons) {
    const questionsCount = await Question.countDocuments({ lessonId: lesson._id });
    const hasPassage = Array.isArray(lesson.passage?.paragraphs) && lesson.passage.paragraphs.length > 0;
    const hasTranscript = !!(lesson.audioTranscript && lesson.audioTranscript.trim());
    const hasMarkdown = !!(lesson.contentMarkdown && lesson.contentMarkdown.trim());

    // Trường hợp 1: Bài bị set nhầm practice nhưng thực chất là bài lý thuyết
    if (lesson.contentType === 'practice' && !hasPassage && !hasTranscript && questionsCount === 0 && hasMarkdown) {
      lesson.contentType = 'theory';
      await lesson.save();
      console.log(`   🔄 Đã chuyển sang THEORY: "${lesson.title}" (${lesson.slug})`);
      convertedToTheory++;
      continue;
    }

    // Trường hợp 2: Bài practice rác hoàn toàn không có gì (không passage, không markdown, 0 questions)
    if (lesson.contentType === 'practice' && !hasPassage && !hasTranscript && questionsCount === 0 && !hasMarkdown) {
      await Lesson.deleteOne({ _id: lesson._id });
      console.log(`   🗑️ Đã xóa bài practice rác: "${lesson.title}" (${lesson.slug})`);
      deletedCount++;
      continue;
    }

    // Trường hợp 3: Mismatch skill (ví dụ bài ngữ pháp thì hiện tại đơn nhưng bị lưu là 'reading')
    const titleLower = (lesson.title || '').toLowerCase();
    const slugLower = (lesson.slug || '').toLowerCase();
    let expectedSkill = lesson.skill;

    if (
      slugLower.includes('grammar') ||
      titleLower.includes('ngữ pháp') ||
      titleLower.includes('thì hiện tại') ||
      titleLower.includes('thì quá khứ') ||
      titleLower.includes('thì tương lai') ||
      titleLower.includes('câu bị động') ||
      titleLower.includes('mệnh đề')
    ) {
      expectedSkill = 'grammar';
    } else if (
      slugLower.includes('phonetics') ||
      titleLower.includes('phát âm') ||
      titleLower.includes('ngữ âm') ||
      titleLower.includes('ending-s') ||
      titleLower.includes('word-stress') ||
      titleLower.includes('trọng âm')
    ) {
      expectedSkill = 'phonetics';
    } else if (
      slugLower.includes('listening') ||
      titleLower.includes('listening') ||
      titleLower.includes('nghe')
    ) {
      expectedSkill = 'listening';
    } else if (
      slugLower.includes('writing') ||
      titleLower.includes('writing') ||
      titleLower.includes('viết') ||
      titleLower.includes('task 1') ||
      titleLower.includes('task 2')
    ) {
      expectedSkill = 'writing';
    } else if (
      slugLower.includes('speaking') ||
      titleLower.includes('speaking') ||
      titleLower.includes('nói') ||
      titleLower.includes('part 1') ||
      titleLower.includes('part 2') ||
      titleLower.includes('part 3')
    ) {
      expectedSkill = 'speaking';
    }

    if (expectedSkill !== lesson.skill) {
      console.log(`   🛠️ Sửa skill: "${lesson.title}" (${lesson.slug}) từ [${lesson.skill}] -> [${expectedSkill}]`);
      lesson.skill = expectedSkill;
      await lesson.save();
      fixedSkillCount++;
    }
  }

  console.log(`\n✅ Hoàn tất dọn dẹp:`);
  console.log(`   - Chuyển thành công ${convertedToTheory} bài sang lý thuyết (theory).`);
  console.log(`   - Sửa đúng skill cho ${fixedSkillCount} bài học.`);
  console.log(`   - Xóa bỏ ${deletedCount} bài rác.`);
  process.exit(0);
}

fixLessons().catch((err) => {
  console.error('[Cleanup Error]:', err);
  process.exit(1);
});
