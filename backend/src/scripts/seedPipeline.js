const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const Vocabulary = require('../models/Vocabulary');
const Lesson = require('../models/Lesson');
const Question = require('../models/Question');

const { LEVELS, TOPICS, SKILL_MODULES, buildPromptA, buildPromptB } = require('./pipelineConfig');
const {
  validateLessonAndQuestions,
  validateVocabularyBatch,
  normalizeQuestionFormat,
} = require('./pipelineValidator');

// CLI Arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return null;
}

const fileArg = getArgValue('--file');
const levelArg = getArgValue('--level') !== null ? Number(getArgValue('--level')) : null;
const topicArg = getArgValue('--topic');
const skillArg = getArgValue('--skill') || 'all';

/**
 * Normalize passage: đảm bảo paragraphs luôn là mảng object { label, text }
 */
function normalizePassage(rawPassage) {
  if (!rawPassage || typeof rawPassage !== 'object') {
    return { paragraphs: [] };
  }

  let paragraphs = rawPassage.paragraphs;

  // Trường hợp LLM trả về string thay vì mảng
  if (typeof paragraphs === 'string') {
    const chunks = paragraphs
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);
    paragraphs = chunks.map((text, i) => ({
      label: String.fromCharCode(65 + i), // A, B, C...
      text,
    }));
  }

  // Trường hợp là mảng nhưng phần tử có thể là string hoặc object thiếu field
  if (Array.isArray(paragraphs)) {
    paragraphs = paragraphs
      .map((p, i) => {
        if (typeof p === 'string') {
          return { label: String.fromCharCode(65 + i), text: p.trim() };
        }
        if (!p || typeof p !== 'object') {
          return null;
        }
        return {
          label: p.label || String.fromCharCode(65 + i),
          text: (p.text || '').trim(),
        };
      })
      .filter((p) => p && p.text);
  } else {
    paragraphs = [];
  }

  return { paragraphs };
}

/**
 * Normalize errorTaxonomy: schema strictly requires enum ['ERR_LEX', 'ERR_PHO', 'ERR_SYN', 'ERR_DIS', 'ERR_LOG']
 */
function normalizeErrorTaxonomy(raw) {
  const CANONICAL = ['ERR_LEX', 'ERR_PHO', 'ERR_SYN', 'ERR_DIS', 'ERR_LOG'];
  if (raw == null) return 'ERR_LEX';

  let str = '';
  if (typeof raw === 'string') {
    str = raw.trim().toUpperCase();
  } else if (typeof raw === 'object') {
    str = String(raw.type || raw.code || raw.errorCode || '').trim().toUpperCase();
  }

  if (CANONICAL.includes(str)) return str;
  if (str.includes('PHO') || str.includes('PRONUN') || str.includes('SOUND') || str.includes('LISTEN')) return 'ERR_PHO';
  if (str.includes('SYN') || str.includes('GRAMMAR') || str.includes('STRUCT')) return 'ERR_SYN';
  if (str.includes('DIS') || str.includes('TRAP')) return 'ERR_DIS';
  if (str.includes('LOG') || str.includes('INFER')) return 'ERR_LOG';
  return 'ERR_LEX';
}

/**
 * Robust JSON Parser that strips markdown fences, trailing commas, and trailing non-whitespace
 */
function cleanAndParseJson(raw) {
  if (!raw || typeof raw !== 'string') return {};
  let cleaned = raw.trim();

  // Strip markdown fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Extract outermost JSON block
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Second pass: remove any remaining trailing commas
    const fixed = cleaned.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(fixed);
  }
}

/**
 * Universal LLM caller via 9Router (OpenAI-compatible endpoint)
 * 9Router base: http://localhost:20128/v1
 */
