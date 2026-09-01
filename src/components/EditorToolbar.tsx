import React, { useState, useRef, useEffect } from 'react';
import { NoteType, TextStylePreset, StyleCategory, SystemSettings } from '../types';
import { 
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, List, ListOrdered, CheckSquare, 
  Indent, Outdent,
  Table, Image, Link, MessageSquare, Undo, Redo, Palette, 
  Highlighter, Sparkles, FileText, Code, Bookmark, Lock, Shield,
  BookOpen, Star, Paintbrush, Eraser, SquarePen, ChevronDown, 
  Columns, Rows, CornerDownRight, Type, SlidersHorizontal,
  Search, Replace, Globe, Settings, WrapText, Laptop, RefreshCw,
  Plus, Check, Pin, Quote, Captions
} from 'lucide-react';
import { TEXTBOX_PRESETS } from '../utils/textboxUtils';

import { ColorPickerPopover } from './ColorPickerPopover';
import { StyleGalleryPopover } from './StyleGalleryPopover';
import { FONT_FAMILY_PRESETS } from '../data/initialSettings';
import { 
  getAllAvailableFonts, 
  queryPCLoaclFonts, 
  detectCaretTypography, 
  addCustomFont, 
  SystemFontInfo, 
  CaretTypography,
  getFriendlyFontName
} from '../utils/fontManager';

interface EditorToolbarProps {
  noteType: NoteType;
  onApplyFormat: (command: string, value?: string) => void;
  onInsertImage: () => void;
  onInsertTable: () => void;
  onInsertCallout: () => void;
  onInsertLink: () => void;
  onInsertFootnote?: () => void;
  onInsertFigureCaption?: () => void;
  onInsertBookmarkCard?: () => void;
  onInsertTextbox?: (orientation: 'horizontal' | 'vertical', presetId?: string) => void;
  currentColorBadge?: string;
  onChangeColorBadge: (color?: string) => void;
  showRuler: boolean;
  onToggleRuler: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onBookmarkSentence?: () => void;
  sentenceBookmarksCount?: number;
  // Format Painter props
  onCopyFormat?: () => void;
  onPasteFormat?: () => void;
  onClearFormat?: () => void;
  isFormatPainterActive?: boolean;
  hasCopiedFormat?: boolean;
  copiedFormatSummary?: string;
  // Style Presets (文字・段落書式メニュー)
  characterStyles?: TextStylePreset[];
  paragraphStyles?: TextStylePreset[];
  activeStyleId?: string | null;
  onApplyStyle?: (style: TextStylePreset) => void;
  onCreateNewStyle?: (category: StyleCategory) => void;
  onEditStyle?: (style: TextStylePreset) => void;
  onDeleteStyle?: (styleId: string) => void;
  onToggleHideStyle?: (styleId: string) => void;
  // Search & Replace props (検索・置換・全体検索)
  onOpenFind?: () => void;
  onOpenReplace?: () => void;
  onOpenGlobalSearch?: () => void;
  // Global Settings props
  settings?: SystemSettings;
  onOpenOptions?: () => void;
  onSetDefaultTypography?: (fontFamily: string, fontSize: string) => void;
}


