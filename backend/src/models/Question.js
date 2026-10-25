const mongoose = require('mongoose');
const MediaSchema = require('./Media');

const CHOICE_FORMATS = [
  'tfng',
  'ynng',
  'mcq',
  'mcq-multiple',
  'matching-headings',
  'matching-info',
  'matching-features',
  'matching-endings',
];

const QuestionSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'Lesson reference is required'],
      index: true,
    },
    vocabId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vocabulary',
      default: null,
    },
    type: {
      type: String,
      // 'open' = free response (writing/speaking), graded by AI or self-review
      enum: ['cloze', 'choice', 'dictation', 'reorder', 'open'],
      required: [true, 'Question type is required'],
    },
    format: {
      type: String,
      enum: [
        'tfng',
        'ynng',
        'mcq',
        'mcq-multiple',
        'sentence-completion',
        'short-answer',
        'matching-headings',
        'matching-info',
        'matching-features',
        'matching-endings',
        'summary-completion',
        'form-completion',
        'diagram-label',
        'vocab-context',
        'writing-prompt',
        'speaking-prompt',
        'standard',
      ],
      default: 'standard',
    },
    orderIndex: {
      type: Number,
      default: 0,
    },
    prompt: {
      type: String,
      required: [true, 'Question prompt is required'],
      trim: true,
    },
    options: [
      {
        type: String,
        trim: true,
      },
    ],
    // mcq-multiple: join answers with "|"  e.g. "A|C"
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
      trim: true,
    },
    acceptableAnswers: [
      {
        type: String,
        trim: true,
      },
    ],
    evidence: {
      paragraphLabel: { type: String, trim: true, default: '' },
      text: { type: String, trim: true, default: '' },
    },
    explanation: {
      type: String,
      required: [true, 'Pedagogical explanation is required'],
      trim: true,
    },
    errorTaxonomy: {
      type: String,
      enum: ['ERR_LEX', 'ERR_PHO', 'ERR_SYN', 'ERR_DIS', 'ERR_LOG'],
      default: 'ERR_LEX',
    },
    media: {
      type: MediaSchema,
      default: null,
    },
    metadata: {
      wpmTarget: { type: Number, default: 40 },
      keyboardShortcutAudio: { type: String, default: '`' },
      acceptableVariants: [{ type: String, trim: true }],
      aiReferenceAnswer: { type: String, trim: true },
      maxWords: { type: Number, default: null },
      requiredSelections: { type: Number, default: null },
      // writing/speaking support
      minWords: { type: Number, default: null },
      timeLimitSec: { type: Number, default: null },
    },
  },
  {
    timestamps: true,
  },
);

// Seed idempotency: one orderIndex per lesson
QuestionSchema.index({ lessonId: 1, orderIndex: 1 }, { unique: true });

QuestionSchema.pre('validate', function (next) {
  if (this.type === 'choice') {
    if (!this.options || this.options.length < 2) {
      return next(new Error(`Choice question needs >= 2 options (format: ${this.format})`));
    }

    if (this.format === 'mcq-multiple') {
      const answers = this.correctAnswer
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      if (answers.length < 2) {
        return next(new Error('mcq-multiple needs >= 2 answers joined by "|"'));
      }
      const missing = answers.filter((a) => !this.options.includes(a));
      if (missing.length) {
        return next(new Error(`mcq-multiple answers not in options: ${missing.join(', ')}`));
      }
      if (this.metadata.requiredSelections == null) {
        this.metadata.requiredSelections = answers.length;
      }
    } else if (!this.options.includes(this.correctAnswer)) {
      return next(new Error(`correctAnswer "${this.correctAnswer}" is not in options`));
    }
  }

  if (this.format === 'tfng' && !['TRUE', 'FALSE', 'NOT GIVEN'].includes(this.correctAnswer)) {
    return next(new Error('tfng correctAnswer must be TRUE | FALSE | NOT GIVEN'));
  }
  if (this.format === 'ynng' && !['YES', 'NO', 'NOT GIVEN'].includes(this.correctAnswer)) {
    return next(new Error('ynng correctAnswer must be YES | NO | NOT GIVEN'));
  }

  next();
});

QuestionSchema.statics.CHOICE_FORMATS = CHOICE_FORMATS;

const Question = mongoose.model('Question', QuestionSchema);

module.exports = Question;