async function callLLM(prompt, retries = 3) {
  const baseURL = 'http://localhost:20128/v1';
  const apiKey = 'sk-c20289893034a894-ke9o9q-7da92cd3';
  const model = 'ag/gemini-3.8-flash-high';

  if (!baseURL) {
    throw new Error(
      'Không tìm thấy NINEROUTER_BASE_URL trong file .env. Vui lòng cấu hình endpoint 9Router (ví dụ: http://localhost:20128/v1) hoặc dùng flag --file <path> để import file JSON có sẵn.',
    );
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 8192,
          stream: false,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`9Router API Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '{}';
      return cleanAndParseJson(text);
    } catch (err) {
      console.warn(`[Pipeline LLM] Lỗi gọi 9Router lần ${attempt}/${retries}: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

/**
 * Ingest and upsert Vocabulary items
 */
async function processVocabularyBatch(vocabList = []) {
  if (!Array.isArray(vocabList) || vocabList.length === 0) return 0;

  const validation = validateVocabularyBatch(vocabList);
  if (!validation.isValid) {
    console.warn('   [Validation Vocab Warnings]:', validation.errors.slice(0, 5));
  }

  const bulkOps = [];
  for (const raw of vocabList) {
    if (!raw.word) continue;
    const cleanWord = String(raw.word).trim().toLowerCase();

    let pos = String(raw.pos || 'noun').trim().toLowerCase();
    const posMap = {
      adjective: 'adj',
      adverb: 'adv',
      preposition: 'prep',
      conjunction: 'conj',
      phrasal_verb: 'verb',
      'phrasal verb': 'verb',
      idiom: 'phrase',
    };
    pos = posMap[pos] || pos;
    const validPos = ['noun', 'verb', 'adj', 'adjective', 'adv', 'adverb', 'phrase', 'prep', 'conj'];
    if (!validPos.includes(pos)) pos = 'noun';

    const validVocabTypes = ['topic_specific', 'academic', 'collocation', 'phrasal_verb', 'idiom'];
    const vocabType = validVocabTypes.includes(raw.vocabType) ? raw.vocabType : 'topic_specific';

    const level = Math.min(Math.max(Number(raw.level ?? 2), 0), 4);

    let tier = Number(raw.tier);
    if (![1, 2, 3, 4].includes(tier)) {
      tier = Math.min(Math.max(level + 1, 1), 4);
    }

    let readingTier = raw.readingTier != null ? Number(raw.readingTier) : null;
    if (readingTier !== null && ![1, 2, 3].includes(readingTier)) {
      readingTier = null;
    }

    let awlSublist = parseInt(raw.awlSublist, 10);
    if (isNaN(awlSublist) || awlSublist < 1 || awlSublist > 10) awlSublist = null;

    const rawWf = typeof raw.wordFamily === 'object' && raw.wordFamily !== null ? raw.wordFamily : {};
    const wordFamily = {
      noun: rawWf.noun || null,
      verb: rawWf.verb || null,
      adj: rawWf.adj || null,
      adv: rawWf.adv || null,
    };

    const vocabDoc = {
      word: cleanWord,
      ipa: raw.ipa || `/${cleanWord}/`,
      pos,
      meaningVi: raw.meaningVi || '',
      definitionEn: raw.definitionEn || '',
      vocabType,
      level,
      awlSublist,
      collocations: Array.isArray(raw.collocations) ? raw.collocations : [],
      topicIdeaVi: raw.topicIdeaVi || '',
      wordFamily,
      paraphrases: Array.isArray(raw.paraphrases) ? raw.paraphrases : [],
      exampleSentence: raw.exampleSentence || `Example sentence with ${cleanWord}.`,
      topic: raw.topic || 'academic-general',
      tier,
      readingTier,
      status: raw.status || 'published',
    };

    bulkOps.push({
      updateOne: {
        filter: { word: cleanWord },
        update: { $set: vocabDoc },
        upsert: true,
      },
    });
  }

  if (!isDryRun && bulkOps.length > 0) {
    await Vocabulary.bulkWrite(bulkOps, { ordered: false });
  }

  return bulkOps.length;
}

/**
 * Ingest and upsert Lesson + Questions
 */
async function processLessonAndQuestionsBatch(
  lessons = [],
  questions = [],
  defaultTopic = 'academic-general',
  defaultLevel = 2,
  defaultSkill = null
) {
  let savedLessons = 0;
  let savedQuestions = 0;

  for (const lessonData of lessons) {
    const slug = lessonData.slug;
    const topic = String(lessonData.topic || defaultTopic || 'academic-general').trim();
    const level = Math.min(Math.max(Number(lessonData.level ?? defaultLevel ?? 2), 0), 4);
    lessonData.topic = topic;
    lessonData.level = level;

    // 0. Chuẩn hóa passage TRƯỚC khi validate & save
    lessonData.passage = normalizePassage(lessonData.passage);

    const lessonQuestions = questions.filter((q) => q.lessonSlug === slug);

    // 1. Strict Validation (sau khi đã normalize)
    const validation = validateLessonAndQuestions(lessonData, lessonQuestions, topic);
    if (!validation.isValid) {
      console.warn(`   [Validation Lesson Error] Bỏ qua ${slug}:`, validation.errors);
      continue;
    }

    // 2. Resolve vocabularies via single in-memory query
    const topicVocabs = await Vocabulary.find({ topic }, '_id word');
    const vocabMap = new Map(topicVocabs.map((v) => [v.word.toLowerCase(), v._id]));

    const vocabIds = (lessonData.vocabWords || [])
      .map((w) => vocabMap.get(String(w).trim().toLowerCase()))
      .filter(Boolean);

    const paragraphs = lessonData.passage?.paragraphs || [];
    const byLabel = new Map(paragraphs.map((p) => [p.label, p.text || '']));

    // 3. Resolve vocabAnchors: kiểm tra bắt buộc xuất hiện trong passage để tránh văng pre('validate')
    const resolvedAnchors = [];
    if (Array.isArray(lessonData.vocabAnchors)) {
      for (const a of lessonData.vocabAnchors) {
        if (!a || typeof a !== 'object') continue;
        const vId = a.vocabId || (a.word ? vocabMap.get(String(a.word).trim().toLowerCase()) : null);
        const text = String(a.text || '').trim();
        const pLabel = String(a.paragraphLabel || '').trim();
        const pText = byLabel.get(pLabel);

        // Chỉ thêm khi có đủ vId và text thật sự xuất hiện trong paragraph
        if (vId && text && pLabel && pText && pText.includes(text)) {
          resolvedAnchors.push({
            vocabId: vId,
            text,
            paragraphLabel: pLabel,
          });
        }
      }
    }

    // 3b. Resolve paraphrasePairs: kiểm tra passageText có trong paragraph
    const resolvedPairs = [];
    if (Array.isArray(lessonData.paraphrasePairs)) {
      for (const p of lessonData.paraphrasePairs) {
        if (!p || typeof p !== 'object') continue;
        const qText = String(p.questionText || '').trim();
        const passText = String(p.passageText || '').trim();
        const pLabel = String(p.paragraphLabel || '').trim();
        const pText = byLabel.get(pLabel);
        const vId = p.vocabId || (p.word ? vocabMap.get(String(p.word).trim().toLowerCase()) : null);

        if (qText && passText && pLabel && pText && pText.includes(passText)) {
          resolvedPairs.push({
            vocabId: vId,
            questionText: qText,
            passageText: passText,
            paragraphLabel: pLabel,
          });
        }
      }
    }

    // 4. Resolve prerequisiteSlugs to ObjectIds
    const prerequisiteIds = [];
    if (Array.isArray(lessonData.prerequisiteSlugs) && lessonData.prerequisiteSlugs.length > 0) {
      const foundPrereqs = await Lesson.find({ slug: { $in: lessonData.prerequisiteSlugs } }, '_id');
      prerequisiteIds.push(...foundPrereqs.map((l) => l._id));
    }

    const validSkills = ['phonetics', 'grammar', 'reading', 'listening', 'speaking', 'writing'];
    let skill = String(lessonData.skill || defaultSkill || 'reading').toLowerCase();
    if (defaultSkill && validSkills.includes(defaultSkill)) {
      skill = defaultSkill;
    }
    if (skill === 'syntax') skill = 'grammar';
    if (skill === 'lexicon' || skill === 'vocab') skill = 'reading';
    if (!validSkills.includes(skill)) skill = defaultSkill || 'reading';

    // Xác định và chuẩn hóa contentType chính xác
    const hasPassage = Array.isArray(lessonData.passage?.paragraphs) && lessonData.passage.paragraphs.length > 0;
    const hasTranscript = !!(lessonData.audioTranscript && lessonData.audioTranscript.trim());
    const hasMarkdown = !!(lessonData.contentMarkdown && lessonData.contentMarkdown.trim());
    const hasQuestions = lessonQuestions.length > 0;

    let contentType = String(lessonData.contentType || '').toLowerCase();
    if (!['theory', 'practice'].includes(contentType)) {
      contentType = hasQuestions || hasPassage || hasTranscript ? 'practice' : 'theory';
    }

    // Tự động nhận diện bài THEORY: Có markdown lý thuyết, không có passage, không có transcript, không có câu hỏi
    if (!hasPassage && !hasTranscript && hasMarkdown && !hasQuestions) {
      contentType = 'theory';
    }

    // Chặn bài practice rác: Đánh dấu practice nhưng không có passage/transcript VÀ không có câu hỏi nào
    if (contentType === 'practice' && !hasQuestions && !hasPassage && !hasTranscript) {
      console.warn(`   ⚠️ [Bỏ qua Lesson rác] ${slug}: Đánh dấu practice nhưng không có bài đọc/audio và 0 câu hỏi.`);
      continue;
    }

    const lessonPayload = {
      slug: lessonData.slug,
      title: lessonData.title,
      skill,
      contentType,
      level,
      topic,
      contentMarkdown: lessonData.contentMarkdown || '',
      audioTranscript: lessonData.audioTranscript || '',
      passage: lessonData.passage,
      vocabIds: vocabIds.length ? vocabIds : undefined,
      vocabAnchors: resolvedAnchors.length ? resolvedAnchors : undefined,
      paraphrasePairs: resolvedPairs,
      prerequisites: prerequisiteIds.length ? prerequisiteIds : undefined,
      orderIndex: Number(lessonData.orderIndex || 0),
      meta: lessonData.meta || {},
      media: lessonData.media || null,
      status: lessonData.status || 'published',
    };

    if (isDryRun) {
      console.log(`   [Dry Run] Hợp lệ: Lesson "${lessonData.title}" (${slug}) với ${lessonQuestions.length} câu hỏi.`);
      savedLessons++;
      savedQuestions += lessonQuestions.length;
      continue;
    }

    const existingLesson = await Lesson.findOne({ slug });
    let savedLesson;
    if (existingLesson) {
      Object.assign(existingLesson, lessonPayload);
      savedLesson = await existingLesson.save();
    } else {
      savedLesson = await Lesson.create(lessonPayload);
    }
    savedLessons++;

    // 5. Upsert Questions via bulkWrite (1 round-trip thay vì N round-trips)
    const CHOICE_FORMATS = Question.CHOICE_FORMATS || [
      'tfng', 'ynng', 'mcq', 'mcq-multiple', 'matching-headings', 'matching-info', 'matching-features', 'matching-endings'
    ];

    const bulkQuestionOps = [];
    for (let i = 0; i < lessonQuestions.length; i++) {
      const q = lessonQuestions[i];
      const qVocabId = q.vocabWord ? vocabMap.get(String(q.vocabWord).trim().toLowerCase()) || null : null;
      const orderIndex = typeof q.orderIndex === 'number' && Number.isFinite(q.orderIndex) ? q.orderIndex : i + 1;

      // Chuẩn hóa format & type (sử dụng normalizeQuestionFormat để bắt alias như 'mcq-single')
      const format = normalizeQuestionFormat(q.format);
      let type = q.type || 'cloze';
      if (CHOICE_FORMATS.includes(format)) {
        type = 'choice';
      } else if (['writing-prompt', 'speaking-prompt'].includes(format)) {
        type = 'open';
      } else if (!['cloze', 'choice', 'dictation', 'reorder', 'open'].includes(type)) {
        type = Array.isArray(q.options) && q.options.length >= 2 ? 'choice' : 'cloze';
      }

      // Chuẩn hóa options
      let options = Array.isArray(q.options) ? q.options : [];
      if (format === 'tfng' && options.length === 0) {
        options = ['TRUE', 'FALSE', 'NOT GIVEN'];
      }
      if (format === 'ynng' && options.length === 0) {
        options = ['YES', 'NO', 'NOT GIVEN'];
      }

      // Chuẩn hóa correctAnswer
      let correctAnswer = String(q.correctAnswer || '').trim();
      if (format === 'tfng') {
        const upper = correctAnswer.toUpperCase();
        if (['TRUE', 'FALSE', 'NOT GIVEN'].includes(upper)) correctAnswer = upper;
      } else if (format === 'ynng') {
        const upper = correctAnswer.toUpperCase();
        if (['YES', 'NO', 'NOT GIVEN'].includes(upper)) correctAnswer = upper;
      } else if (format === 'mcq-multiple' && !correctAnswer.includes('|')) {
        correctAnswer = correctAnswer.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean).join('|');
      } else if (['writing-prompt', 'speaking-prompt'].includes(format) && !correctAnswer) {
        correctAnswer = q.metadata?.aiReferenceAnswer || 'Model answer provided.';
      }

      // Chuẩn hóa khớp correctAnswer trong options nếu LLM trả về chữ cái A/B/C/D hoặc thêm prefix
      if (type === 'choice' && options.length >= 2) {
        if (/^[A-D]$/i.test(correctAnswer)) {
          const letterIdx = correctAnswer.toUpperCase().charCodeAt(0) - 65;
          if (letterIdx >= 0 && letterIdx < options.length) {
            correctAnswer = options[letterIdx];
          }
        }
        if (!options.includes(correctAnswer)) {
          const matched = options.find((opt) => {
            const cleanOpt = opt.replace(/^[A-D][.)]\s*/i, '').trim().toLowerCase();
            const cleanAns = correctAnswer.replace(/^[A-D][.)]\s*/i, '').trim().toLowerCase();
            return cleanOpt === cleanAns;
          });
          if (matched) {
            correctAnswer = matched;
          }
        }
      }

      // Chuẩn hóa prompt (bắt các field alias: question, text, stem, promptText, instruction)
      let prompt = String(q.prompt || q.question || q.text || q.stem || q.promptText || q.instruction || '').trim();
      if (!prompt) {
        if (format === 'tfng') prompt = 'Do the following statements agree with the information in the reading passage?';
        else if (format === 'ynng') prompt = 'Do the following statements agree with the claims of the writer?';
        else if (format.startsWith('matching')) prompt = 'Choose the correct match from the options below.';
        else if (format.includes('completion')) prompt = 'Complete the blanks with words from the context.';
        else prompt = 'Choose the correct answer based on the lesson context.';
      }

      // Chuẩn hóa evidence
      let evidence = q.evidence;
      if (typeof evidence === 'string') {
        evidence = { paragraphLabel: '', text: evidence.trim() };
      } else if (!evidence || typeof evidence !== 'object') {
        evidence = { paragraphLabel: '', text: '' };
      } else {
        evidence = {
          paragraphLabel: String(evidence.paragraphLabel || '').trim(),
          text: String(evidence.text || '').trim(),
        };
      }

      const rawMeta = typeof q.metadata === 'object' && q.metadata !== null ? q.metadata : {};
      const metadata = {
        wpmTarget: typeof rawMeta.wpmTarget === 'number' ? rawMeta.wpmTarget : 40,
        keyboardShortcutAudio: rawMeta.keyboardShortcutAudio || '`',
        acceptableVariants: Array.isArray(rawMeta.acceptableVariants) ? rawMeta.acceptableVariants : [],
        aiReferenceAnswer: rawMeta.aiReferenceAnswer || '',
        maxWords: rawMeta.maxWords != null ? Number(rawMeta.maxWords) : null,
        requiredSelections: rawMeta.requiredSelections != null ? Number(rawMeta.requiredSelections) : null,
        minWords: rawMeta.minWords != null ? Number(rawMeta.minWords) : null,
        timeLimitSec: rawMeta.timeLimitSec != null ? Number(rawMeta.timeLimitSec) : null,
      };

      const questionPayload = {
        lessonId: savedLesson._id,
        vocabId: qVocabId,
        type,
        format,
        orderIndex,
        prompt,
        options,
        correctAnswer,
        acceptableAnswers: Array.isArray(q.acceptableAnswers) ? q.acceptableAnswers : [],
        evidence,
        explanation: q.explanation || 'Pedagogical explanation provided.',
        errorTaxonomy: normalizeErrorTaxonomy(q.errorTaxonomy),
        media: q.media || null,
        metadata,
      };

      bulkQuestionOps.push({
        updateOne: {
          filter: { lessonId: savedLesson._id, orderIndex: questionPayload.orderIndex },
          update: { $set: questionPayload },
          upsert: true,
        },
      });
    }

    if (bulkQuestionOps.length > 0) {
      await Question.bulkWrite(bulkQuestionOps, { ordered: false });
      savedQuestions += bulkQuestionOps.length;
    }

    console.log(`   ✅ Đã lưu Lesson: ${slug} (${bulkQuestionOps.length} questions) [bulkWrite]`);
  }

  return { savedLessons, savedQuestions };
}

