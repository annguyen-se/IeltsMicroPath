/**
 * Strict Pre-DB Validation Engine
 * Catches hallucinated substrings and schema mismatches before saving to MongoDB
 */

function normalizeQuestionFormat(rawFormat) {
  if (!rawFormat) return 'standard';
  const f = String(rawFormat).trim().toLowerCase().replace(/_/g, '-');

  if (['mcq', 'mcq-single', 'single-choice', 'multiple-choice-single', 'multiple-choice'].includes(f)) return 'mcq';
  if (['mcq-multiple', 'multiple-choice-multiple', 'multi-choice', 'pick-multiple', 'multiple'].includes(f)) return 'mcq-multiple';
  if (['tfng', 'true-false-not-given', 'true-false'].includes(f)) return 'tfng';
  if (['ynng', 'yes-no-not-given', 'yes-no'].includes(f)) return 'ynng';
  if (['sentence-completion', 'fill-in-the-blank', 'fill-in-blank', 'gap-fill', 'sentence'].includes(f)) return 'sentence-completion';
  if (['short-answer', 'short-answer-question', 'short'].includes(f)) return 'short-answer';
  if (['matching-headings', 'matching-heading', 'headings', 'heading-matching'].includes(f)) return 'matching-headings';
  if (['matching-info', 'matching-information', 'information-matching'].includes(f)) return 'matching-info';
  if (['matching-features', 'matching-feature', 'features', 'feature-matching', 'matching'].includes(f)) return 'matching-features';
  if (['matching-endings', 'matching-sentence-endings', 'sentence-endings', 'endings'].includes(f)) return 'matching-endings';
  if (['summary-completion', 'summary', 'table-completion', 'note-completion', 'flowchart-completion'].includes(f)) return 'summary-completion';
  if (['form-completion', 'form'].includes(f)) return 'form-completion';
  if (['diagram-label', 'diagram', 'map-label', 'plan-label', 'labelling'].includes(f)) return 'diagram-label';
  if (['vocab-context', 'vocabulary', 'vocab'].includes(f)) return 'vocab-context';
  if (['writing-prompt', 'writing', 'essay'].includes(f)) return 'writing-prompt';
  if (['speaking-prompt', 'speaking', 'interview'].includes(f)) return 'speaking-prompt';

  const VALID_FORMATS = [
    'tfng', 'ynng', 'mcq', 'mcq-multiple', 'sentence-completion', 'short-answer',
    'matching-headings', 'matching-info', 'matching-features', 'matching-endings',
    'summary-completion', 'form-completion', 'diagram-label', 'vocab-context',
    'writing-prompt', 'speaking-prompt', 'standard',
  ];
  return VALID_FORMATS.includes(f) ? f : 'standard';
}

