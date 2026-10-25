/**
 * Pipeline Configuration Matrix & Prompt Templates for IELTS Adaptive Learning
 * Aligned with .claude/workflow13/vocabulary.md and lessonquestion.md
 */

const LEVELS = [
  { level: 0, tier: 1, awl: null, wordLength: '80-150', cefr: 'A1-A2', band: '0-4.0' },
  { level: 1, tier: 2, awl: null, wordLength: '150-250', cefr: 'A2-B1', band: '4.0-5.5' },
  { level: 2, tier: 3, awl: '1-4', wordLength: '250-450', cefr: 'B1-B2', band: '5.5-6.5' },
  { level: 3, tier: '3 or 4', awl: '5-7', wordLength: '450-700', cefr: 'B2-C1', band: '6.5-7.5' },
  { level: 4, tier: 4, awl: '8-10', wordLength: '700-900', cefr: 'C1', band: '7.5-8.0+' },
];

const TOPICS = {
  L0_L1: [
    'Family & Friends',
    'Daily Routine',
    'Food & Drink',
    'Home',
    'Shopping',
    'Weather',
    'Hobbies',
    'Transport',
    'Health Basics',
    'School & Education',
    'Jobs',
    'Travel',
  ],
  L2_L4: [
    'Education',
    'Work & Careers',
    'Technology',
    'Environment',
    'Health',
    'Crime & Law',
    'Media & Advertising',
    'Travel & Tourism',
    'Culture & Globalization',
    'Government & Politics',
    'Family & Society',
    'Science',
    'Transport & Cities',
    'Food & Diet',
    'Sport & Leisure',
    'Arts & Music',
    'Money & Consumerism',
    'History & Heritage',
    'Language',
    'Housing & Architecture',
  ],
};

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const SKILL_MODULES = {
  reading: `Reading Module:
- BATCH: Exactly 1 theory lesson + 1 practice lesson.
- Theory lesson: Comprehensive Vietnamese strategy for ONE question format (e.g. TFNG, Matching Headings, or Summary Completion), skimming/scanning method, keyword identification, paraphrase recognition, common pitfalls.
- Practice lesson:
  * 1 original passage with paragraphs labeled A, B, C, D... Length: L0 (80-150w), L1 (150-250w), L2 (250-450w), L3 (450-700w), L4 (700-900w).
  * 4-6 vocabAnchors where anchor.text is an exact verbatim substring in the paragraph.
  * 3-4 paraphrasePairs where passageText is an exact verbatim substring in the paragraph.
  * Questions: L0-L1 (6-8 questions), L2 (8-10 questions), L3-L4 (10-14 questions, full exam section) testing 2-3 formats (e.g. tfng/ynng + matching + completion). Every evidence.text must be an exact verbatim substring from the passage.`,

  listening: `Listening Module:
- BATCH: Exactly 1 theory lesson + 1 practice lesson.
- Theory lesson: Vietnamese listening strategy for Section {meta.listeningSection} (e.g. prediction, signpost words, number/spelling traps).
- Practice lesson:
  * audioTranscript: realistic dialogue or academic lecture with speaker labels, distractors, and natural self-corrections.
  * meta.listeningSection: 1 (L0-L1), 2 (L1-L2), 3 (L2-L3), or 4 (L3-L4).
  * 8-10 questions (form-completion, mcq, diagram-label, sentence-completion).
  * evidence.text must be an exact verbatim substring from audioTranscript.
  * errorTaxonomy: prioritize ERR_PHO (sound/pronunciation trap) and ERR_DIS (distractor trap).`,

  grammar: `Grammar Module:
- BATCH: Exactly 1 theory lesson + 1 practice lesson.
- Theory lesson: Vietnamese explanation of ONE academic grammar structure (e.g. inversion, relative clauses, passive voice, conditionals), syntactic formula, 6+ clear examples, common pitfalls for Vietnamese learners.
- Practice lesson:
  * 8-10 practice questions (choice, cloze, reorder).
  * errorTaxonomy: mostly ERR_SYN.`,

  phonetics: `Phonetics Module:
- BATCH: Exactly 1 theory lesson + 1 practice lesson.
- Theory lesson: Vietnamese explanation of one sound group (minimal pairs, ending sounds /s/, /ed/, word stress rules).
- Practice lesson:
  * 6-8 practice questions (minimal pairs, stress marking, dictation).
  * Use IPA in prompts; errorTaxonomy: ERR_PHO.`,

  speaking: `Speaking Module:
- BATCH: Exactly 1 theory lesson + 1 practice lesson.
- Theory lesson: Part {meta.speakingPart} structure (Part 1 everyday questions, Part 2 cue card, Part 3 abstract discussion), band 6/7/8 comparison, useful academic lexical phrases.
- Practice lesson:
  * 3-4 questions with type "open", format "speaking-prompt".
  * correctAnswer: condensed key points (1-2 sentences).
  * metadata.aiReferenceAnswer: full Band 8.0 model response.`,

  writing: `Writing Module:
- BATCH: Exactly 1 theory lesson + 1 practice lesson.
- Theory lesson: Task 1 (7 chart types) or Task 2 (5 essay types) strategy, 4 Band Descriptors criteria, template/outline.
- Practice lesson:
  * 1-2 prompt questions with type "open", format "writing-prompt".
  * metadata.minWords: 150 for Task 1, 250 for Task 2. metadata.timeLimitSec: 1200 for Task 1, 2400 for Task 2.
  * metadata.aiReferenceAnswer: full Band 8.0 model essay.`,
};

