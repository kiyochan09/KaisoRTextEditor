import React, { useState, useEffect } from 'react';
import { BookOpen, Check, X, Sparkles, Link, Quote, Hash, Info } from 'lucide-react';

interface InsertFootnoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
  currentCount: number;
}

export const InsertFootnoteModal: React.FC<InsertFootnoteModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  currentCount,
}) => {
  const [footnoteText, setFootnoteText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFootnoteText('');
      setSelectedTemplate(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = footnoteText.trim();
    if (!trimmed) return;

    onInsert(trimmed);
    onClose();
  };

  const applyTemplate = (template: string) => {
    setSelectedTemplate(template);
    if (template === 'url') {
      setFootnoteText('公式ドキュメント: https://example.com/docs (2026年アクセス)');
    } else if (template === 'book') {
      setFootnoteText('著者名『書籍タイトル』出版社 (2025年), pp. 45-48.');
    } else if (template === 'note') {
      setFootnoteText('※補足事項: 本データは最新の測定値に基づいています。');
    }
  };

  const nextNumber = currentCount + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                注釈・脚注の挿入 (Wikipediaスタイル)
              </h3>
              <p className="text-[11px] text-blue-200/80">
                本文に出現順で自動採番される注釈リンク <code className="bg-blue-900/60 px-1 rounded text-white font-mono">[{nextNumber}]</code> を挿入します
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          {/* Automatic numbering note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-blue-950 flex items-center gap-1.5">
                <span>自動採番＆中途挿入の自動振り直し</span>
                <span className="bg-blue-200/70 text-blue-900 px-1.5 py-0.2 rounded text-[10px]">
                  予測番号: [{nextNumber}]
                </span>
              </div>
              <p className="text-[11px] text-blue-800 leading-snug">
                カーソル位置に上付きの注釈番号が挿入され、ノート下部の「脚注セクション」に注釈文が自動配置されます。後から手前や途中に別の注釈を追加・削除しても、全番号が自動的に正しい連番に振り直されます。
              </p>
            </div>
          </div>

          {/* Footnote text input */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Quote className="w-3.5 h-3.5 text-blue-600" />
                注釈・引用・補足テキスト <span className="text-red-500 font-normal">*必須</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                URLリンク、出典、補足解説など
              </span>
            </label>
            <textarea
              id="footnote-text-input"
              autoFocus
              rows={4}
              value={footnoteText}
              onChange={(e) => setFootnoteText(e.target.value)}
              placeholder="ここに注釈や補足、参考文献、WebサイトのURLを入力してください..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none leading-relaxed"
            />
          </div>

          {/* Quick Templates */}
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-600 text-[11px]">クイック挿入テンプレート:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyTemplate('url')}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium text-[11px] flex items-center space-x-1 transition"
              >
                <Link className="w-3 h-3 text-blue-600" />
                <span>🌐 Webサイト引用</span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('book')}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium text-[11px] flex items-center space-x-1 transition"
              >
                <BookOpen className="w-3 h-3 text-indigo-600" />
                <span>📚 書籍・文献引用</span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('note')}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium text-[11px] flex items-center space-x-1 transition"
              >
                <Info className="w-3 h-3 text-amber-600" />
                <span>💡 補足事項・注記</span>
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!footnoteText.trim()}
              id="submit-insert-footnote-btn"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-sm flex items-center space-x-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>注釈 [{nextNumber}] を挿入</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
