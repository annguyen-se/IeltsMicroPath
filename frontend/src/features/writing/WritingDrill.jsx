/* Hallmark · macrostructure: Workbench · tone: editorial · anchor hue: 44 */
/* Hallmark · genre: editorial · macrostructure: Workbench · design-system: design.md · designed-as-app */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/apiClient';
import {
  PenLine,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookCheck,
  Bot,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  LayoutGrid,
  AlertTriangle,
  Send,
  BookOpen,
  FolderOpen
} from 'lucide-react';

const WRITING_TOPICS = [
  { key: 'all', label: 'Tất cả chủ đề (General Academic)' },
  { key: 'technology', label: 'Technology & AI (Khoa học & Trí tuệ nhân tạo)' },
  { key: 'environment', label: 'Environment & Climate (Môi trường & Biến đổi khí hậu)' },
  { key: 'education', label: 'Education & Schools (Giáo dục & Học đường)' },
  { key: 'work', label: 'Work & Employment (Việc làm & Sự nghiệp)' },
  { key: 'society', label: 'Society & Family (Xã hội & Gia đình)' },
  { key: 'health', label: 'Health & Lifestyle (Sức khỏe & Đời sống)' },
  { key: 'crime', label: 'Crime & Law (Tội phạm & Pháp luật)' },
  { key: 'transport', label: 'Transport & Cities (Giao thông & Đô thị)' },
  { key: 'culture', label: 'Arts, Sports & Leisure (Văn hóa, Thể thao & Nghệ thuật)' },
  { key: 'economy', label: 'Money & Economy (Kinh tế & Tiêu dùng)' },
  { key: 'history', label: 'History & Heritage (Lịch sử & Di sản)' },
];

