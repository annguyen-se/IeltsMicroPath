import React from 'react';
import {
  Check,
  Zap,
  Play,
  Lock,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export default function RoadmapTimeline({
  lessons = [],
  nextMilestone = null,
  stages = [],
  skillThemeMap = {},
  onOpen,
  onOpenPaired,
}) {
  return (
    <div className="flex flex-col gap-5 py-2">
      {lessons.map((lesson, idx) => {
        const isMastered = lesson.status === 'mastered';
        const isUnlocked = lesson.status === 'unlocked' || isMastered;
        const isNext = nextMilestone && nextMilestone._id === lesson._id;
        const skillMeta = skillThemeMap[lesson.skill] || {
          name: lesson.skill?.toUpperCase(),
          icon: BookOpen,
          badgeBg: 'bg-stone-100 text-stone-700 border-stone-300',
        };
        const SkillIcon = skillMeta.icon;
        const stg = stages.find((s) => s.key === String(lesson.level)) || stages[1];

        return (
          <div key={lesson._id} className="relative flex items-start gap-3.5 sm:gap-6 group">
            {/* Vertical connecting line to next station */}
            {idx < lessons.length - 1 && (
              <div className="absolute left-[19px] sm:left-[21px] top-11 bottom-0 w-0.5 bg-stone-200 dark:bg-stone-800 group-hover:bg-orange-300 dark:group-hover:bg-orange-950 transition-colors" />
            )}

            {/* Milestone Station Node Pin */}
            <div className="relative z-10 shrink-0 mt-1">
              {isMastered ? (
                <div
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-2 border-emerald-500 flex items-center justify-center shadow-xs"
                  title={`Đã hoàn thành chặng #${idx + 1}`}
                >
                  <Check size={18} strokeWidth={2.5} />
                </div>
              ) : isNext ? (
                <div
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-orange-700 text-white border-2 border-orange-400 flex items-center justify-center shadow-lg ring-4 ring-orange-200 dark:ring-orange-950/60 animate-pulse"
                  title={`Đang mở khóa: Chặng #${idx + 1}`}
                >
                  <Zap size={18} />
                </div>
              ) : isUnlocked ? (
                <div
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-2 border-orange-500 flex items-center justify-center shadow-xs"
                  title={`Sẵn sàng học: Chặng #${idx + 1}`}
                >
                  <Play size={16} fill="currentColor" />
                </div>
              ) : (
                <div
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500 border border-stone-300 dark:border-stone-700 flex items-center justify-center"
                  title={`Đang khóa: Chặng #${idx + 1}`}
                >
                  <Lock size={15} />
                </div>
              )}
            </div>

            {/* Milestone Station Detail Card */}
            <div className="flex-1 pb-4">
              <div
                className={`bg-white dark:bg-stone-900 border rounded-2xl p-5 sm:p-6 transition-all ${
                  isNext
                    ? 'border-2 border-orange-600 shadow-md ring-1 ring-orange-500/20'
                    : isMastered
                    ? 'border-stone-200 dark:border-stone-800 shadow-xs hover:border-emerald-500'
                    : isUnlocked
                    ? 'border-stone-300 dark:border-stone-700 shadow-xs hover:border-orange-500'
                    : 'opacity-65 bg-stone-50/70 dark:bg-stone-850/40 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2 pb-2 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                      BƯỚC #{idx + 1}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${skillMeta.badgeBg}`}
                    >
                      <SkillIcon size={12} />
                      <span>
                        LEVEL {lesson.level} · {stg.band} · {skillMeta.name}
                      </span>
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                      {lesson.contentType === 'theory' ? '📘 LÝ THUYẾT CHIẾN THUẬT' : '🎯 THỰC HÀNH LUYỆN ĐỀ'}
                    </span>
                  </div>

                  {isMastered ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <Check size={11} strokeWidth={2.5} /> ĐÃ THÀNH THẠO
                    </span>
                  ) : isUnlocked ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
                      <Zap size={11} /> SẴN SÀNG HỌC
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                      <Lock size={11} /> ĐANG KHÓA
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-stone-800 dark:text-stone-100 tracking-tight mb-1">
                  {lesson.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">
                  Chủ đề: <strong className="text-stone-800 dark:text-stone-200">{lesson.topic || 'General Academic'}</strong>
                </p>

                {/* Direct Link to Paired Lesson */}
                {lesson.pairedLesson && (
                  <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/80 mb-3 flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-xs text-stone-600 dark:text-stone-300">
                      <span>
                        {lesson.contentType === 'theory' ? '🎯 Bài thực hành đi kèm:' : '📖 Lý thuyết chiến lược đi kèm:'}{' '}
                      </span>
                      <strong className="text-orange-700 dark:text-orange-400">{lesson.pairedLesson.title}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenPaired) onOpenPaired(lesson.pairedLesson);
                      }}
                      className="text-xs font-semibold text-orange-700 hover:text-orange-800 dark:text-orange-400 underline inline-flex items-center gap-1"
                    >
                      <span>{lesson.contentType === 'theory' ? 'Làm bài thực hành ngay' : 'Đọc bài lý thuyết'}</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                )}

                {lesson.prerequisites && lesson.prerequisites.length > 0 && !isUnlocked && (
                  <div className="text-xs text-red-600 dark:text-red-400 mb-3 font-mono">
                    Yêu cầu hoàn thành: {lesson.prerequisites.map((p) => (typeof p === 'object' ? p.title : p)).join(', ')}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  {isUnlocked ? (
                    <button
                      type="button"
                      className={`btn ${isNext ? 'btn-primary' : isMastered ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                      onClick={() => onOpen(lesson)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Play size={12} fill="currentColor" />
                      <span>
                        {isMastered
                          ? 'Ôn tập lại bài này'
                          : lesson.contentType === 'theory'
                          ? 'Đọc bài giảng lý thuyết'
                          : 'Bắt đầu làm bài tập'}
                      </span>
                      <ArrowRight size={12} />
                    </button>
                  ) : (
                    <button type="button" className="btn btn-secondary btn-sm opacity-60" disabled>
                      <Lock size={12} />
                      <span>Cần mở khóa bài trước</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
