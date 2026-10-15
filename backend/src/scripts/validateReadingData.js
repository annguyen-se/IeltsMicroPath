const wordLists = require('../data/word_lists.json');

const oxford3000Set = new Set((wordLists.oxford3000 || []).map(w => w.toLowerCase()));

const normalizeWord = (w) => {
  const clean = String(w || '').toLowerCase().replace(/[^a-z0-9'-]/g, '');
  return wordLists.spellingVariants[clean] || clean;
};

/**
 * Validates a single reading lesson object and its associated questions
 * @param {Object} lesson
 * @param {Array} questions
 * @returns {{ isValid: boolean, errors: string[], warnings: string[] }}
 */
const validateReadingLesson = (lesson, questions = []) => {
  const errors = [];
  const warnings = [];

  // 1. Validate Basic Meta
  if (!lesson.title) errors.push('Lesson title is required');
  if (lesson.skill !== 'reading') errors.push(`Expected lesson skill "reading", got "${lesson.skill}"`);
  if (!lesson.slug) errors.push('Lesson slug is required');
  if (!lesson.topic) errors.push('Lesson topic is required');

  if (lesson.contentType === 'theory') {
    if (!lesson.contentMarkdown || lesson.contentMarkdown.trim().length === 0) {
      errors.push('Theory lesson must have non-empty contentMarkdown');
    }
    for (const q of questions) {
      if (!q.explanation || q.explanation.trim().length === 0) {
        errors.push(`Question "${q.prompt.substring(0, 30)}..." missing explanation`);
      }
    }
    return { isValid: errors.length === 0, errors, warnings };
  }

  // From here: contentType === 'practice'
  const paragraphs = lesson.passage?.paragraphs || [];
  if (paragraphs.length === 0) {
    errors.push('Practice lesson must have at least one paragraph in passage.paragraphs');
    return { isValid: false, errors, warnings };
  }

  const paragraphMap = new Map();
  let totalWordCount = 0;
  let allPassageText = '';

  for (const p of paragraphs) {
    if (!p.label || !p.text) {
      errors.push(`Paragraph missing label or text: ${JSON.stringify(p)}`);
      continue;
    }
    paragraphMap.set(p.label, p.text);
    const count = p.text.split(/\s+/).filter(Boolean).length;
    totalWordCount += count;
    allPassageText += ' ' + p.text;
  }

  // 2. Validate Passage Length by Level
  const levelLimits = {
    1: { min: 140, max: 200 },
    2: { min: 180, max: 240 },
    3: { min: 260, max: 320 },
    4: { min: 330, max: 400 }
  };
  const limits = levelLimits[lesson.level] || { min: 180, max: 400 };

  if (totalWordCount < limits.min || totalWordCount > limits.max) {
    errors.push(`Passage total word count is ${totalWordCount}, outside Level ${lesson.level} range [${limits.min}, ${limits.max}] words`);
  }

  // 3. Check Oxford 3000 coverage on non-target words
  const targetWords = new Set(
    (lesson.vocabIds || []).map(v => (typeof v === 'object' && v.word ? v.word.toLowerCase() : String(v).toLowerCase()))
  );

  const rawWords = allPassageText.toLowerCase().split(/\s+/).filter(Boolean);
  const distinctNonTarget = new Set();
  let unknownCount = 0;
  const unknownList = [];

  for (const raw of rawWords) {
    const norm = normalizeWord(raw);
    if (!norm || norm.length <= 2 || targetWords.has(norm)) continue;
    distinctNonTarget.add(norm);
  }

  for (const w of distinctNonTarget) {
    if (!oxford3000Set.has(w)) {
      unknownCount++;
      unknownList.push(w);
    }
  }

  const coverage = distinctNonTarget.size > 0
    ? Math.round(((distinctNonTarget.size - unknownCount) / distinctNonTarget.size) * 100)
    : 100;

  if (coverage < 95) {
    warnings.push(`Oxford 3000 coverage is ${coverage}% (< 95%). Words outside Oxford 3000: ${unknownList.slice(0, 10).join(', ')}`);
  }

  // 4. Validate Target Vocab Anchors
  const anchors = lesson.vocabAnchors || [];
  const anchoredVocabIds = new Set();

  for (const anchor of anchors) {
    const vId = anchor.vocabId ? (anchor.vocabId._id || anchor.vocabId).toString() : null;
    if (vId) anchoredVocabIds.add(vId);

    const pText = paragraphMap.get(anchor.paragraphLabel);
    if (!pText) {
      errors.push(`vocabAnchor references non-existent paragraph label "${anchor.paragraphLabel}"`);
    } else if (!pText.includes(anchor.text)) {
      errors.push(`vocabAnchor text "${anchor.text}" does NOT appear in paragraph [${anchor.paragraphLabel}]`);
    }
  }

  for (const v of lesson.vocabIds || []) {
    const vId = (v._id || v).toString();
    if (!anchoredVocabIds.has(vId)) {
      errors.push(`vocabId "${v.word || vId}" has NO anchor in vocabAnchors`);
    }
  }

  // 5. Validate Paraphrase Pairs
  const allQuestionStrings = [];
  for (const q of questions) {
    allQuestionStrings.push(q.prompt);
    if (Array.isArray(q.options)) {
      allQuestionStrings.push(...q.options);
    }
  }
  const combinedQuestionText = allQuestionStrings.join(' ');

  for (const pair of lesson.paraphrasePairs || []) {
    // Check questionText appears in questions
    if (!combinedQuestionText.includes(pair.questionText)) {
      errors.push(`paraphrasePair questionText "${pair.questionText}" does NOT appear in any question prompt or option`);
    }

    // Check passageText appears in specified paragraph
    const pText = paragraphMap.get(pair.paragraphLabel);
    if (!pText) {
      errors.push(`paraphrasePair references non-existent paragraph [${pair.paragraphLabel}]`);
    } else if (!pText.includes(pair.passageText)) {
      errors.push(`paraphrasePair passageText "${pair.passageText}" does NOT appear in paragraph [${pair.paragraphLabel}]`);
    }
  }

  // 6. Validate Questions
  for (const q of questions) {
    if (!q.explanation || q.explanation.trim().length === 0) {
      errors.push(`Question "${q.prompt.substring(0, 30)}..." is missing required explanation`);
    }

    if (q.format === 'tfng') {
      const opts = (q.options || []).map(o => String(o).trim().toUpperCase());
      const isStandardTfng = opts.length === 3 && opts[0] === 'TRUE' && opts[1] === 'FALSE' && opts[2] === 'NOT GIVEN';
      if (!isStandardTfng) {
        errors.push(`TFNG question "${q.prompt.substring(0, 30)}..." options must be ['TRUE', 'FALSE', 'NOT GIVEN']`);
      }

      if (q.correctAnswer === 'NOT GIVEN') {
        if (q.evidence && (q.evidence.text || q.evidence.paragraphLabel)) {
          errors.push(`NOT GIVEN question "${q.prompt.substring(0, 30)}..." must have EMPTY evidence`);
        }
      } else {
        if (!q.evidence || !q.evidence.text || !q.evidence.paragraphLabel) {
          errors.push(`Question "${q.prompt.substring(0, 30)}..." with answer "${q.correctAnswer}" must have non-empty evidence`);
        } else {
          const pText = paragraphMap.get(q.evidence.paragraphLabel);
          if (!pText) {
            errors.push(`Evidence references non-existent paragraph [${q.evidence.paragraphLabel}]`);
          } else if (!pText.includes(q.evidence.text)) {
            errors.push(`Evidence text "${q.evidence.text}" does NOT appear in paragraph [${q.evidence.paragraphLabel}]`);
          }
        }
      }
    } else if (q.format === 'mcq' || q.format === 'vocab-context') {
      const opts = q.options || [];
      for (const opt of opts) {
        if (/^([A-D]\.|\(Correct\)|\(Đáp án đúng\))/i.test(opt)) {
          errors.push(`MCQ option "${opt}" must NOT contain prefixes like "A." or "(Correct)"`);
        }
      }
      if (!opts.includes(q.correctAnswer)) {
        errors.push(`MCQ correctAnswer "${q.correctAnswer}" is NOT in options`);
      }
    } else if (q.format === 'sentence-completion') {
      if (!q.evidence || !q.evidence.text) {
        errors.push(`Sentence completion question must have evidence`);
      } else {
        const pText = paragraphMap.get(q.evidence.paragraphLabel);
        if (!pText || !pText.includes(q.evidence.text)) {
          errors.push(`Sentence completion evidence text does not appear in paragraph [${q.evidence?.paragraphLabel}]`);
        } else if (!q.evidence.text.includes(q.correctAnswer)) {
          errors.push(`Sentence completion correctAnswer "${q.correctAnswer}" is NOT in evidence text "${q.evidence.text}"`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

module.exports = {
  validateReadingLesson
};
