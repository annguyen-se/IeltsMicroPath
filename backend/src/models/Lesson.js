const mongoose = require('mongoose');
const MediaSchema = require('./Media');

const LessonSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
    },
    skill: {
      type: String,
      enum: ['phonetics', 'grammar', 'reading', 'listening', 'speaking', 'writing'],
      required: [true, 'Skill category is required'],
    },
    contentType: {
      type: String,
      enum: ['theory', 'practice'],
      default: 'theory',
      index: true,
    },
    level: {
      type: Number,
      required: [true, 'Level (0-4) is required'],
      min: 0,
      max: 4,
      index: true,
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
    },
    contentMarkdown: {
      type: String,
      default: '',
    },
    audioTranscript: {
      type: String,
      default: '',
    },
    passage: {
      paragraphs: [
        {
          label: { type: String, trim: true },
          text: { type: String, trim: true },
        },
      ],
    },
    vocabIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vocabulary',
        index: true,
      },
    ],
    vocabAnchors: [
      {
        vocabId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary', required: true },
        text: { type: String, trim: true, required: true },
        paragraphLabel: { type: String, trim: true, required: true },
      },
    ],
    paraphrasePairs: [
      {
        vocabId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary', required: false },
        questionText: { type: String, trim: true, required: true },
        passageText: { type: String, trim: true, required: true },
        paragraphLabel: { type: String, trim: true, required: true },
      },
    ],
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
      },
    ],
    orderIndex: {
      type: Number,
      default: 0,
    },
    meta: {
      listeningSection: { type: Number, min: 1, max: 4, default: null },
      speakingPart: { type: Number, min: 1, max: 3, default: null },
      writingTask: { type: Number, min: 1, max: 2, default: null },
      estimatedMinutes: { type: Number, default: null },
      wordCount: { type: Number, default: 0 },
    },
    media: {
      type: MediaSchema,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for level queries
LessonSchema.index({ level: 1, status: 1 });
LessonSchema.index({ skill: 1, level: 1, topic: 1, orderIndex: 1 });

LessonSchema.pre('validate', function (next) {
  const paragraphs = this.passage?.paragraphs || [];

  if (paragraphs.length) {
    const byLabel = new Map(paragraphs.map((p) => [p.label, p.text || '']));

    for (const a of this.vocabAnchors || []) {
      const text = byLabel.get(a.paragraphLabel);
      if (text === undefined || !text.includes(a.text)) {
        return next(new Error(`vocabAnchor "${a.text}" not found in paragraph ${a.paragraphLabel} (${this.slug})`));
      }
    }

    for (const p of this.paraphrasePairs || []) {
      const text = byLabel.get(p.paragraphLabel);
      if (text === undefined || !text.includes(p.passageText)) {
        return next(
          new Error(`paraphrasePair "${p.passageText}" not found in paragraph ${p.paragraphLabel} (${this.slug})`),
        );
      }
    }

    this.meta = this.meta || {};
    this.meta.wordCount = paragraphs
      .map((p) => p.text || '')
      .join(' ')
      .split(/\s+/)
      .filter(Boolean).length;
  }

  next();
});

const Lesson = mongoose.model('Lesson', LessonSchema);

module.exports = Lesson;
