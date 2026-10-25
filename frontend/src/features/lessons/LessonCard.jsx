import React from 'react';
import {
  Check,
  Lock,
  Play,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export default function LessonCard({
  lesson,
  stepNumber = null,
  isNext = false,
  skillTheme = null,
  onOpen,
  onOpenPaired,
}) {
  const isMastered = lesson.status === 'mastered';
  const isUnlocked = lesson.status === 'unlocked' || isMastered;

  const SkillIcon = skillTheme?.icon || BookOpen;
  const skillName = skillTheme?.name || lesson.skill?.toUpperCase();
  const badgeBg = skillTheme?.badgeBg || 'bg-stone-100 text-stone-700 border-stone-300';

  return (
    <div
      className={`syllabus-card ${!isUnlocked ? 'is-locked' : ''} ${
        isNext ? 'ring-2 ring-orange-500 shadow-md' : ''
      }`}
      style={{
        borderLeft: isMastered
          ? '3px solid var(--color-moss)'
          : isUnlocked
          ? '3px solid var(--color-accent)'
          : '3px solid var(--color-border)',
      }}
    >
      <div>
        <div className='syllabus-meta-row'>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {stepNumber !== null && (
              <span
                className='syllabus-badge'
                style={{
                  background: isMastered
                    ? 'var(--color-moss-soft)'
                    : isUnlocked
                    ? 'var(--color-accent-soft)'
                    : 'var(--color-paper-3)',
                  color: isMastered
                    ? 'var(--color-moss)'
                    : isUnlocked
                    ? 'var(--color-accent)'
                    : 'var(--color-ink-muted)',
                  fontWeight: 700,
                }}
              >
                CHẶNG #{stepNumber}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold border ${badgeBg}`}
            >
              <SkillIcon size={11} />
              <span>LEVEL {lesson.level} · {skillName}</span>
            </span>
            <span className='syllabus-badge'>
              {lesson.contentType === 'practice' ? '🎯 THỰC HÀNH' : '📘 LÝ THUYẾT'}
            </span>
          </div>

          {isMastered ? (
            <span className='syllabus-badge mastered'>
              <Check size={11} aria-hidden='true' /> MASTERED
            </span>
          ) : isUnlocked ? (
            <span className='syllabus-badge' style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
              READY
            </span>
          ) : (
            <span className='syllabus-badge'>
              <Lock size={11} aria-hidden='true' /> LOCKED
            </span>
          )}
        </div>

        <h3 className='syllabus-title' style={{ marginTop: 8 }}>
          {lesson.title}
        </h3>
        <p className='syllabus-summary'>Topic: {lesson.topic || 'General Academic'}</p>

        {/* Direct Link to Paired Lesson */}
        {lesson.pairedLesson && (
          <div style={{ marginTop: 'var(--space-xs)', marginBottom: 'var(--space-xs)' }}>
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenPaired) onOpenPaired(lesson.pairedLesson);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: 11.5,
                fontWeight: 600,
                color: 'var(--color-accent)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                textAlign: 'left',
              }}
            >
              <span>
                {lesson.contentType === 'theory' ? '🎯 Bài thực hành liên kết:' : '📖 Lý thuyết liên kết:'}{' '}
                <span style={{ textDecoration: 'underline' }}>{lesson.pairedLesson.title}</span>
              </span>
              <ArrowRight size={11} />
            </button>
          </div>
        )}

        {lesson.prerequisites && lesson.prerequisites.length > 0 && !isUnlocked && (
          <div
            style={{
              marginTop: 'var(--space-xs)',
              fontSize: 11,
              color: 'var(--color-brick)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Yêu cầu hoàn thành:{' '}
            {lesson.prerequisites.map((p) => (typeof p === 'object' ? p.title : p)).join(', ')}
          </div>
        )}
      </div>

      <div style={{ paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--color-rule)' }}>
        {isUnlocked ? (
          <button
            className={`btn ${isNext ? 'btn-primary' : isMastered ? 'btn-secondary' : 'btn-primary'}`}
            style={{ width: '100%' }}
            onClick={() => onOpen(lesson)}
          >
            <Play size={13} fill='currentColor' aria-hidden='true' />
            <span>
              {isMastered
                ? 'Ôn tập lại bài này'
                : lesson.contentType === 'theory'
                ? 'Đọc lý thuyết chiến lược'
                : 'Bắt đầu làm bài tập'}
            </span>
          </button>
        ) : (
          <button className='btn btn-secondary' style={{ width: '100%', opacity: 0.6 }} disabled>
            <Lock size={13} aria-hidden='true' />
            <span>Đang khóa (Yêu cầu bài trước)</span>
          </button>
        )}
      </div>
    </div>
  );
}
