import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, List, ListOrdered, CheckSquare, 
  Indent, Outdent, Table, Image as ImageIcon, Link as LinkIcon, MessageSquare, 
  Undo, Redo, Palette, Highlighter, FileText, Bookmark, 
  BookOpen, Star, Paintbrush, Eraser, SquarePen, ChevronDown, 
  Columns, Rows, Search, Replace, Globe, Settings, WrapText,
  Save, FolderPlus, Plus, ChevronUp, Database, Download, HelpCircle,
  FolderTree, AlertCircle, Captions, Check, Eye, Sliders, RefreshCw,
  Edit3, Trash2, Sparkles, Layers, Upload, FolderGit2
} from 'lucide-react';
import { 
  NoteType, TextStylePreset, StyleCategory, SystemSettings, 
  DatabaseProfile, RibbonTab 
} from '../types';
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

interface RibbonBarProps {
  // Active state
  activeRibbonTab: RibbonTab;
  onChangeRibbonTab: (tab: RibbonTab) => void;
  isRibbonMinimized: boolean;
  onToggleRibbonMinimized: () => void;

  // Document / Note state
  activeNotebookName: string;
  activeNoteTitle?: string;
  activeNoteType?: NoteType;
  isSaving: boolean;
  onSave: () => void;
  onNewNote: () => void;
  onNewFolder: () => void;

  // Database props
  databases?: DatabaseProfile[];
  activeDatabaseId?: string;
  activeDatabaseName?: string;
  onSelectDatabase?: (dbId: string) => void;
  onOpenCreateDatabase?: () => void;
  onOpenDatabaseManager?: () => void;

  // Editor formatting & tools
  onApplyFormat: (command: string, value?: string) => void;
  onInsertImage: () => void;
  onInsertTable: () => void;
  onInsertCallout: () => void;
  onInsertLink: () => void;
  onInsertFootnote?: () => void;
  onInsertFigureCaption?: () => void;
  onInsertBookmarkCard?: () => void;
  onInsertTextbox?: (orientation: 'horizontal' | 'vertical', presetId?: string) => void;
  showRuler: boolean;
  onToggleRuler: () => void;
  isHierarchy1Collapsed?: boolean;
  onToggleHierarchy1?: () => void;

  // Bookmark props
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

  // Style presets
  characterStyles?: TextStylePreset[];
  paragraphStyles?: TextStylePreset[];
  activeStyleId?: string | null;
  onApplyStyle?: (style: TextStylePreset) => void;
  onCreateNewStyle?: (category: StyleCategory) => void;
  onEditStyle?: (style: TextStylePreset) => void;
  onDeleteStyle?: (styleId: string) => void;
  onToggleHideStyle?: (styleId: string) => void;
  onResetDefaultStyles?: () => void;

  // Find & Replace
  onOpenFind?: () => void;
  onOpenReplace?: () => void;
  onOpenGlobalSearch?: () => void;

  // Dialogs & Navigation
  onOpenDocxImport?: () => void;
  onOpenOptions: () => void;
  onOpenSpecs: () => void;
  onOpenManual: () => void;
  onExportAllJson: () => void;
  onImportAllJson?: (file: File) => void;
  onExportDataOnlyZip?: () => void;
  onImportDataOnlyZip?: (file: File) => void;
  onResetSampleData: () => void;
  onCleanAndOptimizeDatabase?: () => void;
  onOpenGitPushModal?: () => void;
  onOpenErrorLog?: () => void;

  // Settings
  settings: SystemSettings;
  onUpdateSettings?: (newSettings: Partial<SystemSettings>) => void;
}