const NODE_COLOR_BADGES = [
  { name: 'ブルー (標準)', color: '#60a5fa' },
  { name: 'オレンジ', color: '#fb923c' },
  { name: 'パープル', color: '#c084fc' },
  { name: 'イエロー', color: '#fde047' },
  { name: 'グリーン', color: '#86efac' },
  { name: 'シアン', color: '#67e8f9' },
  { name: 'ピンク', color: '#f472b6' },
  { name: 'レッド', color: '#ef4444' },
];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  noteType,
  onApplyFormat,
  onInsertImage,
  onInsertTable,
  onInsertCallout,
  onInsertLink,
  onInsertFootnote,
  onInsertFigureCaption,
  onInsertBookmarkCard,
  onInsertTextbox,
  currentColorBadge,
  onChangeColorBadge,
  showRuler,
  onToggleRuler,
  isBookmarked,
  onToggleBookmark,
  onBookmarkSentence,
  sentenceBookmarksCount = 0,
  onCopyFormat,
  onPasteFormat,
  onClearFormat,
  isFormatPainterActive = false,
  hasCopiedFormat = false,
  copiedFormatSummary = '',
  characterStyles = [],
  paragraphStyles = [],
  activeStyleId = null,
  onApplyStyle,
  onCreateNewStyle,
  onEditStyle,
  onDeleteStyle,
  onToggleHideStyle,
  onOpenFind,
  onOpenReplace,
  onOpenGlobalSearch,
  settings,
  onOpenOptions,
  onSetDefaultTypography,
}) => {
  // Default font and size from user settings
  const defaultFontFamily = settings?.fontFamily || 'Meiryo';
  const defaultFontSize = settings?.fontSize || '10.5pt';

  const [fontFamily, setFontFamily] = useState<string>(defaultFontFamily);
  const [fontSize, setFontSize] = useState<string>(defaultFontSize);
  const [showColorBadgeMenu, setShowColorBadgeMenu] = useState(false);
  const colorBadgeMenuRef = useRef<HTMLDivElement>(null);
  const [availableFonts, setAvailableFonts] = useState<SystemFontInfo[]>(() => getAllAvailableFonts());
  const [isLoadingPCFonts, setIsLoadingPCFonts] = useState<boolean>(false);
  const [showCustomFontPrompt, setShowCustomFontPrompt] = useState<boolean>(false);
  const [customFontInput, setCustomFontInput] = useState<string>('');
  const [statusToast, setStatusToast] = useState<string>('');

  // Real-time Caret Typography Detection
  const [caretInfo, setCaretInfo] = useState<CaretTypography>(() => 
    detectCaretTypography(defaultFontFamily, defaultFontSize)
  );

  const [textColor, setTextColor] = useState('#0f172a');
  const [highlightColor, setHighlightColor] = useState('#fef08a');
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showStyleGallery, setShowStyleGallery] = useState(false);
  const [showBadgePicker, setShowBadgePicker] = useState(false);
  const [showTextboxMenu, setShowTextboxMenu] = useState(false);
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  const styleGalleryBtnRef = useRef<HTMLButtonElement>(null);
  const textColorBtnRef = useRef<HTMLButtonElement>(null);
  const highlightBtnRef = useRef<HTMLButtonElement>(null);
  const textboxMenuRef = useRef<HTMLDivElement>(null);

  // Sync with user specified base settings when changed
  useEffect(() => {
    if (settings) {
      if (settings.fontFamily) setFontFamily(settings.fontFamily);
      if (settings.fontSize) setFontSize(settings.fontSize);
    }
  }, [settings?.fontFamily, settings?.fontSize]);

  // Real-time caret typography detection across document selection changes
  useEffect(() => {
    const updateCaret = () => {
      try {
        const info = detectCaretTypography(settings?.fontFamily || 'Meiryo', settings?.fontSize || '10.5pt');
        setCaretInfo(info);
        // Only sync select dropdowns if focused inside editor
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && sel.anchorNode) {
          const editor = document.getElementById('rich-text-editor-content');
          if (editor && editor.contains(sel.anchorNode)) {
            setFontFamily(info.fontFamily);
            setFontSize(info.fontSizePt);
          }
        }
      } catch {
        // ignore
      }
    };

    document.addEventListener('selectionchange', updateCaret);
    document.addEventListener('keyup', updateCaret);
    document.addEventListener('mouseup', updateCaret);

    return () => {
      document.removeEventListener('selectionchange', updateCaret);
      document.removeEventListener('keyup', updateCaret);
      document.removeEventListener('mouseup', updateCaret);
    };
  }, [settings?.fontFamily, settings?.fontSize]);

  // Handle Scanning PC installed fonts
  const handleScanPCFonts = async () => {
    setIsLoadingPCFonts(true);
    showToast('PC端末のローカルフォントを読み込んでいます...');
    try {
      const fonts = await queryPCLoaclFonts();
      const all = getAllAvailableFonts();
      setAvailableFonts(all);
      showToast(`PCフォントを ${fonts.length} 件 読み込みました`);
    } catch (err) {
      showToast('PCフォント読み込みに失敗しました');
    } finally {
      setIsLoadingPCFonts(false);
    }
  };

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(''), 3500);
  };

  // Add custom font by name
  const handleAddCustomFont = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFontInput.trim()) return;
    addCustomFont(customFontInput.trim());
    setAvailableFonts(getAllAvailableFonts());
    setFontFamily(customFontInput.trim());
    onApplyFormat('fontName', customFontInput.trim());
    setShowCustomFontPrompt(false);
    showToast(`フォント「${customFontInput.trim()}」を追加しました`);
    setCustomFontInput('');
  };

  // Set current caret or selected font/size as user default system base
  const handleSetCurrentAsDefault = () => {
    const targetFont = fontFamily || caretInfo.fontFamily || defaultFontFamily;
    const targetSize = fontSize || caretInfo.fontSizePt || defaultFontSize;
    if (onSetDefaultTypography) {
      onSetDefaultTypography(targetFont, targetSize);
    }
    showToast(`基本表示フォントを「${getFriendlyFontName(targetFont)} (${targetSize})」に設定しました`);
  };

  // Capture selection range before opening color picker popovers
  const captureSelection = () => {
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        setSavedRange(sel.getRangeAt(0).cloneRange());
      }
    } catch {
      // ignore
    }
  };

  // Close textbox menu on outside click
  useEffect(() => {
    if (!showTextboxMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (textboxMenuRef.current && !textboxMenuRef.current.contains(e.target as Node)) {
        setShowTextboxMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTextboxMenu]);

  const colors = [
    '#000000', '#475569', '#dc2626', '#ea580c', '#d97706', 
    '#16a34a', '#0284c7', '#4f46e5', '#9333ea', '#db2777'
  ];

  const badges = [
    { name: 'なし', color: undefined },
    { name: 'オレンジ', color: '#fb923c' },
    { name: 'パープル', color: '#c084fc' },
    { name: 'イエロー', color: '#fde047' },
    { name: 'グリーン', color: '#86efac' },
    { name: 'シアン', color: '#67e8f9' },
    { name: 'ピンク', color: '#f472b6' },
    { name: 'レッド', color: '#ef4444' },
  ];

  const handlePastePlainText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onApplyFormat('insertText', text);
      setStatusToast('プレーンテキストとして貼り付けました');
    } catch (err) {
      console.error('Failed to read clipboard', err);
      setStatusToast('クリップボードの読み取りに失敗しました');
    }
  };

  return (
    <div id="editor-toolbar" className="bg-stone-100 border-b border-stone-300 px-3 py-1.5 flex flex-col gap-1.5 text-xs select-none shadow-2xs relative">
      {/* Toast notification banner */}
      {statusToast && (
        <div className="absolute top-10 right-4 z-50 bg-stone-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* Font Family, Size & Style Gallery (active when in rich text mode) */}
      {noteType === 'rich' && (
        <>
          {/* --- ROW 1 --- */}
          <div className="flex flex-wrap items-center gap-1.5 w-full">
            {/* Font Family Selector */}
            <select
              id="editor-toolbar-font-family-select"
              value={fontFamily}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__scan_pc_fonts__') {
                  handleScanPCFonts();
                  return;
                }
                if (val === '__add_custom_font__') {
                  setShowCustomFontPrompt(true);
                  return;
                }
                setFontFamily(val);
                onApplyFormat('fontName', val);
              }}
              className="h-7 text-xs bg-white border border-stone-300 rounded px-1.5 focus:outline-none max-w-[130px] font-sans"
              title="選択テキストまたはカーソル位置のフォントを変更"
            >
              <optgroup label="--- 基本・プリセット ---">
                {FONT_FAMILY_PRESETS.map((p) => (
                  <option key={p.id} value={p.family}>{p.name}</option>
                ))}
              </optgroup>
              {availableFonts.some((f) => f.isLocalPC) && (
                <optgroup label="--- 💻 読み込み済み PC フォント ---">
                  {availableFonts.filter((f) => f.isLocalPC).map((f) => (
                    <option key={f.family} value={f.family}>💻 {f.name}</option>
                  ))}
                </optgroup>
              )}
              <optgroup label="--- 日本語・欧文標準フォント ---">
                {availableFonts
                  .filter((f) => !f.isLocalPC && !FONT_FAMILY_PRESETS.some((p) => p.family.toLowerCase() === f.family.toLowerCase()))
                  .map((f) => (
                    <option key={f.family} value={f.family}>{f.name}</option>
                  ))}
              </optgroup>
              <optgroup label="--- アクション ---">
                <option value="__scan_pc_fonts__">💻 PCフォントを読み込む...</option>
                <option value="__add_custom_font__">＋ フォント名を追加...</option>
              </optgroup>
            </select>

            {/* Font Size Selector */}
            <select
              id="editor-toolbar-font-size-select"
              value={fontSize}
              onChange={(e) => {
                setFontSize(e.target.value);
                onApplyFormat('fontSize', e.target.value);
              }}
              className="h-7 w-20 text-xs bg-white border border-stone-300 rounded px-1 focus:outline-none font-mono"
              title="選択テキストまたはカーソル位置の文字サイズを変更"
            >
              <option value="8pt">8pt (10.7px)</option>
              <option value="9pt">9pt (12px)</option>
              <option value="10pt">10pt (13.3px)</option>
              <option value="10.5pt">10.5pt (14px)★</option>
              <option value="11pt">11pt (14.7px)</option>
              <option value="12pt">12pt (16px)</option>
              <option value="13pt">13pt (17.3px)</option>
              <option value="14pt">14pt (18.7px)</option>
              <option value="16pt">16pt (21.3px)</option>
              <option value="18pt">18pt (24px)</option>
              <option value="20pt">20pt (26.7px)</option>
              <option value="24pt">24pt (32px)</option>
              <option value="28pt">28pt (37.3px)</option>
              <option value="36pt">36pt (48px)</option>
            </select>

            <div className="h-4 w-px bg-stone-300 mx-0.5" />

            {/* Find, Replace & Global Search Icons */}
            <div className="flex items-center space-x-0.5 bg-stone-100/90 p-0.5 rounded border border-stone-200">
              <button
                type="button"
                onClick={onOpenFind}
                title="開いているタブ内を検索 (Ctrl+F)"
                className="p-1 rounded hover:bg-white text-stone-700 hover:text-blue-700 transition flex items-center space-x-1 border border-transparent hover:border-stone-300 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[10px] font-medium hidden md:inline">検索</span>
              </button>
              <button
                type="button"
                onClick={onOpenReplace}
                title="開いているタブ内を置換 (Ctrl+H)"
                className="p-1 rounded hover:bg-white text-stone-700 hover:text-blue-700 transition flex items-center space-x-1 border border-transparent hover:border-stone-300 cursor-pointer"
              >
                <Replace className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[10px] font-medium hidden md:inline">置換</span>
              </button>
              <div className="h-3 w-px bg-stone-300 mx-0.5" />
              <button
                type="button"
                onClick={onOpenGlobalSearch}
                title="ＤＢ内全体を検索 (Ctrl+Shift+F)"
                className="p-1 rounded bg-blue-50/80 hover:bg-blue-100 text-blue-800 transition flex items-center space-x-1 border border-blue-200 cursor-pointer font-medium"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[10px] hidden lg:inline font-bold">全体検索</span>
              </button>
            </div>

            <div className="h-4 w-px bg-stone-300 mx-0.5" />

            {/* Style Gallery Menu */}
            <div className="relative">
              <button
                ref={styleGalleryBtnRef}
                id="editor-toolbar-style-gallery-btn"
                type="button"
                onMouseDown={(e) => captureSelection()}
                onClick={() => {
                  captureSelection();
                  setShowStyleGallery(!showStyleGallery);
                  setShowTextColorPicker(false);
                  setShowHighlightPicker(false);
                }}
                title="文字・段落書式ギャラリー (見出し・マーカー・下線スタイル・字下げ一覧)"
                className={`h-7 px-2 rounded border flex items-center space-x-1.5 transition cursor-pointer ${
                  showStyleGallery ? 'bg-blue-100 border-blue-500 text-blue-900 shadow-xs font-semibold' : 'bg-white border-stone-300 hover:border-blue-400 hover:bg-stone-50 text-stone-800'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span className="font-serif font-bold text-[12px] text-blue-700">か力漢</span>
                  <span className="text-[11px] font-medium text-stone-700 hidden sm:inline">書式スタイル</span>
                </div>
                <ChevronDown className="w-3 h-3 text-stone-500" />
              </button>
              {showStyleGallery && (
                <StyleGalleryPopover
                  characterStyles={characterStyles}
                  paragraphStyles={paragraphStyles}
                  activeStyleId={activeStyleId}
                  savedRange={savedRange}
                  triggerRef={styleGalleryBtnRef}
                  onApplyStyle={(style) => onApplyStyle?.(style)}
                  onClearFormat={() => onClearFormat?.()}
                  onCreateNewStyle={(category) => {
                    setShowStyleGallery(false);
                    onCreateNewStyle?.(category);
                  }}
                  onEditStyle={(style) => {
                    setShowStyleGallery(false);
                    onEditStyle?.(style);
                  }}
                  onDeleteStyle={(styleId) => onDeleteStyle?.(styleId)}
                  onToggleHideStyle={(styleId) => onToggleHideStyle?.(styleId)}
                  onClose={() => setShowStyleGallery(false)}
                />
              )}
            </div>

            <div className="h-4 w-px bg-stone-300 mx-0.5" />

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={onInsertFootnote}
              title="注釈・脚注を挿入 (Wikipediaスタイル・自動採番)"
              className="p-1.5 rounded bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 flex items-center space-x-1 font-bold cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-700" />
              <span className="text-[10px] hidden sm:inline">注釈 [※]</span>
            </button>

            {onBookmarkSentence && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onBookmarkSentence}
                title="選択した文章をブックマーク (Ctrl+Shift+B)"
                className="p-1.5 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 flex items-center space-x-1 font-bold cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[10px] hidden sm:inline">文章BM</span>
                {sentenceBookmarksCount > 0 && (
                  <span className="ml-0.5 bg-indigo-200 text-indigo-800 text-[9px] px-1 rounded-full">
                    {sentenceBookmarksCount}
                  </span>
                )}
              </button>
            )}

            {/* Other Insertions (Callout, Image, Link, Textbox) */}
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={onInsertCallout}
              title="黄色の吹き出し・注記ボックスを挿入"
              className="p-1.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 flex items-center space-x-1 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-medium hidden md:inline">吹き出し</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onInsertImage}
              title="画像を挿入 (パソコン内のファイル / Web画像URL)..."
              className="p-1.5 rounded hover:bg-white border border-transparent hover:border-stone-300 text-stone-700 hover:text-emerald-700 cursor-pointer flex items-center space-x-1"
            >
              <Image className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-medium hidden lg:inline">画像</span>
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={onInsertLink}
              title="リンクを挿入"
              className="p-1.5 rounded hover:bg-white border border-transparent hover:border-stone-300 text-stone-700 cursor-pointer"
            >
              <Link className="w-3.5 h-3.5 text-indigo-600" />
            </button>
            
            <div className="relative" ref={textboxMenuRef}>
              <button
                type="button"
                onClick={() => setShowTextboxMenu(!showTextboxMenu)}
                title="テキストボックスを挿入 (横書き / 縦書き)"
                className={`p-1.5 rounded hover:bg-white border transition cursor-pointer flex items-center space-x-0.5 text-stone-700 ${
                  showTextboxMenu ? 'bg-blue-100 border-blue-400 text-blue-900 shadow-xs' : 'hover:border-stone-300 border-transparent'
                }`}
              >
                <SquarePen className="w-3.5 h-3.5 text-stone-800" />
                <ChevronDown className="w-2.5 h-2.5 text-stone-500" />
              </button>
              {showTextboxMenu && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-stone-300 rounded-lg shadow-xl z-50 p-1.5 text-xs text-stone-800 animate-in fade-in select-none">
                  <div className="text-[10px] font-bold text-stone-500 px-1 mb-1 border-b border-stone-100 pb-1">横書きボックス (Horizontal)</div>
                  <div className="grid grid-cols-2 gap-1 px-1 pt-0.5 mb-2">
                    {TEXTBOX_PRESETS.filter((p) => p.orientation === 'horizontal').map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onInsertTextbox?.(p.orientation, p.id);
                          setShowTextboxMenu(false);
                        }}
                        className="text-left p-1 rounded hover:bg-stone-100 border border-stone-200 text-[10px] cursor-pointer"
                        title={p.description}
                      >
                        <div className="font-medium text-stone-800 truncate">{p.label}</div>
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] font-bold text-stone-500 px-1 mb-1 border-b border-stone-100 pb-1">縦書きボックス (Vertical)</div>
                  <div className="grid grid-cols-2 gap-1 px-1 pt-0.5">
                    {TEXTBOX_PRESETS.filter((p) => p.orientation === 'vertical').map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onInsertTextbox?.(p.orientation, p.id);
                          setShowTextboxMenu(false);
                        }}
                        className="text-left p-1 rounded hover:bg-stone-100 border border-stone-200 text-[10px] cursor-pointer"
                        title={p.description}
                      >
                        <div className="font-medium text-stone-800 truncate">{p.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bookmark Star Toggle & Badge Color Tag Buttons (Right Aligned) */}
            <div className="relative ml-auto flex items-center space-x-1.5">
              {onToggleBookmark && (
                <button
                  onClick={onToggleBookmark}
                  id="editor-toolbar-bookmark-btn"
                  className={`flex items-center space-x-1 px-2 py-1 border rounded text-xs transition shadow-2xs font-medium ${
                    isBookmarked ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold hover:bg-amber-200' : 'bg-white hover:bg-stone-50 border-stone-300 text-stone-700'
                  }`}
                  title="このノートをブックマークに追加 / 解除 (Ctrl+D)"
                >
                  <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-500' : 'text-stone-400'}`} />
                  <span className="text-[11px] hidden sm:inline">{isBookmarked ? '★ 登録中' : '☆ ノート'}</span>
                </button>
              )}
              {onChangeColorBadge && (
                <div className="relative" ref={colorBadgeMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowColorBadgeMenu(!showColorBadgeMenu)}
                    className={`px-2 py-1 border rounded text-xs transition shadow-2xs flex items-center space-x-1 ${
                      currentColorBadge ? 'bg-white border-stone-300 hover:bg-stone-50' : 'bg-white border-stone-300 hover:bg-stone-50 text-stone-600'
                    }`}
                    title="ノートのラベル色・バッジカラーを設定"
                  >
                    {currentColorBadge ? (
                      <>
                        <span className="w-3 h-3 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: currentColorBadge }} />
                        <span className="text-[11px] font-medium hidden sm:inline text-stone-800">
                          {NODE_COLOR_BADGES.find((b) => b.color === currentColorBadge)?.name || '色あり'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Palette className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-[11px] hidden sm:inline">ラベル色</span>
                      </>
                    )}
                    <ChevronDown className="w-3 h-3 text-stone-400" />
                  </button>
                  {showColorBadgeMenu && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-stone-300 rounded-lg shadow-xl z-50 p-2 text-xs flex flex-col gap-1 w-32 animate-in fade-in">
                      <button
                        onClick={() => {
                          onChangeColorBadge(undefined);
                          setShowColorBadgeMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full p-1.5 hover:bg-stone-100 rounded text-left transition text-stone-600"
                      >
                        <div className="w-3.5 h-3.5 rounded-full border border-stone-300 bg-transparent flex items-center justify-center overflow-hidden">
                          <div className="w-full h-px bg-red-400 rotate-45 transform origin-center" />
                        </div>
                        <span>色なし (標準)</span>
                      </button>
                      <div className="h-px bg-stone-200 my-0.5 w-full" />
                      {NODE_COLOR_BADGES.map((badge) => (
                        <button
                          key={badge.color}
                          onClick={() => {
                            onChangeColorBadge(badge.color);
                            setShowColorBadgeMenu(false);
                          }}
                          className="flex items-center space-x-2 w-full p-1.5 hover:bg-stone-100 rounded text-left transition"
                        >
                          <span className="w-3.5 h-3.5 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: badge.color }} />
                          <span className="text-stone-800">{badge.name}</span>
                          {currentColorBadge === badge.color && <Check className="w-3 h-3 text-blue-600 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* --- ROW 2 --- */}
          <div className="flex flex-wrap items-center gap-1.5 w-full">
            {/* Bold, Italic, Underline, Strike */}
            <button
              onClick={() => onApplyFormat('bold')}
              title="太字 (Ctrl+B)"
              className="p-1.5 rounded hover:bg-white border border-transparent hover:border-stone-300 font-bold text-stone-800"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onApplyFormat('italic')}
              title="斜体 (Ctrl+I)"
              className="p-1.5 rounded hover:bg-white border border-transparent hover:border-stone-300 italic text-stone-800"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onApplyFormat('underline')}
              title="下線 (Ctrl+U)"
              className="p-1.5 rounded hover:bg-white border border-transparent hover:border-stone-300 underline text-stone-800"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onApplyFormat('strikeThrough')}
              title="取り消し線"
              className="p-1.5 rounded hover:bg-white border border-transparent hover:border-stone-300 text-stone-800"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-stone-300 mx-0.5" />

            {/* Text Color & Highlight Color Pickers */}
            <div className="relative">
              <button
                ref={textColorBtnRef}
                id="editor-toolbar-textcolor-btn"
                type="button"
                onMouseDown={(e) => captureSelection()}
                onClick={() => {
                  captureSelection();
                  setShowTextColorPicker(!showTextColorPicker);
                  setShowHighlightPicker(false);
                }}
                title="文字色の変更 (カラーピッカー・パレット)"
                className={`px-1.5 py-1 rounded flex flex-col items-center justify-center transition cursor-pointer border ${
                  showTextColorPicker ? 'bg-blue-100 border-blue-400 text-blue-900 shadow-xs' : 'hover:bg-white border-transparent hover:border-stone-300 text-stone-800'
                }`}
              >
                <div className="flex items-center space-x-0.5">
                  <span className="font-bold text-[13px] font-serif leading-none text-stone-900">A</span>
                  <ChevronDown className="w-2.5 h-2.5 text-stone-500" />
                </div>
                <span className="w-4 h-1 rounded-xs mt-0.5 shadow-2xs border border-black/20" style={{ backgroundColor: textColor || '#0f172a' }} />
              </button>
              {showTextColorPicker && (
                <ColorPickerPopover
                  mode="textColor"
                  currentColor={textColor}
                  savedRange={savedRange}
                  triggerRef={textColorBtnRef}
                  onSelectColor={(color) => {
                    setTextColor(color);
                    onApplyFormat('foreColor', color);
                  }}
                  onClose={() => setShowTextColorPicker(false)}
                />
              )}
            </div>

            <div className="relative">
              <button
                ref={highlightBtnRef}
                id="editor-toolbar-highlight-btn"
                type="button"
                onMouseDown={(e) => captureSelection()}
                onClick={() => {
                  captureSelection();
                  setShowHighlightPicker(!showHighlightPicker);
                  setShowTextColorPicker(false);
                }}
                title="蛍光ペン・マーカー色"
                className={`px-1.5 py-1 rounded flex flex-col items-center justify-center transition cursor-pointer border ${
                  showHighlightPicker ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-xs' : 'hover:bg-white border-transparent hover:border-stone-300 text-stone-800'
                }`}
              >
                <div className="flex items-center space-x-0.5">
                  <Highlighter className="w-3.5 h-3.5 text-amber-600" />
                  <ChevronDown className="w-2.5 h-2.5 text-stone-500" />
                </div>
                <span className="w-4 h-1 rounded-xs mt-0.5 shadow-2xs border border-black/20" style={{ backgroundColor: highlightColor || '#fef08a' }} />
              </button>
              {showHighlightPicker && (
                <ColorPickerPopover
                  mode="highlight"
                  currentColor={highlightColor}
                  savedRange={savedRange}
                  triggerRef={highlightBtnRef}
                  onSelectColor={(color) => {
                    setHighlightColor(color);
                    onApplyFormat('hiliteColor', color);
                  }}
                  onClose={() => setShowHighlightPicker(false)}
                />
              )}
            </div>

            <div className="h-4 w-px bg-stone-300 mx-0.5" />

            {/* Paste Plain Text */}
            <button
              type="button"
              onClick={handlePastePlainText}
              title="プレーンテキストとして貼り付け"
              className="p-1.5 rounded hover:bg-white border border-transparent hover:border-stone-300 text-stone-700 hover:text-emerald-700 cursor-pointer flex items-center justify-center space-x-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden md:inline font-medium">テキスト貼付</span>
            </button>

            {/* Paste Format */}
            {onPasteFormat && (
              <button
                type="button"
                onClick={onPasteFormat}
                title="コピーした書式を貼り付け"
                className="p-1.5 rounded hover:bg-white border border-transparent hover:border-stone-300 text-stone-700 hover:text-blue-700 cursor-pointer flex items-center justify-center space-x-1"
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden md:inline font-medium">書式貼付</span>
              </button>
            )}

            {/* Format Painter */}
            {onCopyFormat && (
              <button
                type="button"
                onClick={onCopyFormat}
                id="editor-toolbar-format-painter-btn"
                title={
                  isFormatPainterActive
                    ? '書式コピーモード有効中: 適用したいテキストを選択してください (クリックで解除)'
                    : '書式のコピー (書式ペインター) [Ctrl+Shift+C]: 選択範囲の書式をコピーし、次に選択した範囲に自動適用'
                }
                className={`p-1.5 rounded transition cursor-pointer flex items-center justify-center ${
                  isFormatPainterActive
                    ? 'bg-amber-300 hover:bg-amber-400 text-amber-950 ring-2 ring-amber-400 shadow-xs'
                    : hasCopiedFormat
                    ? 'bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 text-indigo-700'
                    : 'hover:bg-white border border-transparent hover:border-stone-300 text-stone-700'
                }`}
              >
                <Paintbrush className={`w-3.5 h-3.5 ${isFormatPainterActive ? 'text-amber-950 animate-pulse' : hasCopiedFormat ? 'text-indigo-700' : 'text-stone-700'}`} />
              </button>
            )}

            {onClearFormat && (
              <button
                type="button"
                onClick={onClearFormat}
                id="editor-toolbar-clear-format-btn"
                title="書式のクリア: 選択中の文字装飾を標準に戻す"
                className="p-1.5 rounded hover:bg-white border border-transparent hover:border-stone-300 text-stone-700 hover:text-red-600 cursor-pointer flex items-center justify-center"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="h-4 w-px bg-stone-300 mx-0.5" />

            {/* Text Alignment */}
            <button
              onClick={() => onApplyFormat('justifyLeft')}
              title="左揃え"
              className="p-1.5 rounded hover:bg-white border border-transparent hover:border-stone-300 text-stone-700"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onApplyFormat('justifyCenter')}
              title="中央揃え"
              className="p-1.5 rounded hover:bg-white border border-transparent hover:border-stone-300 text-stone-700"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onApplyFormat('justifyRight')}
              title="右揃え"
              className="p-1.5 rounded hover:bg-white border border-transparent hover:border-stone-300 text-stone-700"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-stone-300 mx-0.5" />

            {/* Lists & Indentation */}
            <button
              type="button"
              onClick={() => onApplyFormat('insertUnorderedList')}
              title="箇条書きリスト (箇条書き)"
              className="p-1.5 rounded hover:bg-white border border-transparent hover:border-stone-300 text-stone-700 cursor-pointer"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onApplyFormat('insertOrderedList')}
              title="段落番号リスト (番号付き)"
              className="p-1.5 rounded hover:bg-white border border-transparent hover:border-stone-300 text-stone-700 cursor-pointer"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="editor-toolbar-outdent-btn"
              onClick={() => onApplyFormat('outdent')}
              title="インデント解除 (左へシフト / Shift+Tab)"
              className="p-1.5 rounded hover:bg-white border border-transparent hover:border-stone-300 text-stone-700 cursor-pointer"
            >
              <Outdent className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="editor-toolbar-indent-btn"
              onClick={() => onApplyFormat('indent')}
              title="インデントの追加 (右へシフト / Tab)"
              className="p-1.5 rounded hover:bg-white border border-transparent hover:border-stone-300 text-stone-700 cursor-pointer"
            >
              <Indent className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}

      {/* Custom Font Prompt Modal */}
      {showCustomFontPrompt && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-stone-300 p-5 max-w-md w-full animate-in zoom-in-95">
            <h4 className="text-sm font-bold text-stone-900 mb-2 flex items-center gap-2">
              <Type className="w-4 h-4 text-blue-600" />
              <span>カスタムフォント名の追加</span>
            </h4>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              PCにインストールされているフォント名、またはWebフォント名を入力してください。（例: <code className="bg-stone-100 px-1 py-0.5 rounded text-blue-800">Noto Sans JP</code>, <code className="bg-stone-100 px-1 py-0.5 rounded text-blue-800">YuGothic</code>, <code className="bg-stone-100 px-1 py-0.5 rounded text-blue-800">Meiryo</code>）
            </p>
            <form onSubmit={handleAddCustomFont} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={customFontInput}
                  onChange={(e) => setCustomFontInput(e.target.value)}
                  placeholder="フォント名を入力"
                  className="w-full text-sm px-3 py-2 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomFontPrompt(false);
                    setCustomFontInput('');
                  }}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!customFontInput.trim()}
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow-sm disabled:opacity-50"
                >
                  追加して適用
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