function buildPromptA(level, topic, existingWords = []) {
  const lvlConfig = LEVELS.find((l) => l.level === level) || LEVELS[0];
  const tierValue = level === 0 ? 1 : level === 1 ? 2 : level === 4 ? 4 : 3;

  return `You are an IELTS vocabulary author for Vietnamese learners.
Output ONLY valid JSON: {"vocabulary":[...]}. No markdown fences, no comments.

# INPUT
LEVEL: ${level} (Band: ${lvlConfig.band}, CEFR: ${lvlConfig.cefr})
TOPIC: "${topic}"
COUNT: 30-40 items
EXISTING_WORDS_TO_AVOID: [${existingWords.slice(0, 100).join(', ')}]

# RULES PER ITEM:
- word: string (lowercase, unique in batch, not in EXISTING_WORDS_TO_AVOID)
- ipa: string (with standard slashes, British IPA, e.g. "/.../")
- pos: "noun" | "verb" | "adj" | "adv" | "phrase" | "prep" | "conj"
- meaningVi: string (Vietnamese definition)
- definitionEn: string (simple English definition matching CEFR)
- vocabType: "topic_specific" | "academic" | "collocation" | "phrasal_verb" | "idiom"
- level: ${level}
- tier: ${tierValue}
- readingTier: ${level >= 2 ? (level === 2 ? 2 : 3) : 1}
- awlSublist: ${level <= 1 ? 'null' : level === 2 ? 3 : level === 3 ? 6 : 9}
- collocations: array of 3-5 collocations
- topicIdeaVi: string (Vietnamese idea usable in Speaking/Writing)
- wordFamily: { "noun": string|null, "verb": string|null, "adj": string|null, "adv": string|null }
- paraphrases: array of 2-3 synonyms
- exampleSentence: string (contains the target word or a gap)
- topic: "${topic}"
- status: "published"

# CRITICAL JSON SYNTAX:
- Never use unescaped double quotes inside string values; use single quotes ('...') instead.
- No trailing commas.
- Output ONLY the JSON object.
`;
}

