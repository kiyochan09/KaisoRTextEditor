import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, X, Terminal, ChevronRight } from 'lucide-react';
import { logger, ErrorLogEntry } from '../utils/errorLog';

interface ErrorToastProps {
  onOpenLog: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ onOpenLog }) => {
  const [activeToast, setActiveToast] = useState<ErrorLogEntry | null>(null);

  useEffect(() => {
    let timeoutId: any = null;
    const unsub = logger.subscribe((logs) => {
      if (logs.length > 0) {
        const latest = logs[0];
        if (latest.level === 'error' || latest.level === 'warn') {
          setActiveToast(latest);
          if (timeoutId) clearTimeout(timeoutId);
          // Auto hide after 8 seconds
          timeoutId = setTimeout(() => {
            setActiveToast(null);
          }, 8000);
        }
      }
    });

    return () => {
      unsub();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (!activeToast) return null;

  const isError = activeToast.level === 'error';

  return (
    <div className="fixed bottom-10 right-5 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-200">
      <div
        className={`rounded-lg shadow-xl border p-3 flex items-start space-x-3 text-xs backdrop-blur-md ${
          isError
            ? 'bg-red-900/95 text-white border-red-500 shadow-red-900/30'
            : 'bg-amber-900/95 text-white border-amber-500 shadow-amber-900/30'
        }`}
      >
        <div className="shrink-0 pt-0.5">
          {isError ? (
            <AlertCircle className="w-5 h-5 text-red-300 animate-pulse" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1.5 font-bold mb-0.5">
            <span>{isError ? 'エラーが発生しました' : '警告・注意'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 text-white/80 font-mono">
              {activeToast.category}
            </span>
          </div>
          <div className="text-[11px] text-slate-200 line-clamp-2 break-words">
            {activeToast.message}
          </div>

          <div className="mt-2 flex items-center space-x-2">
            <button
              onClick={() => {
                setActiveToast(null);
                onOpenLog();
              }}
              className="inline-flex items-center space-x-1 px-2 py-0.5 bg-white text-slate-900 hover:bg-slate-100 rounded font-semibold text-[10px] transition cursor-pointer shadow-2xs"
            >
              <Terminal className="w-3 h-3 text-slate-700" />
              <span>ログ詳細を開く</span>
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setActiveToast(null)}
              className="text-[10px] text-white/70 hover:text-white underline cursor-pointer"
            >
              閉じる
            </button>
          </div>
        </div>

        <button
          onClick={() => setActiveToast(null)}
          className="text-white/60 hover:text-white p-0.5 rounded transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
