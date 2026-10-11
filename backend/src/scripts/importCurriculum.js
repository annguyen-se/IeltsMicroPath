const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');
const Vocabulary = require('../models/Vocabulary');
const Lesson = require('../models/Lesson');
const Question = require('../models/Question');

// Sample dataset from Oxford Word Skills Basic curriculum conversion
const sampleVocabulary = [
  {
    word: 'thousand',
    ipa: '/ˈθaʊ.zənd/',
    pos: 'noun',
    meaningVi: 'nghìn, một nghìn (1.000)',
    definitionEn: 'the number 1,000',
    vocabType: 'general',
    collocations: ['a few thousand', 'several thousand people', 'thousands of dollars'],
    exampleSentence: 'Over two ______ participants attended the international education conference.',
    topic: 'numbers',
    tier: 1
  },
  {
    word: 'million',
    ipa: '/ˈmɪl.jən/',
    pos: 'noun',
    meaningVi: 'triệu, một triệu (1.000.000)',
    definitionEn: 'the number 1,000,000',
    vocabType: 'general',
    collocations: ['two million pounds', 'millions of users', 'a million times'],
    exampleSentence: 'The government allocated five ______ dollars to build renewable energy stations.',
    topic: 'numbers',
    tier: 1
  },
  {
    word: 'quarter',
    ipa: '/ˈkwɔː.tər/',
    pos: 'noun',
    meaningVi: 'một phần tư, mười lăm phút (15 phút)',
    definitionEn: 'one of four equal parts of something, or 15 minutes before or after an hour',
    vocabType: 'general',
    collocations: ['quarter past ten', 'quarter to five', 'a quarter of an hour'],
    exampleSentence: 'We arranged to meet at a ______ to nine in front of the lecture hall.',
    topic: 'daily-life',
    tier: 1
  },
  {
    word: 'midnight',
    ipa: '/ˈmɪd.naɪt/',
    pos: 'noun',
    meaningVi: 'nửa đêm (12 giờ đêm)',
    definitionEn: 'twelve o clock at night',
    vocabType: 'general',
    collocations: ['at midnight', 'around midnight', 'stroke of midnight'],
    exampleSentence: 'Candidates were instructed to submit their final assignments before ______.',
    topic: 'daily-life',
    tier: 1
  },
  {
    word: 'midday',
    ipa: '/ˌmɪdˈdeɪ/',
    pos: 'noun',
    meaningVi: 'buổi trưa, giữa trưa (12 giờ trưa)',
    definitionEn: 'twelve o clock in the middle of the day',
    vocabType: 'general',
    collocations: ['at midday', 'midday sun', 'midday meal'],
    exampleSentence: 'Solar radiation reaches its highest concentration around ______.',
    topic: 'daily-life',
    tier: 1
  },
  {
    word: 'nationality',
    ipa: '/ˌnæʃ.ənˈæl.ə.ti/',
    pos: 'noun',
    meaningVi: 'quốc tịch',
    definitionEn: 'the official right to belong to a particular country',
    vocabType: 'general',
    collocations: ['dual nationality', 'state your nationality', 'acquire nationality'],
    exampleSentence: 'Applicants must state their full name, date of birth, and ______.',
    topic: 'geography',
    tier: 2
  },
  {
    word: 'abroad',
    ipa: '/əˈbrɔːd/',
    pos: 'adv',
    meaningVi: 'ở nước ngoài, ra nước ngoài',
    definitionEn: 'in or to a foreign country or countries',
    vocabType: 'general',
    collocations: ['study abroad', 'travel abroad', 'work abroad'],
    exampleSentence: 'Many high school graduates aspire to study ______ at prestigious universities.',
    topic: 'geography',
    tier: 2
  }
];