function buildPromptB(level, topic, skill, topicVocabWords = [], existingSlugs = []) {
  const skillPrompt = SKILL_MODULES[skill] || SKILL_MODULES.reading;
  const topicSlug = slugify(topic);
  const theorySlug = `${skill}-l${level}-${topicSlug}-theory`;
  const practiceSlug = `${skill}-l${level}-${topicSlug}-practice`;

  return `You are an IELTS curriculum designer and content author for Vietnamese learners.
Output ONLY valid JSON: {"lessons":[...],"questions":[...]}. No markdown fences, no comments.

# INPUT
LEVEL: ${level} | TOPIC: "${topic}" | SKILL: "${skill}"
BATCH PLAN: Exactly 2 lessons (1 theory + 1 practice).
TOPIC_VOCAB_WORDS: [${topicVocabWords.slice(0, 30).join(', ')}]
EARLIER_LESSON_SLUGS: [${existingSlugs.slice(0, 50).join(', ')}]

# LESSONS SPECIFICATION (Exactly 2 items in "lessons" array):
1. Theory Lesson:
   - "slug": "${theorySlug}" (MUST be exact string)
   - "title": string (Vietnamese title, e.g. "Chiến lược ...")
   - "skill": "${skill}"
   - "contentType": "theory"
   - "level": ${level}
   - "topic": "${topic}"
   - "contentMarkdown": string (Detailed Vietnamese guide: concepts, rules, formulas, 6+ examples, Vietnamese learner pitfalls, exam tips)
   - "orderIndex": 1
   - "status": "published"

2. Practice Lesson:
   - "slug": "${practiceSlug}" (MUST be exact string)
   - "title": string (Vietnamese title, e.g. "Luyện tập ...")
   - "skill": "${skill}"
   - "contentType": "practice"
   - "level": ${level}
   - "topic": "${topic}"
   - "passage": { "paragraphs": [ { "label": "A", "text": "..." }, { "label": "B", "text": "..." } ] } (for reading only; omit for other skills)
   - "audioTranscript": string (for listening only; omit for other skills)
   - "vocabWords": array of words chosen from TOPIC_VOCAB_WORDS
   - "vocabAnchors": [ { "word": "...", "text": "exact verbatim substring in paragraph", "paragraphLabel": "A" } ] (reading only)
   - "paraphrasePairs": [ { "questionText": "...", "passageText": "exact verbatim substring in paragraph", "paragraphLabel": "A" } ] (reading only)
   - "prerequisiteSlugs": [ "${theorySlug}" ]
   - "orderIndex": 2
   - "meta": { "listeningSection": 1, "speakingPart": 1, "writingTask": 2, "estimatedMinutes": 20 }
   - "status": "published"

# QUESTIONS SPECIFICATION (Attached to practice lesson):
Every item in "questions" array MUST have:
- "lessonSlug": "${practiceSlug}" (MUST match practice lesson slug exactly)
- "orderIndex": integer (1, 2, 3... sequential without gaps)
- "type": "choice" | "cloze" | "dictation" | "reorder" | "open"
- "format": "tfng" | "ynng" | "mcq" | "mcq-multiple" | "sentence-completion" | "short-answer" | "matching-headings" | "matching-info" | "matching-features" | "matching-endings" | "summary-completion" | "form-completion" | "diagram-label" | "writing-prompt" | "speaking-prompt"
- "prompt": string (Question prompt/instruction)
- "options": array of strings (required for type "choice"; minimum 2 items)
- "correctAnswer": string (For type "choice": MUST EXACTLY match one option string. For "mcq-multiple": join with "|" e.g. "A|C". For tfng: "TRUE"|"FALSE"|"NOT GIVEN". For ynng: "YES"|"NO"|"NOT GIVEN")
- "acceptableAnswers": array of valid alternative strings
- "evidence": { "paragraphLabel": "A", "text": "exact verbatim substring from passage or audioTranscript" }
- "explanation": string (Vietnamese pedagogical note: why answer is correct AND why distractors are wrong)
- "errorTaxonomy": "ERR_LEX" | "ERR_PHO" | "ERR_SYN" | "ERR_DIS" | "ERR_LOG"
- "metadata": { "maxWords": 2, "minWords": 250, "timeLimitSec": 2400, "aiReferenceAnswer": "..." }

# HARD RULES (Database strictly validates these):
1. Verbatim Substrings: vocabAnchors.text, paraphrasePairs.passageText, and evidence.text MUST be exact copy-pasted substrings of the paragraph indicated by paragraphLabel.
2. type "choice": correctAnswer MUST EXACTLY match one of the strings in options.
3. tfng/ynng: options must be exactly ["TRUE", "FALSE", "NOT GIVEN"] or ["YES", "NO", "NOT GIVEN"].
4. Theory lesson has NO questions. All questions belong to "${practiceSlug}".
5. CRITICAL JSON SYNTAX: Never use unescaped double quotes inside text values; use single quotes ('...'). No trailing commas.

# SKILL SPECIFIC MODULE:
${skillPrompt}
`;
}

module.exports = {
  LEVELS,
  TOPICS,
  SKILL_MODULES,
  slugify,
  buildPromptA,
  buildPromptB,
};