function validateLessonAndQuestions(lessonData, questions = [], defaultTopic = '') {
  const errors = [];

  if (!lessonData.slug) {
    errors.push('Lesson slug is required');
  }
  if (!lessonData.title) {
    errors.push('Lesson title is required');
  }
  const topic = lessonData.topic || defaultTopic;
  if (!topic) {
    errors.push('Lesson topic is required');
  }

  // 1. Validate Reading Passage & Verbatim Substrings
  if (lessonData.passage && Array.isArray(lessonData.passage.paragraphs)) {
    const fullTextMap = new Map();
    lessonData.passage.paragraphs.forEach((p) => {
      if (p.label && p.text) {
        fullTextMap.set(p.label, p.text);
      }
    });

    // Check vocabAnchors
    if (Array.isArray(lessonData.vocabAnchors)) {
      for (const anchor of lessonData.vocabAnchors) {
        if (!anchor.paragraphLabel) continue;
        const paragraphText = fullTextMap.get(anchor.paragraphLabel);
        if (!paragraphText) {
          errors.push(
            `vocabAnchor paragraphLabel '${anchor.paragraphLabel}' không tồn tại trong bài đọc (${lessonData.slug}).`,
          );
        } else if (anchor.text && !paragraphText.includes(anchor.text)) {
          errors.push(
            `vocabAnchor text "${anchor.text}" không phải là verbatim substring của đoạn [${anchor.paragraphLabel}] (${lessonData.slug}).`,
          );
        }
      }
    }

    // Check paraphrasePairs
    if (Array.isArray(lessonData.paraphrasePairs)) {
      for (const pair of lessonData.paraphrasePairs) {
        if (!pair.paragraphLabel) continue;
        const paragraphText = fullTextMap.get(pair.paragraphLabel);
        if (!paragraphText) {
          errors.push(
            `paraphrasePair paragraphLabel '${pair.paragraphLabel}' không tồn tại trong bài đọc (${lessonData.slug}).`,
          );
        } else if (pair.passageText && !paragraphText.includes(pair.passageText)) {
          errors.push(
            `paraphrasePair passageText "${pair.passageText}" không khớp verbatim với đoạn [${pair.paragraphLabel}] (${lessonData.slug}).`,
          );
        }
      }
    }
  }

  // 2. Validate Questions
  const orderIndices = new Set();
  questions.forEach((q, idx) => {
    const oi = q.orderIndex;
    if (typeof oi === 'number' && Number.isFinite(oi)) {
      if (orderIndices.has(oi)) {
        errors.push(`Trùng orderIndex: ${oi} trong bài học ${lessonData.slug}`);
      }
      orderIndices.add(oi);
    }

    const format = normalizeQuestionFormat(q.format);
    const prompt = String(q.prompt || q.question || q.text || q.stem || q.promptText || q.instruction || '').trim();
    if (!prompt) {
      // Prompt will be given default by seedPipeline, not a fatal blocking error unless totally blank
    }

    // Rule Choice: correctAnswer phải nằm trong options
    if (q.type === 'choice' || ['mcq', 'mcq-multiple', 'matching-headings', 'matching-info', 'matching-features', 'matching-endings'].includes(format)) {
      let options = Array.isArray(q.options) ? q.options : [];
      if (format === 'tfng' && options.length === 0) options = ['TRUE', 'FALSE', 'NOT GIVEN'];
      if (format === 'ynng' && options.length === 0) options = ['YES', 'NO', 'NOT GIVEN'];

      if (options.length < 2) {
        errors.push(`Question [${oi ?? idx}]: options phải là mảng có ít nhất 2 lựa chọn.`);
      } else if (format === 'mcq-multiple') {
        const answers = String(q.correctAnswer || '')
          .split(/[,|;]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (answers.length < 2) {
          errors.push(`Question [${oi ?? idx}]: mcq-multiple phải có tối thiểu 2 đáp án (ngăn cách bởi "|").`);
        }
      } else {
        let ans = String(q.correctAnswer || '').trim();
        if (/^[A-D]$/i.test(ans)) {
          const letterIdx = ans.toUpperCase().charCodeAt(0) - 65;
          if (letterIdx >= 0 && letterIdx < options.length) {
            ans = options[letterIdx];
          }
        }
        const hasMatch = options.includes(ans) || options.some((opt) => {
          const cOpt = opt.replace(/^[A-D][.)]\s*/i, '').trim().toLowerCase();
          const cAns = ans.replace(/^[A-D][.)]\s*/i, '').trim().toLowerCase();
          return cOpt === cAns;
        });
        if (!hasMatch) {
          errors.push(`Question [${oi ?? idx}]: correctAnswer "${q.correctAnswer}" không khớp với options.`);
        }
      }
    }

    // Rule TFNG / YNNG
    if (format === 'tfng') {
      const valid = ['TRUE', 'FALSE', 'NOT GIVEN'];
      if (!valid.includes(String(q.correctAnswer).trim().toUpperCase())) {
        errors.push(`Question [${oi ?? idx}]: TFNG correctAnswer phải là TRUE, FALSE hoặc NOT GIVEN.`);
      }
    }
    if (format === 'ynng') {
      const valid = ['YES', 'NO', 'NOT GIVEN'];
      if (!valid.includes(String(q.correctAnswer).trim().toUpperCase())) {
        errors.push(`Question [${oi ?? idx}]: YNNG correctAnswer phải là YES, NO hoặc NOT GIVEN.`);
      }
    }

    // Rule Verbatim Substring cho Question Evidence (Reading & Listening)
    if (q.evidence && q.evidence.text) {
      if (lessonData.passage && Array.isArray(lessonData.passage.paragraphs) && q.evidence.paragraphLabel) {
        const pText = lessonData.passage.paragraphs.find((p) => p.label === q.evidence.paragraphLabel)?.text;
        if (pText && !pText.includes(q.evidence.text)) {
          errors.push(
            `Question [${oi ?? idx}]: evidence.text "${q.evidence.text}" không xuất hiện verbatim trong đoạn [${q.evidence.paragraphLabel}].`,
          );
        }
      } else if (lessonData.audioTranscript) {
        if (!lessonData.audioTranscript.includes(q.evidence.text)) {
          errors.push(`Question [${oi ?? idx}]: evidence.text "${q.evidence.text}" không nằm trong audioTranscript.`);
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateVocabularyBatch(vocabList = []) {
  const errors = [];
  const wordsSet = new Set();
  const validPos = [
    'noun', 'verb', 'adj', 'adjective', 'adv', 'adverb', 'phrase', 'prep', 'conj',
    'phrasal_verb', 'phrasal verb', 'idiom'
  ];

  for (let idx = 0; idx < vocabList.length; idx++) {
    const item = vocabList[idx];
    if (!item.word || typeof item.word !== 'string') {
      errors.push(`Item [${idx}]: Thiếu trường "word" hợp lệ.`);
      continue;
    }

    const cleanWord = item.word.trim().toLowerCase();
    if (wordsSet.has(cleanWord)) {
      errors.push(`Item [${idx}]: Từ vựng "${cleanWord}" bị trùng lặp trong cùng đợt.`);
    }
    wordsSet.add(cleanWord);

    if (!item.meaningVi) {
      errors.push(`Item [${idx}] (${cleanWord}): Thiếu meaningVi.`);
    }

    if (item.pos && !validPos.includes(item.pos.toLowerCase())) {
      errors.push(`Item [${idx}] (${cleanWord}): pos "${item.pos}" không thuộc enum cho phép.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  normalizeQuestionFormat,
  validateLessonAndQuestions,
  validateVocabularyBatch,
};