/**
 * Workflow Step 1: Seed Vocab via LLM (Tự động bỏ qua nếu topic đã có đủ từ)
 */
async function seedVocabStep(level, topic) {
  const existingCount = await Vocabulary.countDocuments({ topic, level });
  if (existingCount >= 25) {
    console.log(`\n📘 [VOCAB] Topic "${topic}" (Level ${level}) đã có ${existingCount} từ vựng. Bỏ qua gọi LLM.`);
    return existingCount;
  }

  console.log(`\n📘 [VOCAB] Đang tạo Vocab Level ${level} | Topic: "${topic}"...`);

  const existingWords = (await Vocabulary.find({ topic }, 'word')).map((v) => v.word);
  const prompt = buildPromptA(level, topic, existingWords);

  const res = await callLLM(prompt);
  const list = res.vocabulary || [];
  console.log(`   -> Nhận được ${list.length} từ vựng từ LLM. Đang lưu DB bằng bulkWrite...`);

  const count = await processVocabularyBatch(list);
  console.log(`   ✅ Đã lưu thành công ${count} từ vựng cho topic "${topic}".`);
  return count;
}

/**
 * Workflow Step 2: Seed Lesson & Questions via LLM (Tự động bỏ qua nếu đã có bài hoàn chỉnh)
 */
