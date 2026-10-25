const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Lesson = require('../models/Lesson');
const Question = require('../models/Question');

async function inspect() {
  await connectDB();
  const lessons = await Lesson.find({}).sort({ createdAt: -1 }).limit(20);
  console.log(`Found ${lessons.length} latest lessons:`);
  for (const l of lessons) {
    const qCount = await Question.countDocuments({ lessonId: l._id });
    const pCount = l.passage?.paragraphs?.length || 0;
    const hasMarkdown = !!(l.contentMarkdown && l.contentMarkdown.trim());
    console.log(`[${l.skill}] [${l.contentType}] ${l.title} (slug: ${l.slug}) -> ${qCount} qs, ${pCount} paragraphs, markdown: ${hasMarkdown}`);
  }
  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
