import React, { useState, useMemo } from 'react';
import { TagItem, TreeNode, SearchResult, Notebook, SentenceBookmark, FigureCaption } from '../types';
import { 
  Search, Tag, History, FileEdit, Plus, Trash2, Edit3, 
  ChevronRight, ExternalLink, Filter, Sparkles, Check, Bookmark,
  Star, ArrowUpDown, X, BookOpen, Lock, Table, Code, FileText,
  Copy, CornerDownRight, Quote, MessageSquare, Captions
} from 'lucide-react';

export type ResourcePanelTab = '検索' | 'タグ' | 'ブックマーク' | '履歴' | 'メモ' | '図表';

interface ResourcePanelProps {
  tags: TagItem[];
  nodes: Record<string, TreeNode>;
  activeNode: TreeNode | null;
  history: Array<{ nodeId: string; title: string; visitedAt: string }>;
  notebooks?: Notebook[];
  activeTab?: ResourcePanelTab;
  onTabChange?: (tab: ResourcePanelTab) => void;
  onSelectNode: (nodeId: string) => void;
  onToggleTagOnActiveNode: (tagName: string) => void;
  onFilterTreeByTag: (tagName: string | null) => void;
  selectedTagFilter: string | null;
  onAddTag: (name: string, color?: string, icon?: string) => void;
  onToggleBookmark: (nodeId: string) => void;
  onClearAllBookmarks?: () => void;
  isBookmarkFiltered?: boolean;
  onToggleBookmarkFilter?: () => void;
  sentenceBookmarks?: SentenceBookmark[];
  figureCaptions?: FigureCaption[];
  onSelectSentenceBookmark?: (bookmark: SentenceBookmark) => void;
  onDeleteSentenceBookmark?: (bookmarkId: string) => void;
  onUpdateSentenceBookmark?: (bookmark: SentenceBookmark) => void;
  onEditFigureCaption?: (captionId: string, label: string, title: string) => void;
  onDeleteFigureCaption?: (captionId: string) => void;
}