export const RibbonBar: React.FC<RibbonBarProps> = ({
  activeRibbonTab,
  onChangeRibbonTab,
  isRibbonMinimized,
  onToggleRibbonMinimized,
  activeNotebookName,
  activeNoteTitle,
  activeNoteType = 'rich',
  isSaving,
  onSave,
  onNewNote,
  onNewFolder,
  databases = [],
  activeDatabaseId = '',
  activeDatabaseName = 'DEMO (デモデータ)',
  onSelectDatabase,
  onOpenCreateDatabase,
  onOpenDatabaseManager,
  onApplyFormat,
  onInsertImage,
  onInsertTable,
  onInsertCallout,
  onInsertLink,
  onInsertFootnote,
  onInsertFigureCaption,
  onInsertBookmarkCard,
  onInsertTextbox,
  showRuler,
  onToggleRuler,
  isHierarchy1Collapsed,
  onToggleHierarchy1,
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
  onResetDefaultStyles,
  onOpenFind,
  onOpenReplace,
  onOpenGlobalSearch,
  onOpenDocxImport,
  onOpenOptions,
  onOpenSpecs,
  onOpenManual,
  onExportAllJson,
  onImportAllJson,
  onExportDataOnlyZip,
  onImportDataOnlyZip,
  onResetSampleData,
  onCleanAndOptimizeDatabase,
  onOpenGitPushModal,
  onOpenErrorLog,
  settings,
  onUpdateSettings,
}) => {
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isDbDropdownOpen, setIsDbDropdownOpen] = useState(false);
  const [isLineSpacingOpen, setIsLineSpacingOpen] = useState(false);
  const [isTextboxMenuOpen, setIsTextboxMenuOpen] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const dbDropdownRef = useRef<HTMLDivElement>(null);
  const lineSpacingRef = useRef<HTMLDivElement>(null);
  const textboxMenuRef = useRef<HTMLDivElement>(null);

  // Style category switcher & detailed gallery popover state
  const [styleCategoryTab, setStyleCategoryTab] = useState<'character' | 'paragraph'>('paragraph');
  const [showStyleGallery, setShowStyleGallery] = useState<boolean>(false);
  const styleGalleryBtnRef = useRef<HTMLButtonElement>(null);

  // Typography state
  const defaultFontFamily = settings?.fontFamily || 'Meiryo';
  const defaultFontSize = settings?.fontSize || '10.5pt';
  const [fontFamily, setFontFamily] = useState<string>(defaultFontFamily);
  const [fontSize, setFontSize] = useState<string>(defaultFontSize);
  const [availableFonts, setAvailableFonts] = useState<SystemFontInfo[]>(() => getAllAvailableFonts());
  const [isLoadingPCFonts, setIsLoadingPCFonts] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string>('');

  // Color picker states
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [textColor, setTextColor] = useState('#0f172a');
  const [highlightColor, setHighlightColor] = useState('#fef08a');
  const textColorBtnRef = useRef<HTMLButtonElement>(null);
  const highlightBtnRef = useRef<HTMLButtonElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setIsFileMenuOpen(false);
      }
      if (dbDropdownRef.current && !dbDropdownRef.current.contains(e.target as Node)) {
        setIsDbDropdownOpen(false);
      }
      if (lineSpacingRef.current && !lineSpacingRef.current.contains(e.target as Node)) {
        setIsLineSpacingOpen(false);
      }
      if (textboxMenuRef.current && !textboxMenuRef.current.contains(e.target as Node)) {
        setIsTextboxMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for caret movement to update font & size feedback
  useEffect(() => {
    const handleSelectionChange = () => {
      try {
        const detected: CaretTypography = detectCaretTypography(defaultFontFamily, defaultFontSize);
        if (detected.fontFamily) setFontFamily(detected.fontFamily);
        if (detected.fontSizePt) setFontSize(detected.fontSizePt);
      } catch {
        // ignore
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [defaultFontFamily, defaultFontSize]);

  const handleFontChange = (newFont: string) => {
    setFontFamily(newFont);
    onApplyFormat('fontName', newFont);
  };

  const handleFontSizeChange = (newSize: string) => {
    setFontSize(newSize);
    onApplyFormat('fontSize', newSize);
  };

  const handleScanPCFonts = async () => {
    setIsLoadingPCFonts(true);
    try {
      const fonts = await queryPCLoaclFonts();
      setAvailableFonts(getAllAvailableFonts());
      setStatusToast(`PCフォントを ${fonts.length} 件 読み込みました`);
      setTimeout(() => setStatusToast(''), 3000);
    } catch {
      setStatusToast('フォント読み込みに失敗しました');
      setTimeout(() => setStatusToast(''), 3000);
    } finally {
      setIsLoadingPCFonts(false);
    }
  };

  return (
    <div className="w-full bg-[#f3f4f6] text-slate-800 border-b border-slate-300 select-none shadow-xs">
      {/* 1. TOP TITLE & QUICK ACCESS TOOLBAR (Word Title Bar) */}
      <div className="h-9 px-2 flex items-center justify-between border-b border-slate-200/80 bg-[#ffffff] text-xs">
        {/* Left: File Button & Quick Action Icons */}
        <div className="flex items-center space-x-1.5">
          {/* Word Blue "ファイル" Backstage Menu Button */}
          <div className="relative" ref={fileMenuRef}>
            <button
              type="button"
              onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
              className="px-3 py-1 bg-[#185abd] hover:bg-[#11499c] active:bg-[#0c3674] text-white font-bold rounded-xs flex items-center space-x-1 shadow-xs transition-colors"
            >
              <span>ファイル</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {/* File Menu Dropdown */}
            {isFileMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-md shadow-xl border border-slate-200 py-1.5 z-50 text-slate-700 animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  ファイル操作・データ
                </div>
                <button
                  type="button"
                  onClick={() => { onNewNote(); setIsFileMenuOpen(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-50 flex items-center space-x-2 text-slate-700"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span className="flex-1">新規ノート作成</span>
                  <span className="text-[10px] text-slate-400">Ctrl+N</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onNewFolder(); setIsFileMenuOpen(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-50 flex items-center space-x-2 text-slate-700"
                >
                  <FolderPlus className="w-4 h-4 text-amber-600" />
                  <span className="flex-1">新規フォルダ作成</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onSave(); setIsFileMenuOpen(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-50 flex items-center space-x-2 text-slate-700 font-semibold"
                >
                  <Save className="w-4 h-4 text-emerald-600" />
                  <span className="flex-1">上書き保存</span>
                  <span className="text-[10px] text-slate-400">Ctrl+S</span>
                </button>

                <div className="my-1 border-t border-slate-150" />

                <button
                  type="button"
                  onClick={() => { onOpenDocxImport?.(); setIsFileMenuOpen(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-50 flex items-center space-x-2 text-slate-700 font-semibold"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="flex-1">📄 Word文書（.docx）一括インポート...</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenDatabaseManager?.(); setIsFileMenuOpen(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-50 flex items-center space-x-2 text-slate-700"
                >
                  <FolderTree className="w-4 h-4 text-indigo-600" />
                  <span className="flex-1">📂 データベース管理・切り替え...</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenCreateDatabase?.(); setIsFileMenuOpen(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-50 flex items-center space-x-2 text-slate-700"
                >
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="flex-1">➕ 新規データベース作成...</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onExportAllJson(); setIsFileMenuOpen(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-50 flex items-center space-x-2 text-slate-700"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span className="flex-1">全データをJSON形式で保存</span>
                </button>

                <div className="my-1 border-t border-slate-150" />

                <button
                  type="button"
                  onClick={() => { onOpenOptions(); setIsFileMenuOpen(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-50 flex items-center space-x-2 text-slate-700"
                >
                  <Settings className="w-4 h-4 text-slate-600" />
                  <span className="flex-1">オプション設定...</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onResetSampleData(); setIsFileMenuOpen(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-rose-50 flex items-center space-x-2 text-rose-600"
                >
                  <RefreshCw className="w-4 h-4 text-rose-500" />
                  <span className="flex-1">デモデータを初期化</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Access Action Icons */}
          <div className="flex items-center space-x-0.5 border-l border-slate-200 pl-1.5">
            <button
              type="button"
              onClick={() => onApplyFormat('undo')}
              title="元に戻す (Ctrl+Z)"
              className="p-1.5 hover:bg-slate-100 active:bg-slate-200 rounded text-slate-700 transition-colors"
            >
              <Undo className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={() => onApplyFormat('redo')}
              title="やり直す (Ctrl+Y)"
              className="p-1.5 hover:bg-slate-100 active:bg-slate-200 rounded text-slate-700 transition-colors"
            >
              <Redo className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>

          {/* Database Profile Switcher */}
          <div className="relative border-l border-slate-200 pl-1.5" ref={dbDropdownRef}>
            <button
              type="button"
              onClick={() => setIsDbDropdownOpen(!isDbDropdownOpen)}
              className="flex items-center space-x-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200/80 rounded text-[11px] font-medium text-slate-700 transition-colors border border-slate-200"
            >
              <Database className="w-3 h-3 text-indigo-600" />
              <span className="max-w-[140px] truncate">{activeDatabaseName}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isDbDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">
                  データベース選択
                </div>
                {databases.map((db) => (
                  <button
                    key={db.id}
                    type="button"
                    onClick={() => { onSelectDatabase?.(db.id); setIsDbDropdownOpen(false); }}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-blue-50 flex items-center justify-between"
                  >
                    <span className="truncate">{db.name}</span>
                    {db.id === activeDatabaseId && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                ))}
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => { onOpenDatabaseManager?.(); setIsDbDropdownOpen(false); }}
                  className="w-full px-3 py-1 text-left text-xs text-blue-600 hover:bg-blue-50 font-medium"
                >
                  データベース一覧・管理...
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Active Document & Notebook Title */}
        <div className="flex items-center space-x-2 truncate max-w-[45%] text-slate-600 font-medium text-xs">
          <span className="font-bold text-slate-800 truncate">{activeNotebookName}</span>
          {activeNoteTitle && (
            <>
              <span className="text-slate-300">/</span>
              <span className="truncate text-slate-600">{activeNoteTitle}</span>
            </>
          )}
        </div>

        {/* Right: Quick Tools, Manual, Specs & Settings */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={onOpenManual}
            className="px-2 py-0.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded text-xs flex items-center space-x-1 transition-colors"
            title="操作マニュアル"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline font-medium">マニュアル</span>
          </button>
          <button
            type="button"
            onClick={onOpenSpecs}
            className="px-2 py-0.5 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded text-xs flex items-center space-x-1 transition-colors"
            title="仕様書・設計書"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline font-medium">仕様・設計</span>
          </button>
          <button
            type="button"
            onClick={onOpenOptions}
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
            title="オプション設定"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
          </button>
          {onOpenErrorLog && (
            <button
              type="button"
              onClick={onOpenErrorLog}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
              title="システム動作・診断ログ"
            >
              <AlertCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. RIBBON TABS ROW (Word Tabs: ホーム / 挿入 / レイアウト・表示 / ツール・管理 / ヘルプ) */}
      <div className="h-8 px-2 flex items-center justify-between border-b border-slate-200/90 bg-[#f9fafb]">
        <div className="flex items-center space-x-0.5">
          {[
            { id: 'home', label: 'ホーム' },
            { id: 'insert', label: '挿入' },
            { id: 'layout', label: 'レイアウト・表示' },
            { id: 'tools', label: 'ツール・管理' },
            { id: 'help', label: 'ヘルプ' },
          ].map((tab) => {
            const isActive = activeRibbonTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onChangeRibbonTab(tab.id as RibbonTab);
                  if (isRibbonMinimized) onToggleRibbonMinimized();
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-t-sm transition-all border-b-2 ${
                  isActive
                    ? 'bg-white text-blue-700 border-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right side: Ribbon Collapse / Expand Toggle */}
        <button
          type="button"
          onClick={onToggleRibbonMinimized}
          title={isRibbonMinimized ? 'リボンを展開する (Ctrl+F1)' : 'リボンを最小化する (Ctrl+F1)'}
          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded transition-colors"
        >
          {isRibbonMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* 3. RIBBON BODY (Structured as Word-like tool groups with group titles at bottom) */}
      {!isRibbonMinimized && (
        <div className="px-2 py-1.5 flex items-stretch space-x-1.5 bg-white min-h-[92px] relative z-20">
          {/* ========================================================================= */}
          {/* TAB 1: HOME (ホーム)                                                      */}
          {/* ========================================================================= */}
          {activeRibbonTab === 'home' && (
            <>
              {/* GROUP 1: クリップボード (Clipboard) */}
              <div className="flex flex-col justify-between pr-2 border-r border-slate-200 shrink-0">
                <div className="flex items-center space-x-1 py-0.5">
                  {/* Format Painter */}
                  <button
                    type="button"
                    onClick={onCopyFormat}
                    title="書式をコピー (Format Painter)"
                    className={`p-1.5 rounded flex flex-col items-center justify-center min-w-[40px] text-xs transition-colors ${
                      isFormatPainterActive
                        ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-500 font-bold'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Paintbrush className="w-4 h-4 text-amber-600 mb-0.5" />
                    <span className="text-[10px]">書式コピー</span>
                  </button>

                  <div className="flex flex-col space-y-0.5">
                    <button
                      type="button"
                      onClick={onPasteFormat}
                      disabled={!hasCopiedFormat}
                      title={hasCopiedFormat ? `書式を適用: ${copiedFormatSummary}` : '書式がコピーされていません'}
                      className={`px-2 py-0.5 rounded text-[11px] flex items-center space-x-1 transition-colors ${
                        hasCopiedFormat
                          ? 'hover:bg-blue-50 text-blue-700 font-semibold cursor-pointer'
                          : 'text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <Paintbrush className="w-3 h-3" />
                      <span>書式適用</span>
                    </button>

                    <button
                      type="button"
                      onClick={onClearFormat}
                      title="選択テキストのすべての書式を解除"
                      className="px-2 py-0.5 rounded text-[11px] text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center space-x-1 transition-colors"
                    >
                      <Eraser className="w-3 h-3 text-slate-400" />
                      <span>書式クリア</span>
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">クリップボード</div>
              </div>

              {/* GROUP 2: フォント (Font) */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 shrink-0">
                <div className="space-y-1">
                  {/* Row 1: Font family & Size */}
                  <div className="flex items-center space-x-1">
                    {/* Font Family Selector */}
                    <div className="relative">
                      <select
                        value={fontFamily}
                        onChange={(e) => {
                          if (e.target.value === '__scan_pc__') {
                            handleScanPCFonts();
                          } else {
                            handleFontChange(e.target.value);
                          }
                        }}
                        className="h-6 text-xs bg-slate-50 border border-slate-200 rounded px-1.5 pr-5 hover:border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 max-w-[140px] truncate"
                      >
                        <optgroup label="プリセットフォント">
                          {FONT_FAMILY_PRESETS.map((f) => (
                            <option key={f.id} value={f.family}>
                              {f.name.split(' (')[0]}
                            </option>
                          ))}
                        </optgroup>
                        {availableFonts.length > 0 && (
                          <optgroup label="PCローカルフォント">
                            {availableFonts.map((f, idx) => (
                              <option key={`${f.family}-${idx}`} value={f.family}>
                                {f.fullName || f.family}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <option value="__scan_pc__">🔍 PCフォントを再読込...</option>
                      </select>
                    </div>

                    {/* Font Size Selector */}
                    <select
                      value={fontSize}
                      onChange={(e) => handleFontSizeChange(e.target.value)}
                      className="h-6 text-xs bg-slate-50 border border-slate-200 rounded px-1 hover:border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 w-[58px]"
                    >
                      {['8pt', '9pt', '10pt', '10.5pt', '11pt', '12pt', '14pt', '16pt', '18pt', '24pt', '32pt'].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Row 2: Basic formatting buttons (B, I, U, S, sub, super, Color, Highlight) */}
                  <div className="flex items-center space-x-0.5">
                    <button
                      type="button"
                      onClick={() => onApplyFormat('bold')}
                      title="太字 (Ctrl+B)"
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-700 font-bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyFormat('italic')}
                      title="斜体 (Ctrl+I)"
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-700 italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyFormat('underline')}
                      title="下線 (Ctrl+U)"
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-700 underline"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyFormat('strikeThrough')}
                      title="取り消し線"
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-700"
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyFormat('subscript')}
                      title="下付き文字 (Subscript)"
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-600 text-[11px] font-bold"
                    >
                      X₂
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyFormat('superscript')}
                      title="上付き文字 (Superscript)"
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-600 text-[11px] font-bold"
                    >
                      X²
                    </button>

                    {/* Color Pickers */}
                    <div className="border-l border-slate-200 pl-1 flex items-center space-x-0.5">
                      <div className="relative">
                        <button
                          ref={textColorBtnRef}
                          type="button"
                          onClick={() => {
                            setShowTextColorPicker(!showTextColorPicker);
                            setShowHighlightPicker(false);
                          }}
                          title="文字色の変更"
                          className={`w-6 h-6 rounded flex flex-col items-center justify-center transition cursor-pointer ${
                            showTextColorPicker ? 'bg-blue-100 ring-1 ring-blue-500' : 'hover:bg-slate-100'
                          }`}
                        >
                          <span className="font-bold text-[11px] leading-none text-slate-800">A</span>
                          <span className="w-3.5 h-0.5 rounded-xs mt-0.5" style={{ backgroundColor: textColor }} />
                        </button>
                        {showTextColorPicker && (
                          <ColorPickerPopover
                            mode="textColor"
                            currentColor={textColor}
                            triggerRef={textColorBtnRef}
                            onSelectColor={(c) => {
                              setTextColor(c);
                              onApplyFormat('foreColor', c);
                            }}
                            onClose={() => setShowTextColorPicker(false)}
                          />
                        )}
                      </div>

                      <div className="relative">
                        <button
                          ref={highlightBtnRef}
                          type="button"
                          onClick={() => {
                            setShowHighlightPicker(!showHighlightPicker);
                            setShowTextColorPicker(false);
                          }}
                          title="テキストの蛍光ペン"
                          className={`w-6 h-6 rounded flex flex-col items-center justify-center transition cursor-pointer ${
                            showHighlightPicker ? 'bg-amber-100 ring-1 ring-amber-500' : 'hover:bg-slate-100'
                          }`}
                        >
                          <Highlighter className="w-3 h-3 text-amber-600" />
                          <span className="w-3.5 h-0.5 rounded-xs mt-0.5" style={{ backgroundColor: highlightColor }} />
                        </button>
                        {showHighlightPicker && (
                          <ColorPickerPopover
                            mode="highlight"
                            currentColor={highlightColor}
                            triggerRef={highlightBtnRef}
                            onSelectColor={(c) => {
                              setHighlightColor(c);
                              onApplyFormat('hiliteColor', c);
                            }}
                            onClose={() => setShowHighlightPicker(false)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">フォント</div>
              </div>

              {/* GROUP 3: 段落 (Paragraph) */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 shrink-0">
                <div className="space-y-1">
                  {/* Row 1: Lists & Indent */}
                  <div className="flex items-center space-x-0.5">
                    <button
                      type="button"
                      onClick={() => onApplyFormat('insertUnorderedList')}
                      title="箇条書き (Bullet List)"
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-700"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyFormat('insertOrderedList')}
                      title="段落番号 (Numbered List)"
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-700"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyFormat('insertChecklist')}
                      title="チェックリスト (Checklist)"
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-700"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyFormat('outdent')}
                      title="インデントを減らす"
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-700"
                    >
                      <Outdent className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyFormat('indent')}
                      title="インデントを増やす"
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-700"
                    >
                      <Indent className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Row 2: Alignment & Line spacing */}
                  <div className="flex items-center space-x-0.5">
                    <button
                      type="button"
                      onClick={() => onApplyFormat('justifyLeft')}
                      title="左揃え"
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-700"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyFormat('justifyCenter')}
                      title="中央揃え"
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-700"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyFormat('justifyRight')}
                      title="右揃え"
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-700"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onApplyFormat('justifyFull')}
                      title="両端揃え"
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-700"
                    >
                      <AlignJustify className="w-3.5 h-3.5" />
                    </button>

                    {/* Line Spacing Menu */}
                    <div className="relative" ref={lineSpacingRef}>
                      <button
                        type="button"
                        onClick={() => setIsLineSpacingOpen(!isLineSpacingOpen)}
                        title="行間・行送り (Line Spacing)"
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-700"
                      >
                        <Rows className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      {isLineSpacingOpen && (
                        <div className="absolute left-0 top-full mt-1 w-36 bg-white rounded shadow-lg border border-slate-200 py-1 z-50 text-xs">
                          <div className="px-2 py-0.5 text-[10px] text-slate-400 font-bold uppercase">行間設定</div>
                          {[
                            { label: '1.4 (高密度)', val: '1.4' },
                            { label: '1.6 (標準・推奨)', val: '1.6' },
                            { label: '1.8 (長文向け)', val: '1.8' },
                            { label: '2.0 (ゆったり)', val: '2.0' },
                          ].map((ls) => (
                            <button
                              key={ls.val}
                              type="button"
                              onClick={() => {
                                onUpdateSettings?.({ lineHeight: ls.val });
                                setIsLineSpacingOpen(false);
                              }}
                              className={`w-full px-2 py-1 text-left flex items-center justify-between hover:bg-blue-50 ${
                                settings.lineHeight === ls.val ? 'text-blue-600 font-bold' : 'text-slate-700'
                              }`}
                            >
                              <span>{ls.label}</span>
                              {settings.lineHeight === ls.val && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">段落</div>
              </div>

              {/* GROUP 4: スタイル (Styles) */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 shrink-0">
                {/* Main styles row: Left switcher -> Enlarged Style Cards -> Right detailed gallery button */}
                <div className="flex items-center space-x-1.5 py-0.5">
                  {/* Left: Category Switcher [文字] / [段落] */}
                  <div className="flex flex-col justify-center space-y-1 pr-1.5 border-r border-slate-200/80 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStyleCategoryTab('character')}
                      className={`px-2 py-1.5 rounded text-[10px] font-bold transition flex items-center justify-center cursor-pointer ${
                        styleCategoryTab === 'character'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                      }`}
                      title="文字単位のスタイル一覧に切り替え"
                    >
                      文字
                    </button>
                    <button
                      type="button"
                      onClick={() => setStyleCategoryTab('paragraph')}
                      className={`px-2 py-1.5 rounded text-[10px] font-bold transition flex items-center justify-center cursor-pointer ${
                        styleCategoryTab === 'paragraph'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                      }`}
                      title="段落単位のスタイル一覧に切り替え"
                    >
                      段落
                    </button>
                  </div>

                  {/* Center: Enlarged Style Cards */}
                  <div className="flex items-center space-x-1.5">
                    {(styleCategoryTab === 'character' ? (characterStyles || []) : (paragraphStyles || []))
                      .filter((st) => !st.isHidden)
                      .slice(0, 5)
                      .map((st) => {
                        const isSelected = activeStyleId === st.id;
                        return (
                          <div
                            key={st.id}
                            className="group relative"
                            onContextMenu={(e) => {
                              e.preventDefault();
                              onEditStyle?.(st);
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => onApplyStyle?.(st)}
                              title={`「${st.name}」を適用（クリック）\n右クリックまたはホバーで編集・削除`}
                              className={`px-2.5 py-1.5 h-[58px] rounded-md border flex flex-col items-center justify-between min-w-[68px] max-w-[76px] transition cursor-pointer shadow-2xs ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/80 shadow-xs'
                                  : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 bg-white'
                              }`}
                            >
                              {/* Large preview text */}
                              <div className="flex-1 flex items-center justify-center w-full overflow-hidden pt-0.5">
                                <span
                                  className="leading-none text-base font-bold truncate max-w-[64px]"
                                  style={{
                                    color: st.textColor || (st.headingLevel === 'h1' ? '#1e3a8a' : '#0f172a'),
                                    backgroundColor: st.backgroundColor || 'transparent',
                                    fontWeight: st.fontWeight || (st.headingLevel ? 'bold' : 'normal'),
                                    textDecoration: st.textDecoration || 'none',
                                    textDecorationColor: st.underlineColor || 'currentColor',
                                    textDecorationStyle: (st.underlineStyle as any) || 'solid',
                                    fontStyle: st.fontStyle || 'normal',
                                  }}
                                >
                                  {st.symbolPrefix ? `${st.symbolPrefix}Aa` : 'Aa'}
                                </span>
                              </div>
                              {/* Style name label */}
                              <span className="text-[10px] text-slate-700 truncate max-w-[62px] font-semibold pb-0.5">
                                {st.name}
                              </span>
                            </button>

                            {/* Hover Actions: 編集 & 削除 */}
                            <div className="hidden group-hover:flex items-center space-x-0.5 absolute top-0.5 right-0.5 bg-white/95 rounded shadow-xs border border-slate-300 px-0.5 py-0.5 z-30">
                              {onEditStyle && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditStyle(st);
                                  }}
                                  title={`「${st.name}」を変更・編集`}
                                  className="p-0.5 hover:bg-blue-100 text-slate-600 hover:text-blue-700 rounded transition cursor-pointer"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                </button>
                              )}
                              {onDeleteStyle && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`スタイル「${st.name}」を削除してもよろしいですか？`)) {
                                      onDeleteStyle(st.id);
                                    }
                                  }}
                                  title={`「${st.name}」を削除`}
                                  className="p-0.5 hover:bg-red-100 text-slate-600 hover:text-red-700 rounded transition cursor-pointer"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Right: Detailed Gallery Button (Opens popover synchronized with active tab) */}
                  <div className="relative flex items-center pl-0.5 shrink-0">
                    <button
                      ref={styleGalleryBtnRef}
                      type="button"
                      onClick={() => setShowStyleGallery(!showStyleGallery)}
                      title={`すべてのスタイル一覧・管理を開く（現在: ${styleCategoryTab === 'character' ? '文字' : '段落'}スタイル）`}
                      className={`px-2 h-[58px] rounded-md border flex flex-col items-center justify-center min-w-[42px] transition cursor-pointer shadow-2xs ${
                        showStyleGallery
                          ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-400'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-500 mb-0.5" />
                      <span className="text-[10px] font-bold leading-tight">詳細</span>
                      <ChevronDown className="w-3 h-3 text-slate-400 mt-0.5" />
                    </button>

                    {/* Detailed Style Gallery Popover */}
                    {showStyleGallery && onApplyStyle && onCreateNewStyle && onEditStyle && onDeleteStyle && (
                      <StyleGalleryPopover
                        characterStyles={characterStyles || []}
                        paragraphStyles={paragraphStyles || []}
                        activeStyleId={activeStyleId}
                        onApplyStyle={onApplyStyle}
                        onClearFormat={onClearFormat || (() => {})}
                        onCreateNewStyle={onCreateNewStyle}
                        onEditStyle={onEditStyle}
                        onDeleteStyle={onDeleteStyle}
                        onToggleHideStyle={onToggleHideStyle}
                        onResetDefaultStyles={onResetDefaultStyles}
                        initialTab={styleCategoryTab}
                        onClose={() => setShowStyleGallery(false)}
                        triggerRef={styleGalleryBtnRef}
                      />
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">スタイル</div>
              </div>

              {/* GROUP 5: 編集・検索 (Editing) */}
              <div className="flex flex-col justify-between pl-2 shrink-0">
                <div className="flex flex-col space-y-0.5 py-0.5">
                  <button
                    type="button"
                    onClick={onOpenFind}
                    title="文書内を検索 (Ctrl+F)"
                    className="px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 rounded flex items-center space-x-1.5 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-blue-600" />
                    <span>検索</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenReplace}
                    title="検索と置換 (Ctrl+H)"
                    className="px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 rounded flex items-center space-x-1.5 transition-colors"
                  >
                    <Replace className="w-3.5 h-3.5 text-emerald-600" />
                    <span>置換</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenGlobalSearch}
                    title="すべてのノートを全体検索 (Ctrl+Shift+F)"
                    className="px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 rounded flex items-center space-x-1.5 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-purple-600" />
                    <span>全体検索</span>
                  </button>
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">編集</div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: INSERT (挿入)                                                      */}
          {/* ========================================================================= */}
          {activeRibbonTab === 'insert' && (
            <>
              {/* GROUP 1: ページ・構造 */}
              <div className="flex flex-col justify-between pr-2 border-r border-slate-200 shrink-0">
                <div className="flex items-center space-x-1 py-0.5">
                  <button
                    type="button"
                    onClick={onNewNote}
                    className="p-2 hover:bg-slate-100 rounded flex flex-col items-center justify-center min-w-[48px] text-xs text-slate-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-blue-600 mb-0.5" />
                    <span className="text-[10px]">新規ノート</span>
                  </button>
                  <button
                    type="button"
                    onClick={onNewFolder}
                    className="p-2 hover:bg-slate-100 rounded flex flex-col items-center justify-center min-w-[48px] text-xs text-slate-700 transition-colors"
                  >
                    <FolderPlus className="w-4 h-4 text-amber-600 mb-0.5" />
                    <span className="text-[10px]">新規フォルダ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onApplyFormat('insertHorizontalRule')}
                    className="p-2 hover:bg-slate-100 rounded flex flex-col items-center justify-center min-w-[44px] text-xs text-slate-700 transition-colors"
                  >
                    <Rows className="w-4 h-4 text-slate-500 mb-0.5" />
                    <span className="text-[10px]">水平線</span>
                  </button>
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">ページ・構造</div>
              </div>

              {/* GROUP 2: 図・表 (Tables & Media) */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 shrink-0">
                <div className="flex items-center space-x-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={onInsertTable}
                    className="p-2 hover:bg-slate-100 rounded flex flex-col items-center justify-center min-w-[50px] text-xs text-slate-700 transition-colors"
                  >
                    <Table className="w-5 h-5 text-indigo-600 mb-0.5" />
                    <span className="text-[10px] font-medium">表の挿入</span>
                  </button>
                  <button
                    type="button"
                    onClick={onInsertImage}
                    className="p-2 hover:bg-slate-100 rounded flex flex-col items-center justify-center min-w-[50px] text-xs text-slate-700 transition-colors"
                  >
                    <ImageIcon className="w-5 h-5 text-emerald-600 mb-0.5" />
                    <span className="text-[10px] font-medium">画像</span>
                  </button>
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">表・図</div>
              </div>

              {/* GROUP 3: 注釈・参照 (Footnotes & References) */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 shrink-0">
                <div className="flex items-center space-x-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={onInsertFootnote}
                    className="p-2 hover:bg-blue-50 text-blue-700 rounded flex flex-col items-center justify-center min-w-[54px] text-xs transition-colors border border-blue-200 bg-blue-50/50"
                  >
                    <BookOpen className="w-5 h-5 text-blue-600 mb-0.5" />
                    <span className="text-[10px] font-bold">注釈・脚注</span>
                  </button>
                  {onInsertFigureCaption && (
                    <button
                      type="button"
                      onClick={onInsertFigureCaption}
                      className="p-2 hover:bg-slate-100 rounded flex flex-col items-center justify-center min-w-[54px] text-xs text-slate-700 transition-colors"
                    >
                      <Captions className="w-5 h-5 text-purple-600 mb-0.5" />
                      <span className="text-[10px]">図表番号</span>
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">注釈・参照</div>
              </div>

              {/* GROUP 4: テキスト・リンク (Text & Links) */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 shrink-0">
                <div className="flex items-center space-x-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={onInsertCallout}
                    className="p-2 hover:bg-slate-100 rounded flex flex-col items-center justify-center min-w-[48px] text-xs text-slate-700 transition-colors"
                  >
                    <MessageSquare className="w-5 h-5 text-amber-600 mb-0.5" />
                    <span className="text-[10px]">吹き出し</span>
                  </button>

                  {/* Textbox Menu */}
                  <div className="relative" ref={textboxMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsTextboxMenuOpen(!isTextboxMenuOpen)}
                      className="p-2 hover:bg-slate-100 rounded flex flex-col items-center justify-center min-w-[54px] text-xs text-slate-700 transition-colors"
                    >
                      <SquarePen className="w-5 h-5 text-sky-600 mb-0.5" />
                      <span className="text-[10px]">テキスト枠</span>
                    </button>
                    {isTextboxMenuOpen && onInsertTextbox && (
                      <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded shadow-lg border border-slate-200 py-1 z-50 text-xs">
                        <button
                          type="button"
                          onClick={() => { onInsertTextbox('horizontal'); setIsTextboxMenuOpen(false); }}
                          className="w-full px-3 py-1.5 text-left hover:bg-blue-50 flex items-center space-x-2 text-slate-700"
                        >
                          <Rows className="w-3.5 h-3.5 text-blue-600" />
                          <span>横書きテキスト枠</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { onInsertTextbox('vertical'); setIsTextboxMenuOpen(false); }}
                          className="w-full px-3 py-1.5 text-left hover:bg-blue-50 flex items-center space-x-2 text-slate-700"
                        >
                          <Columns className="w-3.5 h-3.5 text-emerald-600" />
                          <span>縦書きテキスト枠</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={onInsertLink}
                    className="p-2 hover:bg-slate-100 rounded flex flex-col items-center justify-center min-w-[44px] text-xs text-slate-700 transition-colors"
                  >
                    <LinkIcon className="w-5 h-5 text-blue-600 mb-0.5" />
                    <span className="text-[10px]">リンク</span>
                  </button>
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">テキスト・リンク</div>
              </div>

              {/* GROUP 5: ブックマーク (Bookmarks) */}
              <div className="flex flex-col justify-between pl-2 shrink-0">
                <div className="flex items-center space-x-1 py-0.5">
                  <button
                    type="button"
                    onClick={onToggleBookmark}
                    title="ノート全体をお気に入りに登録/解除"
                    className={`p-2 rounded flex flex-col items-center justify-center min-w-[50px] text-xs transition-colors ${
                      isBookmarked
                        ? 'bg-amber-50 text-amber-600 font-bold border border-amber-200'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Star className={`w-5 h-5 mb-0.5 ${isBookmarked ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                    <span className="text-[10px]">ノートBM</span>
                  </button>

                  <button
                    type="button"
                    onClick={onBookmarkSentence}
                    title="選択中の文章をブックマーク登録"
                    className="p-2 hover:bg-slate-100 rounded flex flex-col items-center justify-center min-w-[50px] text-xs text-slate-700 transition-colors"
                  >
                    <Bookmark className="w-5 h-5 text-amber-600 mb-0.5" />
                    <span className="text-[10px]">文章BM</span>
                  </button>

                  {onInsertBookmarkCard && (
                    <button
                      type="button"
                      onClick={onInsertBookmarkCard}
                      title="本文内にブックマーク引用カードを挿入"
                      className="p-2 hover:bg-slate-100 rounded flex flex-col items-center justify-center min-w-[50px] text-xs text-slate-700 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-indigo-600 mb-0.5" />
                      <span className="text-[10px]">BMカード</span>
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">ブックマーク</div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: LAYOUT & VIEW (レイアウト・表示)                                    */}
          {/* ========================================================================= */}
          {activeRibbonTab === 'layout' && (
            <>
              {/* GROUP 1: 表示設定 (View Toggles) */}
              <div className="flex flex-col justify-between pr-2 border-r border-slate-200 shrink-0">
                <div className="flex items-center space-x-1.5 py-0.5">
                  {onToggleHierarchy1 && (
                    <button
                      type="button"
                      onClick={onToggleHierarchy1}
                      title={isHierarchy1Collapsed ? '階層1（フォルダ・タブ）を展開' : '階層1（フォルダ・タブ）を折りたたむ'}
                      className={`p-2 rounded flex flex-col items-center justify-center min-w-[54px] text-xs transition-colors cursor-pointer ${
                        !isHierarchy1Collapsed
                          ? 'bg-orange-100 text-orange-900 font-bold ring-1 ring-orange-300'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Layers className="w-5 h-5 text-orange-600 mb-0.5" />
                      <span className="text-[10px]">階層1表示</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onToggleRuler}
                    className={`p-2 rounded flex flex-col items-center justify-center min-w-[52px] text-xs transition-colors cursor-pointer ${
                      showRuler
                        ? 'bg-blue-100 text-blue-700 font-bold ring-1 ring-blue-400'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Sliders className="w-5 h-5 text-blue-600 mb-0.5" />
                    <span className="text-[10px]">ルーラー</span>
                  </button>

                  <div className="flex flex-col space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold">折り返しモード:</span>
                    <select
                      value={settings.bodyWrapMode || 'full'}
                      onChange={(e) => onUpdateSettings?.({ bodyWrapMode: e.target.value as any })}
                      className="h-6 text-xs bg-slate-50 border border-slate-200 rounded px-1.5 hover:border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-800"
                    >
                      <option value="full">全幅折り返し</option>
                      <option value="characters">指定文字数 (80文字)</option>
                      <option value="pixels">固定ピクセル (800px)</option>
                      <option value="none">折り返さない (横スクロール)</option>
                    </select>
                  </div>
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">表示設定</div>
              </div>

              {/* GROUP 2: 用紙配置・余白 (Page Layout) */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 shrink-0">
                <div className="flex items-center space-x-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings?.({ contentAlignment: 'center' })}
                    className={`p-2 rounded flex flex-col items-center justify-center min-w-[50px] text-xs transition-colors ${
                      (settings.contentAlignment || 'center') === 'center'
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-300'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <AlignCenter className="w-5 h-5 text-blue-600 mb-0.5" />
                    <span className="text-[10px]">中央揃え</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings?.({ contentAlignment: 'left' })}
                    className={`p-2 rounded flex flex-col items-center justify-center min-w-[50px] text-xs transition-colors ${
                      settings.contentAlignment === 'left'
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-300'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <AlignLeft className="w-5 h-5 text-slate-600 mb-0.5" />
                    <span className="text-[10px]">左揃え</span>
                  </button>
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">用紙配置</div>
              </div>

              {/* GROUP 3: タブ位置 (Tab Position) - USER REQUEST FEATURE */}
              <div className="flex flex-col justify-between pl-2 shrink-0">
                <div className="flex items-center space-x-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings?.({ tabPosition: 'bottom' })}
                    className={`p-2 rounded flex flex-col items-center justify-center min-w-[58px] text-xs transition-colors ${
                      (settings.tabPosition || 'bottom') === 'bottom'
                        ? 'bg-blue-100 text-blue-800 font-bold ring-1 ring-blue-500'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="w-5 h-5 flex flex-col justify-end p-0.5 border border-slate-300 rounded mb-0.5 bg-slate-50">
                      <div className="w-full h-1 bg-blue-600 rounded-xs"></div>
                    </div>
                    <span className="text-[10px]">下部に表示</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings?.({ tabPosition: 'top' })}
                    className={`p-2 rounded flex flex-col items-center justify-center min-w-[58px] text-xs transition-colors ${
                      settings.tabPosition === 'top'
                        ? 'bg-blue-100 text-blue-800 font-bold ring-1 ring-blue-500'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="w-5 h-5 flex flex-col justify-start p-0.5 border border-slate-300 rounded mb-0.5 bg-slate-50">
                      <div className="w-full h-1 bg-blue-600 rounded-xs"></div>
                    </div>
                    <span className="text-[10px]">上部に表示</span>
                  </button>
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">開いているタブ位置 (初期値: 下)</div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: TOOLS & MANAGE (ツール・管理)                                       */}
          {/* ========================================================================= */}
          {activeRibbonTab === 'tools' && (
            <>
              {/* GROUP 1: データベース (Database) */}
              <div className="flex flex-col justify-between pr-2 border-r border-slate-200 shrink-0">
                <div className="flex items-center space-x-1 py-0.5">
                  <button
                    type="button"
                    onClick={onOpenDatabaseManager}
                    className="p-2 hover:bg-slate-100 rounded flex flex-col items-center justify-center min-w-[56px] text-xs text-slate-700 transition-colors"
                  >
                    <FolderTree className="w-5 h-5 text-indigo-600 mb-0.5" />
                    <span className="text-[10px] font-medium">DB管理</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenCreateDatabase}
                    className="p-2 hover:bg-slate-100 rounded flex flex-col items-center justify-center min-w-[56px] text-xs text-slate-700 transition-colors"
                  >
                    <Database className="w-5 h-5 text-blue-600 mb-0.5" />
                    <span className="text-[10px]">新規DB</span>
                  </button>
                  <button
                    type="button"
                    onClick={onResetSampleData}
                    className="p-2 hover:bg-rose-50 rounded flex flex-col items-center justify-center min-w-[56px] text-xs text-rose-600 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5 text-rose-500 mb-0.5" />
                    <span className="text-[10px]">デモ復元</span>
                  </button>
                  {onCleanAndOptimizeDatabase && (
                    <button
                      type="button"
                      onClick={onCleanAndOptimizeDatabase}
                      className="p-2 hover:bg-emerald-50 rounded flex flex-col items-center justify-center min-w-[56px] text-xs text-emerald-700 transition-colors"
                      title="残留データ・孤児ノードの消去とツリー構造の最適化"
                    >
                      <Sparkles className="w-5 h-5 text-emerald-600 mb-0.5" />
                      <span className="text-[10px] font-bold">DB最適化</span>
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">データベース</div>
              </div>

              {/* GROUP 2: データのみ保存・復元 (.zip) */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 shrink-0">
                <div className="flex items-center space-x-1 py-0.5">
                  <button
                    type="button"
                    onClick={onExportDataOnlyZip}
                    className="p-2 hover:bg-emerald-50 rounded flex flex-col items-center justify-center min-w-[62px] text-xs text-emerald-800 transition-colors cursor-pointer"
                    title="Markdown + リッチHTML形式のZIPファイルで全ノートを出力"
                  >
                    <Download className="w-5 h-5 text-emerald-600 mb-0.5" />
                    <span className="text-[10px] font-bold">データ保存</span>
                  </button>

                  <label
                    className="p-2 hover:bg-emerald-50 rounded flex flex-col items-center justify-center min-w-[62px] text-xs text-emerald-800 transition-colors cursor-pointer"
                    title="Markdown ZIPファイルからデータを完全復元"
                  >
                    <Upload className="w-5 h-5 text-emerald-600 mb-0.5" />
                    <span className="text-[10px] font-bold">データ復元</span>
                    <input
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && onImportDataOnlyZip) {
                          onImportDataOnlyZip(file);
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                <div className="text-[10px] text-center text-emerald-600 font-medium">データ保存・復元</div>
              </div>

              {/* GROUP 3: 全DB一括バックアップ・復元 (.json) */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 shrink-0">
                <div className="flex items-center space-x-1 py-0.5">
                  <button
                    type="button"
                    onClick={onExportAllJson}
                    className="p-2 hover:bg-blue-50 rounded flex flex-col items-center justify-center min-w-[62px] text-xs text-blue-800 transition-colors cursor-pointer"
                    title="全DBとシステム設定を1つのJSONファイルに一括保存"
                  >
                    <Download className="w-5 h-5 text-blue-600 mb-0.5" />
                    <span className="text-[10px] font-bold">全DB保存</span>
                  </button>

                  <label
                    className="p-2 hover:bg-blue-50 rounded flex flex-col items-center justify-center min-w-[62px] text-xs text-blue-800 transition-colors cursor-pointer"
                    title="JSONバックアップファイルからすべてのDBと設定を一括復元"
                  >
                    <Upload className="w-5 h-5 text-blue-600 mb-0.5" />
                    <span className="text-[10px] font-bold">全DB復元</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && onImportAllJson) {
                          onImportAllJson(file);
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                <div className="text-[10px] text-center text-blue-600 font-medium">全DBバックアップ</div>
              </div>

              {/* GROUP 4: 外部・Git連携 (Word & GitHub) */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-200 shrink-0">
                <div className="flex items-center space-x-1 py-0.5">
                  <button
                    type="button"
                    onClick={onOpenDocxImport}
                    className="p-2 hover:bg-slate-100 rounded flex flex-col items-center justify-center min-w-[60px] text-xs text-slate-700 transition-colors cursor-pointer"
                    title="Word (.docx) ファイルを一括インポート"
                  >
                    <FileText className="w-5 h-5 text-indigo-600 mb-0.5" />
                    <span className="text-[10px]">Word読込</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenGitPushModal}
                    className="p-2 hover:bg-indigo-50 rounded flex flex-col items-center justify-center min-w-[62px] text-xs text-indigo-800 transition-colors cursor-pointer"
                    title="GitHubリモートリポジトリへ変更をコミット＆プッシュ"
                  >
                    <FolderGit2 className="w-5 h-5 text-indigo-600 mb-0.5" />
                    <span className="text-[10px] font-bold">GitHubプッシュ</span>
                  </button>
                </div>
                <div className="text-[10px] text-center text-indigo-600 font-medium">外部・GitHub</div>
              </div>

              {/* GROUP 3: 診断・設定 (System) */}
              <div className="flex flex-col justify-between pl-2 shrink-0">
                <div className="flex items-center space-x-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={onOpenOptions}
                    className="p-2 hover:bg-slate-100 rounded flex flex-col items-center justify-center min-w-[56px] text-xs text-slate-700 transition-colors"
                  >
                    <Settings className="w-5 h-5 text-slate-600 mb-0.5" />
                    <span className="text-[10px]">オプション</span>
                  </button>
                  {onOpenErrorLog && (
                    <button
                      type="button"
                      onClick={onOpenErrorLog}
                      className="p-2 hover:bg-slate-100 rounded flex flex-col items-center justify-center min-w-[56px] text-xs text-slate-700 transition-colors"
                    >
                      <AlertCircle className="w-5 h-5 text-amber-600 mb-0.5" />
                      <span className="text-[10px]">動作ログ</span>
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">システム</div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: HELP (ヘルプ)                                                      */}
          {/* ========================================================================= */}
          {activeRibbonTab === 'help' && (
            <>
              <div className="flex flex-col justify-between pr-2 border-r border-slate-200 shrink-0">
                <div className="flex items-center space-x-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={onOpenManual}
                    className="p-2 hover:bg-blue-50 rounded flex flex-col items-center justify-center min-w-[64px] text-xs text-blue-700 border border-blue-200 bg-blue-50/50 transition-colors"
                  >
                    <BookOpen className="w-5 h-5 text-blue-600 mb-0.5" />
                    <span className="text-[10px] font-bold">操作マニュアル</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenSpecs}
                    className="p-2 hover:bg-indigo-50 rounded flex flex-col items-center justify-center min-w-[64px] text-xs text-indigo-700 border border-indigo-200 bg-indigo-50/50 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-indigo-600 mb-0.5" />
                    <span className="text-[10px] font-bold">仕様書・設計書</span>
                  </button>
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">マニュアル・仕様</div>
              </div>

              <div className="flex flex-col justify-between pl-2 shrink-0">
                <div className="flex items-center space-x-2 py-1 text-xs text-slate-600">
                  <div className="p-1.5 bg-blue-50 border border-blue-200 rounded text-blue-800 text-[11px] leading-relaxed">
                    <div className="font-bold">階層型リッチノートマネージャー v2.4</div>
                    <div className="text-[10px] text-slate-500">React 19 / Word Ribbon Style UI / DOCX Footnotes Sync</div>
                  </div>
                </div>
                <div className="text-[10px] text-center text-slate-400 font-medium">バージョン情報</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