async function seedLessonStep(level, topic, skill) {
  // Kiểm tra các bài học hiện có của skill + topic + level này
  const existing = await Lesson.find({ topic, level, skill }, '_id slug contentType');
  if (existing.length > 0) {
    const questionCount = await Question.countDocuments({
      lessonId: { $in: existing.map((l) => l._id) },
    });

    const hasPractice = existing.some((l) => l.contentType === 'practice');

    // Nếu đã có bài practice và có câu hỏi (> 0) -> Coi như đã hoàn thiện, bỏ qua
    if (hasPractice && questionCount > 0) {
      console.log(
        `   ⏩ [Skip] Skill "${skill}" cho "${topic}" (Level ${level}) đã hoàn thiện (${existing.length} bài, ${questionCount} câu hỏi).`
      );
      return;
    }

    // Nếu đã có từ 2 bài trở lên và có câu hỏi -> bỏ qua
    if (existing.length >= 2 && questionCount > 0) {
      console.log(
        `   ⏩ [Skip] Skill "${skill}" cho "${topic}" (Level ${level}) đã hoàn thiện (${existing.length} bài, ${questionCount} câu hỏi).`
      );
      return;
    }

    // Nếu chỉ có bài theory hoặc bài practice rác 0 câu hỏi -> Tiếp tục gọi LLM để tạo bổ sung
    console.log(
      `   🔄 [Chưa hoàn chỉnh] Skill "${skill}" cho "${topic}" (Level ${level}) hiện có ${existing.length} bài nhưng ${questionCount} câu hỏi. Đang tạo bổ sung...`
    );
  }

  console.log(`\n📝 [LESSON] Đang tạo Lesson Level ${level} | Topic: "${topic}" | Skill: "${skill}"...`);

  // Query topic vocab
  const vocabs = await Vocabulary.find({ topic, level }, 'word');
  const topicVocabWords = vocabs.map((v) => v.word);

  // Query earlier slugs for prerequisites
  const earlierLessons = await Lesson.find({}, 'slug');
  const existingSlugs = earlierLessons.map((l) => l.slug);

  const prompt = buildPromptB(level, topic, skill, topicVocabWords, existingSlugs);

  let success = false;
  for (let attempt = 1; attempt <= 3 && !success; attempt++) {
    try {
      const res = await callLLM(prompt);
      const lessons = res.lessons || [];
      const questions = res.questions || [];

      if (!lessons.length) {
        console.warn(`   ⚠️ LLM không trả về lessons (Lần ${attempt}/3). Thử lại...`);
        continue;
      }

      const { savedLessons, savedQuestions } = await processLessonAndQuestionsBatch(
        lessons,
        questions,
        topic,
        level,
        skill
      );
      if (savedLessons > 0) {
        success = true;
        console.log(`   ✅ Thành công đợt ${skill}: ${savedLessons} lessons, ${savedQuestions} questions.`);
      }
    } catch (err) {
      console.warn(`   ⚠️ Lỗi batch ${skill} (Lần ${attempt}/3):`, err.message);
    }
  }
}

