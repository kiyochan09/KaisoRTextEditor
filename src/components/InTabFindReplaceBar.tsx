import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TreeNode } from '../types';
import { 
  Search, Replace, ChevronUp, ChevronDown, X, 
  CaseSensitive, WholeWord, Regex, Globe, Check, AlertCircle 
} from 'lucide-react';

interface InTabFindReplaceBarProps {
  isOpen: boolean;
  isReplaceMode: boolean;
  onClose: () => void;
  onToggleReplaceMode: () => void;
  onOpenGlobalSearch: (initialQuery?: string) => void;
  editorContainerRef?: React.RefObject<HTMLElement | null>;
  activeNode: TreeNode | null;
  onUpdateContent?: (newContent: string) => void;
}

export const InTabFindReplaceBar: React.FC<InTabFindReplaceBarProps> = ({
  isOpen,
  isReplaceMode,
  onClose,
  onToggleReplaceMode,
  onOpenGlobalSearch,
  editorContainerRef,
  activeNode,
  onUpdateContent,
}) => {
  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [replaceNotification, setReplaceNotification] = useState<string | null>(null);

  const queryInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        queryInputRef.current?.focus();
        queryInputRef.current?.select();
      }, 50);
    }
  }, [isOpen, isReplaceMode]);

  // Strip HTML to plain text for counting and finding
  const getEditorText = useCallback((): string => {
    if (!activeNode) return '';
    if (activeNode.type === 'rich') {
      const temp = document.createElement('div');
      temp.innerHTML = activeNode.content.richHtml || '';
      return temp.innerText || '';
    } else if (activeNode.type === 'code') {
      return activeNode.content.code?.code || '';
    } else if (activeNode.type === 'encrypted') {
      return activeNode.content.plainText || '';
    }
    return '';
  }, [activeNode]);

  // Calculate matches count in active tab
  useEffect(() => {
    if (!isOpen || !query.trim() || !activeNode) {
      setMatchCount(0);
      setCurrentMatchIndex(0);
      return;
    }

    try {
      const text = getEditorText();
      let flags = matchCase ? 'g' : 'gi';
      let regex: RegExp;

      if (useRegex) {
        regex = new RegExp(query, flags);
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
        regex = new RegExp(pattern, flags);
      }

      const matches = text.match(regex);
      const count = matches ? matches.length : 0;
      setMatchCount(count);
      setCurrentMatchIndex(count > 0 ? 1 : 0);
    } catch {
      setMatchCount(0);
      setCurrentMatchIndex(0);
    }
  }, [query, matchCase, wholeWord, useRegex, isOpen, activeNode, getEditorText]);

  // Perform find next in DOM
  const handleFindNext = (backwards: boolean = false) => {
    if (!query.trim()) return;

    if (matchCount > 0) {
      setCurrentMatchIndex((prev) => {
        if (backwards) {
          return prev <= 1 ? matchCount : prev - 1;
        } else {
          return prev >= matchCount ? 1 : prev + 1;
        }
      });
    }

    // Try standard window.find if available
    try {
      if (typeof (window as any).find === 'function') {
        const found = (window as any).find(
          query,
          matchCase,
          backwards,
          true, // wrapAround
          wholeWord,
          false,
          false
        );
        if (found) {
          const sel = window.getSelection();
          if (sel && sel.anchorNode && sel.anchorNode.parentElement) {
            sel.anchorNode.parentElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
          return;
        }
      }
    } catch {
      // Fallback
    }
  };

  // Perform Single Replace
  const handleReplaceSingle = () => {
    if (!query.trim() || !activeNode) return;

    if (activeNode.type === 'rich') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        const selectedText = sel.toString();
        const matchesQuery = matchCase
          ? selectedText === query
          : selectedText.toLowerCase() === query.toLowerCase();

        if (matchesQuery) {
          document.execCommand('insertText', false, replaceText);
          setReplaceNotification('1箇所を置換しました');
          setTimeout(() => setReplaceNotification(null), 2500);
          handleFindNext(false);
          return;
        }
      }
      // If not currently selecting a match, find next first
      handleFindNext(false);
    } else if (activeNode.type === 'code' && onUpdateContent) {
      const currentCode = activeNode.content.code?.code || '';
      const idx = matchCase
        ? currentCode.indexOf(query)
        : currentCode.toLowerCase().indexOf(query.toLowerCase());

      if (idx !== -1) {
        const newCode =
          currentCode.substring(0, idx) +
          replaceText +
          currentCode.substring(idx + query.length);
        onUpdateContent(newCode);
        setReplaceNotification('1箇所を置換しました');
        setTimeout(() => setReplaceNotification(null), 2500);
      }
    }
  };

  // Perform Replace All
  const handleReplaceAll = () => {
    if (!query.trim() || !activeNode) return;

    let flags = matchCase ? 'g' : 'gi';
    let regex: RegExp;

    try {
      if (useRegex) {
        regex = new RegExp(query, flags);
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
        regex = new RegExp(pattern, flags);
      }
    } catch {
      return;
    }

    if (activeNode.type === 'rich' && onUpdateContent) {
      const currentHtml = activeNode.content.richHtml || '';
      // Safe replacement within text nodes in HTML
      const temp = document.createElement('div');
      temp.innerHTML = currentHtml;

      let replacedCount = 0;
      const walkAndReplace = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
          const original = node.nodeValue;
          if (regex.test(original)) {
            const matches = original.match(regex);
            if (matches) replacedCount += matches.length;
            node.nodeValue = original.replace(regex, replaceText);
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          for (let i = 0; i < node.childNodes.length; i++) {
            walkAndReplace(node.childNodes[i]);
          }
        }
      };

      walkAndReplace(temp);

      if (replacedCount > 0) {
        onUpdateContent(temp.innerHTML);
        setReplaceNotification(`${replacedCount}件 すべて置換しました`);
        setTimeout(() => setReplaceNotification(null), 3000);
      } else {
        setReplaceNotification('一致する項目が見つかりませんでした');
        setTimeout(() => setReplaceNotification(null), 2500);
      }
    } else if (activeNode.type === 'code' && onUpdateContent) {
      const currentCode = activeNode.content.code?.code || '';
      const matches = currentCode.match(regex);
      const replacedCount = matches ? matches.length : 0;
      if (replacedCount > 0) {
        const newCode = currentCode.replace(regex, replaceText);
        onUpdateContent(newCode);
        setReplaceNotification(`${replacedCount}件 すべて置換しました`);
        setTimeout(() => setReplaceNotification(null), 3000);
      } else {
        setReplaceNotification('一致する項目が見つかりませんでした');
        setTimeout(() => setReplaceNotification(null), 2500);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="in-tab-find-replace-bar"
      className="absolute top-2 right-6 z-40 bg-white/95 backdrop-blur-md border border-slate-300 rounded-lg shadow-xl p-2 text-xs text-slate-800 animate-in fade-in slide-in-from-top-2 w-84 sm:w-96 select-none"
    >
      {/* Top Search Input Row */}
      <div className="flex items-center space-x-1.5">
        <button
          type="button"
          onClick={onToggleReplaceMode}
          className={`p-1 rounded transition cursor-pointer ${
            isReplaceMode ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'
          }`}
          title={isReplaceMode ? '置換バーを閉じる' : '置換バーを開く (Ctrl+H)'}
        >
          <Replace className="w-3.5 h-3.5" />
        </button>

        <div className="relative flex-1 flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
          <input
            ref={queryInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) {
                  handleFindNext(true);
                } else {
                  handleFindNext(false);
                }
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="開いているタブ内を検索... (Enterで次へ)"
            className="w-full h-7 pl-7 pr-16 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {/* Match Count Badge */}
          <div className="absolute right-1.5 text-[10px] text-slate-500 font-mono">
            {query.trim() ? (
              matchCount > 0 ? (
                <span className="font-semibold text-blue-600">
                  {currentMatchIndex}/{matchCount}件
                </span>
              ) : (
                <span className="text-red-500">0件</span>
              )
            ) : null}
          </div>
        </div>

        {/* Previous / Next buttons */}
        <div className="flex items-center space-x-0.5">
          <button
            type="button"
            onClick={() => handleFindNext(true)}
            disabled={matchCount === 0}
            className="p-1 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="前の一致を検索 (Shift+Enter / Shift+F3)"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleFindNext(false)}
            disabled={matchCount === 0}
            className="p-1 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="次の一致を検索 (Enter / F3)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Global DB Search shortcut icon */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenGlobalSearch(query);
          }}
          className="p-1 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition cursor-pointer"
          title="ＤＢ全体を検索 (Ctrl+Shift+F)"
        >
          <Globe className="w-3.5 h-3.5" />
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          title="閉じる (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search Options (Case, Word, Regex) */}
      <div className="flex items-center justify-between px-1 mt-1 text-[11px] text-slate-600 border-t border-slate-100 pt-1">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setMatchCase(!matchCase)}
            className={`px-1.5 py-0.5 rounded flex items-center space-x-0.5 font-mono text-[10px] transition cursor-pointer ${
              matchCase ? 'bg-blue-100 border border-blue-400 text-blue-800 font-bold' : 'hover:bg-slate-100 text-slate-600'
            }`}
            title="大文字・小文字を区別"
          >
            <CaseSensitive className="w-3 h-3" />
            <span>Aa</span>
          </button>
          <button
            type="button"
            onClick={() => setWholeWord(!wholeWord)}
            className={`px-1.5 py-0.5 rounded flex items-center space-x-0.5 font-mono text-[10px] transition cursor-pointer ${
              wholeWord ? 'bg-blue-100 border border-blue-400 text-blue-800 font-bold' : 'hover:bg-slate-100 text-slate-600'
            }`}
            title="単語単位で一致"
          >
            <WholeWord className="w-3 h-3" />
            <span>\b</span>
          </button>
          <button
            type="button"
            onClick={() => setUseRegex(!useRegex)}
            className={`px-1.5 py-0.5 rounded flex items-center space-x-0.5 font-mono text-[10px] transition cursor-pointer ${
              useRegex ? 'bg-blue-100 border border-blue-400 text-blue-800 font-bold' : 'hover:bg-slate-100 text-slate-600'
            }`}
            title="正規表現を使用"
          >
            <Regex className="w-3 h-3" />
            <span>.*</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenGlobalSearch(query);
          }}
          className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 cursor-pointer"
        >
          <Globe className="w-3 h-3" />
          <span>DB全体を検索...</span>
        </button>
      </div>

      {/* Replace Row (when isReplaceMode is active) */}
      {isReplaceMode && (
        <div className="mt-2 pt-2 border-t border-slate-200 animate-in fade-in">
          <div className="flex items-center space-x-1.5">
            <div className="w-5 flex justify-center text-slate-400">
              <Replace className="w-3.5 h-3.5" />
            </div>
            <input
              ref={replaceInputRef}
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) {
                    handleReplaceAll();
                  } else {
                    handleReplaceSingle();
                  }
                } else if (e.key === 'Escape') {
                  onClose();
                }
              }}
              placeholder="置換後の文字列..."
              className="flex-1 h-7 px-2.5 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleReplaceSingle}
              disabled={!query.trim() || matchCount === 0}
              className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-[11px] font-medium text-slate-700 disabled:opacity-40 transition cursor-pointer"
              title="現在の一致を置換 (Enter)"
            >
              置換
            </button>
            <button
              type="button"
              onClick={handleReplaceAll}
              disabled={!query.trim() || matchCount === 0}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-medium disabled:opacity-40 transition cursor-pointer shadow-xs"
              title="すべての一致を一括置換 (Shift+Enter)"
            >
              すべて置換
            </button>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {replaceNotification && (
        <div className="mt-1.5 px-2 py-1 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-[11px] flex items-center space-x-1.5 animate-in fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{replaceNotification}</span>
        </div>
      )}
    </div>
  );
};