const sampleLessons = [
  {
    key: 'g-l0-numbers',
    title: 'Understanding and Saying Numbers',
    skill: 'grammar',
    level: 0,
    topic: 'numbers',
    orderIndex: 1,
    prerequisiteKeys: [],
    contentMarkdown: `## Mục tiêu
- Nắm vững quy tắc phát âm, phân biệt đuôi âm -teen và -ty, và cách ghép các con số lớn trong tiếng Anh.
- Tránh lỗi nghe và ghi sai số điện thoại, giá tiền, số liệu trong IELTS Listening Section 1 và Academic Writing Task 1.

## Lý thuyết
1. **Quy tắc nối số hàng chục và đơn vị:** Sử dụng dấu gạch nối (hyphen) cho các số từ 21 đến 99: *twenty-one*, *thirty-five*, *ninety-nine*.
2. **Quy tắc hàng trăm và hàng nghìn:**
   - Thêm liên từ *and* giữa hàng trăm và hàng chục trong tiếng Anh-Anh: *350 = three hundred and fifty*.
   - Các từ *hundred*, *thousand*, *million* không thêm đuôi "s" khi đứng sau một con số cụ thể (*two thousand*, KHÔNG viết *two thousands*).
3. **Cặp âm bẫy nghe -teen vs -ty:**
   - Đuôi **-teen** nhận trọng âm chính, nguyên âm dài /iːn/: *fourteen* /ˌfɔːˈtiːn/, *fifteen* /ˌfɪfˈtiːn/.
   - Đuôi **-ty** không nhận trọng âm, nguyên âm ngắn dứt khoát /ti/: *forty* /ˈfɔː.ti/, *fifty* /ˈfɪf.ti/.

## Ví dụ
- **Đúng:** *There were approximately three hundred and forty students at the seminar.*
- **Sai:** *There were approximately three hundreds and forty students...* (Thêm 's' vào hundred sau số đếm).

## Lỗi thường gặp
- **Nhầm lẫn số 13, 14, 15 với 30, 40, 50:** Thí sinh hay bỏ quên trọng âm đuôi *-teen*, dẫn đến viết nhầm số liệu trong bài nghe IELTS Listening Section 1.

## Mẹo thi IELTS
- Trong IELTS Listening Section 1, nếu đáp án yêu cầu điền số, bạn nên viết dưới dạng ký tự số (*50* thay vì *fifty*) để tiết kiệm thời gian và tránh lỗi chính tả.`
  },
  {
    key: 'l-l0-telling-time',
    title: 'Telling the Time',
    skill: 'listening',
    level: 0,
    topic: 'daily-life',
    orderIndex: 2,
    prerequisiteKeys: ['g-l0-numbers'],
    contentMarkdown: `## Mục tiêu
- Sử dụng chính xác hai hệ thống nói giờ trong tiếng Anh: Giờ thông thường (past/to) và giờ điện tử (digital).
- Bắt kịp các mốc thời gian lịch hẹn, giờ tàu xe trong IELTS Listening Section 1.

## Lý thuyết
1. **Cách nói theo phân đoạn phút:**
   - Phút 1 đến 30: Dùng **past** (*10:15 = quarter past ten*, *10:30 = half past ten*).
   - Phút 31 đến 59: Dùng **to** (*10:45 = quarter to eleven*, *10:50 = ten to eleven*).
2. **Cách nói giờ điện tử:** Số giờ + số phút (*10:15 = ten fifteen*).
3. **Mốc đặc biệt:** *midday / noon* (12h trưa), *midnight* (12h đêm), *o'clock* (chỉ dùng cho giờ chẵn).

## Ví dụ
- **Đúng:** *The flight departs at a quarter to eight in the morning.*
- **Sai:** *The flight departs at quarter to eight o'clock.*

## Mẹo thi IELTS
- Trong Section 1, người nói thường đưa ra một mốc giờ trước rồi đính chính bằng *\"Actually, let's make it...\"*. Chờ người nói chốt câu mới điền đáp án.`
  },
  {
    key: 'r-l0-days-dates',
    title: 'Days, Months and Dates',
    skill: 'reading',
    level: 0,
    topic: 'daily-life',
    orderIndex: 3,
    prerequisiteKeys: ['g-l0-numbers'],
    contentMarkdown: `## Mục tiêu
- Nắm vững cách viết, đọc và kết hợp giới từ chỉ thứ trong tuần, tháng trong năm và số thứ tự ngày tháng.

## Lý thuyết
1. **Viết hoa bắt buộc:** Thứ và tháng luôn luôn viết hoa chữ cái đầu (*Monday*, *July*).
2. **Số thứ tự:** 1st, 2nd, 3rd, 21st, 22nd, 23rd; các số còn lại dùng đuôi -th (4th, 5th, 12th).
3. **Giới từ:** Đi với thứ hoặc ngày cụ thể dùng **on** (*on Tuesday*, *on the 15th of May*); đi với tháng/năm/mùa dùng **in** (*in July*, *in 2024*).

## Mẹo thi IELTS
- Ghi ngày tháng an toàn nhất trong bài nghe: *21 May* hoặc *May 21st*.`
  },
  {
    key: 'w-l0-countries-nationalities',
    title: 'Countries and Nationalities',
    skill: 'writing',
    level: 0,
    topic: 'geography',
    orderIndex: 4,
    prerequisiteKeys: [],
    contentMarkdown: `## Mục tiêu
- Phân biệt danh từ quốc gia (Country), tính từ quốc tịch (Nationality) và ngôn ngữ (Language).

## Lý thuyết
1. **Viết hoa:** Tên nước, quốc tịch và ngôn ngữ đều phải viết hoa chữ cái đầu (*Japan*, *Japanese*, *English*).
2. **Hậu tố phổ biến:** -an/-ian (Brazilian, Canadian), -ish (British, Spanish), -ese (Japanese, Vietnamese).
3. **Cấu trúc:** *I come from Vietnam* (Country) vs *I am Vietnamese* (Nationality).

## Mẹo thi IELTS
- Biến đổi linh hoạt giữa tên nước và tính từ quốc tịch (*consumption in France* -> *French consumption*) giúp đạt điểm Lexical Resource trong Task 1.`
  }
];

