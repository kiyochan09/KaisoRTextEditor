import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TreeNode, Notebook, NoteType } from '../types';
import { 
  Search, Globe, FileText, Table, Code, Bookmark, Lock, 
  ChevronRight, Folder, X, ExternalLink, Calendar, Hash, ArrowRight, CornerDownLeft
} from 'lucide-react';

interface GlobalSearchResult {
  nodeId: string;
  node: TreeNode;
  notebookName: string;
  folderPath: string[];
  matchType: 'title' | 'content' | 'tag';
  snippet: string;
  matchesCount: number;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Record<string, TreeNode>;
  notebooks: Notebook[];
  activeNotebookId: string;
  onSelectNode: (nodeId: string, initialQuery?: string) => void;
  initialQuery?: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  nodes,
  notebooks,
  activeNotebookId,
  onSelectNode,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState<'all' | 'current'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | NoteType>('all');
  const [targetField, setTargetField] = useState<'all' | 'title' | 'content' | 'tags'>('all');
  const [matchCase, setMatchCase] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Sync initial query when opened
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery || '');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialQuery]);

  // Compute folder paths for all nodes
  const nodePaths = useMemo(() => {
    const paths: Record<string, string[]> = {};

    const getPath = (id: string): string[] => {
      const node = nodes[id];
      if (!node) return [];
      if (node.parentId && nodes[node.parentId]) {
        return [...getPath(node.parentId), nodes[node.parentId].title];
      }
      return [];
    };

    Object.keys(nodes).forEach((id) => {
      paths[id] = getPath(id);
    });

    return paths;
  }, [nodes]);

  // Helper to extract text from different node types
  const extractNodePlainText = (node: TreeNode): string => {
    if (node.type === 'rich') {
      const div = document.createElement('div');
      div.innerHTML = node.content.richHtml || '';
      return div.innerText || '';
    } else if (node.type === 'code') {
      return node.content.code?.code || '';
    } else if (node.type === 'spreadsheet' && node.content.spreadsheet) {
      return node.content.spreadsheet.rows
        .map((r) => r.map((c) => c.value).join(' '))
        .concat(node.content.spreadsheet.headers)
        .join(' ');
    } else if (node.type === 'bookmark' && node.content.bookmarks) {
      return node.content.bookmarks
        .map((b) => `${b.title} ${b.url} ${b.notes || ''}`)
        .join(' ');
    } else if (node.type === 'encrypted') {
      return node.content.plainText || '';
    }
    return '';
  };

  // Perform search across the database
  const searchResults = useMemo<GlobalSearchResult[]>(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const searchTarget = matchCase ? trimmed : trimmed.toLowerCase();
    const results: GlobalSearchResult[] = [];

    const notebookMap = new Map<string, string>();
    notebooks.forEach((nb) => notebookMap.set(nb.id, nb.name));

    (Object.values(nodes) as TreeNode[]).forEach((node: TreeNode) => {
      // 1. Check Scope
      if (scope === 'current' && node.notebookId !== activeNotebookId) {
        return;
      }

      // 2. Check Type Filter
      if (typeFilter !== 'all' && node.type !== typeFilter) {
        return;
      }

      const title = node.title;
      const titleCompare = matchCase ? title : title.toLowerCase();
      const plainText = extractNodePlainText(node);
      const textCompare = matchCase ? plainText : plainText.toLowerCase();
      const tags = node.tags || [];
      const tagsString = tags.join(' ');
      const tagsCompare = matchCase ? tagsString : tagsString.toLowerCase();

      let isMatch = false;
      let matchType: 'title' | 'content' | 'tag' = 'content';
      let snippet = '';
      let matchesCount = 0;

      // Check Title
      if (targetField === 'all' || targetField === 'title') {
        if (titleCompare.includes(searchTarget)) {
          isMatch = true;
          matchType = 'title';
          matchesCount++;
        }
      }

      // Check Content
      if (!isMatch && (targetField === 'all' || targetField === 'content')) {
        const idx = textCompare.indexOf(searchTarget);
        if (idx !== -1) {
          isMatch = true;
          matchType = 'content';
          // Count occurrences in content
          const occurrences = textCompare.split(searchTarget).length - 1;
          matchesCount += occurrences;

          // Generate snippet around match
          const start = Math.max(0, idx - 45);
          const end = Math.min(plainText.length, idx + searchTarget.length + 55);
          snippet = (start > 0 ? '...' : '') + plainText.substring(start, end).trim() + (end < plainText.length ? '...' : '');
        }
      }

      // Check Tags
      if (!isMatch && (targetField === 'all' || targetField === 'tags')) {
        if (tagsCompare.includes(searchTarget)) {
          isMatch = true;
          matchType = 'tag';
          snippet = `タグ一致: ${tags.join(', ')}`;
          matchesCount++;
        }
      }

      if (isMatch) {
        if (!snippet) {
          snippet = plainText.substring(0, 100).trim() || '（内容なし）';
        }

        results.push({
          nodeId: node.id,
          node,
          notebookName: notebookMap.get(node.notebookId) || 'メインノート',
          folderPath: nodePaths[node.id] || [],
          matchType,
          snippet,
          matchesCount: Math.max(1, matchesCount),
        });
      }
    });

    // Sort: Title matches first, then match count
    return results.sort((a, b) => {
      if (a.matchType === 'title' && b.matchType !== 'title') return -1;
      if (b.matchType === 'title' && a.matchType !== 'title') return 1;
      return b.matchesCount - a.matchesCount;
    });
  }, [query, nodes, notebooks, activeNotebookId, scope, typeFilter, targetField, matchCase, nodePaths]);

  // Handle jump to selected node
  const handleSelectResult = (nodeId: string) => {
    onSelectNode(nodeId, query);
    onClose();
  };

  // Keyboard navigation inside results list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelectResult(searchResults[selectedIndex].nodeId);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Highlight matched keyword in text
  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, matchCase ? 'g' : 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-amber-200 text-slate-900 font-bold px-0.5 rounded-xs">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getNodeTypeIcon = (type: NoteType) => {
    switch (type) {
      case 'rich':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'spreadsheet':
        return <Table className="w-4 h-4 text-emerald-600" />;
      case 'code':
        return <Code className="w-4 h-4 text-indigo-600" />;
      case 'bookmark':
        return <Bookmark className="w-4 h-4 text-amber-600" />;
      case 'encrypted':
        return <Lock className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getNodeTypeLabel = (type: NoteType) => {
    switch (type) {
      case 'rich': return 'リッチテキスト';
      case 'spreadsheet': return '表計算';
      case 'code': return 'コード';
      case 'bookmark': return 'ブックマーク';
      case 'encrypted': return '暗号化ノート';
      default: return 'ノート';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-16 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="global-search-modal"
        className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-2xl flex flex-col overflow-hidden text-slate-800 text-xs animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Header with Big Search Input */}
        <div className="p-3.5 bg-slate-900 text-white flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-sm">データベース全体検索 (Global Search)</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="DB内の全ノート・フォルダ・本文を高速検索... (↑↓で選択、Enterでジャンプ)"
              className="w-full h-10 pl-9 pr-24 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 text-xs text-slate-400 hover:text-white"
              >
                クリア
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
          {/* Scope Selector */}
          <div className="flex items-center space-x-1">
            <span className="font-semibold text-slate-700">対象:</span>
            <div className="flex bg-slate-200/80 p-0.5 rounded border border-slate-300">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                  scope === 'all' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                全ノートブック
              </button>
              <button
                type="button"
                onClick={() => setScope('current')}
                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                  scope === 'current' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                現在のノートブックのみ
              </button>
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-1">
            <span className="font-semibold text-slate-700">種類:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="h-6 px-1.5 bg-white border border-slate-300 rounded text-[11px] focus:outline-none"
            >
              <option value="all">すべての種類</option>
              <option value="rich">リッチテキスト</option>
              <option value="spreadsheet">表計算</option>
              <option value="code">ソースコード</option>
              <option value="bookmark">ブックマーク</option>
              <option value="encrypted">暗号化ノート</option>
            </select>
          </div>

          {/* Match Case */}
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span className="text-slate-700">大文字/小文字を区別</span>
          </label>
        </div>

        {/* Results List Area */}
        <div
          ref={resultsContainerRef}
          className="p-3 max-h-[380px] overflow-y-auto divide-y divide-slate-100 bg-white"
        >
          {!query.trim() ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p className="text-xs">キーワードを入力すると、DB内の全ノートから即座に検索します</p>
              <p className="text-[11px] text-slate-400">ショートカット: <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">Ctrl+Shift+F</kbd></p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <p className="text-sm font-semibold text-slate-600">一致するノートは見つかりませんでした</p>
              <p className="text-xs text-slate-400">キーワードを変更するか、フィルター条件を調整してください</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-500 px-2 py-1 flex items-center justify-between">
                <span>{searchResults.length} 件のノートが一致しました</span>
                <span className="text-[10px] text-slate-400">↑↓キーで移動 / Enterで開く</span>
              </div>

              {searchResults.map((result, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <div
                    key={result.nodeId}
                    onClick={() => handleSelectResult(result.nodeId)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-2.5 rounded-lg border transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-400 shadow-xs ring-1 ring-blue-300'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {/* Header: Notebook & Folder Breadcrumb */}
                    <div className="flex items-center space-x-1 text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold text-slate-700">{result.notebookName}</span>
                      {result.folderPath.length > 0 && (
                        <>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                          <span>{result.folderPath.join(' / ')}</span>
                        </>
                      )}
                    </div>

                    {/* Title and Badge */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        {getNodeTypeIcon(result.node.type)}
                        <span className="font-bold text-sm text-slate-900">
                          {highlightText(result.node.title, query)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                          {getNodeTypeLabel(result.node.type)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                        {result.matchesCount > 1 && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                            {result.matchesCount} 箇所一致
                          </span>
                        )}
                        <span className="flex items-center space-x-0.5 text-blue-600 font-medium">
                          <span>開く</span>
                          <CornerDownLeft className="w-3 h-3" />
                        </span>
                      </div>
                    </div>

                    {/* Context Snippet */}
                    <div className="text-[11px] text-slate-600 bg-slate-50/80 rounded p-1.5 border border-slate-100 font-sans leading-relaxed">
                      {highlightText(result.snippet, query)}
                    </div>

                    {/* Tags if present */}
                    {result.node.tags && result.node.tags.length > 0 && (
                      <div className="flex items-center space-x-1 mt-1.5">
                        <Hash className="w-3 h-3 text-slate-400" />
                        {result.node.tags.map((tag) => (
                          <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Esc</kbd> 閉じる
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Enter</kbd> ノートを開く
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Ctrl+F</kbd> タブ内検索
            </span>
          </div>

          <div className="text-slate-400">
            全 {Object.keys(nodes).length} ノートを対象
          </div>
        </div>

      </div>
    </div>
  );
};
