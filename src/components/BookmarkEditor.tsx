import React, { useState } from 'react';
import { TreeNode, BookmarkItem } from '../types';
import { Bookmark, ExternalLink, Plus, Trash2, Globe, Clock, FileText } from 'lucide-react';

interface BookmarkEditorProps {
  node: TreeNode;
  onUpdateBookmarks: (bookmarks: BookmarkItem[]) => void;
  onUpdateTitle: (title: string) => void;
}

export const BookmarkEditor: React.FC<BookmarkEditorProps> = ({
  node,
  onUpdateBookmarks,
  onUpdateTitle,
}) => {
  const bookmarks = node.content.bookmarks || [];
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newThumbnail, setNewThumbnail] = useState('');

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const newBookmark: BookmarkItem = {
      id: `bm-${Date.now()}`,
      title: newTitle.trim(),
      url: newUrl.trim(),
      visitedOn: new Date().toLocaleString(),
      notes: newNotes.trim() || 'No additional notes provided.',
      thumbnailUrl: newThumbnail.trim() || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
    };

    const updated = [...bookmarks, newBookmark];
    onUpdateBookmarks(updated);
    setNewTitle('');
    setNewUrl('');
    setNewNotes('');
    setNewThumbnail('');
    setIsAdding(false);
  };

  const handleDeleteBookmark = (id: string) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    onUpdateBookmarks(updated);
  };

  return (
    <div id="bookmark-editor-container" className="flex-1 flex flex-col bg-white overflow-y-auto p-6 text-xs text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 select-none">
        <input
          type="text"
          value={node.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          className="text-xl font-bold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 flex-1 mr-4 font-sans"
        />
        <span className="text-xs text-slate-500 font-mono">
          Created: {node.created || '4 January 2012'}
        </span>
      </div>

      {/* Callout Bubble matching screenshot 4 */}
      <div className="bg-amber-50 border border-amber-300 text-amber-950 p-3.5 rounded-lg text-xs max-w-lg mb-4 shadow-sm relative">
        <strong className="block font-semibold mb-1 text-amber-900">
          Webページのサムネイル付きブックマークをキャプチャ: Ctrl+Shift+F7!
        </strong>
        <p className="leading-relaxed">
          ブラウジング中にブックマークをサムネイル画像や自動抽出されたメタデータと一緒にノートへ直接キャプチャして保管できます。
        </p>
      </div>

      {/* Add New Bookmark Form Modal/Panel */}
      <div className="mb-4 flex items-center justify-between">
        <span className="font-bold text-slate-700 text-sm">保存済みWebブックマーク ({bookmarks.length}件)</span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Webブックマークを追加</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddBookmark} className="mb-6 p-4 bg-slate-50 border border-slate-300 rounded-lg space-y-3 shadow-inner">
          <div className="font-bold text-slate-800 text-xs">新規Webブックマークの追加</div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">ページタイトル *</label>
            <input
              type="text"
              placeholder="例: Flask 公式ドキュメント"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">対象URL *</label>
            <input
              type="url"
              placeholder="https://flask.palletsprojects.com/"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              required
              className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">メモ / 説明</label>
            <textarea
              placeholder="リソースの要約や参照メモ..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={2}
              className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold">ブックマークを保存</button>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-600 px-3 py-1 text-xs">キャンセル</button>
          </div>
        </form>
      )}

      {/* Bookmark Cards (layout matching screenshot 4) */}
      <div className="space-y-4">
        {bookmarks.map((bm) => (
          <div key={bm.id} className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-2xs">
            {/* Header Banner */}
            <div className="bg-slate-300/80 px-3 py-1.5 font-bold text-slate-800 text-xs flex items-center justify-between border-b border-slate-300">
              <span className="flex items-center space-x-1.5">
                <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                <span>Webブックマーク</span>
              </span>
              <button
                onClick={() => handleDeleteBookmark(bm.id)}
                title="ブックマークを削除"
                className="text-slate-500 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content Table / Grid */}
            <div className="p-3 flex flex-col sm:flex-row gap-4">
              {/* Thumbnail */}
              {bm.thumbnailUrl && (
                <div className="w-full sm:w-44 h-28 bg-slate-100 border border-slate-200 rounded overflow-hidden shrink-0 shadow-2xs">
                  <img
                    src={bm.thumbnailUrl}
                    alt={bm.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Details */}
              <div className="flex-1 space-y-1.5 text-xs">
                <div>
                  <strong className="text-slate-600 mr-2">タイトル:</strong>
                  <span className="font-semibold text-slate-900">{bm.title}</span>
                </div>

                <div className="text-slate-600">
                  <strong className="text-slate-600 mr-2">訪問日時:</strong>
                  <span className="font-mono text-[11px] text-slate-700">{bm.visitedOn}</span>
                </div>

                <div className="text-slate-700">
                  <strong className="text-slate-600 mr-2">メモ:</strong>
                  <span className="text-slate-800">{bm.notes}</span>
                </div>

                <div className="pt-1 flex items-center space-x-1">
                  <strong className="text-slate-600 mr-2">リンク先:</strong>
                  <a
                    href={bm.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-mono text-[11px] flex items-center space-x-1 truncate max-w-md"
                  >
                    <span>{bm.url}</span>
                    <ExternalLink className="w-3 h-3 inline shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