const sampleQuestions = [
  {
    lessonKey: 'g-l0-numbers',
    vocabWord: 'thousand',
    type: 'choice',
    prompt: 'Choose the grammatically correct sentence to report survey figures:',
    options: [
      'There were two thousands people in the audience.',
      'There were two thousand people in the audience.',
      'There were two thousand of people in the audience.',
      'There were two thousands of people in the audience.'
    ],
    correctAnswer: 'There were two thousand people in the audience.',
    explanation: 'When preceded by an exact number (two, three...), words like hundred and thousand stay in singular form without s and do not take of.',
    errorTaxonomy: 'ERR_SYN'
  },
  {
    lessonKey: 'g-l0-numbers',
    vocabWord: 'million',
    type: 'cloze',
    prompt: 'Write the missing word: The city spends over eight ______ dollars annually on public transport.',
    options: [],
    correctAnswer: 'million',
    explanation: 'million follows the exact number eight and remains in the singular form.',
    errorTaxonomy: 'ERR_LEX'
  },
  {
    lessonKey: 'l-l0-telling-time',
    vocabWord: 'quarter',
    type: 'choice',
    prompt: "The speaker says: 'The bus will leave at a quarter to five.' What time is it?",
    options: ['5:15', '4:45', '5:45', '4:15'],
    correctAnswer: '4:45',
    explanation: "'Quarter to five' means 15 minutes before 5:00, which corresponds to 4:45.",
    errorTaxonomy: 'ERR_LEX'
  },
  {
    lessonKey: 'l-l0-telling-time',
    vocabWord: 'midnight',
    type: 'choice',
    prompt: "Which preposition correctly completes: 'The museum closes ______ midnight.'?",
    options: ['in', 'on', 'at', 'by the'],
    correctAnswer: 'at',
    explanation: "Specific clock times and points of the day (midnight, midday, noon) take the preposition 'at'.",
    errorTaxonomy: 'ERR_SYN'
  },
  {
    lessonKey: 'r-l0-days-dates',
    vocabWord: null,
    type: 'choice',
    prompt: 'Select the sentence with correct capitalization and preposition:',
    options: [
      'The exam will be held in wednesday morning.',
      'The exam will be held on Wednesday morning.',
      'The exam will be held on wednesday morning.',
      'The exam will be held at Wednesday morning.'
    ],
    correctAnswer: 'The exam will be held on Wednesday morning.',
    explanation: "Days of the week must always be capitalized (Wednesday) and take the preposition 'on'.",
    errorTaxonomy: 'ERR_SYN'
  },
  {
    lessonKey: 'w-l0-countries-nationalities',
    vocabWord: 'nationality',
    type: 'choice',
    prompt: 'Select the correct sentence distinguishing country from nationality:',
    options: [
      'She comes from Spanish and speaks Spain.',
      'She comes from Spain and speaks Spanish.',
      'She comes from Spain and speaks Spain.',
      'She is from Spaniard and her nationality is Spain.'
    ],
    correctAnswer: 'She comes from Spain and speaks Spanish.',
    explanation: "'Spain' is the country noun (following from), and 'Spanish' is the language/nationality adjective.",
    errorTaxonomy: 'ERR_LEX'
  },
  {
    lessonKey: 'w-l0-countries-nationalities',
    vocabWord: 'abroad',
    type: 'cloze',
    prompt: 'Complete the sentence: After graduation, David decided to study ______ in the United Kingdom.',
    options: [],
    correctAnswer: 'abroad',
    explanation: "'study abroad' is a standard collocation meaning to study in a foreign country.",
    errorTaxonomy: 'ERR_LEX'
  }
];

