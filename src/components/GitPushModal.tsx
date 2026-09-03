import React, { useState, useEffect } from 'react';
import { GitBranch, UploadCloud, CheckCircle2, AlertCircle, RefreshCw, X, FolderGit2, FileCode } from 'lucide-react';

interface GitPushModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitPushModal: React.FC<GitPushModalProps> = ({ isOpen, onClose }) => {
  const [branch, setBranch] = useState<string>('main');
  const [remoteUrl, setRemoteUrl] = useState<string>('https://github.com/kiyochan09/KaisoRTextEditor.git');
  const [changes, setChanges] = useState<string[]>([]);
  const [commitMessage, setCommitMessage] = useState<string>(() => {
    const now = new Date();
    return `KaisoRTextEditor 更新 (${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    setPushResult(null);
    try {
      const res = await fetch('/api/git/status');
      if (res.ok) {
        const data = await res.json();
        setBranch(data.branch || 'main');
        setRemoteUrl(data.remote || 'https://github.com/kiyochan09/KaisoRTextEditor.git');
        setChanges(data.changes || []);
      }
    } catch (err) {
      console.error('Failed to fetch git status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handlePush = async () => {
    if (!commitMessage.trim()) {
      alert('コミットメッセージを入力してください。');
      return;
    }

    setIsPushing(true);
    setPushResult(null);

    try {
      const res = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitMessage }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPushResult({
          success: true,
          message: data.message || 'GitHubへのプッシュが正常に完了しました！',
          details: `${data.commitOutput || ''}\n${data.pushOutput || ''}`.trim(),
        });
        fetchStatus();
      } else {
        setPushResult({
          success: false,
          message: 'プッシュ処理中にエラーが発生しました。',
          details: `${data.error || ''}\n${data.stderr || ''}\n${data.stdout || ''}`.trim(),
        });
      }
    } catch (err: any) {
      setPushResult({
        success: false,
        message: 'サーバー通信エラーが発生しました。',
        details: err.message,
      });
    } finally {
      setIsPushing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <FolderGit2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">GitHub同期・プッシュ</h2>
              <p className="text-[11px] text-slate-400">リモートリポジトリへ変更をコミット＆プッシュ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-700">
          {/* Remote & Branch info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-blue-600" /> ブランチ:
              </span>
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {branch}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">リポジトリ:</span>
              <a
                href={remoteUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-slate-700 hover:text-blue-600 hover:underline truncate max-w-xs"
              >
                {remoteUrl}
              </a>
            </div>
          </div>

          {/* Changed Files */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <FileCode className="w-3.5 h-3.5 text-slate-500" />
                変更されたファイル ({changes.length}件)
              </span>
              <button
                type="button"
                onClick={fetchStatus}
                disabled={isLoading}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                更新
              </button>
            </div>
            <div className="bg-slate-900 text-slate-200 font-mono text-[11px] p-2.5 rounded-xl max-h-36 overflow-y-auto space-y-0.5 border border-slate-800">
              {changes.length === 0 ? (
                <div className="text-slate-500 italic py-1 text-center">
                  コミット対象の変更はありません（最新状態です）
                </div>
              ) : (
                changes.map((change, idx) => {
                  const isUntracked = change.startsWith('??');
                  const isModified = change.trim().startsWith('M');
                  const isDeleted = change.trim().startsWith('D');
                  return (
                    <div key={idx} className="flex items-center space-x-2 truncate">
                      <span
                        className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                          isUntracked
                            ? 'bg-emerald-800 text-emerald-200'
                            : isDeleted
                            ? 'bg-rose-800 text-rose-200'
                            : 'bg-amber-800 text-amber-200'
                        }`}
                      >
                        {isUntracked ? 'NEW' : isDeleted ? 'DEL' : 'MOD'}
                      </span>
                      <span className="truncate">{change.slice(3)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Commit Message */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              コミットメッセージ
            </label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="変更内容を簡潔に入力..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs bg-white text-slate-900"
            />
          </div>

          {/* Result Alert / Log */}
          {pushResult && (
            <div
              className={`p-3 rounded-xl border flex flex-col space-y-1.5 animate-in fade-in ${
                pushResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center space-x-2 font-bold text-xs">
                {pushResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{pushResult.message}</span>
              </div>
              {pushResult.details && (
                <pre className="text-[10px] font-mono bg-black/5 p-2 rounded max-h-28 overflow-y-auto whitespace-pre-wrap">
                  {pushResult.details}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Push先: <code className="bg-slate-200/80 px-1 py-0.5 rounded text-slate-700">origin/{branch}</code>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg transition font-medium"
            >
              閉じる
            </button>
            <button
              type="button"
              onClick={handlePush}
              disabled={isPushing || changes.length === 0}
              className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
              <span>{isPushing ? 'プッシュ中...' : 'GitHubへプッシュ実行'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
