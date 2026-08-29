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
  onChangeNoteType: (type: NoteType) => void;
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
  // Search & Replace props (検索・置換・全体検索)
  onOpenFind?: () => void;
  onOpenReplace?: () => void;
  onOpenGlobalSearch?: () => void;
  // Global Settings props
  settings?: SystemSettings;
  onOpenOptions?: () => void;
  onSetDefaultTypography?: (fontFamily: string, fontSize: string) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  noteType,
  onChangeNoteType,
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

  return (
    <div id="editor-toolbar" className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex flex-wrap items-center gap-1.5 text-xs select-none shadow-2xs">
      {/* Toast notification banner */}
      {statusToast && (
        <div className="absolute top-10 right-4 z-50 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* Note Type Selector Dropdown */}
      <div className="flex items-center space-x-1 mr-1 bg-white px-2 py-0.5 rounded border border-slate-300">
        <span className="text-[11px] font-semibold text-slate-500">種別:</span>
        <select
          id="select-note-type"
          value={noteType}
          onChange={(e) => onChangeNoteType(e.target.value as NoteType)}
          className="text-xs bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
        >
          <option value="rich">🔴 リッチテキスト (WYSIWYG)</option>
          <option value="spreadsheet">🟠 スプレッドシート (表計算)</option>
          <option value="code">🟡 ソースコード (Python/JS)</option>
          <option value="bookmark">🔵 Webブックマーク</option>
          <option value="encrypted">🔒 暗号化ノート</option>
        </select>
      </div>

      {/* Font Family, Size & Style Gallery (active when in rich text mode) */}
      {noteType === 'rich' && (
        <>
          {/* Style Gallery Menu (文字・段落書式メニュー / か力漢 ギャラリー) */}
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
                showStyleGallery
                  ? 'bg-blue-100 border-blue-500 text-blue-900 shadow-xs font-semibold'
                  : 'bg-white border-slate-300 hover:border-blue-400 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center space-x-1">
                <span className="font-serif font-bold text-[12px] text-blue-700">か力漢</span>
                <span className="text-[11px] font-medium text-slate-700 hidden sm:inline">書式スタイル</span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showStyleGallery && (
              <StyleGalleryPopover
                characterStyles={characterStyles}
                paragraphStyles={paragraphStyles}
                activeStyleId={activeStyleId}
                savedRange={savedRange}
                triggerRef={styleGalleryBtnRef}
                onApplyStyle={(style) => {
                  onApplyStyle?.(style);
                }}
                onClearFormat={() => {
                  onClearFormat?.();
                }}
                onCreateNewStyle={(category) => {
                  setShowStyleGallery(false);
                  onCreateNewStyle?.(category);
                }}
                onEditStyle={(style) => {
                  setShowStyleGallery(false);
                  onEditStyle?.(style);
                }}
                onDeleteStyle={(styleId) => {
                  onDeleteStyle?.(styleId);
                }}
                onClose={() => setShowStyleGallery(false)}
              />
            )}
          </div>

          <div className="h-4 w-px bg-slate-300 mx-0.5" />

          {/* Live Cursor Typography & Font Display Badge */}
          <div
            id="editor-toolbar-caret-status"
            onClick={handleSetCurrentAsDefault}
            title={`【カーソル位置のフォント】\nフォント名: ${caretInfo.fontFamily} (${caretInfo.friendlyFontName})\nサイズ: ${caretInfo.fontSizePt} (${caretInfo.fontSizePx}px)\n\n※ クリックすると、このフォントとサイズをシステム全体の【基本表示】として保存します`}
            className="hidden sm:flex items-center space-x-1.5 px-2 py-0.5 h-7 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 rounded transition cursor-pointer text-slate-800"
          >
            <Type className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <div className="flex items-center space-x-1 text-[11px] truncate">
              <span className="text-[10px] text-slate-400 font-medium">位置:</span>
              <span className="font-semibold text-slate-900 truncate max-w-[90px] md:max-w-[130px]">
                {caretInfo.friendlyFontName}
              </span>
              <span className="px-1 py-0.2 bg-blue-50 text-blue-800 rounded font-mono text-[10px] font-bold border border-blue-200">
                {caretInfo.fontSizePt}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 hover:text-blue-600 hidden md:inline" title="クリックで既定に設定">
              [既定化]
            </span>
          </div>

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
            className="h-7 text-xs bg-white border border-slate-300 rounded px-1.5 focus:outline-none max-w-[130px] font-sans"
            title="選択テキストまたはカーソル位置のフォントを変更"
          >
            <optgroup label="--- 基本・プリセット ---">
              {FONT_FAMILY_PRESETS.map((p) => (
                <option key={p.id} value={p.family}>
                  {p.name}
                </option>
              ))}
            </optgroup>

            {availableFonts.some((f) => f.isLocalPC) && (
              <optgroup label="--- 💻 読み込み済み PC フォント ---">
                {availableFonts
                  .filter((f) => f.isLocalPC)
                  .map((f) => (
                    <option key={f.family} value={f.family}>
                      💻 {f.name}
                    </option>
                  ))}
              </optgroup>
            )}

            <optgroup label="--- 日本語・欧文標準フォント ---">
              {availableFonts
                .filter((f) => !f.isLocalPC && !FONT_FAMILY_PRESETS.some((p) => p.family.toLowerCase() === f.family.toLowerCase()))
                .map((f) => (
                  <option key={f.family} value={f.family}>
                    {f.name}
                  </option>
                ))}
            </optgroup>

            <optgroup label="--- アクション ---">
              <option value="__scan_pc_fonts__">💻 PCフォントを読み込む...</option>
              <option value="__add_custom_font__">＋ フォント名を追加...</option>
            </optgroup>
          </select>

          {/* Font Size Selector (Comprehensive pt/px scale) */}
          <select
            id="editor-toolbar-font-size-select"
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value);
              onApplyFormat('fontSize', e.target.value);
            }}
            className="h-7 w-20 text-xs bg-white border border-slate-300 rounded px-1 focus:outline-none font-mono"
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

          {/* Scan PC Fonts Quick Button */}
          <button
            type="button"
            onClick={handleScanPCFonts}
            disabled={isLoadingPCFonts}
            title="PC端末にインストールされているフォントを読み込む (Local Font Access)"
            className="h-7 px-1.5 rounded border border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 flex items-center gap-1 transition disabled:opacity-50"
          >
            {isLoadingPCFonts ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Laptop className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span className="hidden xl:inline text-[11px]">PCフォント読込</span>
          </button>

          {/* Set Current Font/Size as Default System Typography Button */}
          <button
            type="button"
            onClick={handleSetCurrentAsDefault}
            title={`現在のフォント（${getFriendlyFontName(fontFamily)} / ${fontSize}）を基本表示に設定`}
            className="h-7 px-1.5 rounded border border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 flex items-center gap-1 transition"
          >
            <Pin className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden xl:inline text-[11px]">基本表示に設定</span>
          </button>

          {onOpenOptions && (
            <button
              onClick={onOpenOptions}
              title="システム全体の既定フォント・文字サイズ・本文折り返し位置を設定 (オプション)"
              className="h-7 px-1.5 rounded border border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 flex items-center transition"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="h-4 w-px bg-slate-300 mx-0.5" />

          {/* Bold, Italic, Underline, Strike */}
          <button
            onClick={() => onApplyFormat('bold')}
            title="太字 (Ctrl+B)"
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 font-bold text-slate-800"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onApplyFormat('italic')}
            title="斜体 (Ctrl+I)"
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 italic text-slate-800"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onApplyFormat('underline')}
            title="下線 (Ctrl+U)"
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 underline text-slate-800"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onApplyFormat('strikeThrough')}
            title="取り消し線"
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 text-slate-800"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-0.5" />

          {/* Text Color & Highlight Color Pickers */}
          <div className="relative">
            <button
              ref={textColorBtnRef}
              id="editor-toolbar-textcolor-btn"
              type="button"
              onMouseDown={(e) => {
                captureSelection();
              }}
              onClick={() => {
                captureSelection();
                setShowTextColorPicker(!showTextColorPicker);
                setShowHighlightPicker(false);
              }}
              title="文字色の変更 (カラーピッカー・パレット)"
              className={`px-1.5 py-1 rounded flex flex-col items-center justify-center transition cursor-pointer border ${
                showTextColorPicker
                  ? 'bg-blue-100 border-blue-400 text-blue-900 shadow-xs'
                  : 'hover:bg-white border-transparent hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex items-center space-x-0.5">
                <span className="font-bold text-[13px] font-serif leading-none text-slate-900">A</span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
              </div>
              <span
                className="w-4 h-1 rounded-xs mt-0.5 shadow-2xs border border-black/20"
                style={{ backgroundColor: textColor || '#0f172a' }}
              />
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
              onMouseDown={(e) => {
                captureSelection();
              }}
              onClick={() => {
                captureSelection();
                setShowHighlightPicker(!showHighlightPicker);
                setShowTextColorPicker(false);
              }}
              title="蛍光ペン・マーカー色"
              className={`px-1.5 py-1 rounded flex flex-col items-center justify-center transition cursor-pointer border ${
                showHighlightPicker
                  ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-xs'
                  : 'hover:bg-white border-transparent hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex items-center space-x-0.5">
                <Highlighter className="w-3.5 h-3.5 text-amber-600" />
                <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
              </div>
              <span
                className="w-4 h-1 rounded-xs mt-0.5 shadow-2xs border border-black/20"
                style={{ backgroundColor: highlightColor || '#fef08a' }}
              />
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

          <div className="h-4 w-px bg-slate-300 mx-0.5" />

          {/* Format Painter (書式のコピー/ペインター) & Clear Format (純粋なアイコンボタン) */}
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
                  : 'hover:bg-white border border-transparent hover:border-slate-300 text-slate-700'
              }`}
            >
              <Paintbrush className={`w-3.5 h-3.5 ${isFormatPainterActive ? 'text-amber-950 animate-pulse' : hasCopiedFormat ? 'text-indigo-700' : 'text-slate-700'}`} />
            </button>
          )}

          {onClearFormat && (
            <button
              type="button"
              onClick={onClearFormat}
              id="editor-toolbar-clear-format-btn"
              title="書式のクリア: 選択中の文字装飾を標準に戻す"
              className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 text-slate-700 hover:text-red-600 cursor-pointer flex items-center justify-center"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="h-4 w-px bg-slate-300 mx-0.5" />

          {/* Text Alignment */}
          <button
            onClick={() => onApplyFormat('justifyLeft')}
            title="左揃え"
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 text-slate-700"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onApplyFormat('justifyCenter')}
            title="中央揃え"
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 text-slate-700"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onApplyFormat('justifyRight')}
            title="右揃え"
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 text-slate-700"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-0.5" />

          {/* Lists & Indentation */}
          <button
            type="button"
            onClick={() => onApplyFormat('insertUnorderedList')}
            title="箇条書きリスト (箇条書き)"
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 text-slate-700 cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onApplyFormat('insertOrderedList')}
            title="段落番号リスト (番号付き)"
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 text-slate-700 cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="editor-toolbar-outdent-btn"
            onClick={() => onApplyFormat('outdent')}
            title="インデント解除 (左へシフト / Shift+Tab)"
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 text-slate-700 cursor-pointer"
          >
            <Outdent className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="editor-toolbar-indent-btn"
            onClick={() => onApplyFormat('indent')}
            title="インデントの追加 (右へシフト / Tab)"
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 text-slate-700 cursor-pointer"
          >
            <Indent className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-0.5" />

          {/* Insert Rich Elements */}
          {/* Insert Text Box Dropdown Button (横書き / 縦書き) */}
          <div className="relative" ref={textboxMenuRef}>
            <button
              type="button"
              id="editor-toolbar-insert-textbox-btn"
              onClick={() => setShowTextboxMenu(!showTextboxMenu)}
              title="テキストボックスを挿入 (横書き / 縦書き)"
              className={`p-1.5 rounded hover:bg-white border transition cursor-pointer flex items-center space-x-0.5 text-slate-700 ${
                showTextboxMenu
                  ? 'bg-blue-100 border-blue-400 text-blue-900 shadow-xs'
                  : 'hover:border-slate-300 border-transparent'
              }`}
            >
              <SquarePen className="w-3.5 h-3.5 text-slate-800" />
              <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
            </button>

            {showTextboxMenu && (
              <div 
                id="textbox-dropdown-menu"
                className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-300 rounded-lg shadow-xl z-50 p-1.5 text-xs text-slate-800 animate-in fade-in select-none"
              >
                <div className="px-2 py-1 text-[11px] font-bold text-slate-500 border-b border-slate-100 flex items-center justify-between">
                  <span>テキストボックスの挿入</span>
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded">Word 互換</span>
                </div>

                <div className="py-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onInsertTextbox?.('horizontal');
                      setShowTextboxMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-blue-50 hover:text-blue-900 flex items-center space-x-2.5 cursor-pointer transition"
                  >
                    <div className="p-1 bg-slate-100 rounded border border-slate-300 text-slate-700">
                      <Rows className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                        <span>横書きテキストボックス</span>
                        <span className="text-[10px] text-slate-500 font-normal">(標準)</span>
                      </div>
                      <div className="text-[10px] text-slate-500">標準的な横書き枠線付きボックス</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onInsertTextbox?.('vertical');
                      setShowTextboxMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-amber-50 hover:text-amber-950 flex items-center space-x-2.5 cursor-pointer transition"
                  >
                    <div className="p-1 bg-slate-100 rounded border border-slate-300 text-slate-700">
                      <Columns className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                        <span>縦書きテキストボックス</span>
                        <span className="text-[10px] text-amber-700 font-medium bg-amber-100 px-1 rounded">縦書き</span>
                      </div>
                      <div className="text-[10px] text-slate-500">右から左への和文縦書き組版</div>
                    </div>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1 mt-0.5">
                  <div className="px-2 py-0.5 text-[10px] font-semibold text-slate-400">スタイル別プリセット</div>
                  <div className="grid grid-cols-2 gap-1 px-1 pt-0.5">
                    {TEXTBOX_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onInsertTextbox?.(p.orientation, p.id);
                          setShowTextboxMenu(false);
                        }}
                        className="text-left p-1 rounded hover:bg-slate-100 border border-slate-200 text-[10px] cursor-pointer"
                        title={p.description}
                      >
                        <div className="font-medium text-slate-800 truncate">{p.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

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
            id="editor-toolbar-insert-image-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onInsertImage}
            title="画像を挿入 (パソコン内のファイル / Web画像URL)..."
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 text-slate-700 hover:text-emerald-700 cursor-pointer flex items-center space-x-1"
          >
            <Image className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-medium hidden lg:inline">画像</span>
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={onInsertTable}
            title="表 (テーブル) を挿入"
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 text-slate-700 cursor-pointer"
          >
            <Table className="w-3.5 h-3.5 text-blue-600" />
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={onInsertLink}
            title="リンクを挿入"
            className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-300 text-slate-700 cursor-pointer"
          >
            <Link className="w-3.5 h-3.5 text-indigo-600" />
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={onInsertFootnote}
            title="注釈・脚注を挿入 (Wikipediaスタイル・自動採番)"
            className="p-1.5 rounded bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 flex items-center space-x-1 font-bold cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-700" />
            <span className="text-[10px] hidden sm:inline">注釈 [※]</span>
          </button>

          {onInsertFigureCaption && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={onInsertFigureCaption}
              title="図表キャプションを挿入"
              className="p-1.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center space-x-1 font-bold cursor-pointer"
            >
              <Captions className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[10px] hidden sm:inline">図表</span>
            </button>
          )}

          {onInsertBookmarkCard && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={onInsertBookmarkCard}
              title="Webブックマークカードを挿入"
              className="p-1.5 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-900 flex items-center space-x-1 font-medium cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[10px] hidden sm:inline">カード挿入</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-300 mx-0.5" />

          {/* Find, Replace & Global Search Icons */}
          <div className="flex items-center space-x-0.5 bg-slate-100/90 p-0.5 rounded border border-slate-200">
            <button
              type="button"
              onClick={onOpenFind}
              title="開いているタブ内を検索 (Ctrl+F)"
              className="p-1 rounded hover:bg-white text-slate-700 hover:text-blue-700 transition flex items-center space-x-1 border border-transparent hover:border-slate-300 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] font-medium hidden md:inline">検索</span>
            </button>

            <button
              type="button"
              onClick={onOpenReplace}
              title="開いているタブ内を置換 (Ctrl+H)"
              className="p-1 rounded hover:bg-white text-slate-700 hover:text-blue-700 transition flex items-center space-x-1 border border-transparent hover:border-slate-300 cursor-pointer"
            >
              <Replace className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-medium hidden md:inline">置換</span>
            </button>

            <div className="h-3 w-px bg-slate-300 mx-0.5" />

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
        </>
      )}

      {/* Bookmark Star Toggle & Sentence Bookmark & Badge Color Tag Buttons */}
      <div className="relative ml-auto flex items-center space-x-1.5">
        {onToggleBookmark && (
          <button
            onClick={onToggleBookmark}
            id="editor-toolbar-bookmark-btn"
            className={`flex items-center space-x-1 px-2 py-1 border rounded text-xs transition shadow-2xs font-medium ${
              isBookmarked
                ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold hover:bg-amber-200'
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
            }`}
            title="このノートをブックマークに追加 / 解除 (Ctrl+D)"
          >
            <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
            <span className="text-[11px] hidden sm:inline">{isBookmarked ? '★ 登録中' : '☆ ノート'}</span>
          </button>
        )}

        {onBookmarkSentence && (
          <button
            onClick={onBookmarkSentence}
            id="editor-toolbar-sentence-bookmark-btn"
            className="flex items-center space-x-1 px-2 py-1 border border-blue-300 bg-blue-50/70 hover:bg-blue-100 text-blue-800 rounded text-xs transition shadow-2xs font-medium"
            title="選択した文章をブックマークに登録 (Ctrl+Shift+D)"
          >
            <Quote className="w-3 h-3 text-blue-600" />
            <span className="text-[11px] hidden sm:inline">🔖 文章BM</span>
            {sentenceBookmarksCount > 0 && (
              <span className="bg-blue-600 text-white px-1 py-0.2 rounded-full text-[9px] font-bold">
                {sentenceBookmarksCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setShowBadgePicker(!showBadgePicker)}
          className="flex items-center space-x-1 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs text-slate-700 shadow-2xs"
          title="ノードにカラーバッジを設定"
        >
          {currentColorBadge ? (
            <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: currentColorBadge }} />
          ) : (
            <span className="w-3 h-3 rounded-full border border-dashed border-slate-400" />
          )}
          <span className="text-[11px]">バッジ色</span>
        </button>

        {showBadgePicker && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-300 p-2 rounded shadow-xl z-50 w-36">
            <div className="text-[10px] font-bold text-slate-500 mb-1">バッジ色の選択</div>
            <div className="grid grid-cols-4 gap-1.5">
              {badges.map((b) => (
                <button
                  key={b.name}
                  onClick={() => {
                    onChangeColorBadge(b.color);
                    setShowBadgePicker(false);
                  }}
                  style={{ backgroundColor: b.color || '#f1f5f9' }}
                  title={b.name}
                  className="w-6 h-6 rounded border border-slate-300 flex items-center justify-center text-[9px] hover:scale-110 transition"
                >
                  {!b.color && '✕'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ruler Toggle */}
        <button
          onClick={onToggleRuler}
          className={`px-2 py-1 text-[11px] rounded border transition ${
            showRuler ? 'bg-blue-100 border-blue-300 text-blue-800 font-semibold' : 'bg-white border-slate-300 text-slate-600'
          }`}
          title="ルーラー (定規) の表示切替"
        >
          ルーラー
        </button>
      </div>

      {/* Custom Font Prompt Modal */}
      {showCustomFontPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 p-5 max-w-md w-full animate-in zoom-in-95">
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Type className="w-4 h-4 text-blue-600" />
              <span>カスタムフォント名の追加</span>
            </h4>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              PCにインストールされているフォント名、またはWebフォント名を入力してください。（例: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800">Noto Sans JP</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800">YuGothic</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800">Meiryo</code>）
            </p>
            <form onSubmit={handleAddCustomFont} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={customFontInput}
                onChange={(e) => setCustomFontInput(e.target.value)}
                placeholder="フォント名（例: Noto Serif JP）"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomFontPrompt(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!customFontInput.trim()}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 transition"
                >
                  フォントを追加して適用
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
