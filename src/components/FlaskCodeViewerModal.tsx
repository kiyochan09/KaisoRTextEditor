import React, { useState } from 'react';
import { FLASK_PROJECT_FILES, STANDALONE_FLASK_APP_CODE, FlaskSourceFile } from '../data/flaskCodebase';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  X, 
  Folder, 
  File, 
  Terminal, 
  Play, 
  Archive, 
  Zap, 
  CheckCircle2, 
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';
import JSZip from 'jszip';

interface FlaskCodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlaskCodeViewerModal: React.FC<FlaskCodeViewerModalProps> = ({ isOpen, onClose }) => {
  const [activeFilePath, setActiveFilePath] = useState('app.py');
  const [copied, setCopied] = useState(false);
  const [cmdCopied, setCmdCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const currentFile = FLASK_PROJECT_FILES.find((f) => f.path === activeFilePath) || FLASK_PROJECT_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCmd = (text: string) => {
    navigator.clipboard.writeText(text);
    setCmdCopied(true);
    setTimeout(() => setCmdCopied(false), 2000);
  };

  // Download standalone app.py directly
  const handleDownloadStandaloneAppPy = () => {
    const blob = new Blob([STANDALONE_FLASK_APP_CODE], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'app.py';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download currently selected single file
  const handleDownloadSingleFile = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = currentFile.path.split('/').pop() || 'file.py';
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download all files as a real ZIP archive using JSZip
  const handleDownloadZipArchive = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();
      
      FLASK_PROJECT_FILES.forEach((f) => {
        zip.file(f.path, f.content);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'flask_hierarchical_note_backend.zip';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="bg-slate-950 text-slate-100 rounded-xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-950/80 border border-emerald-500/40 rounded-lg text-emerald-400 shadow-inner">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold tracking-tight text-white">Flask バックエンド実装コード & プロジェクト構成</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                  最新版 v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Python 3.10+ / Flask 3.0 / SQLite (WALモード高速永続化) / RESTful API / 図表キャプション・ブックマーク対応
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Standalone app.py Download */}
            <button
              onClick={handleDownloadStandaloneAppPy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs rounded-lg transition font-semibold shadow-md border border-emerald-400/30"
              title="単一ファイルで即座に動作する app.py をダウンロード"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>⚡ app.py (スタンドアロン版) を保存</span>
            </button>

            {/* ZIP Download */}
            <button
              onClick={handleDownloadZipArchive}
              disabled={isZipping}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition font-medium shadow-md border border-blue-400/30"
              title="全ファイルをフォルダ構造そのままZIP形式でダウンロード"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{isZipping ? 'ZIP生成中...' : '📦 全ファイル(ZIP)を保存'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition border border-slate-700"
              title="表示中ファイルのソースコードをコピー"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'コピー完了' : 'コピー'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 ml-1 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Launch Banner */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-2.5 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="text-amber-400 font-bold">💡 ローカル起動手順:</span>
            <span className="text-slate-400">1. ダウンロードしたフォルダでコマンドを実行</span>
          </div>
          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <div className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-emerald-400 select-all">
              pip install flask flask-cors
            </div>
            <span className="text-slate-500">→</span>
            <div className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-emerald-400 select-all">
              python app.py
            </div>
            <button
              onClick={() => handleCopyCmd('pip install flask flask-cors && python app.py')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-sans transition"
            >
              {cmdCopied ? 'コピー済' : 'コマンドコピー'}
            </button>
          </div>
        </div>

        {/* File Explorer & Code Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-80 bg-slate-900/70 border-r border-slate-800 flex flex-col p-3 shrink-0">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>ファイル構成</span>
              </div>
              <span className="text-[10px] text-slate-500">{FLASK_PROJECT_FILES.length} ファイル</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {FLASK_PROJECT_FILES.map((file) => {
                const isSelected = file.path === activeFilePath;
                const isStandalone = file.path === 'app.py';
                return (
                  <button
                    key={file.path}
                    onClick={() => setActiveFilePath(file.path)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex flex-col space-y-1 border ${
                      isSelected
                        ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2 truncate font-mono">
                        <File className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span className="truncate font-semibold">{file.path}</span>
                      </div>
                      {isStandalone && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-sans font-medium shrink-0">
                          単体動作
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">{file.description}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Standalone Box */}
            <div className="mt-3 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-[11px] text-emerald-300 space-y-1.5">
              <div className="font-bold flex items-center space-x-1 text-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>スタンドアロン版の特徴</span>
              </div>
              <p className="text-[10px] text-emerald-400/90 leading-relaxed">
                サブフォルダ不要！<code>app.py</code> 1ファイルのみでSQLite DBの自動初期化、全API、シードデータ登録まで自動実行されます。
              </p>
            </div>
          </div>

          {/* Right Code Display Area */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden font-mono text-xs">
            <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-slate-400 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-200 font-bold">{currentFile.path}</span>
                <span className="text-[11px] text-slate-500">({currentFile.language})</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadSingleFile}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition border border-slate-700"
                >
                  <Download className="w-3 h-3" />
                  <span>このファイルを保存</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 leading-relaxed select-text bg-slate-950">
              <pre className="text-slate-200 whitespace-pre font-mono text-xs">
                <code>{currentFile.content}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>REST API Ready: ノート階層、図表キャプション、文章ブックマーク、全文検索 完全対応</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition font-medium"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
};
