import React, { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, AlertCircle, Info, CheckCircle2, Copy, 
  Trash2, Filter, RefreshCw, FileText, Check, Bug, Terminal,
  ClipboardPaste, Download
} from 'lucide-react';
import { logger, ErrorLogEntry, LogLevel, LogCategory } from '../utils/errorLog';

interface ErrorLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ErrorLogModal: React.FC<ErrorLogModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [logs, setLogs] = useState<ErrorLogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<'all' | LogLevel>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | LogCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLogs(logger.getLogs());
      const unsubscribe = logger.subscribe((newLogs) => {
        setLogs(newLogs);
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchDetails = log.details?.toLowerCase().includes(q) || false;
      const matchCategory = log.category.toLowerCase().includes(q);
      if (!matchMsg && !matchDetails && !matchCategory) return false;
    }
    return true;
  });

  const errorCount = logs.filter((l) => l.level === 'error').length;
  const warnCount = logs.filter((l) => l.level === 'warn').length;
  const infoCount = logs.filter((l) => l.level === 'info' || l.level === 'success').length;

  const handleCopyLogs = () => {
    const text = logger.exportLogsAsText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearLogs = () => {
    logger.clearLogs();
    setShowClearConfirm(false);
  };

  const handleRunDiagnostic = () => {
    setTestStatus('診断テスト実行中...');
    try {
      logger.addLog({
        level: 'info',
        category: 'system',
        message: 'システム自己診断を開始しました',
        details: `ブラウザ: ${navigator.userAgent}\n解像度: ${window.innerWidth}x${window.innerHeight}\n言語: ${navigator.language}`,
      });

      // Test clipboard support
      const hasClipboard = !!navigator.clipboard;
      const hasFileReader = typeof FileReader !== 'undefined';
      const hasDOMParser = typeof DOMParser !== 'undefined';

      logger.addLog({
        level: 'success',
        category: 'clipboard',
        message: 'ブラウザAPI互換性チェック完了',
        details: `Clipboard API: ${hasClipboard ? '利用可能' : '制限あり'}\nFileReader: ${hasFileReader ? '利用可能' : '非対応'}\nDOMParser: ${hasDOMParser ? '利用可能' : '非対応'}`,
      });

      setTestStatus('診断完了: ログに結果を出力しました');
      setTimeout(() => setTestStatus(null), 3000);
    } catch (err: any) {
      logger.addLog({
        level: 'error',
        category: 'system',
        message: '自己診断中にエラーが発生しました',
        details: err.message,
      });
      setTestStatus('診断エラー');
    }
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3 mr-1 text-red-600" />
            ERROR
          </span>
        );
      case 'warn':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
            WARN
          </span>
        );
      case 'success':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            OK
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Info className="w-3 h-3 mr-1 text-blue-600" />
            INFO
          </span>
        );
    }
  };

  const getCategoryBadge = (cat: LogCategory) => {
    const labels: Record<LogCategory, { label: string; color: string }> = {
      clipboard: { label: 'クリップボード', color: 'bg-purple-100 text-purple-700 border-purple-200' },
      'docx-import': { label: 'DOCXインポート', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      database: { label: 'データベース', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
      editor: { label: 'エディタ', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      system: { label: 'システム', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    };
    const c = labels[cat] || { label: cat, color: 'bg-slate-100 text-slate-600' };
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${c.color}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 font-sans">
        
        {/* Header */}
        <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-red-500/20 border border-red-400/40 rounded-lg text-red-300">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-sm text-white">システム動作ログ &amp; エラー診断ビューア</h2>
                <span className="text-[11px] bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">
                  {logs.length} 件記録
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                画像の貼り付け、DOCXインポート、データベース同期等の動作状態と例外ログを確認できます
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700 transition"
            title="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Statistics Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
              <span className="text-slate-500 font-medium">エラー:</span>
              <span className={`font-bold font-mono ${errorCount > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                {errorCount}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
              <span className="text-slate-500 font-medium">警告:</span>
              <span className="font-bold font-mono text-amber-600">{warnCount}</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
              <span className="text-slate-500 font-medium">情報/成功:</span>
              <span className="font-bold font-mono text-blue-600">{infoCount}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRunDiagnostic}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 font-medium text-xs shadow-2xs transition"
            >
              <Bug className="w-3.5 h-3.5 text-indigo-600" />
              <span>{testStatus || '環境診断テスト'}</span>
            </button>
            <button
              onClick={handleCopyLogs}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 font-medium text-xs shadow-2xs transition"
              title="ログ全体をテキストとしてクリップボードにコピー"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">コピー完了</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>ログをコピー</span>
                </>
              )}
            </button>
            <div className="relative inline-block">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-red-50 text-red-600 rounded border border-slate-300 hover:border-red-300 font-medium text-xs shadow-2xs transition"
                title="ログを全消去"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>クリア</span>
              </button>
              {showClearConfirm && (
                <div className="absolute bottom-full right-0 mb-2 p-3 bg-white border border-red-200 shadow-xl rounded-lg z-20 w-56 animate-in fade-in zoom-in-95">
                  <p className="text-xs font-bold text-slate-800 mb-2 leading-relaxed">
                    すべてのログをクリアしますか？
                  </p>
                  <div className="flex space-x-2 justify-end">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleClearLogs}
                      className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition shadow-sm font-medium"
                    >
                      クリアする
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>絞り込み:</span>
            </div>

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">すべてのレベル</option>
              <option value="error">エラーのみ (ERROR)</option>
              <option value="warn">警告のみ (WARN)</option>
              <option value="info">情報のみ (INFO)</option>
              <option value="success">成功のみ (OK)</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">すべてのカテゴリ</option>
              <option value="clipboard">クリップボード / 画像貼り付け</option>
              <option value="docx-import">DOCX インポート</option>
              <option value="database">データベース操作</option>
              <option value="editor">エディタ</option>
              <option value="system">システム全般</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="メッセージや詳細を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Log List View */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 min-h-[300px]">
          {filteredLogs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <div className="text-sm font-medium text-slate-600">表示対象のログはありません</div>
              <div className="text-xs text-slate-400">現在エラーや例外は発生していません</div>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const hasExtra = !!log.details || !!log.stack;

              return (
                <div
                  key={log.id}
                  className={`bg-white rounded-lg border transition shadow-2xs overflow-hidden ${
                    log.level === 'error'
                      ? 'border-red-200 hover:border-red-300'
                      : log.level === 'warn'
                      ? 'border-amber-200 hover:border-amber-300'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    onClick={() => hasExtra && setExpandedLogId(isExpanded ? null : log.id)}
                    className={`p-2.5 flex items-start justify-between gap-2 cursor-pointer ${
                      hasExtra ? 'hover:bg-slate-50/80' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-2 min-w-0 flex-1">
                      <span className="font-mono text-[11px] text-slate-400 shrink-0 pt-0.5">
                        {log.timeString}
                      </span>
                      <div className="shrink-0">{getLevelBadge(log.level)}</div>
                      <div className="shrink-0">{getCategoryBadge(log.category)}</div>
                      <div className="text-xs text-slate-800 font-medium break-words min-w-0 flex-1">
                        {log.message}
                      </div>
                    </div>

                    {hasExtra && (
                      <button
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium underline shrink-0 select-none ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedLogId(isExpanded ? null : log.id);
                        }}
                      >
                        {isExpanded ? '詳細を隠す' : '詳細・スタック'}
                      </button>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && hasExtra && (
                    <div className="bg-slate-900 text-slate-200 p-3 text-[11px] font-mono border-t border-slate-200 overflow-x-auto space-y-2">
                      {log.details && (
                        <div>
                          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                            詳細情報 (Details):
                          </div>
                          <pre className="whitespace-pre-wrap text-emerald-300 leading-relaxed">
                            {log.details}
                          </pre>
                        </div>
                      )}
                      {log.stack && (
                        <div>
                          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                            スタックトレース (Stack Trace):
                          </div>
                          <pre className="whitespace-pre-wrap text-red-300 leading-relaxed">
                            {log.stack}
                          </pre>
                        </div>
                      )}
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(
                              `[${log.timestamp}] [${log.level}] ${log.message}\n${log.details || ''}\n${log.stack || ''}`
                            );
                            alert('ログエントリをコピーしました');
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[10px] flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>このエントリをコピー</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            💡 エラーが起きた場合は「ログをコピー」して不具合状況をお伝えいただけます。
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
};