const TOPIC_PROMPTS = {
  technology: {
    task1: {
      'line-graph': 'The line graph below shows internet access rates and smartphone ownership across five countries between 2005 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      'bar-chart': 'The bar chart compares research and development spending in artificial intelligence by tech corporations across four regions in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      'pie-chart': 'The pie charts illustrate the proportion of online activities (social media, streaming, remote work, shopping) conducted by teenagers in 2010 and 2020.',
      'table': 'The table shows data on global artificial intelligence adoption rates across six business sectors in 2022 and 2024.',
      'process': 'The diagram illustrates the technical process of training, fine-tuning, and deploying a large language model.',
      'map': 'The two plans depict changes to a tech campus and innovation hub between 2015 and the present day.',
      'mixed': 'The bar chart shows computer sales while the pie chart demonstrates customer service satisfaction rates across three electronics brands.'
    },
    task2: {
      'opinion': 'Some people believe that artificial intelligence will replace most white-collar jobs within the next two decades. To what extent do you agree or disagree with this statement?',
      'discussion': 'Some people think that automated algorithms and robots will bring tremendous prosperity to human society, while others fear they will cause widespread unemployment and inequality. Discuss both views and give your opinion.',
      'advantages-disadvantages': 'An increasing number of companies allow employees to work entirely remotely using digital communication tools. Do the advantages of this trend outweigh the disadvantages?',
      'problem-solution': 'Digital screen addiction and excessive social media usage are creating severe mental health issues among young teenagers. What are the primary causes of this phenomenon, and what measures can parents and schools take to address it?',
      'two-part': 'Many traditional physical shops are closing as consumers switch to online e-commerce platforms. Why is this occurring? Is this a positive or negative development for communities?'
    }
  },
  environment: {
    task1: {
      'line-graph': 'The line graph shows renewable energy generation (solar, wind, hydroelectric) in Europe from 2000 to 2024. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      'bar-chart': 'The bar chart compares annual greenhouse gas emissions by sector (transport, industry, agriculture, households) in four countries in 2022.',
      'pie-chart': 'The pie charts show the sources of municipal electricity generation in a European nation in 1990 and 2020.',
      'table': 'The table provides data on recycling rates for municipal solid waste in six metropolitan cities between 2010 and 2020.',
      'process': 'The diagram illustrates the process of geothermal power generation from subterranean superheated water to electrical grid transmission.',
      'map': 'The maps illustrate the reforestation and flood defense redevelopment of a coastal estuary between 2005 and 2025.',
      'mixed': 'The line graph displays plastic waste generation while the bar chart shows municipal recycling rates in five nations.'
    },
    task2: {
      'opinion': 'The only way to solve global environmental problems is for individuals to dramatically alter their daily consumption habits. To what extent do you agree or disagree?',
      'discussion': 'Some people believe governments should enforce strict environmental regulations and carbon taxes on businesses, while others argue that technological innovation alone can resolve climate change. Discuss both views and give your opinion.',
      'advantages-disadvantages': 'Many governments are investing heavily in nuclear energy as an alternative to fossil fuels. Do the advantages of nuclear energy outweigh the disadvantages?',
      'problem-solution': 'Deforestation and habitat destruction are accelerating the extinction of thousands of plant and animal species worldwide. What are the main causes of this loss, and what solutions can international organizations implement?',
      'two-part': 'Global warming is resulting in more frequent extreme weather events around the world. Why is this problem proving so difficult to resolve? What actions should governments prioritize?'
    }
  },
  education: {
    task1: {
      'line-graph': 'The line graph shows university enrollment rates among young adults aged 18-24 in three countries between 1995 and 2020.',
      'bar-chart': 'The bar chart compares educational attainment levels between men and women across four academic fields in 2022.',
      'pie-chart': 'The pie charts compare government expenditure on primary, secondary, and higher education in 2000 and 2020.',
      'table': 'The table displays student-teacher ratios and average exam scores in public versus private schools across five regions.',
      'process': 'The diagram shows the multi-stage admission and scholarship evaluation process at an international university.',
      'map': 'The two maps show the expansion of a university campus library and student accommodation complex between 2012 and 2022.',
      'mixed': 'The bar chart shows graduate employment rates while the pie chart breaks down graduates by chosen degree subject.'
    },
    task2: {
      'opinion': 'University education should be completely free of charge for all eligible citizens regardless of their financial background. To what extent do you agree or disagree?',
      'discussion': 'Some people argue that schools should focus exclusively on academic subjects like mathematics and science, while others believe non-academic courses such as music, art, and physical education are equally essential. Discuss both views and give your opinion.',
      'advantages-disadvantages': 'More universities are delivering entire degree qualifications online without requiring physical campus attendance. Do the advantages of online higher education outweigh the disadvantages?',
      'problem-solution': 'Many secondary school students feel overwhelmed by academic stress and competitive examinations. What factors contribute to this pressure, and what can educational institutions do to support students?',
      'two-part': 'Fewer young people are pursuing degrees in science, technology, engineering, and mathematics (STEM). Why is this happening? What consequences will this have on national development?'
    }
  },
  work: {
    task1: {
      'line-graph': 'The line graph shows unemployment rates among graduates and non-graduates in an OECD country from 2008 to 2024.',
      'bar-chart': 'The bar chart compares the average working hours per week across five industrial sectors in 2023.',
      'pie-chart': 'The pie charts illustrate the percentage of workers employed in agriculture, manufacturing, and service industries in 1970 and 2020.',
      'table': 'The table details average starting salaries and career promotion timelines for seven professional occupations in 2022.',
      'process': 'The flow-chart outlines the corporate recruitment, interview, and probation assessment cycle for new employees.',
      'map': 'The plans show the layout reconfiguration of a corporate office building to facilitate hot-desking and open collaborative spaces.',
      'mixed': 'The bar chart shows employee job satisfaction levels while the pie chart depicts remote vs office working arrangements.'
    },
    task2: {
      'opinion': 'Young professionals should prioritize career advancement and high salaries over maintaining a healthy work-life balance. To what extent do you agree or disagree?',
      'discussion': 'Some people believe working for the same company for their entire career offers the best security, while others argue that frequently changing employers provides better opportunities and skills. Discuss both views and give your opinion.',
      'advantages-disadvantages': 'Many businesses have adopted a four-day working week with no reduction in employee pay. Do the advantages of a four-day work week outweigh the disadvantages?',
      'problem-solution': 'Workplace burnout and chronic occupational stress are becoming increasingly prevalent in modern corporate environments. What are the causes of this trend, and what steps should employers take to prevent it?',
      'two-part': 'Retirement ages are rising in many developed countries around the world. Why is this occurring? Do you consider this a positive or negative development for society?'
    }
  },
  society: {
    task1: {
      'line-graph': 'The line graph illustrates average life expectancy and median marriage ages in a developed country from 1950 to 2020.',
      'bar-chart': 'The bar chart shows household sizes and single-person residences in five nations in 2023.',
      'pie-chart': 'The pie charts compare household expenditure categories (housing, food, childcare, healthcare) in 1980 and 2020.',
      'table': 'The table displays demographic statistics including birth rates, median age, and dependency ratios in four continents.',
      'process': 'The flow-chart illustrates the lifecycle and operational phases of community social welfare support programs.',
      'map': 'The two maps show the redevelopment of a suburban community center and park facilities over a 15-year period.',
      'mixed': 'The bar chart shows marriage rates while the pie chart illustrates divorce rates by age demographic.'
    },
    task2: {
      'opinion': 'In modern society, elderly citizens should be cared for by government institutions rather than relying on their families. To what extent do you agree or disagree?',
      'discussion': 'Some people believe that increasing urbanization and modern lifestyles are weakening traditional family bonds, while others feel that technology helps families stay closer than ever. Discuss both views and give your opinion.',
      'advantages-disadvantages': 'An increasing number of adults are choosing to live alone in single-person households. Do the advantages of living alone outweigh the disadvantages?',
      'problem-solution': 'Economic inequality between the wealthiest and poorest members of society has widened substantially in recent decades. What problems does this disparity create, and what solutions can governments introduce?',
      'two-part': 'The proportion of elderly citizens is expanding rapidly in many countries while birth rates decline. Why is this demographic shift taking place? What challenges does it present for public services?'
    }
  },
  health: {
    task1: {
      'line-graph': 'The line graph shows obesity rates among children and adults in three countries from 1990 to 2020.',
      'bar-chart': 'The bar chart compares daily physical activity levels across different age demographics in 2023.',
      'pie-chart': 'The pie charts display the breakdown of dietary calorie intake from fats, carbohydrates, proteins, and sugars in 1970 and 2010.',
      'table': 'The table shows public healthcare spending per capita and average life expectancy across six nations.',
      'process': 'The diagram illustrates the production and quality assurance testing of pharmaceutical vaccines.',
      'map': 'The maps depict the renovation and expansion of a regional general hospital between 2008 and 2020.',
      'mixed': 'The bar chart shows fruit and vegetable consumption while the pie chart breaks down chronic lifestyle diseases.'
    },
    task2: {
      'opinion': 'Governments should impose a dedicated health tax on fast food and sugary beverages to discourage unhealthy dietary habits. To what extent do you agree or disagree?',
      'discussion': 'Some people believe individuals are solely responsible for their own personal physical fitness, while others argue that municipal authorities should provide free sports facilities and parks. Discuss both views and give your opinion.',
      'advantages-disadvantages': 'Many people now track their daily health, sleep patterns, and physical exercise using wearable digital smartwatches. Do the advantages of this technology outweigh the disadvantages?',
      'problem-solution': 'Sedentary desk lifestyles and poor dietary choices are contributing to a global surge in lifestyle diseases like type-2 diabetes and heart disease. What are the key causes of this epidemic, and how can communities combat it?',
      'two-part': 'Modern life expectancy has reached record highs in many countries, yet chronic illness is widespread. Why is this the case? What can individuals do to ensure longevity with high vitality?'
    }
  }
};