const importCurriculum = async () => {
  try {
    console.log('[Import] Connecting to MongoDB database...');
    await connectDB();

    console.log('[Import] Step 1: Upserting Vocabulary items...');
    const vocabMap = new Map();
    for (const v of sampleVocabulary) {
      const doc = await Vocabulary.findOneAndUpdate(
        { word: v.word },
        { $set: v },
        { upsert: true, new: true }
      );
      vocabMap.set(v.word, doc._id);
    }
    console.log(`[Import] Seeded ${vocabMap.size} vocabulary items.`);

    console.log('[Import] Step 2a: Creating/updating Lessons...');
    const lessonKeyToId = new Map();
    for (const l of sampleLessons) {
      const doc = await Lesson.findOneAndUpdate(
        { title: l.title },
        {
          $set: {
            title: l.title,
            skill: l.skill,
            level: l.level,
            topic: l.topic,
            orderIndex: l.orderIndex,
            contentMarkdown: l.contentMarkdown,
            status: 'published'
          }
        },
        { upsert: true, new: true }
      );
      lessonKeyToId.set(l.key, doc._id);
    }

    console.log('[Import] Step 2b: Linking DAG prerequisites...');
    for (const l of sampleLessons) {
      const prereqIds = (l.prerequisiteKeys || [])
        .map(k => lessonKeyToId.get(k))
        .filter(Boolean);

      await Lesson.findByIdAndUpdate(lessonKeyToId.get(l.key), {
        $set: { prerequisites: prereqIds }
      });
    }
    console.log(`[Import] Connected ${lessonKeyToId.size} lessons on DAG prerequisite tree.`);

    console.log('[Import] Step 3: Inserting Practice Questions with Vocab linkage...');
    let questionCount = 0;
    for (const q of sampleQuestions) {
      const lessonId = lessonKeyToId.get(q.lessonKey);
      const vocabId = q.vocabWord ? vocabMap.get(q.vocabWord) : null;

      if (lessonId) {
        // Delete any existing identical question to avoid duplication on re-run
        await Question.deleteMany({ lessonId, prompt: q.prompt });
        await Question.create({
          lessonId,
          vocabId,
          type: q.type,
          prompt: q.prompt,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          errorTaxonomy: q.errorTaxonomy
        });
        questionCount++;
      }
    }
    console.log(`[Import] Successfully linked ${questionCount} questions to lessons.`);

    console.log('[Import] COMPLETED SUCCESSFULLY! Database is ready for learning missions.');
    process.exit(0);
  } catch (err) {
    console.error('[Import Error]:', err);
    process.exit(1);
  }
};

importCurriculum();
