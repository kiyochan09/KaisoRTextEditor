import React, { useState, useEffect } from 'react';
import { Bookmark, Check, X, Globe, Link, Sparkles, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface InsertBookmarkCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (bookmarkData: {
    title: string;
    url: string;
    notes: string;
    thumbnailUrl?: string;
  }) => void;
}

export const InsertBookmarkCardModal: React.FC<InsertBookmarkCardModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setUrl('');
      setNotes('');
      setThumbnailUrl('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    onInsert({
      title: title.trim(),
      url: url.trim(),
      notes: notes.trim(),
      thumbnailUrl: thumbnailUrl.trim(),
    });
    onClose();
  };

  const presetThumbnails = [
    { label: 'テック・Web', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80' },
    { label: '書籍・知識', url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=400&q=80' },
    { label: 'コード・開発', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80' },
    { label: 'デザイン・アート', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Webブックマークカードの挿入
              </h3>
              <p className="text-[11px] text-indigo-200/80">
                本文中にサムネイル画像・リンク・説明付きのブックマークカードを挿入します
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              ページタイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="例: React 18 公式ドキュメント"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              対象URL <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="url"
                placeholder="https://react.dev"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              メモ・要約・説明
            </label>
            <textarea
              rows={2}
              placeholder="このWebサイトの概要や重要ポイント..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none text-xs"
            />
          </div>

          {/* Thumbnail Presets */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800 text-[11px] flex items-center justify-between">
              <span>サムネイル画像</span>
              <span className="text-[10px] text-slate-400 font-normal">プリセットから選択またはURL指定</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {presetThumbnails.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => setThumbnailUrl(p.url)}
                  className={`cursor-pointer rounded-lg border p-1 text-center transition ${
                    thumbnailUrl === p.url
                      ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-500 font-bold text-indigo-900'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <img
                    src={p.url}
                    alt={p.label}
                    className="w-full h-10 object-cover rounded mb-1"
                  />
                  <div className="text-[10px] truncate">{p.label}</div>
                </div>
              ))}
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
              disabled={!title.trim() || !url.trim()}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-sm flex items-center space-x-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>ブックマークカードを挿入</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