const TASK1_SUBTYPES = [
  { key: 'line-graph', label: '1. Line Graph (Biểu đồ đường)', defaultPrompt: 'The line graph below shows the changes in electricity consumption across three sectors between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.' },
  { key: 'bar-chart', label: '2. Bar Chart (Biểu đồ cột)', defaultPrompt: 'The bar chart illustrates the percentage of university graduates employed in four industries in 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.' },
  { key: 'pie-chart', label: '3. Pie Chart (Biểu đồ tròn)', defaultPrompt: 'The pie charts compare household spending on food, housing, transport, and leisure in 1980 and 2010. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.' },
  { key: 'table', label: '4. Table (Bảng số liệu)', defaultPrompt: 'The table displays demographic shifts and internet penetration rates in five countries. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.' },
  { key: 'process', label: '5. Process (Quy trình sản xuất)', defaultPrompt: 'The diagram illustrates the sequential stages involved in the commercial production of recycled paper. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.' },
  { key: 'map', label: '6. Map (Bản đồ thay đổi)', defaultPrompt: 'The two maps depict the planned redevelopment of a coastal industrial town between 2010 and the present day. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.' },
  { key: 'mixed', label: '7. Mixed Charts (Kết hợp 2 dạng)', defaultPrompt: 'The bar chart shows total car ownership while the pie chart demonstrates the breakdown by vehicle fuel type. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.' }
];

const TASK2_SUBTYPES = [
  { key: 'opinion', label: '1. Opinion (Agree / Disagree)', defaultPrompt: 'Some people believe that artificial intelligence will replace most white-collar jobs within the next two decades. To what extent do you agree or disagree with this statement?' },
  { key: 'discussion', label: '2. Discussion (Both Views)', defaultPrompt: 'Some people argue that universities should focus exclusively on providing specialized job skills, while others believe education should foster broader academic knowledge. Discuss both views and give your opinion.' },
  { key: 'advantages-disadvantages', label: '3. Advantages vs Disadvantages', defaultPrompt: 'In many countries, international tourism has become a primary driver of economic growth. Do the advantages of this trend outweigh the disadvantages?' },
  { key: 'problem-solution', label: '4. Problem / Cause & Solution', defaultPrompt: 'Traffic congestion in metropolitan centers has worsened significantly in recent years. What are the primary causes of this issue, and what solutions can governments implement?' },
  { key: 'two-part', label: '5. Two-part Question', defaultPrompt: 'Fewer young people are choosing careers in science and engineering. Why is this the case? What impact might this have on society in the future?' }
];

