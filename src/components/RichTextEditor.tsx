import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TreeNode, SystemSettings } from '../types';
import { 
  FootnoteItem, 
  renumberFootnotes, 
  createFootnoteHtml 
} from '../utils/footnoteUtils';
import { processWordPastedHtml } from '../utils/textboxUtils';
import { logInfo, logSuccess, logWarn, logError } from '../utils/errorLog';
import { 
  BookOpen, Plus, Trash2, ArrowUp, Edit3, ExternalLink, 
  Sparkles, Check, CornerDownRight, MessageSquare, Paintbrush, X,
  WrapText, Sliders, Image as ImageIcon
} from 'lucide-react';

interface RichTextEditorProps {
  node: TreeNode;
  onUpdateContent: (html: string) => void;
  onUpdateTitle: (title: string) => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
  onOpenInsertFootnote?: () => void;
  isFormatPainterActive?: boolean;
  onAutoApplyFormatPainter?: () => void;
  onCancelFormatPainter?: () => void;
  copiedFormatSummary?: string;
  settings?: SystemSettings;
  onOpenOptions?: () => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  node,
  onUpdateContent,
  onUpdateTitle,
  editorRef,
  onOpenInsertFootnote,
  isFormatPainterActive = false,
  onAutoApplyFormatPainter,
  onCancelFormatPainter,
  copiedFormatSummary = '',
  settings,
  onOpenOptions,
}) => {
  const content = node.content.richHtml || '<p>ノートの内容をここに入力してください...</p>';
  const [footnotes, setFootnotes] = useState<FootnoteItem[]>([]);
  const [hoveredFootnote, setHoveredFootnote] = useState<{ id: string; text: string; x: number; y: number } | null>(null);
  const [highlightedFootnoteId, setHighlightedFootnoteId] = useState<string | null>(null);
  const [editingFnId, setEditingFnId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const footnoteSectionRef = useRef<HTMLDivElement>(null);

  // Sync and renumber all footnotes in editor content
  const syncFootnotes = useCallback(() => {
    if (editorRef.current) {
      const items = renumberFootnotes(editorRef.current);
      setFootnotes(items);
      return items;
    }
    return [];
  }, [editorRef]);

  // Handle Input event with automatic renumbering
  const handleInput = () => {
    if (editorRef.current) {
      syncFootnotes();
      onUpdateContent(editorRef.current.innerHTML);
    }
  };

  // Synchronize when content or active node changes
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
      syncFootnotes();
    }
  }, [node.id, content, editorRef, syncFootnotes]);

  // MutationObserver to auto-sync footnotes when inserted via external modals or commands
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Run initial sync
    syncFootnotes();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new MutationObserver((mutations) => {
      const hasRelevantMutation = mutations.some((m) => {
        if (m.type === 'childList') {
          return Array.from(m.addedNodes).some((n) => (n as HTMLElement).classList?.contains('footnote-ref') || (n as HTMLElement).querySelector?.('.footnote-ref')) ||
                 Array.from(m.removedNodes).some((n) => (n as HTMLElement).classList?.contains('footnote-ref') || (n as HTMLElement).querySelector?.('.footnote-ref'));
        }
        if (m.type === 'attributes') {
          return m.attributeName === 'data-fn-text' || m.attributeName === 'data-fn-id';
        }
        return false;
      });

      if (hasRelevantMutation) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          syncFootnotes();
        }, 30);
      }
    });

    observer.observe(editor, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-fn-text', 'data-fn-id'],
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, [editorRef, syncFootnotes]);

  // Handle click on footnote refs in editor body (smooth scroll to bottom footnote item)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const refEl = target.closest('.footnote-ref') as HTMLElement;
      if (refEl) {
        e.preventDefault();
        const fnId = refEl.getAttribute('data-fn-id');
        if (fnId) {
          jumpToFootnote(fnId);
        }
      }
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const refEl = target.closest('.footnote-ref') as HTMLElement;
      if (refEl) {
        const fnId = refEl.getAttribute('data-fn-id') || '';
        const fnText = refEl.getAttribute('data-fn-text') || '';
        const rect = refEl.getBoundingClientRect();
        setHoveredFootnote({
          id: fnId,
          text: fnText,
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY - 8,
        });
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.footnote-ref')) {
        setHoveredFootnote(null);
      }
    };

    editor.addEventListener('click', handleClick);
    editor.addEventListener('mouseover', handleMouseEnter);
    editor.addEventListener('mouseout', handleMouseLeave);

    return () => {
      editor.removeEventListener('click', handleClick);
      editor.removeEventListener('mouseover', handleMouseEnter);
      editor.removeEventListener('mouseout', handleMouseLeave);
    };
  }, [editorRef]);

  // Jump from body anchor to bottom footnote
  const jumpToFootnote = (fnId: string) => {
    const el = document.getElementById(`cite_note-${fnId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setHighlightedFootnoteId(fnId);
      setTimeout(() => {
        setHighlightedFootnoteId(null);
      }, 2500);
    }
  };

  // Jump from bottom backlink (^) to body anchor
  const jumpToBodyAnchor = (fnId: string) => {
    const el = document.getElementById(`cite_ref-${fnId}`) || document.querySelector(`[data-fn-id="${fnId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-amber-200', 'transition-all', 'duration-500', 'rounded-xs');
      setTimeout(() => {
        el.classList.remove('bg-amber-200');
      }, 2500);
    }
  };

  // Update footnote text directly in DOM and state
  const handleUpdateFootnoteText = (fnId: string, newText: string) => {
    if (!editorRef.current) return;
    const refs = editorRef.current.querySelectorAll(`[data-fn-id="${fnId}"]`);
    refs.forEach((ref) => {
      ref.setAttribute('data-fn-text', newText);
      const a = ref.querySelector('a');
      if (a) a.title = newText;
    });

    syncFootnotes();
    onUpdateContent(editorRef.current.innerHTML);
    setEditingFnId(null);
  };

  // Delete a footnote (removes ref from text and automatically renumbers remaining)
  const handleDeleteFootnote = (fnId: string) => {
    if (!editorRef.current) return;
    const refs = editorRef.current.querySelectorAll(`[data-fn-id="${fnId}"]`);
    refs.forEach((ref) => ref.remove());

    syncFootnotes();
    onUpdateContent(editorRef.current.innerHTML);
  };

  // Render clickable links in footnote text if any URL exists
  const renderFormattedFootnoteText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-mono inline-flex items-center gap-0.5 mx-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{part}</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Handle selection completion (mouseup, double-click, or keyup with selection) for automatic Format Painter application
  const checkAndApplySelectionFormat = () => {
    if (isFormatPainterActive && onAutoApplyFormatPainter) {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        // Apply copied format immediately to the selected text range
        onAutoApplyFormatPainter();
      }
    }
  };

  const handleMouseUp = () => {
    checkAndApplySelectionFormat();
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    // If user selected text with Shift+Arrows or other keys
    if (isFormatPainterActive && (e.shiftKey || e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'End' || e.key === 'Home')) {
      checkAndApplySelectionFormat();
    }
  };

  // Insert image Base64 data into current editor selection or append safely
  const insertImageAtSelection = useCallback((dataUri: string, fileName?: string) => {
    if (!editorRef.current) return;

    try {
      const imgHtml = `<div class="my-3 block clear-both" data-image-wrapper="true"><img src="${dataUri}" alt="${fileName || '画像'}" class="max-w-full h-auto rounded-lg border border-slate-300 shadow-xs inline-block" loading="lazy" /></div><p><br></p>`;
      
      const sel = window.getSelection();
      let inserted = false;

      if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = imgHtml;
        const frag = document.createDocumentFragment();
        let node: ChildNode | null;
        let lastNode: ChildNode | null = null;
        while ((node = tempDiv.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        inserted = true;
      }

      if (!inserted) {
        // Append to editor content if no active selection
        editorRef.current.insertAdjacentHTML('beforeend', imgHtml);
      }

      syncFootnotes();
      onUpdateContent(editorRef.current.innerHTML);
      logSuccess('clipboard', `画像を貼り付けました: ${fileName || 'クリップボード画像'} (${Math.round(dataUri.length * 0.75 / 1024)} KB)`);
    } catch (err: any) {
      logError('clipboard', '画像の挿入処理に失敗しました', err);
    }
  }, [editorRef, onUpdateContent, syncFootnotes]);

  // Read File as Data URL and insert into editor
  const insertImageFile = useCallback((file: File): Promise<void> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        logWarn('clipboard', `非対応のファイル形式です: ${file.type}`);
        resolve();
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUri = event.target?.result as string;
        if (dataUri) {
          insertImageAtSelection(dataUri, file.name);
        }
        resolve();
      };
      reader.onerror = (error) => {
        logError('clipboard', `画像ファイル「${file.name}」の読み込みに失敗しました`, error);
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }, [insertImageAtSelection]);

  // Handle Paste event: Detect images, Word Textboxes, VML shapes, and clean HTML
  const handlePaste = async (e: React.ClipboardEvent) => {
    try {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // 1. Check for image files in clipboardData.items
      const items = Array.from(clipboardData.items || []) as DataTransferItem[];
      const imageItems = items.filter((item: DataTransferItem) => item.type && item.type.startsWith('image/'));

      if (imageItems.length > 0) {
        e.preventDefault();
        logInfo('clipboard', `クリップボードから画像(${imageItems.length}件)を検出しました`);
        for (const item of imageItems) {
          const file = item.getAsFile();
          if (file) {
            await insertImageFile(file);
          }
        }
        return;
      }

      // 2. Check for image files in clipboardData.files (fallback for some browsers)
      const files = Array.from(clipboardData.files || []) as File[];
      const imageFiles = files.filter((file: File) => file.type && file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        e.preventDefault();
        logInfo('clipboard', `クリップボードから画像ファイル(${imageFiles.length}件)を検出しました`);
        for (const file of imageFiles) {
          await insertImageFile(file);
        }
        return;
      }

      // 3. Process HTML (Word text boxes or formatted text)
      const htmlData = clipboardData.getData('text/html');
      if (htmlData) {
        const processed = processWordPastedHtml(htmlData);
        if (processed.containsWordTextbox) {
          e.preventDefault();
          document.execCommand('insertHTML', false, processed.html);
          if (editorRef.current) {
            syncFootnotes();
            onUpdateContent(editorRef.current.innerHTML);
          }
          logSuccess('clipboard', 'Word テキストボックスを変換して貼り付けました');
          return;
        }
      }
    } catch (err: any) {
      logError('clipboard', 'クリップボード貼り付け処理中に例外が発生しました', err);
    }
  };

  // Handle Drag & Drop of image files onto the editor canvas
  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer.files || []) as File[];
    const imageFiles = files.filter((f: File) => f.type && f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      e.preventDefault();
      logInfo('clipboard', `ドラッグ＆ドロップされた画像ファイル(${imageFiles.length}件)を読み込みます`);
      for (const file of imageFiles) {
        await insertImageFile(file);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Support Tab for indent and Shift+Tab for outdent in rich editor
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        document.execCommand('outdent', false);
      } else {
        document.execCommand('indent', false);
      }
      if (editorRef.current) {
        syncFootnotes();
        onUpdateContent(editorRef.current.innerHTML);
      }
    }
  };

  // Keyboard shortcut (Escape to cancel format painter)
  useEffect(() => {
    if (!isFormatPainterActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancelFormatPainter?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormatPainterActive, onCancelFormatPainter]);

  // Padding class based on settings
  const paddingClass = settings?.pagePadding === 'compact' 
    ? 'p-4' 
    : settings?.pagePadding === 'spacious' 
    ? 'p-8' 
    : 'p-6';

  // Wrap container style (enforces page width / wrap mode across document content)
  const getWrapContainerStyle = (): React.CSSProperties => {
    if (!settings) return { width: '100%' };

    if (settings.bodyWrapMode === 'characters') {
      return {
        maxWidth: `${settings.bodyWrapValue}ch`,
        marginLeft: settings.contentAlignment === 'left' ? '0' : 'auto',
        marginRight: settings.contentAlignment === 'left' ? '0' : 'auto',
        width: '100%',
      };
    }
    if (settings.bodyWrapMode === 'pixels') {
      return {
        maxWidth: `${settings.bodyWrapValue}px`,
        marginLeft: settings.contentAlignment === 'left' ? '0' : 'auto',
        marginRight: settings.contentAlignment === 'left' ? '0' : 'auto',
        width: '100%',
      };
    }
    if (settings.bodyWrapMode === 'none') {
      return {
        width: 'max-content',
        minWidth: '100%',
      };
    }
    return {
      width: '100%',
      maxWidth: '100%',
    };
  };

  // Editable body typography style
  const getEditorBodyStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      wordBreak: settings?.bodyWrapMode === 'none' ? 'normal' : 'break-word',
    };
    if (settings) {
      if (settings.fontFamily) baseStyle.fontFamily = settings.fontFamily;
      if (settings.fontSize) baseStyle.fontSize = settings.fontSize;
      if (settings.lineHeight) baseStyle.lineHeight = settings.lineHeight;
      if (settings.bodyWrapMode === 'none') {
        baseStyle.whiteSpace = 'pre';
      }
    }
    return baseStyle;
  };

  return (
    <div 
      id="rich-text-editor-container" 
      className={`flex-1 overflow-y-auto ${settings?.bodyWrapMode === 'none' ? 'overflow-x-auto' : ''} bg-white ${paddingClass} relative`}
    >
      {/* Note Page Document Container (Respects word-wrap / max-width settings) */}
      <div 
        id="rich-note-page-canvas"
        style={getWrapContainerStyle()}
        className="transition-all duration-150 relative"
      >
        {/* Note Header Title & Created Date */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 select-none">
          <input
            type="text"
            value={node.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="text-xl font-bold text-slate-900 bg-transparent border-none focus:outline-hidden focus:ring-1 focus:ring-blue-400 rounded px-1 flex-1 mr-4"
            style={{ fontFamily: settings?.fontFamily }}
            placeholder="ノートタイトルを入力..."
          />
          <div className="flex items-center space-x-2 shrink-0">
            {settings && settings.bodyWrapMode !== 'full' && onOpenOptions && (
              <button
                onClick={onOpenOptions}
                title="本文折り返し設定を変更"
                className="text-[10px] bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-300 hover:border-blue-300 px-2 py-0.5 rounded-full font-mono flex items-center gap-1 transition"
              >
                <WrapText className="w-3 h-3 text-slate-500" />
                <span>
                  {settings.bodyWrapMode === 'characters'
                    ? `${settings.bodyWrapValue}文字`
                    : settings.bodyWrapMode === 'pixels'
                    ? `${settings.bodyWrapValue}px`
                    : '折り返しなし'}
                </span>
              </button>
            )}

            {footnotes.length > 0 && (
              <span className="text-[11px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-blue-600" />
                注釈: {footnotes.length}件
              </span>
            )}
            <span className="text-xs text-slate-500 font-sans">
              作成日: {node.created || '2025年1月15日'}
            </span>
          </div>
        </div>

        {/* Format Painter Active Status Banner */}
        {isFormatPainterActive && (
          <div 
            id="format-painter-active-bar"
            className="mb-3 px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between shadow-2xs animate-in fade-in select-none text-xs"
          >
            <div className="flex items-center space-x-2 text-amber-900 font-medium">
              <span className="p-1 bg-amber-200 rounded-full">
                <Paintbrush className="w-3.5 h-3.5 text-amber-950 animate-bounce" />
              </span>
              <span>
                <strong>書式コピーモード有効中:</strong> テキストをドラッグ選択すると、コピーした書式
                {copiedFormatSummary && <span className="font-bold text-amber-950">（{copiedFormatSummary}）</span>}
                が自動適用されます。
              </span>
            </div>
            <button
              onClick={onCancelFormatPainter}
              title="書式コピーを解除 (Esc)"
              className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition"
            >
              <X className="w-3 h-3" />
              <span>解除 (Esc)</span>
            </button>
          </div>
        )}

        {/* Editable Rich Canvas - Document Body */}
        <div
          id="rich-text-content-editable"
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onKeyDown={handleKeyDown}
          onMouseUp={handleMouseUp}
          onKeyUp={handleKeyUp}
          onDoubleClick={handleMouseUp}
          suppressContentEditableWarning
          className={`focus:outline-hidden text-slate-800 text-sm leading-relaxed prose max-w-none clear-both flow-root min-h-[220px] pb-4 transition-colors ${
            isFormatPainterActive ? 'ring-2 ring-amber-300/60 rounded-md p-1 bg-amber-50/10 cursor-crosshair' : ''
          }`}
          style={getEditorBodyStyle()}
        />

        {/* Floating Hover Tooltip for Footnote Ref */}
        {hoveredFootnote && hoveredFootnote.text && (
          <div 
            className="fixed z-50 max-w-xs bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-slate-700 pointer-events-none transform -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-95 duration-100"
            style={{ left: hoveredFootnote.x, top: hoveredFootnote.y }}
          >
            <div className="font-bold text-blue-300 text-[10px] mb-0.5 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>注釈プレビュー</span>
            </div>
            <div className="leading-snug text-slate-200 break-words">{hoveredFootnote.text}</div>
          </div>
        )}

        {/* Wikipedia-Style Footnotes & References Section - Flowed naturally after the last line */}
        <div 
          ref={footnoteSectionRef}
          id="wikipedia-footnotes-container"
          className="mt-8 pt-5 pb-16 border-t border-slate-300 select-none clear-both flow-root"
        >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-700" />
              <span>注釈・脚注 (Footnotes & References)</span>
            </h3>
            <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
              Wikipediaスタイル・自動採番連動
            </span>
          </div>

          {onOpenInsertFootnote && (
            <button
              onClick={onOpenInsertFootnote}
              type="button"
              className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-xs flex items-center space-x-1 transition shadow-2xs"
            >
              <Plus className="w-3 h-3 text-blue-700" />
              <span>注釈を追加</span>
            </button>
          )}
        </div>

        {footnotes.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 text-center text-xs text-slate-500">
            <p className="font-medium text-slate-600 mb-1">このノートにはまだ注釈がありません</p>
            <p className="text-[11px] text-slate-400">
              エディタツールバーの <strong className="text-blue-600">「注釈 [※]」</strong> ボタンを押すと、カーソル位置に自動採番される注釈リンク（[1], [2]...）を挿入できます。
            </p>
          </div>
        ) : (
          <div className="bg-slate-50/70 rounded-lg border border-slate-200 p-3.5 space-y-2">
            <ol className="space-y-2 text-xs">
              {footnotes.map((fn) => {
                const isHighlighted = highlightedFootnoteId === fn.id;
                const isEditing = editingFnId === fn.id;

                return (
                  <li
                    key={fn.id}
                    id={`cite_note-${fn.id}`}
                    className={`flex items-start space-x-2 p-2 rounded-md transition-all duration-300 ${
                      isHighlighted
                        ? 'bg-amber-100 border border-amber-300 shadow-xs ring-2 ring-amber-300/60'
                        : 'hover:bg-white border border-transparent hover:border-slate-200'
                    }`}
                  >
                    {/* Number & Backlink (Wikipedia '^') */}
                    <div className="flex items-center space-x-1 shrink-0 font-bold text-slate-600 pt-0.5">
                      <span className="font-mono text-slate-800">{fn.number}.</span>
                      <button
                        type="button"
                        onClick={() => jumpToBodyAnchor(fn.id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline px-0.5 text-xs font-bold transition"
                        title="本文の注釈位置へジャンプ"
                      >
                        ^
                      </button>
                    </div>

                    {/* Footnote Content */}
                    <div className="flex-1 text-slate-800 leading-relaxed text-xs">
                      {isEditing ? (
                        <div className="flex items-center space-x-1.5 w-full">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateFootnoteText(fn.id, editText);
                              if (e.key === 'Escape') setEditingFnId(null);
                            }}
                            autoFocus
                            className="flex-1 px-2 py-1 text-xs border border-blue-500 rounded bg-white text-slate-900 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateFootnoteText(fn.id, editText)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="保存"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="break-words">
                          {fn.text ? (
                            renderFormattedFootnoteText(fn.text)
                          ) : (
                            <span className="text-slate-400 italic font-mono">（注釈テキスト未設定）</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-1 shrink-0 opacity-70 hover:opacity-100 transition">
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFnId(fn.id);
                            setEditText(fn.text);
                          }}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="注釈テキストを編集"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteFootnote(fn.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="この注釈を削除（本文からも削除され、番号が自動で繰り上がります）"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
