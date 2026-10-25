const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Lesson = require('../models/Lesson');
const Question = require('../models/Question');
const Vocabulary = require('../models/Vocabulary');

async function checkStatus() {
  await connectDB();
  console.log('=== THỐNG KÊ DATABASE HIỆN TẠI ===');

  const totalVocabs = await Vocabulary.countDocuments({});
  const totalLessons = await Lesson.countDocuments({});
  const totalQuestions = await Question.countDocuments({});

  console.log(`Tổng Từ vựng: ${totalVocabs}`);
  console.log(`Tổng Bài học: ${totalLessons}`);
  console.log(`Tổng Câu hỏi: ${totalQuestions}`);

  console.log('\n--- DANH SÁCH BÀI HỌC VÀ SỐ CÂU HỎI THEO LEVEL & TOPIC ---');
  const lessons = await Lesson.find({}).sort({ level: 1, topic: 1, skill: 1, contentType: 1 });

  for (const l of lessons) {
    const qCount = await Question.countDocuments({ lessonId: l._id });
    console.log(`[L${l.level}] [${l.skill.padEnd(9)}] [${l.contentType.padEnd(8)}] (${qCount.toString().padStart(2)} qs) ${l.topic} -> ${l.slug}`);
  }

  process.exit(0);
}

checkStatus().catch((err) => {
  console.error(err);
  process.exit(1);
});