export const ResourcePanel: React.FC<ResourcePanelProps> = ({
  tags,
  nodes,
  activeNode,
  history,
  notebooks = [],
  activeTab: controlledTab,
  onTabChange,
  onSelectNode,
  onToggleTagOnActiveNode,
  onFilterTreeByTag,
  selectedTagFilter,
  onAddTag,
  onToggleBookmark,
  onClearAllBookmarks,
  isBookmarkFiltered,
  onToggleBookmarkFilter,
  sentenceBookmarks = [],
  figureCaptions = [],
  onSelectSentenceBookmark,
  onDeleteSentenceBookmark,
  onUpdateSentenceBookmark,
  onEditFigureCaption,
  onDeleteFigureCaption,
}) => {
  const [internalTab, setInternalTab] = useState<ResourcePanelTab>('ブックマーク');
  const activeTab = controlledTab || internalTab;

  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [editCaptionLabel, setEditCaptionLabel] = useState('');
  const [editCaptionTitle, setEditCaptionTitle] = useState('');
  const [deletingCaptionId, setDeletingCaptionId] = useState<string | null>(null);

  const handleTabClick = (tab: ResourcePanelTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [showTagSuggestDropdown, setShowTagSuggestDropdown] = useState(false);
  const [fullSearchQuery, setFullSearchQuery] = useState('');
  const [bookmarkSearchQuery, setBookmarkSearchQuery] = useState('');
  const [bookmarkSort, setBookmarkSort] = useState<'date' | 'title' | 'type'>('date');
  const [bookmarkTypeFilter, setBookmarkTypeFilter] = useState<'all' | 'notes' | 'sentences'>('all');
  const [copiedSentenceId, setCopiedSentenceId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<string>('');

  const [scratchText, setScratchText] = useState(
    '一時スクラッチメモ...\n- Flask サーバー起動 (ポート 5000)\n- SQLAlchemy ツリー CTE クエリ検証\n- CSV エクスポート機能確認'
  );
  const [newTagName, setNewTagName] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Filtered tags for auto-complete dropdown
  const tagSuggestions = tags.filter((t) =>
    t.name.toLowerCase().startsWith(tagSearchQuery.toLowerCase())
  );

  // List of all bookmarked nodes
  const bookmarkedNodes = useMemo(() => {
    return (Object.values(nodes) as TreeNode[]).filter((n) => Boolean(n.isBookmarked));
  }, [nodes]);

  // Filtered and sorted note bookmarks
  const filteredNoteBookmarks = useMemo(() => {
    let list = [...bookmarkedNodes];
    if (bookmarkSearchQuery.trim()) {
      const q = bookmarkSearchQuery.toLowerCase();
      list = list.filter((b) => 
        b.title.toLowerCase().includes(q) || 
        b.tags.some((t) => t.toLowerCase().includes(q)) ||
        (b.notebookId && b.notebookId.toLowerCase().includes(q))
      );
    }

    if (bookmarkSort === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (bookmarkSort === 'type') {
      list.sort((a, b) => a.type.localeCompare(b.type));
    } else {
      // date (bookmarkedAt or created)
      list.sort((a, b) => (b.bookmarkedAt || b.created || '').localeCompare(a.bookmarkedAt || a.created || ''));
    }
    return list;
  }, [bookmarkedNodes, bookmarkSearchQuery, bookmarkSort]);

  // Filtered and sorted sentence bookmarks
  const filteredSentenceBookmarks = useMemo(() => {
    let list = [...sentenceBookmarks];
    if (bookmarkSearchQuery.trim()) {
      const q = bookmarkSearchQuery.toLowerCase();
      list = list.filter((s) => 
        s.text.toLowerCase().includes(q) ||
        s.noteTitle.toLowerCase().includes(q) ||
        (s.comment && s.comment.toLowerCase().includes(q)) ||
        (s.notebookId && s.notebookId.toLowerCase().includes(q))
      );
    }

    if (bookmarkSort === 'title') {
      list.sort((a, b) => a.text.localeCompare(b.text));
    } else if (bookmarkSort === 'type') {
      list.sort((a, b) => a.noteTitle.localeCompare(b.noteTitle));
    } else {
      // date
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
    return list;
  }, [sentenceBookmarks, bookmarkSearchQuery, bookmarkSort]);

  const totalBookmarksCount = bookmarkedNodes.length + sentenceBookmarks.length;

  const handleCopySentence = (e: React.MouseEvent, id: string, text: string) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopiedSentenceId(id);
    setTimeout(() => {
      setCopiedSentenceId(null);
    }, 2000);
  };

  const handleSaveComment = (sbm: SentenceBookmark) => {
    if (onUpdateSentenceBookmark) {
      onUpdateSentenceBookmark({
        ...sbm,
        comment: commentInput.trim() || undefined,
      });
    }
    setEditingCommentId(null);
  };

  // Helper to find notebook name
  const getNotebookName = (nbId: string) => {
    const nb = notebooks.find((n) => n.id === nbId);
    return nb ? nb.name : nbId;
  };

  // Helper icon for node type
  const getNodeTypeIcon = (node: TreeNode) => {
    if (node.isEncrypted) return <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    switch (node.type) {
      case 'spreadsheet':
        return <Table className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'code':
        return <Code className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
      case 'bookmark':
        return <Bookmark className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  // Perform full-text search across all nodes
  const searchResults: SearchResult[] = [];
  if (fullSearchQuery.trim()) {
    const q = fullSearchQuery.toLowerCase();
    (Object.values(nodes) as TreeNode[]).forEach((n) => {
      let matched = false;
      let snippet = '';
      let matchType: 'title' | 'content' | 'tag' | 'spreadsheet' = 'title';

      if (n.title.toLowerCase().includes(q)) {
        matched = true;
        matchType = 'title';
        snippet = `タイトル一致: "${n.title}"`;
      } else if (n.tags.some((t) => t.toLowerCase().includes(q))) {
        matched = true;
        matchType = 'tag';
        snippet = `タグ一致: ${n.tags.join(', ')}`;
      } else if (n.content.richHtml && n.content.richHtml.toLowerCase().includes(q)) {
        matched = true;
        matchType = 'content';
        const clean = n.content.richHtml.replace(/<[^>]*>?/gm, ' ');
        const idx = clean.toLowerCase().indexOf(q);
        snippet = clean.substring(Math.max(0, idx - 30), Math.min(clean.length, idx + 70)) + '...';
      } else if (n.content.code && n.content.code.code.toLowerCase().includes(q)) {
        matched = true;
        matchType = 'content';
        snippet = `コード抜粋: ${n.content.code.code.substring(0, 80)}...`;
      }

      if (matched) {
        searchResults.push({
          nodeId: n.id,
          notebookId: n.notebookId,
          notebookName: getNotebookName(n.notebookId),
          title: n.title,
          type: n.type,
          matchType,
          snippet,
        });
      }
    });
  }

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    onAddTag(newTagName.trim(), '#3b82f6', '🏷️');
    setNewTagName('');
    setIsAddingTag(false);
  };

  const tabs: ResourcePanelTab[] = ['検索', 'タグ', 'ブックマーク', '図表', '履歴', 'メモ'];

  return (
    <div id="resource-panel" className="w-80 bg-slate-100 border-l border-slate-300 flex flex-col shrink-0 select-none text-xs">
      {/* Resource Panel Top Tab Header */}
      <div className="flex items-center bg-slate-200 border-b border-slate-300 px-1 pt-1 gap-0.5 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              id={`resource-tab-${tab}`}
              onClick={() => handleTabClick(tab)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-t transition flex items-center space-x-1 shrink-0 ${
                isActive
                  ? 'bg-white text-blue-700 border-t-2 border-t-blue-600 border-l border-r border-slate-300 -mb-[1px] z-10 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60'
              }`}
            >
              {tab === 'ブックマーク' && <Star className={`w-3 h-3 ${isActive ? 'text-amber-500 fill-amber-400' : 'text-slate-500'}`} />}
              {tab === '図表' && <Captions className={`w-3 h-3 ${isActive ? 'text-emerald-500' : 'text-slate-500'}`} />}
              <span>{tab}</span>
              {tab === 'ブックマーク' && totalBookmarksCount > 0 && (
                <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${isActive ? 'bg-amber-100 text-amber-800' : 'bg-slate-300 text-slate-700'}`}>
                  {totalBookmarksCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        
        {/* TAB: BOOKMARKS (★ ブックマーク) */}
        {activeTab === 'ブックマーク' && (
          <div className="flex-1 flex flex-col overflow-hidden p-2">
            {/* Header / Actions */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
              <div className="flex items-center space-x-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span className="text-[11px] font-bold text-slate-800">
                  ブックマーク一覧 ({totalBookmarksCount}件)
                </span>
              </div>

              <div className="flex items-center space-x-1">
                {onToggleBookmarkFilter && (
                  <button
                    onClick={onToggleBookmarkFilter}
                    title={isBookmarkFiltered ? 'ツリーのブックマーク絞り込みを解除' : 'ツリーをブックマークのみに絞り込む'}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition flex items-center space-x-1 ${
                      isBookmarkFiltered
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                    }`}
                  >
                    <Filter className="w-2.5 h-2.5" />
                    <span>{isBookmarkFiltered ? '絞込中' : 'ツリー絞込'}</span>
                  </button>
                )}

                {totalBookmarksCount > 0 && onClearAllBookmarks && (
                  <div className="relative">
                    <button
                      onClick={() => setDeletingCaptionId('all_bookmarks')}
                      title="全ブックマークを解除"
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {deletingCaptionId === 'all_bookmarks' && (
                      <div className="absolute top-full right-0 mt-1 z-20 bg-white shadow-lg border border-red-200 rounded-md p-2 w-48 text-center animate-in fade-in zoom-in-95">
                        <div className="text-[10px] font-medium text-slate-700 mb-2">すべてのブックマークを解除しますか？</div>
                        <div className="flex justify-center gap-2">
                          <button onClick={() => setDeletingCaptionId(null)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px]">キャンセル</button>
                          <button onClick={() => { onClearAllBookmarks(); setDeletingCaptionId(null); }} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-[10px]">解除する</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sub-filter Tabs: All / Notes / Sentences */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded border border-slate-200 mb-2 text-[11px]">
              <button
                onClick={() => setBookmarkTypeFilter('all')}
                className={`flex-1 py-0.5 rounded font-medium transition text-center ${
                  bookmarkTypeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                すべて ({totalBookmarksCount})
              </button>
              <button
                onClick={() => setBookmarkTypeFilter('notes')}
                className={`flex-1 py-0.5 rounded font-medium transition text-center flex items-center justify-center space-x-1 ${
                  bookmarkTypeFilter === 'notes'
                    ? 'bg-white text-amber-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-2.5 h-2.5 text-amber-500" />
                <span>ノート ({bookmarkedNodes.length})</span>
              </button>
              <button
                onClick={() => setBookmarkTypeFilter('sentences')}
                className={`flex-1 py-0.5 rounded font-medium transition text-center flex items-center justify-center space-x-1 ${
                  bookmarkTypeFilter === 'sentences'
                    ? 'bg-white text-blue-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Quote className="w-2.5 h-2.5 text-blue-500" />
                <span>文章 ({sentenceBookmarks.length})</span>
              </button>
            </div>

            {/* Bookmark Search & Sort Bar */}
            <div className="space-y-1.5 mb-2">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ノート名・文章・メモ内を検索..."
                  value={bookmarkSearchQuery}
                  onChange={(e) => setBookmarkSearchQuery(e.target.value)}
                  className="w-full pl-6.5 pr-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white"
                />
                {bookmarkSearchQuery && (
                  <button
                    onClick={() => setBookmarkSearchQuery('')}
                    className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 px-0.5">
                <span>並び替え:</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setBookmarkSort('date')}
                    className={`px-1.5 py-0.5 rounded ${bookmarkSort === 'date' ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-slate-100'}`}
                  >
                    登録順
                  </button>
                  <button
                    onClick={() => setBookmarkSort('title')}
                    className={`px-1.5 py-0.5 rounded ${bookmarkSort === 'title' ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-slate-100'}`}
                  >
                    名前順
                  </button>
                  <button
                    onClick={() => setBookmarkSort('type')}
                    className={`px-1.5 py-0.5 rounded ${bookmarkSort === 'type' ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-slate-100'}`}
                  >
                    ノート別
                  </button>
                </div>
              </div>
            </div>

            {/* Bookmark Combined List */}
            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded p-1 bg-slate-50/50">
              
              {/* SECTION: NOTE BOOKMARKS */}
              {(bookmarkTypeFilter === 'all' || bookmarkTypeFilter === 'notes') && filteredNoteBookmarks.length > 0 && (
                <div className="space-y-1">
                  {bookmarkTypeFilter === 'all' && (
                    <div className="flex items-center justify-between px-1.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100/80 rounded">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                        ノートブックマーク ({filteredNoteBookmarks.length})
                      </span>
                    </div>
                  )}

                  <div className="divide-y divide-slate-100 bg-white rounded border border-slate-200 shadow-2xs">
                    {filteredNoteBookmarks.map((node) => {
                      const isActive = activeNode?.id === node.id;
                      const notebookName = getNotebookName(node.notebookId);

                      return (
                        <div
                          key={node.id}
                          onClick={() => onSelectNode(node.id)}
                          className={`p-2 hover:bg-amber-50/60 cursor-pointer transition flex items-start justify-between gap-1.5 group ${
                            isActive ? 'bg-amber-100/70 border-l-3 border-l-amber-500' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center space-x-1.5">
                              {getNodeTypeIcon(node)}
                              <span className={`truncate text-xs font-medium ${isActive ? 'text-amber-950 font-bold' : 'text-slate-800'}`}>
                                {node.title}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                              <span className="bg-slate-100 px-1 py-0.2 rounded text-slate-600 truncate max-w-[120px]">
                                {notebookName}
                              </span>
                              {node.colorBadge && (
                                <span
                                  className="w-2 h-2 rounded-full border border-slate-300 inline-block"
                                  style={{ backgroundColor: node.colorBadge }}
                                />
                              )}
                              {node.tags && node.tags.length > 0 && (
                                <span className="text-slate-400 truncate max-w-[100px]">
                                  🏷️ {node.tags[0]}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Unstar / remove button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleBookmark(node.id);
                            }}
                            title="ノートブックマークを解除"
                            className="p-1 rounded text-amber-500 hover:text-red-500 hover:bg-white transition opacity-70 group-hover:opacity-100"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION: SENTENCE BOOKMARKS */}
              {(bookmarkTypeFilter === 'all' || bookmarkTypeFilter === 'sentences') && filteredSentenceBookmarks.length > 0 && (
                <div className="space-y-1">
                  {bookmarkTypeFilter === 'all' && (
                    <div className="flex items-center justify-between px-1.5 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50/80 rounded border border-blue-100">
                      <span className="flex items-center gap-1">
                        <Quote className="w-3 h-3 text-blue-600" />
                        文章ブックマーク ({filteredSentenceBookmarks.length})
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {filteredSentenceBookmarks.map((sbm) => {
                      const isCurrentNode = activeNode?.id === sbm.nodeId;
                      const isEditing = editingCommentId === sbm.id;

                      return (
                        <div
                          key={sbm.id}
                          onClick={() => {
                            if (onSelectSentenceBookmark) {
                              onSelectSentenceBookmark(sbm);
                            } else {
                              onSelectNode(sbm.nodeId);
                            }
                          }}
                          className={`p-2 bg-white rounded border border-slate-200 hover:border-blue-300 hover:shadow-xs transition cursor-pointer group relative ${
                            isCurrentNode ? 'border-l-3 border-l-blue-500 bg-blue-50/20' : ''
                          }`}
                        >
                          {/* Top: Parent Note Info & Actions */}
                          <div className="flex items-center justify-between gap-1 mb-1 text-[10px]">
                            <div className="flex items-center space-x-1 min-w-0">
                              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold inline-flex items-center gap-0.5 shrink-0">
                                🔖 抜粋
                              </span>
                              <span className="font-semibold text-slate-700 truncate max-w-[130px]" title={sbm.noteTitle}>
                                {sbm.noteTitle}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0 opacity-80 group-hover:opacity-100">
                              {/* Copy Text Button */}
                              <button
                                onClick={(e) => handleCopySentence(e, sbm.id, sbm.text)}
                                title="文章をクリップボードにコピー"
                                className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                              >
                                {copiedSentenceId === sbm.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>

                              {/* Edit Memo/Comment Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCommentId(sbm.id);
                                  setCommentInput(sbm.comment || '');
                                }}
                                title="メモ・コメントを編集"
                                className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>

                              {/* Delete Sentence Bookmark */}
                              {onDeleteSentenceBookmark && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSentenceBookmark(sbm.id);
                                  }}
                                  title="文章ブックマークを解除"
                                  className="p-0.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Sentence Content Box */}
                          <div className="relative pl-2.5 py-1 text-xs text-slate-800 border-l-2 border-amber-400 bg-amber-50/40 rounded-r text-[11px] leading-relaxed select-text font-serif italic mb-1">
                            "{sbm.text}"
                          </div>

                          {/* Comment or Edit Comment Form */}
                          {isEditing ? (
                            <div className="mt-1.5 p-1.5 bg-slate-50 border border-slate-300 rounded space-y-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder="メモ・備考を入力..."
                                autoFocus
                                className="w-full px-1.5 py-0.5 text-[11px] bg-white border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveComment(sbm);
                                  if (e.key === 'Escape') setEditingCommentId(null);
                                }}
                              />
                              <div className="flex justify-end gap-1 text-[10px]">
                                <button
                                  onClick={() => setEditingCommentId(null)}
                                  className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                                >
                                  キャンセル
                                </button>
                                <button
                                  onClick={() => handleSaveComment(sbm)}
                                  className="px-1.5 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700 font-bold"
                                >
                                  保存
                                </button>
                              </div>
                            </div>
                          ) : sbm.comment ? (
                            <div className="mt-1 text-[10px] text-slate-600 flex items-start gap-1 bg-slate-100/70 px-1.5 py-0.5 rounded">
                              <MessageSquare className="w-2.5 h-2.5 text-slate-400 shrink-0 mt-0.5" />
                              <span className="truncate">{sbm.comment}</span>
                            </div>
                          ) : null}

                          {/* Bottom Jump Indicator */}
                          <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400">
                            <span>{sbm.createdAt ? new Date(sbm.createdAt).toLocaleDateString('ja-JP') : ''}</span>
                            <span className="inline-flex items-center gap-0.5 text-blue-600 group-hover:underline font-medium">
                              <span>本文へジャンプ</span>
                              <CornerDownRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* EMPTY STATES */}
              {totalBookmarksCount === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs space-y-2 bg-white rounded border border-slate-200">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center border border-amber-200">
                    <Star className="w-5 h-5 fill-amber-200" />
                  </div>
                  <div className="font-bold text-slate-700">ブックマークはありません</div>
                  <div className="text-[11px] text-slate-500 leading-relaxed text-left space-y-1.5 bg-slate-50 p-2.5 rounded border border-slate-200">
                    <div className="font-semibold text-slate-800">💡 2種類のブックマークに対応しています:</div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">1. ノート単位:</span>
                      <span>ツールバーの <Star className="w-3 h-3 inline fill-amber-400 text-amber-500" /> ボタン、または <code className="bg-white px-1 py-0.2 rounded border font-mono font-bold text-blue-700">Ctrl + D</code></span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold">2. 文章単位:</span>
                      <span>文章を選択して <code className="bg-white px-1 py-0.2 rounded border font-mono font-bold text-blue-700">Ctrl + Shift + D</code>、またはツールバーの <Quote className="w-3 h-3 inline text-blue-600" /> ボタン</span>
                    </div>
                  </div>
                </div>
              ) : (filteredNoteBookmarks.length === 0 && filteredSentenceBookmarks.length === 0) ? (
                <div className="p-4 text-center text-slate-400 text-xs bg-white rounded border border-slate-200">
                  検索条件に一致するブックマークはありません。
                </div>
              ) : null}
            </div>

            {/* Quick Helper Banner */}
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <span>⭐ ショートカット:</span>
                <code className="bg-white/80 px-1 rounded border border-amber-300 font-mono font-bold">Ctrl+D</code>
              </span>
              <span className="text-[10px] text-amber-700">登録/解除を瞬時に切替</span>
            </div>
          </div>
        )}

        {/* TAB 1: TAGS */}
        {activeTab === 'タグ' && (
          <div className="flex-1 flex flex-col overflow-hidden p-2">
            {/* Tag Action Toolbar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsAddingTag(!isAddingTag)}
                  title="新規タグを追加"
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-emerald-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold text-slate-700 ml-1">タグ一覧</span>
              </div>

              {selectedTagFilter && (
                <button
                  onClick={() => onFilterTreeByTag(null)}
                  className="text-[10px] bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-1.5 py-0.5 rounded font-medium"
                >
                  フィルタ解除
                </button>
              )}
            </div>

            {/* Add Tag Form if open */}
            {isAddingTag && (
              <form onSubmit={handleCreateTag} className="mb-2 p-2 bg-slate-50 border border-slate-200 rounded space-y-1.5">
                <input
                  type="text"
                  placeholder="新しいタグ名を入力..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  autoFocus
                  className="w-full text-xs p-1 bg-white border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex justify-end space-x-1">
                  <button type="submit" className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-medium">保存</button>
                  <button type="button" onClick={() => setIsAddingTag(false)} className="text-[10px] text-slate-500">キャンセル</button>
                </div>
              </form>
            )}

            {/* Tag Auto-complete Search Box */}
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="タグを検索 (例: In, レシピ)..."
                value={tagSearchQuery}
                onChange={(e) => {
                  setTagSearchQuery(e.target.value);
                  setShowTagSuggestDropdown(true);
                }}
                onFocus={() => setShowTagSuggestDropdown(true)}
                className="w-full text-xs px-2 py-1 bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />

              {/* Dropdown Suggestions */}
              {showTagSuggestDropdown && tagSearchQuery.trim() && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-300 rounded shadow-lg z-50 divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {tagSuggestions.length > 0 ? (
                    tagSuggestions.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onFilterTreeByTag(t.name);
                          setShowTagSuggestDropdown(false);
                        }}
                        className="p-1.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-slate-800">{t.name}</span>
                        <span className="text-slate-400 text-[10px]">({t.count})</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-[11px] text-slate-400">一致するタグはありません</div>
                  )}
                </div>
              )}
            </div>

            {/* Tag List Tree with counts */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded">
              {tags.map((tag) => {
                const isAssigned = activeNode?.tags.includes(tag.name);
                const isFiltered = selectedTagFilter === tag.name;

                return (
                  <div
                    key={tag.id}
                    className={`flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 transition cursor-pointer ${
                      isFiltered ? 'bg-blue-100 text-blue-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div
                      onClick={() => onFilterTreeByTag(isFiltered ? null : tag.name)}
                      className="flex items-center space-x-1.5 flex-1 truncate"
                    >
                      <span className="text-xs">{tag.icon || '🏷️'}</span>
                      <span className="truncate text-[11px]">{tag.name}</span>
                      <span className="text-slate-400 text-[10px]">({tag.count})</span>
                    </div>

                    {/* Checkbox to assign/remove tag to active note */}
                    {activeNode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTagOnActiveNode(tag.name);
                        }}
                        title={isAssigned ? 'このノートからタグを解除' : 'このノートにタグを付与'}
                        className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] transition ${
                          isAssigned
                            ? 'bg-blue-600 border-blue-700 text-white'
                            : 'border-slate-300 text-transparent hover:border-slate-400'
                        }`}
                      >
                        ✓
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SEARCH (Full-Text) */}
        {activeTab === '検索' && (
          <div className="flex-1 flex flex-col overflow-hidden p-2">
            <div className="mb-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">ノート全文検索</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="全ノートブックを横断検索..."
                  value={fullSearchQuery}
                  onChange={(e) => setFullSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-7 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded p-1">
              {searchResults.length > 0 ? (
                searchResults.map((res, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectNode(res.nodeId)}
                    className="p-2 hover:bg-blue-50 cursor-pointer rounded transition space-y-0.5"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-blue-700">
                      <span className="truncate">{res.title}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded uppercase">{res.type}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{res.snippet}</p>
                  </div>
                ))
              ) : fullSearchQuery.trim() ? (
                <div className="p-4 text-center text-slate-400 text-xs">該当するノートが見つかりませんでした。</div>
              ) : (
                <div className="p-4 text-center text-slate-400 text-xs">キーワードを入力してタイトル・本文・タグを検索します。</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: HISTORY */}
        {activeTab === '履歴' && (
          <div className="flex-1 flex flex-col overflow-hidden p-2">
            <div className="font-bold text-slate-700 text-xs mb-2 flex items-center space-x-1">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>最近の閲覧履歴</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded">
              {history.map((h, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectNode(h.nodeId)}
                  className="p-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs"
                >
                  <span className="truncate font-medium text-slate-800">{h.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{h.visitedAt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: FIGURE CAPTIONS */}
        {activeTab === '図表' && (
          <div className="flex-1 flex flex-col overflow-hidden p-2">
            <div className="font-bold text-slate-700 text-xs mb-2 flex items-center space-x-1">
              <Captions className="w-3.5 h-3.5 text-slate-500" />
              <span>図表キャプション一覧</span>
            </div>
            
            {figureCaptions.length === 0 ? (
              <div className="text-center text-slate-500 my-4 text-[11px] leading-relaxed">
                ノート内に図表キャプションがありません。<br/>
                エディタ上部の「図表」ボタンから追加できます。
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                {figureCaptions.map(caption => (
                  <div
                    key={caption.id}
                    className="p-2 border rounded-md border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 transition-colors group relative"
                  >
                    {editingCaptionId === caption.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={editCaptionLabel}
                          onChange={(e) => setEditCaptionLabel(e.target.value)}
                          className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          placeholder="ラベル (例: 図1)"
                        />
                        <input
                          type="text"
                          value={editCaptionTitle}
                          onChange={(e) => setEditCaptionTitle(e.target.value)}
                          className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          placeholder="タイトル"
                        />
                        <div className="flex justify-end gap-1 mt-1">
                          <button
                            onClick={() => setEditingCaptionId(null)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onEditFigureCaption?.(caption.id, editCaptionLabel, editCaptionTitle);
                              setEditingCaptionId(null);
                            }}
                            className="p-1 text-emerald-500 hover:text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            if (activeNode?.id !== caption.nodeId) {
                              onSelectNode(caption.nodeId);
                              setTimeout(() => {
                                document.getElementById(caption.anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 300);
                            } else {
                              document.getElementById(caption.anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }}
                        >
                          <div className="text-[11px] font-bold text-emerald-700 mb-0.5 flex justify-between items-center pr-12">
                            <span>{caption.label}</span>
                            <span className="text-[9px] text-emerald-500 font-normal">{nodes[caption.nodeId]?.title || '不明'}</span>
                          </div>
                          <div className="text-xs text-slate-700 truncate pr-12" title={caption.title}>
                            {caption.title}
                          </div>
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute top-2 right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-100/80 rounded backdrop-blur-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditCaptionLabel(caption.label);
                              setEditCaptionTitle(caption.title);
                              setEditingCaptionId(caption.id);
                            }}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-200 rounded transition-colors"
                            title="編集"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingCaptionId(caption.id);
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                    {deletingCaptionId === caption.id && (
                      <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-[1px] flex flex-col justify-center items-center rounded-md border border-red-200 p-2 text-center animate-in fade-in zoom-in-95 duration-200">
                        <span className="text-[10px] text-slate-700 mb-2 font-medium">この図表キャプションを削除しますか？<br/><span className="text-red-500 text-[9px]">（エディタからも消えます）</span></span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeletingCaptionId(null)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-medium"
                          >
                            キャンセル
                          </button>
                          <button
                            onClick={() => {
                              onDeleteFigureCaption?.(caption.id);
                              setDeletingCaptionId(null);
                            }}
                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-medium shadow-xs"
                          >
                            削除する
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SCRATCH */}
        {activeTab === 'メモ' && (
          <div className="flex-1 flex flex-col overflow-hidden p-2">
            <div className="font-bold text-slate-700 text-xs mb-1 flex items-center justify-between">
              <span>スクラッチパッド</span>
              <span className="text-[10px] text-emerald-600 font-medium">自動保存中</span>
            </div>
            <textarea
              value={scratchText}
              onChange={(e) => setScratchText(e.target.value)}
              placeholder="一時的なアイデアやTODO、コードスニペットを自由にメモできます..."
              className="flex-1 p-2 bg-amber-50/40 border border-amber-200 rounded text-xs font-mono resize-none focus:outline-hidden focus:ring-1 focus:ring-amber-400 leading-relaxed shadow-inner"
            />
          </div>
        )}
      </div>
    </div>
  );
};