function IeltsEssayWorkbench({ isAuthenticated, onOpenAuth, lessons = [] }) {
  const [taskType, setTaskType] = useState('task2');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [subtypeKey, setSubtypeKey] = useState('opinion');
  const [selectedDbLessonId, setSelectedDbLessonId] = useState('');
  const [promptText, setPromptText] = useState('');
  const [essayText, setEssayText] = useState('');
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  const [timeLeft, setTimeLeft] = useState(2400);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [evalError, setEvalError] = useState('');

  const currentSubtypes = taskType === 'task1' ? TASK1_SUBTYPES : TASK2_SUBTYPES;
  const activeSubtype = currentSubtypes.find((s) => s.key === subtypeKey) || currentSubtypes[0];

  // Filter writing lessons available in DB for the selected topic
  const dbWritingLessons = useMemo(() => {
    return (lessons || []).filter((l) => {
      if (l.skill !== 'writing') return false;
      if (selectedTopic === 'all') return true;
      const tLower = (l.topic || '').toLowerCase();
      return tLower.includes(selectedTopic.toLowerCase());
    });
  }, [lessons, selectedTopic]);

  const resolvePrompt = (type, topic, subKey) => {
    if (topic !== 'all' && TOPIC_PROMPTS[topic]?.[type]?.[subKey]) {
      return TOPIC_PROMPTS[topic][type][subKey];
    }
    const list = type === 'task1' ? TASK1_SUBTYPES : TASK2_SUBTYPES;
    const found = list.find((s) => s.key === subKey);
    return found ? found.defaultPrompt : '';
  };

  useEffect(() => {
    const list = taskType === 'task1' ? TASK1_SUBTYPES : TASK2_SUBTYPES;
    setSubtypeKey(list[0].key);
    setSelectedDbLessonId('');
    setPromptText(resolvePrompt(taskType, selectedTopic, list[0].key));
    setTimeLeft(taskType === 'task1' ? 1200 : 2400);
    setIsTimerRunning(false);
    setEvalResult(null);
  }, [taskType]);

  useEffect(() => {
    if (selectedDbLessonId) return;
    setPromptText(resolvePrompt(taskType, selectedTopic, subtypeKey));
    setEvalResult(null);
  }, [selectedTopic, subtypeKey]);

  const handleSelectDbLesson = async (e) => {
    const lId = e.target.value;
    setSelectedDbLessonId(lId);
    if (!lId) {
      setPromptText(resolvePrompt(taskType, selectedTopic, subtypeKey));
      return;
    }
    try {
      const res = await api.get(`/lessons/${lId}`);
      if (res?.questions?.[0]?.prompt) {
        setPromptText(res.questions[0].prompt);
      } else if (res?.lesson?.title) {
        setPromptText(`IELTS Writing Task: "${res.lesson.title}". Discuss your viewpoint and support your response with relevant academic arguments and examples.`);
      }
    } catch (err) {
      console.warn('[Fetch DB Writing Prompt Error]:', err.message);
    }
  };

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const words = essayText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const minWords = taskType === 'task1' ? 150 : 250;
  const isEnoughWords = wordCount >= minWords;

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleEvaluate = async () => {
    if (!essayText.trim()) return;
    if (!isAuthenticated && onOpenAuth) {
      onOpenAuth();
      return;
    }

    setIsEvaluating(true);
    setEvalError('');
    try {
      const res = await api.post('/learning/essay-evaluate', {
        taskType,
        taskSubtype: activeSubtype.label,
        prompt: promptText,
        essayText
      });
      setEvalResult(res);
    } catch (err) {
      setEvalError(err.message || 'Lỗi khi chấm bài viết.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Task & Subtype Selector */}
      <div className="card" style={{ padding: 'var(--space-md)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn btn-sm ${taskType === 'task1' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTaskType('task1')}
              >
                Task 1: Academic Report (7 dạng · 150+ từ)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${taskType === 'task2' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTaskType('task2')}
              >
                Task 2: Academic Essay (5 dạng · 250+ từ)
              </button>
            </div>

            {/* Timer Controller */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="font-mono text-xs font-bold" style={{ color: timeLeft < 300 ? 'var(--color-brick)' : 'var(--color-ink)' }}>
                ⏱ {formatTimer(timeLeft)}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
              >
                {isTimerRunning ? 'Tạm dừng' : 'Bắt đầu tính giờ'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setTimeLeft(taskType === 'task1' ? 1200 : 2400);
                  setIsTimerRunning(false);
                }}
              >
                Đặt lại
              </button>
            </div>
          </div>

          {/* Topic Selector Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <label htmlFor="essay-topic-select" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
              <FolderOpen size={14} style={{ color: 'var(--color-accent)' }} />
              <span>Chủ đề (Topic):</span>
            </label>
            <select
              id="essay-topic-select"
              className="input-select"
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setSelectedDbLessonId('');
              }}
              style={{ flex: 1, minWidth: 260, fontSize: 13.5 }}
            >
              {WRITING_TOPICS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Database Prompts Selector if available */}
          {dbWritingLessons.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <label htmlFor="db-prompt-select" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                <BookOpen size={14} style={{ color: 'var(--color-moss)' }} />
                <span>Đề bài từ Database ({dbWritingLessons.length} bài):</span>
              </label>
              <select
                id="db-prompt-select"
                className="input-select"
                value={selectedDbLessonId}
                onChange={handleSelectDbLesson}
                style={{ flex: 1, minWidth: 260, fontSize: 13.5 }}
              >
                <option value="">-- Đề bài chuẩn ngân hàng đề thi IELTS --</option>
                {dbWritingLessons.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.title} (Level {l.level} · {l.topic})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <label htmlFor="subtype-select" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', whiteSpace: 'nowrap' }}>
              Dạng bài ({taskType === 'task1' ? '7 dạng Task 1' : '5 dạng Task 2'}):
            </label>
            <select
              id="subtype-select"
              className="input-select"
              value={subtypeKey}
              onChange={(e) => {
                setSubtypeKey(e.target.value);
                setSelectedDbLessonId('');
              }}
              style={{ flex: 1, minWidth: 260, fontSize: 13.5 }}
            >
              {currentSubtypes.map((st) => (
                <option key={st.key} value={st.key}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Prompt Card */}
      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="section-kicker" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
            {taskType === 'task1' ? 'IELTS WRITING TASK 1 QUESTION' : 'IELTS WRITING TASK 2 QUESTION'}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setIsEditingPrompt(!isEditingPrompt)}
            style={{ fontSize: 12 }}
          >
            {isEditingPrompt ? 'Lưu đề bài' : 'Tùy chỉnh đề bài'}
          </button>
        </div>

        {isEditingPrompt ? (
          <textarea
            className="input-text"
            rows={3}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            style={{ width: '100%', fontSize: 14 }}
          />
        ) : (
          <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, color: 'var(--color-ink)', margin: 0 }}>
            "{promptText}"
          </p>
        )}
      </div>

      {/* Essay Editor Area */}
      <div className="card-desk" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <label htmlFor="essay-input" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>
            Bài viết của bạn (Your Response):
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              className="font-mono text-xs font-bold"
              style={{
                color: isEnoughWords ? 'var(--color-moss)' : 'var(--color-brick)',
                background: isEnoughWords ? 'var(--color-moss-soft)' : 'var(--color-brick-soft)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {wordCount} / {minWords} từ {isEnoughWords ? '✓ Đạt chuẩn độ dài' : `(Thiếu ${minWords - wordCount} từ)`}
            </span>
          </div>
        </div>

        <textarea
          id="essay-input"
          className="input-text"
          rows={14}
          placeholder={`Nhập bài viết ${taskType === 'task1' ? 'Task 1 (tối thiểu 150 từ)' : 'Task 2 (tối thiểu 250 từ)'} của bạn vào đây...`}
          value={essayText}
          onChange={(e) => setEssayText(e.target.value)}
          style={{
            width: '100%',
            fontSize: 14.5,
            padding: 'var(--space-md)',
            lineHeight: 1.6,
            fontFamily: 'var(--font-body)',
            resize: 'vertical'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
          {evalError && <span style={{ color: 'var(--color-brick)', fontSize: 12 }}>{evalError}</span>}
          <button
            type="button"
            className="btn btn-primary"
            disabled={isEvaluating || wordCount === 0}
            onClick={handleEvaluate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Send size={14} />
            <span>{isEvaluating ? 'Đang chấm theo 4 tiêu chí...' : 'Chấm điểm Band Score & 4 tiêu chí'}</span>
          </button>
        </div>
      </div>

      {/* 4 Band Descriptors Evaluation Result Banner */}
      {evalResult && (
        <div className="card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-rule)', paddingBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <span className="section-kicker" style={{ color: 'var(--color-moss)', fontWeight: 700 }}>
                KẾT QUẢ ĐÁNH GIÁ CHUẨN IELTS BAND DESCRIPTORS
              </span>
              <h3 style={{ fontSize: 18, margin: '4px 0 0', fontWeight: 700 }}>
                Điểm ước lượng: Band {evalResult.overallBand}
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="font-mono text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                Band {evalResult.overallBand}
              </div>
              <span style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>
                {evalResult.wordCount} từ · {evalResult.paragraphCount} đoạn văn
              </span>
            </div>
          </div>

          {/* 4 Criteria Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
            {Object.entries(evalResult.criteria || {}).map(([key, crit]) => (
              <div
                key={key}
                style={{
                  background: 'var(--color-paper-2)',
                  border: '1px solid var(--color-rule)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-md)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-ink)' }}>{crit.label}</span>
                  <span className="font-mono text-xs font-bold" style={{ color: 'var(--color-accent)' }}>
                    Band {crit.score}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', margin: 0, lineHeight: 1.45 }}>
                  {crit.feedback}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WritingDrill(props) {
  const isAuthenticated = props?.isAuthenticated || false;
  const onOpenAuth = props?.onOpenAuth;
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [selectedGroupKey, setSelectedGroupKey] = useState('all');
  const [practiceMode, setPracticeMode] = useState('type'); // 'type' | 'reorder' | 'essay'

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userSentence, setUserSentence] = useState('');
  const [selectedChunks, setSelectedChunks] = useState([]);
  const [availableChunks, setAvailableChunks] = useState([]);
  const [checkResult, setCheckResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // 1. Fetch Writing Lessons dynamically
  useEffect(() => {
    fetchWritingLessons();
  }, []);

  const fetchWritingLessons = async () => {
    setLoading(true);
    try {
      const lessonsRes = await api.get('/lessons?skill=writing');
      const list = lessonsRes?.lessons || [];
      setLessons(list);
      if (list.length > 0) {
        setSelectedLessonId(list[0]._id);
      }
    } catch (err) {
      console.warn('[Fetch Writing Lessons Warning]:', err.message);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  // Extract distinct topics dynamically from writing lessons
  const availableTopics = useMemo(() => {
    const counts = {};
    lessons.forEach((l) => {
      const top = l.topic || 'General Academic';
      counts[top] = (counts[top] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => a.topic.localeCompare(b.topic));
  }, [lessons]);

  // Lessons filtered by chosen topic
  const filteredLessons = useMemo(() => {
    if (selectedTopic === 'all') return lessons;
    return lessons.filter((l) => (l.topic || 'General Academic') === selectedTopic);
  }, [lessons, selectedTopic]);

  const handleSelectTopic = (top) => {
    setSelectedTopic(top);
    const matching = top === 'all' ? lessons : lessons.filter((l) => (l.topic || 'General Academic') === top);
    if (matching.length > 0) {
      setSelectedLessonId(matching[0]._id);
    } else {
      setSelectedLessonId('');
    }
  };

  // 2. Fetch Questions when selected lesson changes
  useEffect(() => {
    if (!selectedLessonId) {
      setQuestions([]);
      return;
    }
    fetchQuestionsForLesson(selectedLessonId);
  }, [selectedLessonId]);

  const fetchQuestionsForLesson = async (lessonId) => {
    setLoadingQuestions(true);
    try {
      const detailRes = await api.get(`/lessons/${lessonId}`);
      const qs = detailRes?.questions || [];
      setQuestions(qs);
      setCurrentIndex(0);
      setSelectedGroupKey('all');
    } catch (err) {
      console.warn('[Fetch Writing Questions Warning]:', err.message);
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Extract distinct grammar groups dynamically from question metadata
  const grammarGroups = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    const map = new Map();
    questions.forEach((q) => {
      const g = q.metadata?.groupTitleEn || q.metadata?.groupTitleVi || q.metadata?.category || q.topic;
      if (g) {
        map.set(g, (map.get(g) || 0) + 1);
      }
    });

    if (map.size === 0) return [];
    return [
      { key: 'all', label: `Tất cả cấu trúc (${questions.length} câu)` },
      ...Array.from(map.entries()).map(([k, count]) => ({
        key: k,
        label: `${k} (${count} câu)`
      }))
    ];
  }, [questions]);

  // Filter questions dynamically
  const filteredQuestions = useMemo(() => {
    if (selectedGroupKey === 'all' || !selectedGroupKey) return questions;
    return questions.filter((q) => {
      const g = q.metadata?.groupTitleEn || q.metadata?.groupTitleVi || q.metadata?.category || q.topic;
      return g === selectedGroupKey;
    });
  }, [questions, selectedGroupKey]);

  const currentQ = filteredQuestions[currentIndex] || null;

  // Reset state when current question or mode changes
  useEffect(() => {
    setUserSentence('');
    setCheckResult(null);

    if (currentQ?.options && Array.isArray(currentQ.options)) {
      const shuffled = [...currentQ.options].sort(() => Math.random() - 0.5);
      setAvailableChunks(shuffled);
      setSelectedChunks([]);
    } else {
      setAvailableChunks([]);
      setSelectedChunks([]);
    }
  }, [currentIndex, selectedGroupKey, practiceMode]);

  // Handle reorder chunk selection
  const handleSelectChunk = (chunk, idx) => {
    const nextAvailable = [...availableChunks];
    nextAvailable.splice(idx, 1);
    setAvailableChunks(nextAvailable);

    const nextSelected = [...selectedChunks, chunk];
    setSelectedChunks(nextSelected);
    setUserSentence(nextSelected.join(' '));
  };

  const handleDeselectChunk = (chunk, idx) => {
    const nextSelected = [...selectedChunks];
    nextSelected.splice(idx, 1);
    setSelectedChunks(nextSelected);

    setAvailableChunks([...availableChunks, chunk]);
    setUserSentence(nextSelected.join(' '));
  };

  const handleResetReorder = () => {
    if (currentQ?.options) {
      setAvailableChunks([...currentQ.options].sort(() => Math.random() - 0.5));
      setSelectedChunks([]);
      setUserSentence('');
      setCheckResult(null);
    }
  };

  // Check sentence translation via API
  const handleCheckAnswer = async () => {
    if (!currentQ || !userSentence.trim()) return;

    if (!isAuthenticated && onOpenAuth) {
      onOpenAuth();
      return;
    }

    setIsChecking(true);
    try {
      const res = await api.post('/learning/writing-check', {
        questionId: currentQ._id,
        userSentence
      });
      setCheckResult(res);
    } catch (err) {
      // Fallback local comparison
      const cleanUser = userSentence.trim().toLowerCase().replace(/[^\w\s]/g, '');
      const cleanTarget = (currentQ.correctAnswer || '').trim().toLowerCase().replace(/[^\w\s]/g, '');
      const isExact = cleanUser === cleanTarget;

      setCheckResult({
        isExact,
        isAccepted: isExact,
        similarityScore: isExact ? 100 : 60,
        standardAnswer: currentQ.correctAnswer,
        aiReferenceAnswer: currentQ.metadata?.aiReferenceAnswer || '',
        remark: currentQ.metadata?.remark || ''
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* ─── Top Workbench Header & Controls ─── */}
      <section className="section-head" style={{ marginBottom: 0 }}>
        <div className="section-head-row" style={{ alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              aria-label="Return to Workspace">
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Workspace</span>
            </button>
            <div>
              <span className="section-kicker">
                <PenLine size={13} aria-hidden="true" /> Guided Sentence Construction
              </span>
              <h1 className="section-title" style={{ fontSize: 'var(--text-xl)' }}>
                IELTS Academic Writing Clinic
              </h1>
            </div>
          </div>

          {/* Mode Switcher: Free Translation vs Chunk Reorder */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              background: 'var(--color-paper-2)',
              padding: 3,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-rule)'
            }}
            role="group"
            aria-label="Practice Mode Switcher">
            <button
              className={`btn btn-sm ${practiceMode === 'type' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPracticeMode('type')}>
              <FileEdit size={13} aria-hidden="true" />
              <span>Free Translation</span>
            </button>
            <button
              className={`btn btn-sm ${practiceMode === 'reorder' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPracticeMode('reorder')}>
              <LayoutGrid size={13} aria-hidden="true" />
              <span>Chunk Reorder</span>
            </button>
            <button
              className={`btn btn-sm ${practiceMode === 'essay' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPracticeMode('essay')}>
              <BookCheck size={13} aria-hidden="true" />
              <span>IELTS Essay (Task 1 & 2)</span>
            </button>
          </div>
        </div>
      </section>

      {practiceMode === 'essay' ? (
        <IeltsEssayWorkbench isAuthenticated={isAuthenticated} onOpenAuth={onOpenAuth} lessons={lessons} />
      ) : (
        <>
          {/* ─── Lesson & Topic & Grammar Filters ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {/* Topic & Lesson Selector */}
            {(availableTopics.length > 0 || filteredLessons.length > 0) && (
              <div className="card" style={{ padding: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                  {/* Topic Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label htmlFor="writing-topic-select" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <FolderOpen size={14} style={{ color: 'var(--color-accent)' }} />
                      <span>Chủ đề (Topic):</span>
                    </label>
                    <select
                      id="writing-topic-select"
                      className="input-select"
                      value={selectedTopic}
                      onChange={(e) => handleSelectTopic(e.target.value)}
                      style={{ fontSize: 13, minWidth: 200 }}
                    >
                      <option value="all">Tất cả chủ đề ({availableTopics.length} topics)</option>
                      {availableTopics.map((t) => (
                        <option key={t.topic} value={t.topic}>
                          {t.topic} ({t.count} bài)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lesson Selector */}
                  {filteredLessons.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240 }}>
                      <label htmlFor="lesson-select" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', whiteSpace: 'nowrap' }}>
                        Bài học viết:
                      </label>
                      <select
                        id="lesson-select"
                        className="input-select"
                        value={selectedLessonId}
                        onChange={(e) => setSelectedLessonId(e.target.value)}
                        style={{ flex: 1, minWidth: 200, fontSize: 13.5 }}>
                        {filteredLessons.map((l) => (
                          <option key={l._id} value={l._id}>
                            {l.title} (Level {l.level})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dynamic Grammar Groups Filter */}
        {grammarGroups.length > 1 && (
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
              <label htmlFor="grammar-select" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', whiteSpace: 'nowrap' }}>
                Cấu trúc (Grammar Pattern):
              </label>
              <select
                id="grammar-select"
                className="input-select"
                value={selectedGroupKey}
                onChange={(e) => {
                  setSelectedGroupKey(e.target.value);
                  setCurrentIndex(0);
                }}
                style={{ flex: 1, minWidth: 260, fontSize: 13.5 }}>
                {grammarGroups.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ─── Main Question Workbench ─── */}
      {loading || loadingQuestions ? (
        <div className="card" style={{ padding: 'var(--space-3xl)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: 14 }}>
            {loading ? 'Đang tải danh sách bài học viết...' : 'Đang tải câu hỏi bài tập viết...'}
          </p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="card" style={{ padding: 'var(--space-3xl)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: 14 }}>
            Chưa có bài học kỹ năng Viết nào trong hệ thống. Bạn có thể thêm bài học qua trang Admin hoặc import từ vựng/bài học mới.
          </p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="card" style={{ padding: 'var(--space-3xl)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: 14 }}>
            Không có câu hỏi nào trong bài học hoặc cấu trúc này.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Active Question Desk */}
          <div className="card-desk">
            {/* Header: Status Counter & Stepper Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                <span className="syllabus-badge" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                  SENTENCE {currentQ?.metadata?.no || currentIndex + 1} OF {filteredQuestions.length}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>
                  {currentQ?.metadata?.groupTitleEn || currentQ?.metadata?.groupTitleVi || currentQ?.topic || ''}
                </span>
              </div>

              {/* Prev / Next Steppers */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentIndex === 0}
                  onClick={handlePrev}
                  title="Previous sentence">
                  <ChevronLeft size={15} />
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentIndex >= filteredQuestions.length - 1}
                  onClick={handleNext}
                  title="Next sentence">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Vietnamese Prompt (Preserved in Vietnamese per language policy) */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <span className="section-kicker" style={{ color: 'var(--color-ink-muted)', fontSize: 11 }}>
                Source sentence (Tiếng Việt):
              </span>
              <p
                style={{
                  fontSize: 'clamp(1.15rem, 2.2vw, 1.35rem)',
                  fontWeight: 600,
                  lineHeight: 1.45,
                  color: 'var(--color-ink)',
                  marginTop: 4
                }}>
                "{currentQ?.metadata?.promptVi || currentQ?.prompt}"
              </p>
            </div>

            {/* Input Workspace */}
            {practiceMode === 'type' ? (
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label
                  htmlFor="user-translation-input"
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: 'var(--color-ink)'
                  }}>
                  Your Academic English Translation:
                </label>
                <textarea
                  id="user-translation-input"
                  className="input-text"
                  rows={3}
                  placeholder="Draft your English translation here... (Press Enter to evaluate)"
                  value={userSentence}
                  onChange={(e) => setUserSentence(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCheckAnswer();
                    }
                  }}
                  style={{
                    width: '100%',
                    fontSize: 15,
                    padding: 'var(--space-sm)',
                    lineHeight: 1.5,
                    fontFamily: 'var(--font-body)',
                    resize: 'vertical'
                  }}
                />
              </div>
            ) : (
              /* Chunk Reorder Mode */
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 6 }}>
                  Assemble sentence chunks in grammatical sequence:
                </div>
                {/* Assembly Tray */}
                <div
                  style={{
                    minHeight: 56,
                    padding: 'var(--space-sm)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-paper-2)',
                    border: '1px dashed var(--color-border-strong)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    alignItems: 'center',
                    marginBottom: 'var(--space-sm)'
                  }}>
                  {selectedChunks.length === 0 ? (
                    <span style={{ color: 'var(--color-ink-muted)', fontSize: 13 }}>
                      Click on the word blocks below in order to build your sentence...
                    </span>
                  ) : (
                    selectedChunks.map((chunk, idx) => (
                      <button
                        key={idx}
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDeselectChunk(chunk, idx)}
                        style={{
                          background: 'var(--color-surface)',
                          borderColor: 'var(--color-accent)',
                          color: 'var(--color-ink)',
                          fontWeight: 600
                        }}>
                        {chunk}
                      </button>
                    ))
                  )}
                </div>

                {/* Chunks Pool */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  {availableChunks.map((chunk, idx) => (
                    <button
                      key={idx}
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSelectChunk(chunk, idx)}>
                      {chunk}
                    </button>
                  ))}
                  {selectedChunks.length > 0 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={handleResetReorder}
                      style={{ fontSize: 12, marginLeft: 'auto' }}>
                      <RotateCcw size={13} aria-hidden="true" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>
                {practiceMode === 'type' ? 'Tip: Use formal register and academic collocations.' : 'Tip: Pay attention to clause boundaries.'}
              </span>
              <button
                className="btn btn-primary"
                onClick={handleCheckAnswer}
                disabled={!userSentence.trim() || isChecking}>
                <Sparkles size={14} aria-hidden="true" />
                <span>{isChecking ? 'Evaluating syntax...' : 'Evaluate Translation'}</span>
              </button>
            </div>
          </div>

          {/* ─── Coach Feedback Panel (Comparative Academic Diagnosis) ─── */}
          {checkResult && (
            <div
              className="card"
              style={{
                border: `1.5px solid ${
                  checkResult.isExact
                    ? 'var(--color-moss)'
                    : checkResult.isAccepted
                    ? 'var(--color-accent)'
                    : 'var(--color-brick)'
                }`,
                background: 'var(--color-surface)'
              }}>
              {/* Status Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                {checkResult.isExact ? (
                  <CheckCircle2 size={22} style={{ color: 'var(--color-moss)', flexShrink: 0 }} aria-hidden="true" />
                ) : checkResult.isAccepted ? (
                  <Sparkles size={22} style={{ color: 'var(--color-accent)', flexShrink: 0 }} aria-hidden="true" />
                ) : (
                  <AlertTriangle size={22} style={{ color: 'var(--color-brick)', flexShrink: 0 }} aria-hidden="true" />
                )}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                    {checkResult.isExact
                      ? 'Accurate match with academic standard (100%)'
                      : checkResult.isAccepted
                      ? `Acceptable academic variation (${checkResult.similarityScore}% lexical similarity)`
                      : `Revision recommended (${checkResult.similarityScore}% lexical similarity)`}
                  </h3>
                  <p style={{ color: 'var(--color-ink-muted)', fontSize: 13, marginTop: 2 }}>
                    Compare your submission against the verified standard and native AI alternative:
                  </p>
                </div>
              </div>

              {/* Comparative Translation Models */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 'var(--space-md)',
                  marginBottom: 'var(--space-md)'
                }}>
                {/* Academic Standard Model */}
                <div
                  style={{
                    padding: 'var(--space-md)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-paper-2)',
                    border: '1px solid var(--color-rule)'
                  }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--color-accent)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: 6
                    }}>
                    <BookCheck size={14} aria-hidden="true" />
                    <span>Academic Standard Model</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)', margin: 0, lineHeight: 1.5 }}>
                    {checkResult.standardAnswer}
                  </p>
                </div>

                {/* AI Band 8.0+ Alternative */}
                {checkResult.aiReferenceAnswer && (
                  <div
                    style={{
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-paper-2)',
                      border: '1px solid var(--color-rule)'
                    }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-moss)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: 6
                      }}>
                      <Bot size={14} aria-hidden="true" />
                      <span>Band 8.0+ Native Alternative</span>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)', margin: 0, lineHeight: 1.5 }}>
                      {checkResult.aiReferenceAnswer}
                    </p>
                  </div>
                )}
              </div>

              {/* Pedagogical Vietnamese Coach Note (Preserved per language policy for L1 contrast & common traps) */}
              {(checkResult.remark || checkResult.explanation) && (
                <div
                  style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-amber-soft)',
                    border: '1px solid var(--color-rule)',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-xs)',
                    marginBottom: 'var(--space-md)'
                  }}>
                  <Lightbulb size={16} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                  <div style={{ color: 'var(--color-ink)', lineHeight: 1.55 }}>
                    <strong>Writing Coach Note:</strong>{' '}
                    <span>{checkResult.remark || checkResult.explanation}</span>
                  </div>
                </div>
              )}

              {/* Navigation Action to Next Sentence */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-xs)' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleNext}
                  disabled={currentIndex >= filteredQuestions.length - 1}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>Proceed to Next Sentence</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}
