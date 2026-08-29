import React, { useState } from 'react';
import { 
  FileText, FolderPlus, Plus, Save, Printer, Search, Replace, Lock, 
  FileCode2, BookOpen, Download, Settings, RefreshCw, Layers,
  BookMarked, HelpCircle, Trash2, Database, ChevronDown, Check,
  FolderTree, Sparkles, Star, Bookmark, Globe, Paintbrush, ClipboardPaste, Eraser,
  SquarePen, Rows, Columns, Terminal, Bug, AlertCircle, Image as ImageIcon, Table as TableIcon, MessageSquare
} from 'lucide-react';
import { DatabaseProfile } from '../types';

interface TopMenuBarProps {
  onNewNote: () => void;
  onNewFolder: () => void;
  onSave: () => void;
  onDeleteNode?: () => void;
  onOpenSearch?: () => void;
  onOpenFind?: () => void;
  onOpenReplace?: () => void;
  onOpenGlobalSearch?: () => void;
  onOpenDocxImport?: () => void;
  onOpenOptions?: () => void;
  onOpenSpecs: () => void;
  onOpenFlaskCode: () => void;
  onOpenManual: () => void;
  onExportAllJson: () => void;
  onResetSampleData: () => void;
  isSaving: boolean;
  activeNotebookName: string;
  // Database Management Props
  databases?: DatabaseProfile[];
  activeDatabaseId?: string;
  activeDatabaseName?: string;
  onSelectDatabase?: (dbId: string) => void;
  onOpenCreateDatabase?: () => void;
  onOpenDatabaseManager?: () => void;
  onInsertImage?: () => void;
  onInsertTable?: () => void;
  onInsertCallout?: () => void;
  onInsertFootnote?: () => void;
  onInsertTextbox?: (orientation: 'horizontal' | 'vertical') => void;
  // Bookmark props
  onToggleBookmarkActive?: () => void;
  onBookmarkSentence?: () => void;
  onOpenBookmarksTab?: () => void;
  onInsertBookmarkCard?: () => void;
  onClearAllBookmarks?: () => void;
  bookmarkedCount?: number;
  isCurrentNodeBookmarked?: boolean;
  // Format Painter props
  onCopyFormat?: () => void;
  onPasteFormat?: () => void;
  onClearFormat?: () => void;
  onOpenErrorLog?: () => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  onNewNote,
  onNewFolder,
  onSave,
  onDeleteNode,
  onOpenSearch,
  onOpenFind,
  onOpenReplace,
  onOpenGlobalSearch,
  onOpenDocxImport,
  onOpenOptions,
  onOpenSpecs,
  onOpenFlaskCode,
  onOpenManual,
  onExportAllJson,
  onResetSampleData,
  isSaving,
  activeNotebookName,
  databases = [],
  activeDatabaseId = 'demo',
  activeDatabaseName = 'DEMO（デモデータ）',
  onSelectDatabase,
  onOpenCreateDatabase,
  onOpenDatabaseManager,
  onInsertImage,
  onInsertTable,
  onInsertCallout,
  onInsertFootnote,
  onInsertTextbox,
  onToggleBookmarkActive,
  onBookmarkSentence,
  onOpenBookmarksTab,
  onInsertBookmarkCard,
  onClearAllBookmarks,
  bookmarkedCount = 0,
  isCurrentNodeBookmarked = false,
  onCopyFormat,
  onPasteFormat,
  onClearFormat,
  onOpenErrorLog,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isDbDropdownOpen, setIsDbDropdownOpen] = useState<boolean>(false);

  const menuItems = [
    {
      name: 'ファイル(F)',
      items: [
        { label: '新規ノート', shortcut: 'Ctrl+N', action: onNewNote, icon: <Plus className="w-3.5 h-3.5" /> },
        { label: '新規フォルダ', shortcut: 'Ctrl+Shift+N', action: onNewFolder, icon: <FolderPlus className="w-3.5 h-3.5" /> },
        { label: '上書き保存', shortcut: 'Ctrl+S', action: onSave, icon: <Save className="w-3.5 h-3.5" /> },
        { divider: true },
        { label: '📄 DOCXファイルをインポート...', shortcut: '', action: onOpenDocxImport, icon: <FileText className="w-3.5 h-3.5 text-blue-600" /> },
        { divider: true },
        { label: '🗄️ 新規データベースを作成 (名前指定)...', shortcut: '', action: onOpenCreateDatabase, icon: <Database className="w-3.5 h-3.5 text-blue-600" /> },
        { label: '📂 データベースの管理・切り替え...', shortcut: '', action: onOpenDatabaseManager, icon: <FolderTree className="w-3.5 h-3.5 text-indigo-600" /> },
        { divider: true },
        { label: '全データをJSON形式で保存', shortcut: '', action: onExportAllJson, icon: <Download className="w-3.5 h-3.5" /> },
        { label: '初期DEMOデータにリセット', shortcut: '', action: onResetSampleData, icon: <RefreshCw className="w-3.5 h-3.5" /> },
      ],
    },
    {
      name: '編集(E)',
      items: [
        { label: 'タブ内を検索 (Find)', shortcut: 'Ctrl+F', action: onOpenFind, icon: <Search className="w-3.5 h-3.5 text-blue-600" /> },
        { label: 'タブ内を置換 (Replace)', shortcut: 'Ctrl+H', action: onOpenReplace, icon: <Replace className="w-3.5 h-3.5 text-amber-600" /> },
        { label: 'ＤＢ内全体を検索 (Global Search)', shortcut: 'Ctrl+Shift+F', action: onOpenGlobalSearch, icon: <Globe className="w-3.5 h-3.5 text-indigo-600" /> },
        { divider: true },
        { label: '選択中ノートを削除', shortcut: 'Delete', action: onDeleteNode, icon: <Trash2 className="w-3.5 h-3.5 text-red-500" /> },
        { divider: true },
        { label: '元に戻す (Undo)', shortcut: 'Ctrl+Z' },
        { label: 'やり直し (Redo)', shortcut: 'Ctrl+Y' },
        { divider: true },
        { label: '切り取り', shortcut: 'Ctrl+X' },
        { label: 'コピー', shortcut: 'Ctrl+C' },
        { label: '貼り付け', shortcut: 'Ctrl+V' },
        { divider: true },
        { label: '書式のコピー (Format Painter)', shortcut: 'Ctrl+Shift+C', action: onCopyFormat, icon: <Paintbrush className="w-3.5 h-3.5 text-indigo-600" /> },
        { label: '書式の貼り付け', shortcut: 'Ctrl+Shift+V', action: onPasteFormat, icon: <ClipboardPaste className="w-3.5 h-3.5 text-indigo-600" /> },
        { label: '書式のクリア(C)', shortcut: 'Alt+C', action: onClearFormat, icon: <Eraser className="w-3.5 h-3.5 text-amber-500" /> },
        { divider: true },
        { label: 'すべて選択', shortcut: 'Ctrl+A' },
      ],
    },
    {
      name: '表示(V)',
      items: [
        { label: '📖 操作マニュアル・ユーザーガイド', shortcut: '', action: onOpenManual, icon: <BookMarked className="w-3.5 h-3.5 text-blue-600" /> },
        { label: 'リソースパネルの表示切替', shortcut: 'F9' },
        { label: 'フォルダ一覧の表示切替', shortcut: 'Ctrl+B' },
        { label: 'ルーラー(定規)の表示切替', shortcut: '' },
      ],
    },
    {
      name: 'ブックマーク(B)',
      items: [
        { 
          label: isCurrentNodeBookmarked ? '★ 現在のノートのブックマークを解除' : '☆ 現在のノートをブックマークに追加', 
          shortcut: 'Ctrl+D', 
          action: onToggleBookmarkActive, 
          icon: <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> 
        },
        { 
          label: '🔖 選択した文章をブックマークに追加', 
          shortcut: 'Ctrl+Shift+D', 
          action: onBookmarkSentence, 
          icon: <Bookmark className="w-3.5 h-3.5 text-blue-600" /> 
        },
        { 
          label: `📑 ブックマーク一覧パネルを開く (${bookmarkedCount}件)`, 
          shortcut: 'Shift+B', 
          action: onOpenBookmarksTab, 
          icon: <BookMarked className="w-3.5 h-3.5 text-indigo-600" /> 
        },
        { divider: true },
        { 
          label: '🌐 Webブックマークカードを本文に挿入...', 
          shortcut: '', 
          action: onInsertBookmarkCard, 
          icon: <Globe className="w-3.5 h-3.5 text-indigo-600" /> 
        },
        { divider: true },
        { 
          label: '🧹 すべてのブックマーク登録をクリア...', 
          shortcut: '', 
          action: onClearAllBookmarks, 
          icon: <Trash2 className="w-3.5 h-3.5 text-red-500" /> 
        },
      ],
    },
    {
      name: 'ノート(N)',
      items: [
        { label: '選択中ノートを削除', shortcut: 'Delete', action: onDeleteNode, icon: <Trash2 className="w-3.5 h-3.5 text-red-500" /> },
        { divider: true },
        { label: 'ノートのプロパティ', shortcut: 'Alt+Enter' },
        { label: 'ノートを暗号化・保護', shortcut: 'Ctrl+L' },
      ],
    },
    {
      name: 'ツリー(T)',
      items: [
        { label: '同階層にノートを追加', shortcut: 'Ctrl+Enter' },
        { label: '子階層にノートを追加', shortcut: 'Ctrl+Shift+N' },
        { label: 'ノードを上へ移動', shortcut: 'Alt+Up' },
        { label: 'ノードを下へ移動', shortcut: 'Alt+Down' },
      ],
    },
    {
      name: '書式(O)',
      items: [
        { label: '書式のコピー (Format Painter)', shortcut: 'Ctrl+Shift+C', action: onCopyFormat, icon: <Paintbrush className="w-3.5 h-3.5 text-indigo-600" /> },
        { label: '書式の貼り付け', shortcut: 'Ctrl+Shift+V', action: onPasteFormat, icon: <ClipboardPaste className="w-3.5 h-3.5 text-indigo-600" /> },
        { label: '書式のクリア (標準スタイルに戻す)', shortcut: '', action: onClearFormat, icon: <Eraser className="w-3.5 h-3.5 text-slate-500" /> },
        { divider: true },
        { label: '⚙️ 既定フォント・本文折り返し設定...', shortcut: '', action: onOpenOptions, icon: <Settings className="w-3.5 h-3.5 text-indigo-600" /> },
        { divider: true },
        { label: '太字 (Bold)', shortcut: 'Ctrl+B' },
        { label: '斜体 (Italic)', shortcut: 'Ctrl+I' },
        { label: '下線 (Underline)', shortcut: 'Ctrl+U' },
        { label: '大見出し (H1)', shortcut: 'Ctrl+1' },
        { label: '中見出し (H2)', shortcut: 'Ctrl+2' },
      ],
    },
    {
      name: '挿入(I)',
      items: [
        { 
          label: '📝 横書きテキストボックス', 
          shortcut: '', 
          action: () => onInsertTextbox?.('horizontal'), 
          icon: <Rows className="w-3.5 h-3.5 text-blue-600" /> 
        },
        { 
          label: '📜 縦書きテキストボックス (縦書き・和文組版)', 
          shortcut: '', 
          action: () => onInsertTextbox?.('vertical'), 
          icon: <Columns className="w-3.5 h-3.5 text-amber-600" /> 
        },
        { divider: true },
        { label: '📖 注釈・脚注 [※] (Wikipediaスタイル)', shortcut: '', action: onInsertFootnote, icon: <BookOpen className="w-3.5 h-3.5 text-blue-600" /> },
        { label: '🌐 Webブックマークカードの挿入', shortcut: '', action: onInsertBookmarkCard, icon: <Globe className="w-3.5 h-3.5 text-indigo-600" /> },
        { divider: true },
        { label: '表 (Table) の挿入', shortcut: '', action: onInsertTable, icon: <TableIcon className="w-3.5 h-3.5 text-blue-600" /> },
        { label: '🖼️ 画像の挿入 (ファイル/Web URL)...', shortcut: '', action: onInsertImage, icon: <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> },
        { label: '💬 注記・吹き出しボックスの挿入', shortcut: '', action: onInsertCallout, icon: <MessageSquare className="w-3.5 h-3.5 text-amber-600" /> },
      ],
    },
    {
      name: 'ツール(L)',
      items: [
        { label: '⚙️ システム設定・オプション (フォント・折り返し)...', shortcut: 'Ctrl+,', action: onOpenOptions, icon: <Settings className="w-3.5 h-3.5 text-blue-600" /> },
        { divider: true },
        { label: '🚨 エラーログ & 動作履歴ビューア...', shortcut: '', action: onOpenErrorLog, icon: <Terminal className="w-3.5 h-3.5 text-red-600" /> },
        { divider: true },
        { label: '📖 操作マニュアル・ユーザーガイド', shortcut: '', action: onOpenManual, icon: <BookMarked className="w-3.5 h-3.5 text-blue-600" /> },
        { label: '📋 仕様書・設計書ビューア', shortcut: '', action: onOpenSpecs, icon: <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> },
        { label: '🐍 Flask バックエンドコード生成・閲覧', shortcut: '', action: onOpenFlaskCode, icon: <FileCode2 className="w-3.5 h-3.5 text-emerald-600" /> },
      ],
    },
    {
      name: 'ヘルプ(H)',
      items: [
        { label: '🚨 エラーログ & 診断ツール', action: onOpenErrorLog, icon: <Terminal className="w-3.5 h-3.5 text-red-600" /> },
        { divider: true },
        { label: '📖 操作マニュアル・ユーザーガイド', action: onOpenManual, icon: <BookMarked className="w-3.5 h-3.5 text-blue-600" /> },
        { label: '📋 階層型ノート仕様書・設計書', action: onOpenSpecs, icon: <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> },
        { label: '🐍 Flask + React システム設計ガイド', action: onOpenFlaskCode, icon: <FileCode2 className="w-3.5 h-3.5 text-emerald-600" /> },
      ],
    },
  ];

  return (
    <div id="top-menu-bar" className="bg-slate-100 border-b border-slate-300 text-slate-700 text-xs select-none">
      {/* Windows classic menu header */}
      <div className="flex items-center justify-between px-2 py-0.5 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-slate-200">
        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-1.5 font-bold text-slate-800 mr-3 px-1 py-0.5">
            <span className="text-blue-700 font-serif text-sm">🗂️</span>
            <span className="tracking-tight text-slate-900 font-sans">階層型リッチノートマネージャー</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-1.5 py-0.2 rounded border border-blue-200">Flask 対応</span>
          </div>

          {menuItems.map((menu) => (
            <div key={menu.name} className="relative">
              <button
                id={`menu-button-${menu.name}`}
                onClick={() => setActiveMenu(activeMenu === menu.name ? null : menu.name)}
                onMouseEnter={() => activeMenu && setActiveMenu(menu.name)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  activeMenu === menu.name
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                {menu.name}
              </button>

              {activeMenu === menu.name && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setActiveMenu(null)}
                  />
                  <div className="absolute top-full left-0 mt-0.5 w-64 bg-white border border-slate-300 shadow-xl rounded-b-md z-50 py-1 text-slate-800">
                    {menu.items.map((item, idx) => (
                      item.divider ? (
                        <div key={idx} className="my-1 border-t border-slate-200" />
                      ) : (
                        <button
                          key={idx}
                          id={`menu-item-${menu.name}-${idx}`}
                          onClick={() => {
                            if (item.action) item.action();
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-blue-500 hover:text-white group"
                        >
                          <span className="flex items-center space-x-2">
                            {item.icon && <span className="text-slate-500 group-hover:text-white">{item.icon}</span>}
                            <span>{item.label}</span>
                          </span>
                          {item.shortcut && (
                            <span className="text-[10px] text-slate-400 group-hover:text-blue-100 font-mono">{item.shortcut}</span>
                          )}
                        </button>
                      )
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Top Right Action Pills */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-open-options-top"
            onClick={onOpenOptions}
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-2.5 py-1 rounded text-xs font-semibold shadow-2xs transition"
            title="システム全体のフォント、フォントサイズ、本文折り返し位置を設定 (Ctrl+,)"
          >
            <Settings className="w-3.5 h-3.5 text-slate-700" />
            <span>⚙️ オプション</span>
          </button>

          <button
            id="btn-open-manual-top"
            onClick={onOpenManual}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold shadow-sm transition"
            title="アプリケーション操作マニュアル・使い方ガイドを開く"
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>📖 操作マニュアル</span>
          </button>

          <button
            id="btn-open-specs-top"
            onClick={onOpenSpecs}
            className="flex items-center space-x-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-300 px-2.5 py-1 rounded text-xs font-medium shadow-sm transition"
            title="要件定義書・基本設計書・詳細設計書・DB物理設計書を開く"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold">仕様書・設計書</span>
          </button>

          <button
            id="btn-open-flask-code-top"
            onClick={onOpenFlaskCode}
            className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded text-xs font-medium shadow-sm transition"
            title="Flask プロジェクトコードとファイル構造の閲覧・保存"
          >
            <FileCode2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold">Flaskコード</span>
          </button>
        </div>
      </div>

      {/* Main Quick Action Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-b from-slate-100 to-slate-200 border-b border-slate-300">
        <div className="flex items-center space-x-1.5">
          {/* Database Selector Dropdown */}
          <div className="relative mr-1.5">
            <button
              id="toolbar-db-selector-btn"
              onClick={() => setIsDbDropdownOpen(!isDbDropdownOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-2xs text-xs font-bold text-slate-800 transition"
              title="データベース（DB / ワークスペース）を切り替える"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span className="max-w-[140px] truncate">{activeDatabaseName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isDbDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDbDropdownOpen(false)} 
                />
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-300 shadow-xl rounded-lg z-50 py-1.5 text-slate-800 divide-y divide-slate-100">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>データベース切り替え</span>
                    <span>{databases.length} 件</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto py-1">
                    {databases.map((db) => {
                      const isCurrent = db.id === activeDatabaseId;
                      const count = Object.keys(db.nodes || {}).length;
                      return (
                        <button
                          key={db.id}
                          onClick={() => {
                            if (onSelectDatabase) onSelectDatabase(db.id);
                            setIsDbDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-blue-50 transition ${
                            isCurrent ? 'bg-blue-50/80 font-bold text-blue-900' : 'text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            {isCurrent ? (
                              <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span className="truncate">{db.name}</span>
                            {db.isDemo && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded border border-amber-200">
                                DEMO
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                            {count}ノート
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setIsDbDropdownOpen(false);
                        if (onOpenCreateDatabase) onOpenCreateDatabase();
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs flex items-center space-x-2 text-blue-600 hover:bg-blue-50 font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>新規データベースを作成...</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsDbDropdownOpen(false);
                        if (onOpenDatabaseManager) onOpenDatabaseManager();
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs flex items-center space-x-2 text-slate-700 hover:bg-slate-100"
                    >
                      <FolderTree className="w-3.5 h-3.5 text-slate-500" />
                      <span>データベース一覧・管理...</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            id="toolbar-btn-new-db"
            onClick={onOpenCreateDatabase}
            title="新規データベース（ノート・フォルダ・タブ群）を作成"
            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-semibold flex items-center space-x-1 transition mr-2"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] hidden sm:inline">+ 新規DB</span>
          </button>

          <div className="h-4 w-px bg-slate-300 mx-0.5" />

          <button
            id="toolbar-btn-new-note"
            onClick={onNewNote}
            title="新規ノート (Ctrl+N)"
            className="p-1.5 rounded hover:bg-white hover:border-slate-300 border border-transparent text-slate-700 flex items-center space-x-1"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-medium hidden sm:inline">新規ノート</span>
          </button>

          <button
            id="toolbar-btn-new-folder"
            onClick={onNewFolder}
            title="新規フォルダ / 分類 (Ctrl+Shift+N)"
            className="p-1.5 rounded hover:bg-white hover:border-slate-300 border border-transparent text-slate-700 flex items-center space-x-1"
          >
            <FolderPlus className="w-4 h-4 text-amber-600" />
            <span className="text-[11px] font-medium hidden sm:inline">新規フォルダ</span>
          </button>

          {onDeleteNode && (
            <button
              id="toolbar-btn-delete-node"
              onClick={onDeleteNode}
              title="選択中のノート/フォルダを削除"
              className="p-1.5 rounded hover:bg-red-50 hover:border-red-300 border border-transparent text-red-600 flex items-center space-x-1 transition"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span className="text-[11px] font-medium hidden sm:inline">削除</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <button
            id="toolbar-btn-save"
            onClick={onSave}
            title="ノートを保存 (Ctrl+S)"
            className={`p-1.5 rounded border flex items-center space-x-1 transition ${
              isSaving 
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700' 
                : 'hover:bg-white hover:border-slate-300 border-transparent text-slate-700'
            }`}
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : 'text-blue-600'}`} />
            <span className="text-[11px] font-medium hidden sm:inline">{isSaving ? '保存完了' : '保存'}</span>
          </button>

          <button
            id="toolbar-btn-search"
            onClick={onOpenSearch}
            title="ノート内を検索 (Ctrl+F)"
            className="p-1.5 rounded hover:bg-white hover:border-slate-300 border border-transparent text-slate-700 flex items-center space-x-1"
          >
            <Search className="w-4 h-4 text-slate-600" />
            <span className="text-[11px] font-medium hidden sm:inline">検索</span>
          </button>

          <button
            id="toolbar-btn-options"
            onClick={onOpenOptions}
            title="システム設定・オプション (フォント/文字サイズ/折り返し)"
            className="p-1.5 rounded hover:bg-white hover:border-slate-300 border border-transparent text-slate-700 flex items-center space-x-1"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            <span className="text-[11px] font-medium hidden sm:inline">オプション</span>
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <span className="text-[11px] text-slate-500 font-sans px-2 truncate max-w-[200px]">
            対象ブック: <strong className="text-slate-800">{activeNotebookName}</strong>
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-300">
            RightNote スタイル UI
          </span>
        </div>
      </div>
    </div>
  );
};