/**
 * Helper: chạy mảng tasks song song theo từng batch (concurrency limiter)
 */
async function runInBatches(tasks, batchSize = 3) {
  for (let i = 0; i < tasks.length; i += batchSize) {
    const chunk = tasks.slice(i, i + batchSize);
    await Promise.allSettled(chunk.map((fn) => fn()));
  }
}

/**
 * Main Entry Point
 */
async function run() {
  await connectDB();

  // Mode 1: Import directly from JSON file (masterplan bundle)
  if (fileArg) {
    const fullPath = path.resolve(process.cwd(), fileArg);
    if (!fs.existsSync(fullPath)) {
      console.error(`[Error] Không tìm thấy file: ${fullPath}`);
      process.exit(1);
    }

    console.log(`\n📂 [Bundle Import] Đọc file: ${fullPath} (dryRun = ${isDryRun})...`);
    const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

    if (Array.isArray(content.vocabulary)) {
      const vCount = await processVocabularyBatch(content.vocabulary);
      console.log(`✅ [Vocab] Đã import ${vCount} từ vựng.`);
    }

    if (Array.isArray(content.lessons)) {
      const { savedLessons, savedQuestions } = await processLessonAndQuestionsBatch(
        content.lessons,
        content.questions || [],
        content.topic || 'academic-general',
      );
      console.log(`✅ [Lessons] Đã import ${savedLessons} bài học & ${savedQuestions} câu hỏi.`);
    }

    console.log('\n🎉 Hoàn thành nạp dữ liệu từ file!');
    process.exit(0);
  }

  // Mode 2: Targeted Generation via LLM
  if (levelArg !== null && topicArg) {
    const skillsToRun =
      skillArg === 'all' ? ['reading', 'listening', 'grammar', 'phonetics', 'speaking', 'writing'] : [skillArg];

    await seedVocabStep(levelArg, topicArg);
    const tasks = skillsToRun.map((sk) => () => seedLessonStep(levelArg, topicArg, sk));
    await runInBatches(tasks, 3);

    console.log('\n🎉 Hoàn tất chu kỳ seed cho level & topic đã chọn!');
    process.exit(0);
  }

  // Mode 3: Full Automated Matrix Loop (Song song 3 skills mỗi topic + concurrency 2 topic cùng lúc)
  console.log(`\n🚀 [Full Matrix Pipeline] Bắt đầu tự động duyệt qua toàn bộ Levels & Topics (Tối ưu tốc độ cao)...`);
  const allSkills = ['reading', 'listening', 'grammar', 'phonetics', 'speaking', 'writing'];

  for (const lvlObj of LEVELS) {
    const lvl = lvlObj.level;
    const topicList = lvl <= 1 ? TOPICS.L0_L1 : TOPICS.L2_L4;

    for (let t = 0; t < topicList.length; t += 2) {
      const chunkTopics = topicList.slice(t, t + 2);
      await Promise.allSettled(
        chunkTopics.map(async (top) => {
          try {
            await seedVocabStep(lvl, top);
            const tasks = allSkills.map((sk) => () => seedLessonStep(lvl, top, sk));
            await runInBatches(tasks, 3);
          } catch (err) {
            console.error(`[Pipeline Error] Lỗi topic "${top}" (Level ${lvl}):`, err.message);
          }
        })
      );
    }
  }

  console.log('\n🏁 Toàn bộ quy trình Pipeline đã hoàn tất!');
  process.exit(0);
}

if (require.main === module) {
  run().catch((err) => {
    console.error('[Fatal Pipeline Failure]:', err);
    process.exit(1);
  });
}

module.exports = {
  callLLM,
  processVocabularyBatch,
  processLessonAndQuestionsBatch,
  seedVocabStep,
  seedLessonStep,
  normalizePassage,
  normalizeErrorTaxonomy,
};
