import React, { useState, useEffect } from 'react';
import { TreeNode, SystemSettings } from '../types';
import { Tag, CheckCircle2, AlertCircle, AlertTriangle, Terminal, Type } from 'lucide-react';
import { logger, ErrorLogEntry } from '../utils/errorLog';
import { detectCaretTypography, CaretTypography } from '../utils/fontManager';

interface StatusBarProps {
  activeNode: TreeNode | null;
  totalNodeCount: number;
  activeNodeIndex: number;
  activeCellCoord?: string;
  onTagClick?: (tag: string) => void;
  onOpenErrorLog?: () => void;
  settings?: SystemSettings;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeNode,
  totalNodeCount,
  activeNodeIndex,
  activeCellCoord,
  onTagClick,
  onOpenErrorLog,
  settings,
}) => {
  const [logs, setLogs] = useState<ErrorLogEntry[]>([]);
  const [caretInfo, setCaretInfo] = useState<CaretTypography>(() =>
    detectCaretTypography(settings?.fontFamily, settings?.fontSize)
  );

  useEffect(() => {
    setLogs(logger.getLogs());
    const unsub = logger.subscribe((newLogs) => setLogs(newLogs));
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleSelectionUpdate = () => {
      try {
        const info = detectCaretTypography(settings?.fontFamily, settings?.fontSize);
        setCaretInfo(info);
      } catch {
        // ignore
      }
    };

    document.addEventListener('selectionchange', handleSelectionUpdate);
    document.addEventListener('keyup', handleSelectionUpdate);
    document.addEventListener('mouseup', handleSelectionUpdate);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionUpdate);
      document.removeEventListener('keyup', handleSelectionUpdate);
      document.removeEventListener('mouseup', handleSelectionUpdate);
    };
  }, [settings?.fontFamily, settings?.fontSize]);

  const errorCount = logs.filter((l) => l.level === 'error').length;
  const warnCount = logs.filter((l) => l.level === 'warn').length;

  return (
    <div id="application-status-bar" className="h-7 bg-slate-200 border-t border-slate-300 px-3 flex items-center justify-between text-[11px] text-slate-700 select-none shrink-0 font-sans">
      {/* Left: Active Tags list matching RightNote screenshots bottom bar */}
      <div className="flex items-center space-x-2 truncate max-w-xl">
        <span className="font-semibold text-slate-600 flex items-center space-x-1">
          <Tag className="w-3 h-3 text-slate-500" />
          <span>タグ:</span>
        </span>

        {activeNode && activeNode.tags.length > 0 ? (
          <div className="flex items-center space-x-1.5 truncate">
            {activeNode.tags.map((t) => (
              <span
                key={t}
                onClick={() => onTagClick && onTagClick(t)}
                className="bg-white border border-slate-300 hover:border-blue-400 px-1.5 py-0.2 rounded text-[10px] text-slate-800 font-medium cursor-pointer shadow-2xs transition"
              >
                {t}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-400 italic text-[10px]">タグなし</span>
        )}
      </div>

      {/* Right: Counters, Error Log Button, and Technical Status */}
      <div className="flex items-center space-x-3 shrink-0 font-mono text-[10px] text-slate-600">
        {/* Caret Typography Info */}
        {activeNode?.type === 'rich' && (
          <div 
            title={`カーソル位置のフォント: ${caretInfo.fontFamily} / サイズ: ${caretInfo.fontSizePt} (${caretInfo.fontSizePx}px)`}
            className="hidden sm:flex items-center space-x-1 bg-white border border-slate-300 px-2 py-0.5 rounded text-slate-800 font-sans shadow-2xs"
          >
            <Type className="w-3 h-3 text-blue-600" />
            <span className="font-semibold truncate max-w-[100px]">{caretInfo.friendlyFontName}</span>
            <span className="font-mono text-blue-700 font-bold bg-blue-50 px-1 rounded">{caretInfo.fontSizePt}</span>
          </div>
        )}

        {/* Error / Activity Log Quick Trigger */}
        <button
          onClick={onOpenErrorLog}
          title="システム動作ログ＆エラー診断を開く"
          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded border transition cursor-pointer ${
            errorCount > 0
              ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200 animate-pulse font-bold'
              : warnCount > 0
              ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 font-semibold'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {errorCount > 0 ? (
            <AlertCircle className="w-3 h-3 text-red-600" />
          ) : warnCount > 0 ? (
            <AlertTriangle className="w-3 h-3 text-amber-600" />
          ) : (
            <Terminal className="w-3 h-3 text-slate-500" />
          )}
          <span className="font-sans text-[10px]">
            {errorCount > 0 ? `エラー: ${errorCount}件` : warnCount > 0 ? `警告: ${warnCount}件` : `ログ (${logs.length})`}
          </span>
        </button>

        {/* Spreadsheet Active Cell Coordinate */}
        {activeNode?.type === 'spreadsheet' && activeCellCoord && (
          <span className="bg-slate-300/80 px-1.5 py-0.5 rounded font-bold text-slate-800">
            セル: {activeCellCoord}
          </span>
        )}

        {/* Node index / Total nodes in notebook */}
        <span className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded font-semibold text-slate-800">
          {activeNodeIndex > 0 ? activeNodeIndex : 1} / {totalNodeCount}
        </span>

        {/* Zoom */}
        <span className="hidden sm:inline">100%</span>

        {/* Status icon */}
        <div className="flex items-center space-x-1 text-emerald-700">
          <CheckCircle2 className="w-3 h-3" />
          <span className="hidden md:inline">準備完了</span>
        </div>
      </div>
    </div>
  );
};
