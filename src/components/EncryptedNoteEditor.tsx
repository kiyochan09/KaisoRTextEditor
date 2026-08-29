import React, { useState } from 'react';
import { TreeNode, SystemSettings } from '../types';
import { Lock, Unlock, Key, ShieldCheck } from 'lucide-react';

interface EncryptedNoteEditorProps {
  node: TreeNode;
  onUpdateContent: (text: string) => void;
  onUpdateTitle: (title: string) => void;
  settings?: SystemSettings;
}

export const EncryptedNoteEditor: React.FC<EncryptedNoteEditorProps> = ({
  node,
  onUpdateContent,
  onUpdateTitle,
  settings,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(!node.isLocked);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [noteText, setNoteText] = useState(node.content.plainText || '');

  const correctPassword = node.password || 'password123';

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === correctPassword) {
      setIsUnlocked(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Incorrect passphrase. (Hint: sample password is "password123")');
    }
  };

  const handleLockAgain = () => {
    setIsUnlocked(false);
    setPasswordInput('');
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteText(e.target.value);
    onUpdateContent(e.target.value);
  };

  const getEncryptedAreaStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};
    if (settings) {
      if (settings.fontFamily) style.fontFamily = settings.fontFamily;
      if (settings.fontSize) style.fontSize = settings.fontSize;
      if (settings.lineHeight) style.lineHeight = settings.lineHeight;
      if (settings.bodyWrapMode === 'characters') {
        style.maxWidth = `${settings.bodyWrapValue}ch`;
      } else if (settings.bodyWrapMode === 'pixels') {
        style.maxWidth = `${settings.bodyWrapValue}px`;
      } else if (settings.bodyWrapMode === 'none') {
        style.whiteSpace = 'pre';
        style.overflowX = 'auto';
      }
    }
    return style;
  };

  return (
    <div id="encrypted-note-container" className="flex-1 flex flex-col bg-slate-50 p-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <input
          type="text"
          value={node.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          className="text-xl font-bold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 flex-1 mr-4"
          style={{ fontFamily: settings?.fontFamily }}
        />
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 font-semibold flex items-center space-x-1">
            <Lock className="w-3 h-3" />
            <span>Encrypted Node</span>
          </span>
        </div>
      </div>

      {!isUnlocked ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 border border-amber-300 shadow-sm">
            <Lock className="w-8 h-8 text-amber-700" />
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1">ノートは暗号化・保護されています</h3>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            このノートはパスワードによって保護されています。内容を表示・編集するにはパスフレーズを入力してください。
          </p>

          <form onSubmit={handleUnlock} className="w-full space-y-3">
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                placeholder="パスフレーズを入力..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded text-xs font-semibold shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>ノートのロックを解除</span>
            </button>
          </form>

          <div className="mt-4 text-[11px] text-slate-400">
            デモ用パスワード: <code className="bg-slate-200 text-slate-700 px-1 py-0.5 rounded font-mono">password123</code>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-3">
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 p-2.5 rounded text-xs text-emerald-900">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">復号モード（編集中）。ノート切替時または再ロック時に自動暗号化されます。</span>
            </div>
            <button
              onClick={handleLockAgain}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1"
            >
              <Lock className="w-3 h-3" />
              <span>今すぐロック</span>
            </button>
          </div>

          <textarea
            value={noteText}
            onChange={handleTextChange}
            placeholder="暗号化して保存する機密テキストを入力..."
            style={getEncryptedAreaStyle()}
            className="flex-1 p-4 bg-white border border-slate-300 rounded-lg text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner resize-none"
          />
        </div>
      )}
    </div>
  );
};

