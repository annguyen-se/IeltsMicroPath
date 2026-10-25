import MarkdownView from '../../components/MarkdownView';
import {
  X,
  Sparkles,
  Volume2,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export default function TheoryReaderModal({
  lessonDetail,
  loading,
  isMastered,
  onClose,
  onComplete,
  isSubmittingComplete,
  onOpenPractice,
  fallbackPractice = null,
  enrolledVocabs = new Set(),
  onEnrollVocab,
  onEnrollAllVocabs,
  notice,
  onClearNotice,
  onPlayAudio,
}) {
  const lesson = lessonDetail?.lesson;
  const vocabularies = lessonDetail?.vocabularies || [];
  const pairedPractice =
    lessonDetail?.relatedPracticeLessons?.[0] ||
    lesson?.relatedPracticeLessons?.[0] ||
    lesson?.pairedLesson;

  const practiceTarget = pairedPractice || fallbackPractice;
  const isDirectPair = !!pairedPractice;

  return (
    <div
      className='fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto'
      role='dialog'
      aria-modal='true'
      aria-label='Theory Lesson Reader'
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className='bg-[#fcfbf9] dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-2xl max-w-4xl w-full min-h-[500px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl'>
        {/* Topbar */}
        <div className='flex items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shrink-0'>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className='flex items-center gap-2 mb-1 flex-wrap'>
              <span className='inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800'>
                LÝ THUYẾT CHIẾN THUẬT · LEVEL {lesson?.level ?? 0} · {lesson?.skill?.toUpperCase()}
              </span>
              <span className='text-xs font-semibold text-stone-500 dark:text-stone-400'>
                Chủ đề: {lesson?.topic || 'General Academic'}
              </span>
            </div>
            <h2 className='text-lg font-semibold text-stone-800 dark:text-stone-100 tracking-tight'>
              {lesson?.title || 'Đang tải bài học...'}
            </h2>
          </div>
          <button
            className='p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors'
            onClick={onClose}
            aria-label='Đóng cửa sổ'
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className='p-12 text-center text-sm text-stone-500'>
            Đang nạp bài giảng lý thuyết & chiến lược học thuật...
          </div>
        ) : (
          <>
            {/* Main Theory Body */}
            <div className='flex-1 overflow-y-auto p-6 sm:p-8 max-w-3xl w-full mx-auto space-y-6'>
              {notice && (
                <div className='p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center justify-between'>
                  <span>{notice}</span>
                  {onClearNotice && <button type='button' onClick={onClearNotice}>✕</button>}
                </div>
              )}

              {/* Theory Markdown */}
              <div className='card' style={{ background: 'var(--color-surface)', padding: 'var(--space-xl)' }}>
                <MarkdownView content={lesson?.contentMarkdown || 'Nội dung lý thuyết đang được cập nhật.'} />
              </div>

              {/* Core Vocabulary Section if attached */}
              {vocabularies.length > 0 && (
                <div className='space-y-3 pt-2'>
                  <div className='flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-stone-200 dark:border-stone-800'>
                    <h4 className='text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5'>
                      <Sparkles size={14} className='text-orange-700 dark:text-orange-500' />
                      <span>Từ vựng học thuật cốt lõi ({vocabularies.length} từ)</span>
                    </h4>
                    {onEnrollAllVocabs && (
                      <button
                        className='btn btn-secondary btn-sm'
                        onClick={() => onEnrollAllVocabs(vocabularies)}
                      >
                        + Thêm tất cả vào Hộp 1 SRS
                      </button>
                    )}
                  </div>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {vocabularies.map((v) => {
                      const isEnrolled = enrolledVocabs.has(v._id);
                      return (
                        <div
                          key={v._id}
                          className='p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-850 flex flex-col justify-between gap-2 shadow-xs'
                        >
                          <div className='flex items-start justify-between gap-2'>
                            <div>
                              <div className='font-bold text-base text-stone-900 dark:text-stone-100'>
                                {v.word}
                              </div>
                              <div className='text-xs font-mono text-orange-700 dark:text-orange-400'>
                                {v.ipa} · {v.pos}
                              </div>
                            </div>
                            <div className='flex items-center gap-1.5'>
                              {onPlayAudio && (
                                <button
                                  type='button'
                                  className='p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300'
                                  onClick={() => onPlayAudio(v.media?.url, v.word)}
                                  title='Nghe phát âm'
                                >
                                  <Volume2 size={14} />
                                </button>
                              )}
                              {onEnrollVocab && (
                                <button
                                  type='button'
                                  className={`px-2 py-1 text-[11px] font-semibold rounded ${
                                    isEnrolled
                                      ? 'bg-stone-100 text-stone-500 dark:bg-stone-800'
                                      : 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 hover:bg-orange-200'
                                  }`}
                                  onClick={() => onEnrollVocab(v._id)}
                                  disabled={isEnrolled}
                                >
                                  {isEnrolled ? '✓ SRS' : '+ SRS'}
                                </button>
                              )}
                            </div>
                          </div>
                          <p className='text-xs text-stone-700 dark:text-stone-300 font-medium m-0'>
                            {v.meaningVi}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar: Direct Bridge to Practice */}
            <div className='px-6 py-4 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between flex-wrap gap-3 shrink-0'>
              <button
                type='button'
                className={`btn ${isMastered ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                onClick={onComplete}
                disabled={isSubmittingComplete || isMastered}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <CheckCircle size={15} />
                <span>
                  {isMastered
                    ? '✓ Đã hoàn thành lý thuyết'
                    : isSubmittingComplete
                    ? 'Đang lưu...'
                    : 'Đánh dấu đã hiểu lý thuyết'}
                </span>
              </button>

              {practiceTarget && onOpenPractice && (
                <button
                  type='button'
                  className='btn btn-primary btn-sm'
                  onClick={() => onOpenPractice(practiceTarget)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px' }}
                >
                  <span>
                    {isDirectPair
                      ? `🎯 Tiến hành Thực hành: ${practiceTarget.title}`
                      : `🎯 Bài thực hành kế tiếp trên lộ trình: ${practiceTarget.title}`}
                  </span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
