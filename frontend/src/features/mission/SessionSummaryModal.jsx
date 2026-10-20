import React from 'react';
import { Trophy, Flame, ArrowRight } from 'lucide-react';

export default function SessionSummaryModal({ isOpen, summaryData, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Tổng kết phiên học"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center">
          <Trophy size={28} aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100 tracking-tight mb-1.5">
          Hoàn thành buổi học hôm nay!
        </h2>
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-5 leading-relaxed">
          Bạn đã hoàn thành xuất sắc các chặng rèn luyện trong giáo án hôm nay.
        </p>

        <div className="bg-[#f5f3ef] dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 rounded-xl p-4 mb-5 flex flex-col gap-3 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-600 dark:text-stone-400">Chuỗi học liên tục</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-mono text-[11px] font-semibold border border-amber-200 dark:border-amber-800">
              <Flame size={12} aria-hidden="true" />
              <span>+{summaryData?.streak ?? 0} ngày streak</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-600 dark:text-stone-400">Độ chính xác bài học</span>
            <span className="font-mono font-bold text-green-700 dark:text-green-400 text-sm">
              {summaryData?.scorePercent ?? 0}%
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-600 dark:text-stone-400">Tổng mục đã ôn tập</span>
            <span className="font-mono font-semibold text-blue-700 dark:text-blue-400">
              {summaryData?.reviewedCount ?? 0} mục
            </span>
          </div>
        </div>

        <button
          className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-orange-700 hover:bg-orange-800 active:translate-y-px rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
          onClick={onClose}
        >
          <span>Quay về bàn làm việc</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
