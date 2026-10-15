const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Vocabulary = require('../models/Vocabulary');
const wordLists = require('../data/word_lists.json');

const generateCurriculumMap = async () => {
  try {
    console.log('[Curriculum Map] Connecting to DB...');
    await connectDB();

    const readingWords = await Vocabulary.find({
      $or: [
        { topic: 'reading-538' },
        { vocabType: 'ielts_reading_538' }
      ]
    }).sort({ readingTier: 1, tier: 1, word: 1 });

    console.log(`[Curriculum Map] Found ${readingWords.length} reading words in DB.`);

    const tier1Words = readingWords.filter(w => (w.readingTier ?? w.tier) === 1);
    const tier2Words = readingWords.filter(w => (w.readingTier ?? w.tier) === 2);
    const tier3Words = readingWords.filter(w => (w.readingTier ?? w.tier) === 3);

    console.log(`[Curriculum Map] Group counts - Tier 1: ${tier1Words.length}, Tier 2: ${tier2Words.length}, Tier 3: ${tier3Words.length}`);

    // Level 2: 20 Tier 1 + 40 familiar Tier 2 = 60 words (~10 lessons of 6 words)
    const level2Words = [...tier1Words, ...tier2Words.slice(0, 40)];

    // Level 3: 60 remaining Tier 2 + 60 Tier 3 = 120 words (~20 lessons of 6 words)
    const level3Words = [...tier2Words.slice(40, 100), ...tier3Words.slice(0, 60)];

    // Level 4: 196 remaining Tier 3 = 196 words (~25 lessons of 7-8 words)
    const level4Words = [...tier3Words.slice(60)];

    const allMapped = [];

    // Helper to assign topic and lesson key
    const assignLessons = (words, level, wordsPerLesson) => {
      let lessonIdx = 1;
      for (let i = 0; i < words.length; i += wordsPerLesson) {
        const batch = words.slice(i, i + wordsPerLesson);
        const lessonKey = `r-l${level}-passage-${String(lessonIdx).padStart(2, '0')}`;

        batch.forEach(w => {
          allMapped.push({
            word: w.word,
            awlSublist: w.awlSublist || '-',
            readingTier: w.readingTier ?? w.tier,
            targetLevel: `Level ${level}`,
            recommendedTopic: w.topic === 'reading-538' ? 'academic-general' : w.topic,
            isHardToGroup: w.word.includes(' ') || w.word.length > 12 ? 'Yes' : 'No',
            assignedLessonKey: lessonKey
          });
        });
        lessonIdx++;
      }
    };

    assignLessons(level2Words, 2, 6);
    assignLessons(level3Words, 3, 6);
    assignLessons(level4Words, 4, 8);

    // Build Markdown Table
    let md = '# BẢNG PHÂN BỔ 376 TỪ VỰNG IELTS READING THEO CẤP ĐỘ\n\n';
    md += `> **Tổng kết phân bổ:**\n`;
    md += `> - **Level 2 (Band 5.5–6.0)**: ${level2Words.length} từ (20 từ Tier 1 + 40 từ quen thuộc Tier 2) -> ~10 bài micro-reading\n`;
    md += `> - **Level 3 (Band 6.5–7.0)**: ${level3Words.length} từ (60 từ còn lại Tier 2 + 60 từ cơ bản Tier 3) -> ~20 bài micro-reading\n`;
    md += `> - **Level 4 (Band 7.5+)**: ${level4Words.length} từ (196 từ chuyên sâu Tier 3) -> ~25 bài micro-reading\n`;
    md += `> - **Tổng cộng**: ${allMapped.length} / 376 từ (100% khớp)\n\n`;

    md += '| STT | Từ vựng | AWL Sublist | Reading Tier | Level mục tiêu | Chủ đề đề xuất | Khó ghép | Mã bài học đề xuất |\n';
    md += '|---|---|---|---|---|---|---|---|\n';

    allMapped.forEach((item, idx) => {
      md += `| ${idx + 1} | **${item.word}** | ${item.awlSublist} | Tier ${item.readingTier} | ${item.targetLevel} | ${item.recommendedTopic} | ${item.isHardToGroup} | \`${item.assignedLessonKey}\` |\n`;
    });

    const outPath = path.resolve(__dirname, '../data/reading_curriculum_map.md');
    fs.writeFileSync(outPath, md, 'utf8');
    console.log(`[Curriculum Map] Successfully exported ${allMapped.length} words to: ${outPath}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('[Curriculum Map Error]:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

generateCurriculumMap();
