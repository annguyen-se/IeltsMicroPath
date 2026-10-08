const Vocabulary = require('../models/Vocabulary');
const Lesson = require('../models/Lesson');
const Question = require('../models/Question');

const foundationalVocab = [
  {
    word: 'mitigate',
    ipa: '/ˈmɪt.ɪ.ɡeɪt/',
    pos: 'verb',
    meaningVi: 'làm giảm bớt, làm dịu bớt',
    definitionEn: 'to make something less harmful, unpleasant, or bad',
    exampleSentence: 'Governments must act swiftly to ______ environmental damage.',
    topic: 'environment',
    tier: 3,
    media: {
      type: 'audio',
      provider: 'cloudinary',
      url: 'https://res.cloudinary.com/ieltstrain/audio/mitigate.mp3',
      duration: 2
    }
  },
  {
    word: 'ubiquitous',
    ipa: '/juːˈbɪk.wə.təs/',
    pos: 'adj',
    meaningVi: 'có mặt ở khắp nơi, phổ biến',
    definitionEn: 'seeming to be everywhere',
    exampleSentence: 'Smartphones have become ______ in modern society.',
    topic: 'technology',
    tier: 4,
    media: {
      type: 'audio',
      provider: 'cloudinary',
      url: 'https://res.cloudinary.com/ieltstrain/audio/ubiquitous.mp3',
      duration: 2
    }
  },
  {
    word: 'accommodate',
    ipa: '/əˈkɒm.ə.deɪt/',
    pos: 'verb',
    meaningVi: 'cung cấp chỗ ở, đáp ứng nhu cầu',
    definitionEn: 'to provide with a place to live or to fit in with the wishes of someone',
    exampleSentence: 'The new hotel can ______ up to 500 guests comfortably.',
    topic: 'travel',
    tier: 2,
    media: {
      type: 'audio',
      provider: 'cloudinary',
      url: 'https://res.cloudinary.com/ieltstrain/audio/accommodate.mp3',
      duration: 2
    }
  },
  {
    word: 'beneficial',
    ipa: '/ˌben.ɪˈfɪʃ.əl/',
    pos: 'adj',
    meaningVi: 'có lợi, có ích',
    definitionEn: 'helpful, useful, or good',
    exampleSentence: 'Regular exercise is highly ______ to cardiovascular health.',
    topic: 'health',
    tier: 1,
    media: {
      type: 'audio',
      provider: 'cloudinary',
      url: 'https://res.cloudinary.com/ieltstrain/audio/beneficial.mp3',
      duration: 2
    }
  },
  {
    word: 'consequence',
    ipa: '/ˈkɒn.sɪ.kwəns/',
    pos: 'noun',
    meaningVi: 'hậu quả, kết quả',
    definitionEn: 'a result of a particular action or situation',
    exampleSentence: 'Failing to prepare will lead to severe ______ in the exam.',
    topic: 'education',
    tier: 2,
    media: {
      type: 'audio',
      provider: 'cloudinary',
      url: 'https://res.cloudinary.com/ieltstrain/audio/consequence.mp3',
      duration: 2
    }
  }
];

const seedInitialData = async () => {
  try {
    const vocabCount = await Vocabulary.countDocuments();
    if (vocabCount === 0) {
      console.log('[Seed] Seeding foundational vocabulary items...');
      await Vocabulary.insertMany(foundationalVocab);
      console.log(`[Seed] Seeded ${foundationalVocab.length} vocabulary items.`);
    }

    const lessonCount = await Lesson.countDocuments();
    if (lessonCount === 0) {
      console.log('[Seed] Seeding foundational phonetics lessons...');

      const lesson1 = await Lesson.create({
        title: 'Minimal Pairs: /iː/ vs /ɪ/',
        skill: 'phonetics',
        level: 0,
        topic: 'vowels',
        orderIndex: 1,
        contentMarkdown: `### Âm /iː/ dài và /ɪ/ ngắn trong tiếng Anh\n\n- **/iː/** là âm kéo dài, khẩu hình cười nhẹ: *sheep*, *sleep*, *eat*.\n- **/ɪ/** là âm ngắn, bật dứt khoát: *ship*, *slip*, *it*.\n\nNhận diện đúng 2 âm này giúp bạn tránh nhầm lẫn tai hại trong IELTS Listening Section 1.`,
        media: {
          type: 'audio',
          provider: 'cloudinary',
          url: 'https://res.cloudinary.com/ieltstrain/audio/lesson1_vowels.mp3',
          duration: 35
        }
      });

      // Add questions for Lesson 1
      await Question.create([
        {
          lessonId: lesson1._id,
          type: 'choice',
          prompt: 'Từ nào sau đây chứa nguyên âm dài /iː/?',
          options: ['Ship', 'Sheep', 'Fit', 'Sit'],
          correctAnswer: 'Sheep',
          explanation: "'Sheep' phát âm là /ʃiːp/ với nguyên âm dài, trong khi 'Ship' là /ʃɪp/ với nguyên âm ngắn.",
          errorTaxonomy: 'ERR_PHO'
        },
        {
          lessonId: lesson1._id,
          type: 'cloze',
          prompt: 'Điền từ còn thiếu: The captain steered the large s____ into the harbor. (con tàu)',
          correctAnswer: 'ship',
          explanation: "'Ship' nghĩa là con tàu, phát âm là /ʃɪp/.",
          errorTaxonomy: 'ERR_LEX'
        }
      ]);

      const lesson2 = await Lesson.create({
        title: 'Minimal Pairs: /æ/ vs /e/',
        skill: 'phonetics',
        level: 0,
        topic: 'vowels',
        orderIndex: 2,
        prerequisites: [lesson1._id], // Dependent on Lesson 1!
        contentMarkdown: `### Phân biệt âm /æ/ bẹt và âm /e/ ngắn\n\n- **/æ/** miệng mở rộng, hàm hạ thấp: *bad*, *cat*, *man*.\n- **/e/** miệng mở vừa phải, đầu lưỡi chạm chân răng dưới: *bed*, *get*, *men*.\n\nLỗi thường gặp là người Việt hay phát âm /æ/ thành /e/, dẫn đến nghe nhầm 'man' thành 'men'.`
      });

      await Question.create({
        lessonId: lesson2._id,
        type: 'choice',
        prompt: 'Từ nào có âm /æ/ (miệng mở rộng)?',
        options: ['Bed', 'Bad', 'Pen', 'Ten'],
        correctAnswer: 'Bad',
        explanation: "'Bad' phát âm là /bæd/.",
        errorTaxonomy: 'ERR_PHO'
      });

      console.log('[Seed] Seeded foundational Level 0 lessons and questions with DAG linkage.');
    }
  } catch (err) {
    console.error('[Seed Error]', err.message);
  }
};

module.exports = seedInitialData;
