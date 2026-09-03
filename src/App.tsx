import localforage from 'localforage';
import JSZip from 'jszip';
import React, { useState, useRef, useEffect } from 'react';
import { Notebook, TreeNode, NoteType, TagItem, SpreadsheetData, BookmarkItem, DatabaseProfile, TextFormatState, TabFolder, TextStylePreset, StyleCategory, SystemSettings, SentenceBookmark, FigureCaption, RibbonTab } from './types';
import { INITIAL_NOTEBOOKS, INITIAL_NODES, INITIAL_TAGS, INITIAL_TAB_FOLDERS, INITIAL_SENTENCE_BOOKMARKS } from './data/initialData';
import { INITIAL_CHARACTER_STYLES, INITIAL_PARAGRAPH_STYLES } from './data/initialStyles';
import { DEFAULT_SYSTEM_SETTINGS } from './data/initialSettings';

// UI Components
import { TopMenuBar } from './components/TopMenuBar';
import { RibbonBar } from './components/RibbonBar';
import { NotebookTabBar } from './components/NotebookTabBar';
import { TabListPanel } from './components/TabListPanel';
import { TreeSidebar } from './components/TreeSidebar';
import { EditorToolbar } from './components/EditorToolbar';
import { RulerBar } from './components/RulerBar';
import { RichTextEditor } from './components/RichTextEditor';
import { SpreadsheetEditor } from './components/SpreadsheetEditor';
import { SourceCodeEditor } from './components/SourceCodeEditor';
import { BookmarkEditor } from './components/BookmarkEditor';
import { EncryptedNoteEditor } from './components/EncryptedNoteEditor';
import { ResourcePanel, ResourcePanelTab } from './components/ResourcePanel';
import { StatusBar } from './components/StatusBar';
import { SpecsDocModal } from './components/SpecsDocModal';
import { UserManualModal } from './components/UserManualModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { RestoreModal } from './components/RestoreModal';
import { CreateDatabaseModal } from './components/CreateDatabaseModal';
import { DatabaseManagerModal } from './components/DatabaseManagerModal';
import { InsertFootnoteModal } from './components/InsertFootnoteModal';
import { InsertBookmarkCardModal } from './components/InsertBookmarkCardModal';
import { InsertFigureCaptionModal, FigureTarget } from './components/InsertFigureCaptionModal';
import { InsertImageModal } from './components/InsertImageModal';
import { StyleEditModal } from './components/StyleEditModal';
import { InTabFindReplaceBar } from './components/InTabFindReplaceBar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { DocxImportModal } from './components/DocxImportModal';
import { SystemOptionsModal } from './components/SystemOptionsModal';
import { ErrorLogModal } from './components/ErrorLogModal';
import { GitPushModal } from './components/GitPushModal';
import { ErrorToast } from './components/ErrorToast';
import { logSuccess, logInfo, logError } from './utils/errorLog';
import { exportDataOnlyZip } from './utils/zipExporter';
import { DocxImportPreviewResult, convertPreviewToAppNodes } from './utils/docxImporter';
import { createFootnoteHtml, renumberFootnotes } from './utils/footnoteUtils';
import { createTextboxHtml, TEXTBOX_PRESETS } from './utils/textboxUtils';
import { 
  captureCurrentFormat, 
  applyFormatToCurrentSelection, 
  clearCurrentFormat, 
  formatStateToDescription,
  applyExactFontFamily,
  applyExactFontSize
} from './utils/formatUtils';

// Pure Single-Storage: Explicitly enforce browser IndexedDB only (no localStorage fallback/duplication)
localforage.config({
  name: 'KaisoRTextEditor',
  storeName: 'app_databases',
  description: 'Pure Single-Storage IndexedDB for KaisoRTextEditor',
  driver: [localforage.INDEXEDDB],
});

const INITIAL_DEMO_DB: DatabaseProfile = {
  id: 'demo',
  name: 'DEMO（デモデータ）',
  createdAt: '2026-08-24',
  updatedAt: new Date().toISOString().split('T')[0],
  isDemo: true,
  tabFolders: INITIAL_TAB_FOLDERS,
  notebooks: INITIAL_NOTEBOOKS,
  nodes: INITIAL_NODES,
  tags: INITIAL_TAGS,
  sentenceBookmarks: INITIAL_SENTENCE_BOOKMARKS,
  figureCaptions: [],
  activeNotebookId: 'recipes',
  activeNodeId: 'rec-vegetable',
};

function MainApp({ initialDatabases, initialActiveDatabaseId }: { initialDatabases: DatabaseProfile[], initialActiveDatabaseId: string }) {
  // Multi-Database Management State
  const [databases, setDatabases] = useState<DatabaseProfile[]>(initialDatabases);

  const [activeDatabaseId, setActiveDatabaseId] = useState<string>(initialActiveDatabaseId);

  // Current Active Database Object
  const currentDb = databases.find((d) => d.id === activeDatabaseId) || databases[0] || INITIAL_DEMO_DB;

  // Tab Folders (階層管理されたタブフォルダ群)
  const [tabFolders, setTabFolders] = useState<TabFolder[]>(() => {
    const folders = currentDb.tabFolders;
    if (folders === undefined) {
      return currentDb.isDemo ? INITIAL_TAB_FOLDERS : [];
    }
    // Auto-heal if a non-demo database accidentally inherited demo folders
    if (!currentDb.isDemo && folders.length > 0) {
      const demoFolderIds = new Set(INITIAL_TAB_FOLDERS.map((f) => f.id));
      const nbFolderIds = new Set((currentDb.notebooks || []).map((nb) => nb.folderId).filter(Boolean));
      const hasAnyNbInDemoFolders = [...demoFolderIds].some((id) => nbFolderIds.has(id));
      const allAreDemoFolders = folders.every((f) => demoFolderIds.has(f.id));
      if (allAreDemoFolders && !hasAnyNbInDemoFolders) {
        return [];
      }
    }
    return folders;
  });
  // Active Tab Folder (currently selected folder in タブ一覧)
  const [activeTabFolderId, setActiveTabFolderId] = useState<string | null>(() => {
    const activeNb = (currentDb.notebooks || INITIAL_NOTEBOOKS).find(
      (nb) => nb.id === (currentDb.activeNotebookId || 'recipes')
    );
    return activeNb?.folderId || (currentDb.isDemo ? 'tf-lifestyle' : null);
  });

  // Active Database's specific content states
  const [notebooks, setNotebooks] = useState<Notebook[]>(currentDb.notebooks || INITIAL_NOTEBOOKS);
  const [activeNotebookId, setActiveNotebookId] = useState<string>(
    currentDb.activeNotebookId || currentDb.notebooks[0]?.id || 'recipes'
  );
  const [openNotebookIds, setOpenNotebookIds] = useState<string[]>(() => [
    currentDb.activeNotebookId || currentDb.notebooks[0]?.id || 'recipes'
  ]);
  const [nodes, setNodes] = useState<Record<string, TreeNode>>(currentDb.nodes || INITIAL_NODES);
  const [activeNodeId, setActiveNodeId] = useState<string>(
    currentDb.activeNodeId || Object.keys(currentDb.nodes || {})[0] || 'rec-vegetable'
  );
  const [tags, setTags] = useState<TagItem[]>(currentDb.tags || INITIAL_TAGS);
  const [sentenceBookmarks, setSentenceBookmarks] = useState<SentenceBookmark[]>(
    currentDb.sentenceBookmarks || INITIAL_SENTENCE_BOOKMARKS
  );
  const [figureCaptions, setFigureCaptions] = useState<FigureCaption[]>(
    currentDb.figureCaptions || []
  );

  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  const [history, setHistory] = useState<Array<{ nodeId: string; title: string; visitedAt: string }>>([
    { nodeId: 'rec-vegetable', title: 'Chunky Vegetable Soup ⭐', visitedAt: '10:26' },
    { nodeId: 'feat-sheet-contacts', title: 'Sample 2: Contacts', visitedAt: '10:20' },
    { nodeId: 'mf-tag-search', title: 'How do I search for a tag?', visitedAt: '10:15' },
    { nodeId: 'mf-bookmarks', title: '⭐ Bookmarks', visitedAt: '10:10' },
  ]);

  const [showBirdEyeFolders, setShowBirdEyeFolders] = useState<boolean>(true);
  const [isHierarchy1Collapsed, setIsHierarchy1Collapsed] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeCellCoord, setActiveCellCoord] = useState<string>('A2');

  // Modals
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState<boolean>(false);
  const [isCreateDbOpen, setIsCreateDbOpen] = useState<boolean>(false);
  const [isDbManagerOpen, setIsDbManagerOpen] = useState<boolean>(false);
  const [isInsertFootnoteOpen, setIsInsertFootnoteOpen] = useState<boolean>(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState<boolean>(false);
  const [hasUsedEmergencyRestore, setHasUsedEmergencyRestore] = useState<boolean>(false);
  const [restoreCandidates, setRestoreCandidates] = useState<{ id: string; name: string }[]>([]);
  const [isInsertBookmarkCardOpen, setIsInsertBookmarkCardOpen] = useState<boolean>(false);
  const [isInsertFigureCaptionOpen, setIsInsertFigureCaptionOpen] = useState<boolean>(false);
  const [savedEditorRangeForFigureCaption, setSavedEditorRangeForFigureCaption] = useState<Range | null>(null);
  const [figureTargets, setFigureTargets] = useState<FigureTarget[]>([]);
  const [isInsertImageOpen, setIsInsertImageOpen] = useState<boolean>(false);
  const [savedEditorRangeForImage, setSavedEditorRangeForImage] = useState<Range | null>(null);
  const [isDocxImportOpen, setIsDocxImportOpen] = useState<boolean>(false);
  const [isErrorLogOpen, setIsErrorLogOpen] = useState<boolean>(false);
  const [isGitPushModalOpen, setIsGitPushModalOpen] = useState<boolean>(false);

  // Search & Replace State (タブ内検索・置換 & DB全体検索)
  const [isFindBarOpen, setIsFindBarOpen] = useState<boolean>(false);
  const [isReplaceMode, setIsReplaceMode] = useState<boolean>(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);
  const [globalSearchInitialQuery, setGlobalSearchInitialQuery] = useState<string>('');

  // Bookmark and Resource Panel tab states
  const [isBookmarkFiltered, setIsBookmarkFiltered] = useState<boolean>(false);
  const [resourcePanelTab, setResourcePanelTab] = useState<ResourcePanelTab>('ブックマーク');

  // In-App Safe Deletion Confirmation State
  const [nodeToDelete, setNodeToDelete] = useState<{ id: string; title: string; count: number } | null>(null);

  // Rich Text Editor DOM ref and active selection range tracking
  const richEditorRef = useRef<HTMLDivElement | null>(null);
  const lastEditorRangeRef = useRef<Range | null>(null);
  const [savedEditorRangeForFootnote, setSavedEditorRangeForFootnote] = useState<Range | null>(null);
  const [savedEditorRangeForBookmark, setSavedEditorRangeForBookmark] = useState<Range | null>(null);

  // Continuously track caret / selection inside rich text editor
  useEffect(() => {
    const handleSelectionChange = () => {
      try {
        const sel = window.getSelection();
        if (
          sel &&
          sel.rangeCount > 0 &&
          richEditorRef.current &&
          richEditorRef.current.contains(sel.anchorNode)
        ) {
          lastEditorRangeRef.current = sel.getRangeAt(0).cloneRange();
        }
      } catch {
        // Ignore detached or cross-origin range exceptions
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    
  return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Format Painter (書式のコピー・貼り付け) state
  const [copiedFormat, setCopiedFormat] = useState<TextFormatState | null>(null);
  const [isFormatPainterActive, setIsFormatPainterActive] = useState<boolean>(false);

  // Style Gallery & Custom Presets (文字・段落書式メニュー)
  const [characterStyles, setCharacterStyles] = useState<TextStylePreset[]>(() => {
    try {
      const saved = localStorage.getItem('marp_character_styles');
      return saved ? JSON.parse(saved) : INITIAL_CHARACTER_STYLES;
    } catch {
      return INITIAL_CHARACTER_STYLES;
    }
  });

  const [paragraphStyles, setParagraphStyles] = useState<TextStylePreset[]>(() => {
    try {
      const saved = localStorage.getItem('marp_paragraph_styles');
      return saved ? JSON.parse(saved) : INITIAL_PARAGRAPH_STYLES;
    } catch {
      return INITIAL_PARAGRAPH_STYLES;
    }
  });

  const [activeStyleId, setActiveStyleId] = useState<string | null>(null);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState<boolean>(false);
  const [editingStyle, setEditingStyle] = useState<TextStylePreset | null>(null);
  const [defaultStyleCategory, setDefaultStyleCategory] = useState<StyleCategory>('character');

  // System-wide display & typography options (フォント、フォントサイズ、本文折り返し位置)
  const [activeRibbonTab, setActiveRibbonTab] = useState<RibbonTab>('home');
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem('hierarchical_system_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { 
          ...DEFAULT_SYSTEM_SETTINGS, 
          ...parsed,
          tabPosition: parsed.tabPosition || 'bottom',
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SYSTEM_SETTINGS;
  });
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);

  const handleSaveSystemSettings = (newSettings: SystemSettings) => {
    setSystemSettings(newSettings);
    try {
      localStorage.setItem('hierarchical_system_settings', JSON.stringify(newSettings));
    } catch {
      // ignore
    }
  };

  const handleToggleRibbonMinimized = () => {
    setSystemSettings((prev) => {
      const updated = { ...prev, ribbonMinimized: !prev.ribbonMinimized };
      try {
        localStorage.setItem('hierarchical_system_settings', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleUpdateSettingsPartial = (newPartial: Partial<SystemSettings>) => {
    setSystemSettings((prev) => {
      const updated = { ...prev, ...newPartial };
      try {
        localStorage.setItem('hierarchical_system_settings', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Persist styles to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('marp_character_styles', JSON.stringify(characterStyles));
    } catch {
      // ignore
    }
  }, [characterStyles]);

  useEffect(() => {
    try {
      localStorage.setItem('marp_paragraph_styles', JSON.stringify(paragraphStyles));
    } catch {
      // ignore
    }
  }, [paragraphStyles]);

  const currentDbIdRef = useRef<string>(activeDatabaseId);

  // Sync active database content to databases collection and localStorage
  useEffect(() => {
    // If activeDatabaseId just changed via database switching, avoid saving stale states
    if (currentDbIdRef.current !== activeDatabaseId) {
      currentDbIdRef.current = activeDatabaseId;
      localforage.setItem('hierarchical_active_db_id', activeDatabaseId);
      return;
    }

    setDatabases((prevDbs) => {
      const next = prevDbs.map((db) => {
        if (db.id === activeDatabaseId) {
          return {
            ...db,
            tabFolders,
            notebooks,
            nodes,
            tags,
            sentenceBookmarks,
            figureCaptions,
            activeNotebookId,
            activeNodeId,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return db;
      });
      localforage.setItem('hierarchical_databases', next);
      return next;
    });

    localforage.setItem('hierarchical_active_db_id', activeDatabaseId);
  }, [tabFolders, notebooks, nodes, tags, sentenceBookmarks, figureCaptions, activeNotebookId, activeNodeId, activeDatabaseId]);

  // Keep activeTabFolderId in sync with current tabFolders
  useEffect(() => {
    if (activeTabFolderId !== null && !tabFolders.some((f) => f.id === activeTabFolderId)) {
      setActiveTabFolderId(tabFolders[0]?.id || null);
    }
  }, [tabFolders, activeTabFolderId]);

  // Handle switching active database
  const handleSelectDatabase = (dbId: string) => {
    if (dbId === activeDatabaseId) return;
    const targetDb = databases.find((d) => d.id === dbId);
    if (!targetDb) return;

    // 1. Immediately persist current database's state so no unsaved changes are lost
    const updatedDbs = databases.map((db) => {
      if (db.id === activeDatabaseId) {
        return {
          ...db,
          tabFolders,
          notebooks,
          nodes,
          tags,
          sentenceBookmarks,
          figureCaptions,
          activeNotebookId,
          activeNodeId,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return db;
    });
    setDatabases(updatedDbs);
    localforage.setItem('hierarchical_databases', updatedDbs);

    // 2. Resolve fresh target database
    const freshTargetDb = updatedDbs.find((d) => d.id === dbId) || targetDb;

    let targetTabFolders = freshTargetDb.tabFolders;
    if (targetTabFolders === undefined) {
      targetTabFolders = freshTargetDb.isDemo ? INITIAL_TAB_FOLDERS : [];
    }

    // Auto-heal if a non-demo database was contaminated with the demo folders
    if (!freshTargetDb.isDemo && targetTabFolders.length > 0) {
      const demoFolderIds = new Set(INITIAL_TAB_FOLDERS.map((f) => f.id));
      const nbFolderIds = new Set((freshTargetDb.notebooks || []).map((nb) => nb.folderId).filter(Boolean));
      const hasAnyNbInDemoFolders = [...demoFolderIds].some((id) => nbFolderIds.has(id));
      const allAreDemoFolders = targetTabFolders.every((f) => demoFolderIds.has(f.id));
      if (allAreDemoFolders && !hasAnyNbInDemoFolders) {
        targetTabFolders = [];
      }
    }

    // 3. Mark the switching ref so the auto-sync effect does not overwrite the target db with stale states
    currentDbIdRef.current = dbId;

    setActiveDatabaseId(dbId);
    setTabFolders(targetTabFolders);
    setNotebooks(freshTargetDb.notebooks || []);
    setNodes(freshTargetDb.nodes || {});
    setTags(freshTargetDb.tags || []);
    setSentenceBookmarks(freshTargetDb.sentenceBookmarks || []);
    setFigureCaptions(freshTargetDb.figureCaptions || []);
    
    const nextNbId = freshTargetDb.activeNotebookId || freshTargetDb.notebooks[0]?.id || '';
    setActiveNotebookId(nextNbId);
    setOpenNotebookIds(nextNbId ? [nextNbId] : []);

    const activeNb = (freshTargetDb.notebooks || []).find((nb) => nb.id === nextNbId);
    const validFolderId = activeNb?.folderId && targetTabFolders.some((f) => f.id === activeNb.folderId)
      ? activeNb.folderId
      : (targetTabFolders[0]?.id || null);
    setActiveTabFolderId(validFolderId);

    const nextNodeId = freshTargetDb.activeNodeId || Object.keys(freshTargetDb.nodes || {})[0] || '';
    setActiveNodeId(nextNodeId);
    setSelectedTagFilter(null);
  };

  // Handle creating a new database (user specifies name & storage location)
  const handleCreateDatabase = (
    name: string,
    templateType: 'clean' | 'starter' | 'copy_current',
    storageConfig: {
      storageType: 'browser_storage' | 'local_folder' | 'custom_file';
      storageLocation: string;
      storagePath: string;
    }
  ) => {
    const newDbId = `db-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    let newNotebooks: Notebook[] = [];
    let newNodes: Record<string, TreeNode> = {};
    let newTags: TagItem[] = [
      { id: 'tag-1', name: '重要', color: 'red', count: 1 },
      { id: 'tag-2', name: 'メモ', color: 'blue', count: 1 },
      { id: 'tag-3', name: '進行中', color: 'amber', count: 0 },
    ];
    let startNbId = '';
    let startNodeId = '';

    if (templateType === 'clean') {
      // 1 single tab and 1 welcome root note
      startNbId = `nb-${Date.now()}`;
      startNodeId = `note-${Date.now()}`;
      newNotebooks = [
        {
          id: startNbId,
          name: 'マイノート',
          color: 'blue',
          bgClass: 'bg-blue-600 text-white border-blue-700',
          borderClass: 'border-t-blue-500',
          description: `${name} のメインノートブック`,
          nodeIds: [startNodeId],
        },
      ];
      newNodes = {
        [startNodeId]: {
          id: startNodeId,
          notebookId: startNbId,
          parentId: null,
          title: 'はじめに（新規ノート）',
          type: 'rich',
          tags: ['メモ'],
          created: today,
          updated: today,
          isFolder: false,
          content: {
            richHtml: `<h2>${name} へようこそ 📝</h2><p>新しいデータベースが作成されました。</p><p><strong>保存場所:</strong> ${storageConfig.storageLocation || 'ブラウザ内蔵領域'}</p><p>ツールバーの「+ 新規ノート」「+ 新規フォルダ」からノートを追加したり、ドラッグ＆ドロップで自由に階層構造を整理できます。</p><ul><li>リッチテキスト、表計算（スプレッドシート）、ソースコード、Webブックマーク、暗号化メモに対応しています。</li><li>画面上部のデータベースセレクターから、いつでも「DEMO（デモデータ）」や他のデータベースに切り替えることができます。</li></ul>`,
            plainText: `${name} へようこそ`,
          },
          children: [],
        },
      };
    } else if (templateType === 'starter') {
      // 3 organized tabs: Work, Personal, Ideas
      const nb1 = `nb-work-${Date.now()}`;
      const nb2 = `nb-life-${Date.now()}`;
      const nb3 = `nb-idea-${Date.now()}`;
      const n1 = `note-w1-${Date.now()}`;
      const n2 = `note-l1-${Date.now()}`;
      const n3 = `note-i1-${Date.now()}`;

      startNbId = nb1;
      startNodeId = n1;

      newNotebooks = [
        {
          id: nb1,
          name: '業務・プロジェクト',
          color: 'blue',
          bgClass: 'bg-blue-600 text-white border-blue-700',
          borderClass: 'border-t-blue-500',
          nodeIds: [n1],
        },
        {
          id: nb2,
          name: '個人・プライベート',
          color: 'emerald',
          bgClass: 'bg-emerald-600 text-white border-emerald-700',
          borderClass: 'border-t-emerald-500',
          nodeIds: [n2],
        },
        {
          id: nb3,
          name: 'アイデア・メモ帳',
          color: 'purple',
          bgClass: 'bg-purple-600 text-white border-purple-700',
          borderClass: 'border-t-purple-500',
          nodeIds: [n3],
        },
      ];

      newNodes = {
        [n1]: {
          id: n1,
          notebookId: nb1,
          parentId: null,
          title: 'プロジェクト計画メモ',
          type: 'rich',
          tags: ['重要'],
          created: today,
          updated: today,
          content: {
            richHtml: `<h2>プロジェクト計画</h2><p>タスク一覧やミーティング議事録をここに記録します。</p><p><strong>保存場所:</strong> ${storageConfig.storageLocation || 'ブラウザ内蔵領域'}</p>`,
          },
          children: [],
        },
        [n2]: {
          id: n2,
          notebookId: nb2,
          parentId: null,
          title: '日常メモ・ToDo',
          type: 'rich',
          tags: ['メモ'],
          created: today,
          updated: today,
          content: {
            richHtml: `<h2>個人メモ</h2><p>読みたい本や買い物リストなどを管理します。</p>`,
          },
          children: [],
        },
        [n3]: {
          id: n3,
          notebookId: nb3,
          parentId: null,
          title: 'アイデアストック',
          type: 'rich',
          tags: ['メモ'],
          created: today,
          updated: today,
          content: {
            richHtml: `<h2>アイデア・構想</h2><p>思いついたアイデアや気になるリンクを書き留めます。</p>`,
          },
          children: [],
        },
      };
    } else {
      // Copy current
      newNotebooks = JSON.parse(JSON.stringify(notebooks));
      newNodes = JSON.parse(JSON.stringify(nodes));
      newTags = JSON.parse(JSON.stringify(tags));
      startNbId = activeNotebookId;
      startNodeId = activeNodeId;
    }

    const newDbTabFolders: TabFolder[] = templateType === 'copy_current' 
      ? JSON.parse(JSON.stringify(tabFolders)) 
      : [];

    const newDb: DatabaseProfile = {
      id: newDbId,
      name,
      createdAt: today,
      updatedAt: today,
      isDemo: false,
      storageLocation: storageConfig.storageLocation,
      storageType: storageConfig.storageType,
      storagePath: storageConfig.storagePath,
      tabFolders: newDbTabFolders,
      notebooks: newNotebooks,
      nodes: newNodes,
      tags: newTags,
      sentenceBookmarks: templateType === 'copy_current' ? JSON.parse(JSON.stringify(sentenceBookmarks)) : [],
      figureCaptions: templateType === 'copy_current' ? JSON.parse(JSON.stringify(figureCaptions)) : [],
      activeNotebookId: startNbId,
      activeNodeId: startNodeId,
    };

    setDatabases((prev) => {
      const next = [...prev, newDb];
      localforage.setItem('hierarchical_databases', next);
      return next;
    });

    // Switch to the newly created database
    currentDbIdRef.current = newDbId;
    setActiveDatabaseId(newDbId);
    setTabFolders(newDbTabFolders);
    setActiveTabFolderId(null);
    setNotebooks(newNotebooks);
    setNodes(newNodes);
    setTags(newTags);
    setSentenceBookmarks(newDb.sentenceBookmarks || []);
    setFigureCaptions(newDb.figureCaptions || []);
    setActiveNotebookId(startNbId);
    setActiveNodeId(startNodeId);
    setSelectedTagFilter(null);
  };

  // Handle updating storage location
  const handleUpdateStorageLocation = (dbId: string, location: string, path: string) => {
    setDatabases((prev) => {
      const next = prev.map((db) =>
        db.id === dbId
          ? {
              ...db,
              storageLocation: location,
              storagePath: path,
              updatedAt: new Date().toISOString().split('T')[0],
            }
          : db
      );
      localforage.setItem('hierarchical_databases', next);
      return next;
    });
  };

  // Handle renaming database
  const handleRenameDatabase = (dbId: string, newName: string) => {
    setDatabases((prev) => {
      const next = prev.map((db) => (db.id === dbId ? { ...db, name: newName } : db));
      localforage.setItem('hierarchical_databases', next);
      return next;
    });
  };

  // Handle deleting database
  const handleDeleteDatabase = (dbId: string) => {
    setDatabases((prev) => {
      const next = prev.filter((db) => db.id !== dbId);
      localforage.setItem('hierarchical_databases', next);
      if (activeDatabaseId === dbId) {
        const fallback = next[0] || INITIAL_DEMO_DB;
        setActiveDatabaseId(fallback.id);
        setNotebooks(fallback.notebooks);
        setNodes(fallback.nodes);
        setTags(fallback.tags);
        setActiveNotebookId(fallback.activeNotebookId || fallback.notebooks[0]?.id || '');
        setActiveNodeId(fallback.activeNodeId || Object.keys(fallback.nodes)[0] || '');
      }
      return next;
    });
  };

  // Handle batch deleting databases
  const handleBatchDeleteDatabases = (dbIds: string[]) => {
    if (!dbIds || dbIds.length === 0) return;
    setDatabases((prev) => {
      let next = prev.filter((db) => !dbIds.includes(db.id));
      if (next.length === 0) {
        next = [{
          id: 'demo',
          name: 'DEMO（デモデータ）',
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
          isDemo: true,
          tabFolders: INITIAL_TAB_FOLDERS,
          notebooks: INITIAL_NOTEBOOKS,
          nodes: INITIAL_NODES,
          tags: INITIAL_TAGS,
          sentenceBookmarks: INITIAL_SENTENCE_BOOKMARKS,
          figureCaptions: [],
          activeNotebookId: 'recipes',
          activeNodeId: 'rec-vegetable',
        }];
      }
      localforage.setItem('hierarchical_databases', next);

      const fallback = next[0];
      if (dbIds.includes(activeDatabaseId) || !next.some((d) => d.id === activeDatabaseId)) {
        currentDbIdRef.current = fallback.id;
        setActiveDatabaseId(fallback.id);
        localforage.setItem('hierarchical_active_db_id', fallback.id);
        setTabFolders(fallback.tabFolders || (fallback.isDemo ? INITIAL_TAB_FOLDERS : []));
        setNotebooks(fallback.notebooks);
        setNodes(fallback.nodes);
        setTags(fallback.tags);
        setSentenceBookmarks(fallback.sentenceBookmarks || []);
        setFigureCaptions(fallback.figureCaptions || []);
        setActiveNotebookId(fallback.activeNotebookId || fallback.notebooks[0]?.id || '');
        setActiveNodeId(fallback.activeNodeId || Object.keys(fallback.nodes)[0] || '');
      }
      return next;
    });
  };

  // Handle completely clearing all databases (reset to clean initial state)
  const handleClearAllDatabases = () => {
    const cleanDb: DatabaseProfile = {
      id: 'db-' + Date.now(),
      name: '新規データベース',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      isDemo: false,
      notebooks: [
        {
          id: 'nb-main',
          name: 'ノートブック 1',
          color: '#e0f2fe',
          bgClass: 'bg-sky-100 text-sky-900 border-sky-300',
          borderClass: 'border-t-sky-500',
          nodeIds: [],
        },
      ],
      nodes: {},
      tags: INITIAL_TAGS,
      tabFolders: [],
      sentenceBookmarks: [],
      figureCaptions: [],
      activeNotebookId: 'nb-main',
      activeNodeId: null,
    };

    const next = [cleanDb];
    setDatabases(next);
    localforage.setItem('hierarchical_databases', next);
    setActiveDatabaseId(cleanDb.id);
    localforage.setItem('hierarchical_active_db_id', cleanDb.id);
    setTabFolders([]);
    setNotebooks(cleanDb.notebooks);
    setNodes({});
    setTags(INITIAL_TAGS);
    setSentenceBookmarks([]);
    setFigureCaptions([]);
    setActiveNotebookId('nb-main');
    setActiveNodeId(null);
  };

  // Handle resetting DEMO database to initial sample data
  const handleResetDemoDatabase = () => {
    const demoDb: DatabaseProfile = {
      id: 'demo',
      name: 'DEMO（デモデータ）',
      createdAt: '2026-08-24',
      updatedAt: new Date().toISOString().split('T')[0],
      isDemo: true,
      tabFolders: INITIAL_TAB_FOLDERS,
      notebooks: INITIAL_NOTEBOOKS,
      nodes: INITIAL_NODES,
      tags: INITIAL_TAGS,
      sentenceBookmarks: INITIAL_SENTENCE_BOOKMARKS,
      figureCaptions: [],
      activeNotebookId: 'recipes',
      activeNodeId: 'rec-vegetable',
    };

    setDatabases((prev) => {
      const exists = prev.some((d) => d.id === 'demo');
      const next = exists ? prev.map((d) => (d.id === 'demo' ? demoDb : d)) : [demoDb, ...prev];
      localforage.setItem('hierarchical_databases', next);
      return next;
    });

    if (activeDatabaseId === 'demo') {
      setTabFolders(INITIAL_TAB_FOLDERS);
      setNotebooks(INITIAL_NOTEBOOKS);
      setNodes(INITIAL_NODES);
      setTags(INITIAL_TAGS);
      setSentenceBookmarks(INITIAL_SENTENCE_BOOKMARKS);
      setActiveNotebookId('recipes');
      setActiveNodeId('rec-vegetable');
      setSelectedTagFilter(null);
    }
  };

  const activeNotebook = notebooks.find((nb) => nb.id === activeNotebookId) || notebooks[0];
  const activeNode = nodes[activeNodeId] || null;

  // Filter nodes for the current notebook
  const notebookNodes: Record<string, TreeNode> = {};
  (Object.values(nodes) as TreeNode[]).forEach((n) => {
    if (n.notebookId === activeNotebookId) {
      notebookNodes[n.id] = n;
    }
  });

  // Calculate root node IDs for the active notebook preserving ordered list
  const currentNotebookRoots = (Object.values(notebookNodes) as TreeNode[])
    .filter((n) => n.parentId === null)
    .map((n) => n.id);

  let rootNodeIds: string[] = [];
  if (activeNotebook && activeNotebook.nodeIds && activeNotebook.nodeIds.length > 0) {
    const ordered = activeNotebook.nodeIds.filter((id) => currentNotebookRoots.includes(id));
    const missing = currentNotebookRoots.filter((id) => !ordered.includes(id));
    rootNodeIds = [...ordered, ...missing];
  } else {
    rootNodeIds = currentNotebookRoots;
  }

  // Helper to reorder root node IDs in active notebook
  const updateNotebookRootOrder = (newRootIds: string[]) => {
    setNotebooks((prev) =>
      prev.map((nb) => {
        if (nb.id === activeNotebookId) {
          return { ...nb, nodeIds: newRootIds };
        }
        return nb;
      })
    );
  };

  // Calculate active node index within notebook
  const allNotebookNodeIds = Object.keys(notebookNodes);
  const activeNodeIndex = allNotebookNodeIds.indexOf(activeNodeId) + 1;

  // Helper to recursively collect all descendant node IDs
  const getDescendantIds = (nodeId: string, nodeMap: Record<string, TreeNode>): string[] => {
    const result: string[] = [nodeId];
    const node = nodeMap[nodeId];
    if (node && node.children) {
      for (const childId of node.children) {
        result.push(...getDescendantIds(childId, nodeMap));
      }
    }
    return result;
  };

  // Handle notebook tab change
  const handleSelectNotebook = (nbId: string) => {
    setActiveNotebookId(nbId);
    setOpenNotebookIds((prev) => (prev.includes(nbId) ? prev : [...prev, nbId]));
    setNotebooks((prev) =>
      prev.map((nb) => (nb.id === nbId ? { ...nb, isHidden: false } : nb))
    );
    const targetNb = notebooks.find((n) => n.id === nbId);
    if (targetNb && targetNb.folderId !== undefined) {
      setActiveTabFolderId(targetNb.folderId);
    }
    // Select first node in that notebook
    const firstNode = (Object.values(nodes) as TreeNode[]).find((n) => n.notebookId === nbId);
    if (firstNode) {
      handleSelectNode(firstNode.id);
    }
  };

  // Handle Tab Folder selection in 階層1
  const handleSelectTabFolder = (folderId: string | null) => {
    setActiveTabFolderId(folderId);
    if (folderId !== null) {
      const tabsInFolder = notebooks.filter((nb) => nb.folderId === folderId);
      if (tabsInFolder.length > 0) {
        const isCurrentInFolder = tabsInFolder.some((t) => t.id === activeNotebookId);
        if (!isCurrentInFolder) {
          handleSelectNotebook(tabsInFolder[0].id);
        }
      }
    }
  };

  // Create new Tab Folder (階層化対応)
  const handleCreateTabFolder = (parentId: string | null, name?: string) => {
    const newFolderId = `tf-${Date.now()}`;
    const folderName = name || (parentId ? '新規サブフォルダ' : '新規フォルダ');
    const newFolder: TabFolder = {
      id: newFolderId,
      name: folderName,
      parentId,
      color: '#3b82f6',
    };
    setTabFolders((prev) => [...prev, newFolder]);
    setActiveTabFolderId(newFolderId);
  };

  // Rename Tab Folder
  const handleRenameNotebook = (notebookId: string, newName: string) => {
    setNotebooks((prev) =>
      prev.map((nb) => (nb.id === notebookId ? { ...nb, name: newName } : nb))
    );
  };

  const handleCloseNotebooks = (notebookIds: string[]) => {
    setOpenNotebookIds((prev) => {
      const next = prev.filter((id) => !notebookIds.includes(id));
      return next.length > 0
        ? next
        : activeNotebookId && !notebookIds.includes(activeNotebookId)
        ? [activeNotebookId]
        : [];
    });
    if (notebookIds.includes(activeNotebookId)) {
      const remainingVisible = openNotebookIds.filter(
        (id) => !notebookIds.includes(id)
      );
      if (remainingVisible.length > 0) {
        handleSelectNotebook(remainingVisible[remainingVisible.length - 1]);
      } else {
        const anyOther = notebooks.find((n) => !notebookIds.includes(n.id));
        if (anyOther) handleSelectNotebook(anyOther.id);
      }
    }
  };

  const handleRenameTabFolder = (folderId: string, newName: string) => {
    setTabFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f))
    );
  };

  // Delete Tab Folder (and move its notebooks to unfiled/root)
  const handleDeleteTabFolder = (folderId: string) => {
    const collectFolderDescendants = (fid: string): string[] => {
      const subs = tabFolders.filter((f) => f.parentId === fid);
      return [fid, ...subs.flatMap((s) => collectFolderDescendants(s.id))];
    };
    const deletedFolderIds = new Set(collectFolderDescendants(folderId));

    setTabFolders((prev) => prev.filter((f) => !deletedFolderIds.has(f.id)));
    setNotebooks((prev) =>
      prev.map((nb) => (nb.folderId && deletedFolderIds.has(nb.folderId) ? { ...nb, folderId: null } : nb))
    );

    if (activeTabFolderId && deletedFolderIds.has(activeTabFolderId)) {
      setActiveTabFolderId(null);
    }
  };

  // Move Tab Folder hierarchy
  const handleMoveTabFolder = (folderId: string, targetParentId: string | null) => {
    if (folderId === targetParentId) return;
    setTabFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, parentId: targetParentId } : f))
    );
  };

  // Move Notebook/Tab into a Tab Folder
  const handleMoveNotebookToFolder = (notebookId: string, targetFolderId: string | null) => {
    setNotebooks((prev) =>
      prev.map((nb) => (nb.id === notebookId ? { ...nb, folderId: targetFolderId } : nb))
    );
  };

  // Delete Notebook/Tab
  const handleRestoreNotebooks = () => {
    setHasUsedEmergencyRestore(true);
    const existingNbIds = new Set(notebooks.map(nb => nb.id));
    const missingNbIds = new Set<string>();
    
    (Object.values(nodes) as TreeNode[]).forEach(node => {
      if (!existingNbIds.has(node.notebookId)) {
        missingNbIds.add(node.notebookId);
      }
    });

    const candidates = Array.from(missingNbIds).map(id => {
      const rootNodes = (Object.values(nodes) as TreeNode[]).filter(n => n.notebookId === id && n.parentId === null);
      const rootNode = rootNodes.length > 0 ? rootNodes[0] : (Object.values(nodes) as TreeNode[]).find(n => n.notebookId === id);
      return {
        id,
        name: rootNode ? rootNode.title : `復元タブ (${id.slice(0, 4)})`
      };
    });

    setRestoreCandidates(candidates);
    setIsRestoreModalOpen(true);
  };

  const executeRestore = (folderId: string | null) => {
    const newNotebooks: Notebook[] = restoreCandidates.map(c => {
      const rootNodes = (Object.values(nodes) as TreeNode[]).filter(n => n.notebookId === c.id && n.parentId === null);
      return {
        id: c.id,
        name: c.name,
        color: '#fef3c7',
        bgClass: 'bg-amber-100',
        borderClass: 'border-amber-300',
        nodeIds: rootNodes.map(n => n.id),
        folderId: folderId
      };
    });

    setNotebooks(prev => [...prev, ...newNotebooks]);
    setActiveNotebookId(newNotebooks[0].id);
    if (folderId !== undefined) {
      setActiveTabFolderId(folderId);
    }
    setIsRestoreModalOpen(false);
  };

  const handleDeleteNotebook = (notebookIdOrIds: string | string[]) => {
    const idsToDelete = Array.isArray(notebookIdOrIds) ? notebookIdOrIds : [notebookIdOrIds];
    if (notebooks.length <= idsToDelete.length) return;
    
    const nbIdSet = new Set(idsToDelete);

    // 1. Remove notebooks from state
    const remaining = notebooks.filter((nb) => !nbIdSet.has(nb.id));
    setNotebooks(remaining);
    setOpenNotebookIds((prev) => prev.filter((id) => !nbIdSet.has(id)));

    // 2. Deep Cascade Delete: physically purge all nodes belonging to the deleted notebooks
    const deletedNodeIds = new Set<string>();
    setNodes((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((nid) => {
        if (nbIdSet.has(next[nid].notebookId)) {
          deletedNodeIds.add(nid);
          delete next[nid];
        }
      });
      return next;
    });

    // 3. Deep Cascade Delete: remove sentence bookmarks belonging to deleted notebooks or nodes
    setSentenceBookmarks((prev) => prev.filter((bm) => !nbIdSet.has(bm.notebookId) && !deletedNodeIds.has(bm.nodeId)));

    // 4. Deep Cascade Delete: remove figure captions
    setFigureCaptions((prev) => prev.filter((fc) => !nbIdSet.has(fc.notebookId) && !deletedNodeIds.has(fc.nodeId)));
    
    if (idsToDelete.includes(activeNotebookId)) {
      handleSelectNotebook(remaining[0].id);
    }
  };

  // Database Vacuum & Integrity Optimization (孤児ノード・参照残骸の消去とツリー整合性の完全修復)
  const handleCleanAndOptimizeDatabase = async () => {
    const currentDb = databases.find((d) => d.id === activeDatabaseId);
    if (!currentDb) return;

    const validNotebookIds = new Set(notebooks.map((nb) => nb.id));
    const validTabFolderIds = new Set(tabFolders.map((tf) => tf.id));

    let removedOrphanNodesCount = 0;
    let fixedParentChildCount = 0;
    let removedOrphanBookmarksCount = 0;
    let removedOrphanCaptionsCount = 0;

    // 1. 孤児ノードの完全パージとツリー整合性修復
    const cleanedNodes: Record<string, TreeNode> = {};
    const validNodeIds = new Set<string>();

    // Pass 1: 実在するノートブックに属するノードのみを抽出
    (Object.entries(nodes) as [string, TreeNode][]).forEach(([nid, node]) => {
      if (!node || !validNotebookIds.has(node.notebookId)) {
        removedOrphanNodesCount++;
        return;
      }
      validNodeIds.add(nid);
      cleanedNodes[nid] = { ...node };
    });

    // Pass 2: 親子参照（parentId / children）の整合性修復
    Object.values(cleanedNodes).forEach((node) => {
      if (node.parentId && !validNodeIds.has(node.parentId)) {
        node.parentId = null;
        fixedParentChildCount++;
      }
      if (node.children) {
        const validChildren = node.children.filter((cid) => validNodeIds.has(cid));
        if (validChildren.length !== node.children.length) {
          node.children = validChildren;
          fixedParentChildCount++;
        }
        node.isFolder = node.children.length > 0;
      }
    });

    // Pass 3: 親ノードのchildren配列に自身が含まれていることを担保
    Object.values(cleanedNodes).forEach((node) => {
      if (node.parentId && cleanedNodes[node.parentId]) {
        const parent = cleanedNodes[node.parentId];
        if (!parent.children) parent.children = [];
        if (!parent.children.includes(node.id)) {
          parent.children.push(node.id);
          parent.isFolder = true;
          fixedParentChildCount++;
        }
      }
    });

    // 2. 実体のないノードを指している文章ブックマーク残骸の消去
    const cleanedBookmarks = (sentenceBookmarks || []).filter((bm) => {
      const isValid = validNodeIds.has(bm.nodeId) && validNotebookIds.has(bm.notebookId);
      if (!isValid) removedOrphanBookmarksCount++;
      return isValid;
    });

    // 3. 実体のないノードを指している図表キャプション残骸の消去
    const cleanedCaptions = (figureCaptions || []).filter((fc) => {
      const isValid = validNodeIds.has(fc.nodeId) && validNotebookIds.has(fc.notebookId);
      if (!isValid) removedOrphanCaptionsCount++;
      return isValid;
    });

    // 4. ノートブックのnodeIdsおよびfolderIdの整合性修復
    const cleanedNotebooks = notebooks.map((nb) => {
      const validNids = (nb.nodeIds || []).filter((nid) => validNodeIds.has(nid));
      const validFid = nb.folderId && validTabFolderIds.has(nb.folderId) ? nb.folderId : null;
      return {
        ...nb,
        folderId: validFid,
        nodeIds: validNids,
      };
    });

    // 5. 状態へ反映
    setNodes(cleanedNodes);
    setSentenceBookmarks(cleanedBookmarks);
    setFigureCaptions(cleanedCaptions);
    setNotebooks(cleanedNotebooks);

    // 6. IndexedDBへ即時物理コミット（Vacuum）
    const updatedDbs = databases.map((db) => {
      if (db.id === activeDatabaseId) {
        return {
          ...db,
          tabFolders,
          notebooks: cleanedNotebooks,
          nodes: cleanedNodes,
          tags,
          sentenceBookmarks: cleanedBookmarks,
          figureCaptions: cleanedCaptions,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return db;
    });

    setDatabases(updatedDbs);
    await localforage.setItem('hierarchical_databases', updatedDbs);

    // 7. 結果報告
    const totalIssues = removedOrphanNodesCount + fixedParentChildCount + removedOrphanBookmarksCount + removedOrphanCaptionsCount;
    if (totalIssues > 0) {
      alert(
        `【データベース最適化＆クリーン完了】\n\n` +
        `・削除された孤児ノード（残留データ）: ${removedOrphanNodesCount}件\n` +
        `・修復・同期されたツリー構造: ${fixedParentChildCount}件\n` +
        `・消去されたブックマーク残骸: ${removedOrphanBookmarksCount}件\n` +
        `・消去された図表キャプション残骸: ${removedOrphanCaptionsCount}件\n\n` +
        `データベース「${currentDb.name}」の整合性が完全に修復され、IndexedDBへ物理コミットされました。`
      );
    } else {
      alert(
        `【データベース完全診断】\n\n` +
        `データベース「${currentDb.name}」には孤児データや参照残骸などの不整合は一切ありません。\n` +
        `すべてのデータ構造は100%健全でクリーンな状態です。\n` +
        `（IndexedDBへの物理コミットを完了しました）`
      );
    }
  };

  // Handle node selection & record in navigation history
  const handleSelectNode = (nodeId: string) => {
    const node = nodes[nodeId];
    if (!node) return;
    setActiveNodeId(nodeId);
    if (node.notebookId !== activeNotebookId) {
      setActiveNotebookId(node.notebookId);
    }

    setHistory((prev) => {
      const filtered = prev.filter((h) => h.nodeId !== nodeId);
      return [
        {
          nodeId: node.id,
          title: node.title,
          visitedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...filtered,
      ].slice(0, 20);
    });
  };

  // Create new child node in Note Tree
  const handleAddChildNode = (parentId: string | null) => {
    const newId = `node-${Date.now()}`;
    const newNode: TreeNode = {
      id: newId,
      notebookId: activeNotebookId,
      parentId,
      title: parentId ? '新規サブノート' : '新規ノート',
      type: 'rich',
      tags: [],
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString().split('T')[0],
      content: {
        richHtml: '<p>ノートの内容をここに入力してください...</p>',
      },
    };

    setNodes((prev) => {
      const next = { ...prev, [newId]: newNode };
      if (parentId && next[parentId]) {
        next[parentId] = {
          ...next[parentId],
          isFolder: true,
          children: [...(next[parentId].children || []), newId],
        };
      }
      return next;
    });

    if (!parentId) {
      updateNotebookRootOrder([...rootNodeIds, newId]);
    }

    handleSelectNode(newId);
  };

  // Create new folder section in Note Tree
  const handleNewFolder = () => {
    const newId = `folder-${Date.now()}`;
    const newFolderNode: TreeNode = {
      id: newId,
      notebookId: activeNotebookId,
      parentId: null,
      title: '📁 新規フォルダセクション',
      type: 'rich',
      isFolder: true,
      colorBadge: '#fb923c',
      tags: [],
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString().split('T')[0],
      children: [],
      content: {
        richHtml: '<h3>フォルダセクション</h3><p>このフォルダ内に子ノートをドラッグまたは追加して整理できます。</p>',
      },
    };

    setNodes((prev) => ({ ...prev, [newId]: newFolderNode }));
    updateNotebookRootOrder([...rootNodeIds, newId]);
    handleSelectNode(newId);
  };

  // Request node deletion (shows in-app custom modal)
  const handleRequestDeleteNode = (nodeId: string) => {
    const node = nodes[nodeId];
    if (!node) return;
    const allDescendantIds = getDescendantIds(nodeId, nodes);
    setNodeToDelete({
      id: nodeId,
      title: node.title,
      count: allDescendantIds.length,
    });
  };

  // Confirm node deletion (cleanly deletes node and all recursive descendants)
  const handleConfirmDeleteNode = () => {
    if (!nodeToDelete) return;
    const { id: nodeId } = nodeToDelete;

    const allDescendantIds = getDescendantIds(nodeId, nodes);
    const descendantSet = new Set(allDescendantIds);

    setNodes((prev) => {
      const next = { ...prev };
      const targetNode = next[nodeId];

      // Remove targetId from parent's children array
      if (targetNode?.parentId && next[targetNode.parentId]) {
        const remainingChildren = (next[targetNode.parentId].children || []).filter((cid) => cid !== nodeId && !descendantSet.has(cid));
        next[targetNode.parentId] = {
          ...next[targetNode.parentId],
          children: remainingChildren,
          isFolder: remainingChildren.length > 0,
        };
      }

      // Delete target and all descendants
      for (const did of allDescendantIds) {
        delete next[did];
      }

      return next;
    });

    // Cascade delete: remove sentence bookmarks and captions belonging to deleted nodes
    setSentenceBookmarks((prev) => prev.filter((bm) => !descendantSet.has(bm.nodeId)));
    setFigureCaptions((prev) => prev.filter((fc) => !descendantSet.has(fc.nodeId)));

    // Update notebook nodeIds if tracked
    setNotebooks((prev) =>
      prev.map((nb) => ({
        ...nb,
        nodeIds: nb.nodeIds ? nb.nodeIds.filter((nid) => !descendantSet.has(nid)) : undefined,
      }))
    );

    // Select remaining node
    const remainingIds = Object.keys(notebookNodes).filter((id) => !descendantSet.has(id));
    if (remainingIds.length > 0) {
      handleSelectNode(remainingIds[0]);
    } else {
      setActiveNodeId('');
    }

    setNodeToDelete(null);
  };

  // Move node via Drag & Drop or direct parenting with position support
  const handleMoveNode = (
    sourceId: string,
    targetId: string | null,
    position: 'before' | 'inside' | 'after' | 'root' | 'promote' = 'inside'
  ) => {
    if (!sourceId || sourceId === targetId) return;

    // Check if targetId is a descendant of sourceId (prevent cyclical nesting)
    if (targetId) {
      const descendants = getDescendantIds(sourceId, nodes);
      if (descendants.includes(targetId)) {
        return; // Cannot drop a parent into its own child/descendant
      }
    }

    const sourceNode = nodes[sourceId];
    if (!sourceNode) return;

    // Case 1: PROMOTE (raise hierarchy 1 level)
    if (position === 'promote') {
      handlePromoteNode(sourceId);
      return;
    }

    // Case 2: ROOT (move to root level)
    if (position === 'root' || targetId === null) {
      if (sourceNode.parentId === null) return; // already root

      setNodes((prev) => {
        const next = { ...prev };
        // 1. Remove from old parent's children
        if (sourceNode.parentId && next[sourceNode.parentId]) {
          const remaining = (next[sourceNode.parentId].children || []).filter((id) => id !== sourceId);
          next[sourceNode.parentId] = {
            ...next[sourceNode.parentId],
            children: remaining,
            isFolder: remaining.length > 0,
          };
        }
        // 2. Set parent to null
        next[sourceId] = {
          ...next[sourceId],
          parentId: null,
          updated: new Date().toISOString().split('T')[0],
        };
        return next;
      });

      // Add to notebook root nodes if not there
      const currentRoots = rootNodeIds.filter((id) => id !== sourceId);
      updateNotebookRootOrder([...currentRoots, sourceId]);
      handleSelectNode(sourceId);
      return;
    }

    const targetNode = nodes[targetId];
    if (!targetNode) return;

    // Case 3: INSIDE (make child of targetNode)
    if (position === 'inside') {
      setNodes((prev) => {
        const next = { ...prev };
        const oldParentId = next[sourceId]?.parentId;

        // 1. Remove from old parent
        if (oldParentId && next[oldParentId]) {
          const remaining = (next[oldParentId].children || []).filter((id) => id !== sourceId);
          next[oldParentId] = {
            ...next[oldParentId],
            children: remaining,
            isFolder: remaining.length > 0,
          };
        }

        // 2. Add to targetNode's children
        const existingChildren = next[targetId]?.children || [];
        const filteredChildren = existingChildren.filter((id) => id !== sourceId);
        next[targetId] = {
          ...next[targetId],
          isFolder: true,
          children: [...filteredChildren, sourceId],
        };

        // 3. Update sourceNode
        next[sourceId] = {
          ...next[sourceId],
          parentId: targetId,
          updated: new Date().toISOString().split('T')[0],
        };

        return next;
      });

      // If source was a root node, remove it from notebook root nodes
      if (sourceNode.parentId === null) {
        updateNotebookRootOrder(rootNodeIds.filter((id) => id !== sourceId));
      }

      handleSelectNode(sourceId);
      return;
    }

    // Case 4: BEFORE or AFTER targetNode (become sibling of targetNode)
    const newParentId = targetNode.parentId;

    if (newParentId === null) {
      // Both are root nodes in active notebook
      setNodes((prev) => {
        const next = { ...prev };
        const oldParentId = next[sourceId]?.parentId;

        // 1. Remove from old parent if it had one
        if (oldParentId && next[oldParentId]) {
          const remaining = (next[oldParentId].children || []).filter((id) => id !== sourceId);
          next[oldParentId] = {
            ...next[oldParentId],
            children: remaining,
            isFolder: remaining.length > 0,
          };
        }

        // 2. Update source parentId to null
        next[sourceId] = {
          ...next[sourceId],
          parentId: null,
          updated: new Date().toISOString().split('T')[0],
        };

        return next;
      });

      // Reorder in rootNodeIds
      const cleanRoots = rootNodeIds.filter((id) => id !== sourceId);
      const targetIdx = cleanRoots.indexOf(targetId);
      if (targetIdx !== -1) {
        const insertIdx = position === 'before' ? targetIdx : targetIdx + 1;
        const newRoots = [...cleanRoots];
        newRoots.splice(insertIdx, 0, sourceId);
        updateNotebookRootOrder(newRoots);
      } else {
        updateNotebookRootOrder([...cleanRoots, sourceId]);
      }

      handleSelectNode(sourceId);
    } else {
      // Both will be children under newParentId
      setNodes((prev) => {
        const next = { ...prev };
        const oldParentId = next[sourceId]?.parentId;

        // 1. Remove from old parent if different
        if (oldParentId && oldParentId !== newParentId && next[oldParentId]) {
          const remaining = (next[oldParentId].children || []).filter((id) => id !== sourceId);
          next[oldParentId] = {
            ...next[oldParentId],
            children: remaining,
            isFolder: remaining.length > 0,
          };
        }

        // 2. Reorder in newParent's children
        const parentNode = next[newParentId];
        if (parentNode) {
          const cleanChildren = (parentNode.children || []).filter((id) => id !== sourceId);
          const targetIdx = cleanChildren.indexOf(targetId);
          if (targetIdx !== -1) {
            const insertIdx = position === 'before' ? targetIdx : targetIdx + 1;
            cleanChildren.splice(insertIdx, 0, sourceId);
          } else {
            cleanChildren.push(sourceId);
          }
          next[newParentId] = {
            ...parentNode,
            children: cleanChildren,
            isFolder: true,
          };
        }

        // 3. Update sourceNode parent
        next[sourceId] = {
          ...next[sourceId],
          parentId: newParentId,
          updated: new Date().toISOString().split('T')[0],
        };

        return next;
      });

      // If source was root, remove from roots
      if (sourceNode.parentId === null) {
        updateNotebookRootOrder(rootNodeIds.filter((id) => id !== sourceId));
      }

      handleSelectNode(sourceId);
    }
  };

  // Promote node (raise hierarchy 1 level up - out of parent into grandparent or root)
  const handlePromoteNode = (nodeId: string) => {
    const node = nodes[nodeId];
    if (!node || !node.parentId) return; // already at root

    const parentNode = nodes[node.parentId];
    if (!parentNode) return;

    const grandParentId = parentNode.parentId;

    setNodes((prev) => {
      const next = { ...prev };

      // 1. Remove nodeId from parent's children
      if (next[parentNode.id]) {
        const remaining = (next[parentNode.id].children || []).filter((id) => id !== nodeId);
        next[parentNode.id] = {
          ...next[parentNode.id],
          children: remaining,
          isFolder: remaining.length > 0,
        };
      }

      // 2. If grandparent exists, add nodeId right after parentNode in grandparent's children
      if (grandParentId && next[grandParentId]) {
        const gpChildren = [...(next[grandParentId].children || [])];
        const parentIdx = gpChildren.indexOf(parentNode.id);
        if (parentIdx !== -1) {
          gpChildren.splice(parentIdx + 1, 0, nodeId);
        } else {
          gpChildren.push(nodeId);
        }
        next[grandParentId] = {
          ...next[grandParentId],
          children: gpChildren,
        };
        next[nodeId] = {
          ...next[nodeId],
          parentId: grandParentId,
          updated: new Date().toISOString().split('T')[0],
        };
      } else {
        // Grandparent is null -> node becomes root immediately after parentNode in roots
        next[nodeId] = {
          ...next[nodeId],
          parentId: null,
          updated: new Date().toISOString().split('T')[0],
        };
      }

      return next;
    });

    // If moved to root, update notebook root order
    if (!grandParentId) {
      const cleanRoots = rootNodeIds.filter((id) => id !== nodeId);
      const parentIdx = cleanRoots.indexOf(parentNode.id);
      if (parentIdx !== -1) {
        cleanRoots.splice(parentIdx + 1, 0, nodeId);
        updateNotebookRootOrder(cleanRoots);
      } else {
        updateNotebookRootOrder([...cleanRoots, nodeId]);
      }
    }

    handleSelectNode(nodeId);
  };

  // Demote node (indent 1 level down - into previous sibling)
  const handleDemoteNode = (nodeId: string) => {
    const node = nodes[nodeId];
    if (!node) return;

    // Find siblings list
    let siblings: string[] = [];
    if (node.parentId && nodes[node.parentId]) {
      siblings = nodes[node.parentId].children || [];
    } else {
      siblings = rootNodeIds;
    }

    const idx = siblings.indexOf(nodeId);
    if (idx <= 0) return; // No previous sibling to demote into

    const previousSiblingId = siblings[idx - 1];
    handleMoveNode(nodeId, previousSiblingId, 'inside');
  };

  // Reorder siblings (move up or down)
  const handleReorderNode = (nodeId: string, direction: 'up' | 'down') => {
    const node = nodes[nodeId];
    if (!node) return;

    if (node.parentId && nodes[node.parentId]) {
      // Reorder within parent's children
      setNodes((prev) => {
        const next = { ...prev };
        const parent = next[node.parentId!];
        const children = [...(parent.children || [])];
        const idx = children.indexOf(nodeId);
        if (idx === -1) return prev;

        if (direction === 'up' && idx > 0) {
          [children[idx - 1], children[idx]] = [children[idx], children[idx - 1]];
          next[node.parentId!] = { ...parent, children };
          return next;
        } else if (direction === 'down' && idx < children.length - 1) {
          [children[idx], children[idx + 1]] = [children[idx + 1], children[idx]];
          next[node.parentId!] = { ...parent, children };
          return next;
        }
        return prev;
      });
    } else {
      // Reorder within root nodes
      const roots = [...rootNodeIds];
      const idx = roots.indexOf(nodeId);
      if (idx === -1) return;

      if (direction === 'up' && idx > 0) {
        [roots[idx - 1], roots[idx]] = [roots[idx], roots[idx - 1]];
        updateNotebookRootOrder(roots);
      } else if (direction === 'down' && idx < roots.length - 1) {
        [roots[idx], roots[idx + 1]] = [roots[idx + 1], roots[idx]];
        updateNotebookRootOrder(roots);
      }
    }
  };

  // Rename node
  const handleRenameNode = (nodeId: string, newTitle: string) => {
    setNodes((prev) => {
      if (!prev[nodeId]) return prev;
      return {
        ...prev,
        [nodeId]: { ...prev[nodeId], title: newTitle, updated: new Date().toISOString().split('T')[0] },
      };
    });
  };

  // Change note type
  const handleChangeNodeType = (nodeId: string, newType: NoteType) => {
    setNodes((prev) => {
      const curr = prev[nodeId];
      if (!curr) return prev;

      const nextContent = { ...curr.content };
      if (newType === 'spreadsheet' && !nextContent.spreadsheet) {
        nextContent.spreadsheet = {
          hasHeaderRow: true,
          lockHeader: true,
          headers: ['A', 'B', 'C', 'D', 'E'],
          rows: [
            [{ value: 'Item' }, { value: 'Category' }, { value: 'Cost' }, { value: 'Qty' }, { value: 'Total' }],
            [{ value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }],
          ],
        };
      } else if (newType === 'code' && !nextContent.code) {
        nextContent.code = {
          language: 'python',
          code: '# Python source script\n',
        };
      } else if (newType === 'bookmark' && !nextContent.bookmarks) {
        nextContent.bookmarks = [];
      }

      return {
        ...prev,
        [nodeId]: {
          ...curr,
          type: newType,
          content: nextContent,
          isEncrypted: newType === 'encrypted',
          isLocked: newType === 'encrypted',
        },
      };
    });
  };

  // Change Color Badge
  const handleChangeColorBadge = (nodeId: string, color?: string) => {
    setNodes((prev) => {
      if (!prev[nodeId]) return prev;
      return {
        ...prev,
        [nodeId]: { ...prev[nodeId], colorBadge: color },
      };
    });
  };

  // Update Content
  const handleUpdateRichContent = (html: string) => {
    if (!activeNodeId) return;
    setNodes((prev) => {
      if (!prev[activeNodeId]) return prev;
      return {
        ...prev,
        [activeNodeId]: {
          ...prev[activeNodeId],
          content: { ...prev[activeNodeId].content, richHtml: html },
          updated: new Date().toISOString().split('T')[0],
        },
      };
    });
  };

  const handleUpdateSpreadsheet = (data: SpreadsheetData) => {
    if (!activeNodeId) return;
    setNodes((prev) => {
      if (!prev[activeNodeId]) return prev;
      return {
        ...prev,
        [activeNodeId]: {
          ...prev[activeNodeId],
          content: { ...prev[activeNodeId].content, spreadsheet: data },
        },
      };
    });
  };

  const handleUpdateCode = (language: string, code: string) => {
    if (!activeNodeId) return;
    setNodes((prev) => {
      if (!prev[activeNodeId]) return prev;
      return {
        ...prev,
        [activeNodeId]: {
          ...prev[activeNodeId],
          content: { ...prev[activeNodeId].content, code: { language, code } },
        },
      };
    });
  };

  const handleUpdateBookmarks = (bookmarks: BookmarkItem[]) => {
    if (!activeNodeId) return;
    setNodes((prev) => {
      if (!prev[activeNodeId]) return prev;
      return {
        ...prev,
        [activeNodeId]: {
          ...prev[activeNodeId],
          content: { ...prev[activeNodeId].content, bookmarks },
        },
      };
    });
  };

  const handleUpdateEncrypted = (text: string) => {
    if (!activeNodeId) return;
    setNodes((prev) => {
      if (!prev[activeNodeId]) return prev;
      return {
        ...prev,
        [activeNodeId]: {
          ...prev[activeNodeId],
          content: { ...prev[activeNodeId].content, plainText: text },
        },
      };
    });
  };

  // Tags toggle
  const handleToggleTagOnActiveNode = (tagName: string) => {
    if (!activeNodeId) return;
    setNodes((prev) => {
      const curr = prev[activeNodeId];
      if (!curr) return prev;
      const hasTag = curr.tags.includes(tagName);
      const nextTags = hasTag
        ? curr.tags.filter((t) => t !== tagName)
        : [...curr.tags, tagName];

      // update tag counts
      setTags((tPrev) =>
        tPrev.map((t) => {
          if (t.name === tagName) {
            return { ...t, count: Math.max(0, t.count + (hasTag ? -1 : 1)) };
          }
          return t;
        })
      );

      return {
        ...prev,
        [activeNodeId]: { ...curr, tags: nextTags },
      };
    });
  };

  const handleAddTag = (name: string, color?: string, icon?: string) => {
    if (tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) return;
    const newTag: TagItem = {
      id: `tag-${Date.now()}`,
      name,
      color: color || '#3b82f6',
      icon: icon || '🏷️',
      count: 0,
    };
    setTags((prev) => [...prev, newTag]);
  };

  // WYSIWYG formatting commands
  const handleApplyFormat = (command: string, value?: string) => {
    if (richEditorRef.current) {
      richEditorRef.current.focus();
    }
    if (command === 'fontName' && value) {
      applyExactFontFamily(value, richEditorRef.current);
    } else if (command === 'fontSize' && value) {
      applyExactFontSize(value, richEditorRef.current);
    } else {
      document.execCommand(command, false, value);
    }
    if (richEditorRef.current) {
      handleUpdateRichContent(richEditorRef.current.innerHTML);
    }
  };

  // Set default typography for global system
  const handleSetDefaultTypography = (fontFamily: string, fontSize: string) => {
    const updated: SystemSettings = {
      ...systemSettings,
      fontFamily,
      fontSize,
    };
    handleSaveSystemSettings(updated);
  };

  // Robust helper to insert HTML snippet at the saved or current caret/selection in richEditorRef
  const insertHtmlAtSelection = (html: string, explicitRange?: Range | null): boolean => {
    if (!richEditorRef.current) return false;
    richEditorRef.current.focus();

    const targetRange = explicitRange || lastEditorRangeRef.current;
    const sel = window.getSelection();

    if (
      targetRange &&
      richEditorRef.current.contains(targetRange.commonAncestorContainer)
    ) {
      try {
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(targetRange);
        }
        targetRange.deleteContents();

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node: ChildNode | null;
        let lastNode: ChildNode | null = null;
        while ((node = tempDiv.firstChild)) {
          lastNode = frag.appendChild(node);
        }

        targetRange.insertNode(frag);

        if (lastNode && sel) {
          const newRange = document.createRange();
          newRange.setStartAfter(lastNode);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
          lastEditorRangeRef.current = newRange.cloneRange();
        }
        return true;
      } catch (err) {
        console.warn('Range insertion fallback:', err);
      }
    }

    // Fallback if no valid range found: try execCommand or append to end
    const success = document.execCommand('insertHTML', false, html);
    if (!success) {
      richEditorRef.current.insertAdjacentHTML('beforeend', html);
    }
    return true;
  };

  const handleInsertCallout = () => {
    const calloutHtml = `
      <div class="bg-amber-50 border border-amber-300 text-amber-950 p-3 rounded-lg text-xs max-w-sm my-3 shadow-xs">
        <strong class="block font-semibold mb-1 text-amber-900">📌 Important Note:</strong>
        Click to write your callout notes here...
      </div>
      <p><br></p>
    `;
    insertHtmlAtSelection(calloutHtml);
    if (richEditorRef.current) {
      handleUpdateRichContent(richEditorRef.current.innerHTML);
    }
  };

  const handleOpenInsertImage = () => {
    let rangeToSave: Range | null = null;
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && richEditorRef.current && richEditorRef.current.contains(sel.anchorNode)) {
        rangeToSave = sel.getRangeAt(0).cloneRange();
      } else if (lastEditorRangeRef.current && richEditorRef.current && richEditorRef.current.contains(lastEditorRangeRef.current.commonAncestorContainer)) {
        rangeToSave = lastEditorRangeRef.current.cloneRange();
      }
    } catch {
      rangeToSave = lastEditorRangeRef.current;
    }
    setSavedEditorRangeForImage(rangeToSave);
    setIsInsertImageOpen(true);
  };

  const handleConfirmInsertImage = (imageHtml: string) => {
    insertHtmlAtSelection(imageHtml, savedEditorRangeForImage);
    setSavedEditorRangeForImage(null);
    if (richEditorRef.current) {
      handleUpdateRichContent(richEditorRef.current.innerHTML);
    }
  };

  const handleInsertTable = () => {
    const tableHtml = `
      <table class="border-collapse border border-stone-300 text-xs my-3 w-full max-w-md">
        <thead>
          <tr class="bg-stone-100 font-bold">
            <th class="border border-stone-300 p-1.5 text-left">Header 1</th>
            <th class="border border-stone-300 p-1.5 text-left">Header 2</th>
            <th class="border border-stone-300 p-1.5 text-left">Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-stone-300 p-1.5">Value A1</td>
            <td class="border border-stone-300 p-1.5">Value B1</td>
            <td class="border border-stone-300 p-1.5">Value C1</td>
          </tr>
          <tr>
            <td class="border border-stone-300 p-1.5">Value A2</td>
            <td class="border border-stone-300 p-1.5">Value B2</td>
            <td class="border border-stone-300 p-1.5">Value C2</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    insertHtmlAtSelection(tableHtml);
    if (richEditorRef.current) {
      handleUpdateRichContent(richEditorRef.current.innerHTML);
    }
  };

  const handleInsertLink = () => {
    const url = window.prompt('Enter Web URL:', 'https://');
    if (url) {
      if (richEditorRef.current) {
        richEditorRef.current.focus();
      }
      document.execCommand('createLink', false, url);
      if (richEditorRef.current) {
        handleUpdateRichContent(richEditorRef.current.innerHTML);
      }
    }
  };

  const handleOpenInsertFootnote = () => {
    let rangeToSave: Range | null = null;
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && richEditorRef.current && richEditorRef.current.contains(sel.anchorNode)) {
        rangeToSave = sel.getRangeAt(0).cloneRange();
      } else if (lastEditorRangeRef.current && richEditorRef.current && richEditorRef.current.contains(lastEditorRangeRef.current.commonAncestorContainer)) {
        rangeToSave = lastEditorRangeRef.current.cloneRange();
      }
    } catch {
      rangeToSave = lastEditorRangeRef.current;
    }
    setSavedEditorRangeForFootnote(rangeToSave);
    setIsInsertFootnoteOpen(true);
  };

  const handleInsertFootnote = (text: string) => {
    if (!richEditorRef.current) return;
    const footnoteHtml = createFootnoteHtml(text);

    insertHtmlAtSelection(footnoteHtml, savedEditorRangeForFootnote);

    renumberFootnotes(richEditorRef.current);
    handleUpdateRichContent(richEditorRef.current.innerHTML);
    setSavedEditorRangeForFootnote(null);
    logSuccess('editor', `注釈 [${text.slice(0, 20)}...] をカーソル位置に挿入しました`);
  };

  const handleInsertTextbox = (orientation: 'horizontal' | 'vertical', presetId?: string) => {
    const preset = presetId ? TEXTBOX_PRESETS.find((p) => p.id === presetId) : undefined;
    const textboxHtml = createTextboxHtml({
      orientation: preset ? preset.orientation : orientation,
      borderStyle: preset?.borderStyle,
      borderColor: preset?.borderColor,
      bgColor: preset?.bgColor,
    });

    insertHtmlAtSelection(textboxHtml);

    if (richEditorRef.current) {
      handleUpdateRichContent(richEditorRef.current.innerHTML);
    }
  };

  // Format Painter: Copy current selection or caret style
  const handleCopyFormat = () => {
    const format = captureCurrentFormat();
    if (format) {
      setCopiedFormat(format);
      setIsFormatPainterActive(true);
    } else {
      setIsFormatPainterActive((prev) => !prev);
    }
  };

  // Format Painter: Paste copied format onto current selection
  const handlePasteFormat = () => {
    if (copiedFormat) {
      if (richEditorRef.current) {
        richEditorRef.current.focus();
      }
      applyFormatToCurrentSelection(copiedFormat);
      if (richEditorRef.current) {
        handleUpdateRichContent(richEditorRef.current.innerHTML);
      }
    }
  };

  // Format Painter: Clear formatting
  const handleClearFormat = () => {
    if (richEditorRef.current) {
      richEditorRef.current.focus();
    }
    clearCurrentFormat();
    setActiveStyleId(null);
    if (richEditorRef.current) {
      handleUpdateRichContent(richEditorRef.current.innerHTML);
    }
  };

  // Apply predefined or custom style (文字・段落書式)
  const handleApplyStyle = (style: TextStylePreset) => {
    if (!richEditorRef.current) return;
    richEditorRef.current.focus();

    setActiveStyleId(style.id);

    if (style.category === 'character') {
      // 1. Exact Font Family
      if (style.fontFamily) {
        applyExactFontFamily(style.fontFamily, richEditorRef.current);
      }

      // 2. Exact Font Size (pt, px, scale)
      if (style.fontSize) {
        applyExactFontSize(style.fontSize, richEditorRef.current);
      }

      // 3. Weight & Style
      if (style.fontWeight === 'bold' || style.fontWeight === '700') {
        document.execCommand('bold', false);
      }
      if (style.fontStyle === 'italic') {
        document.execCommand('italic', false);
      }

      // 4. Colors
      if (style.textColor) {
        document.execCommand('foreColor', false, style.textColor);
      }
      if (style.backgroundColor && style.backgroundColor !== 'transparent') {
        document.execCommand('hiliteColor', false, style.backgroundColor);
      }

      // 5. Text Decoration
      if (style.textDecoration?.includes('underline')) {
        document.execCommand('underline', false);
      }
      if (style.textDecoration?.includes('line-through')) {
        document.execCommand('strikeThrough', false);
      }

      // 6. Advanced inline decorations (wavy underline, custom line colors, padding, etc.)
      if ((style.underlineStyle && style.underlineStyle !== 'solid') || style.underlineColor) {
        try {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
            const range = sel.getRangeAt(0);
            const span = document.createElement('span');
            if (style.fontFamily) span.style.fontFamily = style.fontFamily;
            if (style.fontSize) span.style.fontSize = style.fontSize;
            if (style.textColor) span.style.color = style.textColor;
            if (style.textDecoration) {
              span.style.textDecoration = style.textDecoration;
              if (style.underlineStyle) span.style.textDecorationStyle = style.underlineStyle;
              if (style.underlineColor) span.style.textDecorationColor = style.underlineColor;
            }
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);

            // Re-select contents
            sel.removeAllRanges();
            const newRange = document.createRange();
            newRange.selectNodeContents(span);
            sel.addRange(newRange);
          }
        } catch (err) {
          console.warn('Advanced inline style error:', err);
        }
      }
    } else if (style.category === 'paragraph') {
      // Paragraph Block formatting
      const tag = style.headingLevel || 'p';
      document.execCommand('formatBlock', false, tag);

      // Alignment
      if (style.textAlign === 'center') {
        document.execCommand('justifyCenter', false);
      } else if (style.textAlign === 'right') {
        document.execCommand('justifyRight', false);
      } else if (style.textAlign === 'justify') {
        document.execCommand('justifyFull', false);
      } else if (style.textAlign === 'left') {
        document.execCommand('justifyLeft', false);
      }

      // Block-level CSS attributes (fontSize, fontFamily, lineHeight, textIndent, margin, colors)
      try {
        const sel = window.getSelection();
        if (sel && sel.anchorNode) {
          let node: Node | null = sel.anchorNode;
          while (node && node !== richEditorRef.current) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              const tagName = el.tagName.toLowerCase();
              if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'div', 'li'].includes(tagName)) {
                if (style.fontSize) el.style.fontSize = style.fontSize;
                if (style.fontFamily) el.style.fontFamily = style.fontFamily;
                if (style.textColor) el.style.color = style.textColor;
                if (style.lineHeight) el.style.lineHeight = style.lineHeight;
                if (style.textIndent) el.style.textIndent = style.textIndent;
                if (style.marginTop) el.style.marginTop = style.marginTop;
                if (style.marginBottom) el.style.marginBottom = style.marginBottom;
                if (style.fontWeight) el.style.fontWeight = style.fontWeight;
                if (style.borderLeft) el.style.borderLeft = style.borderLeft;
                if (style.paddingLeft) el.style.paddingLeft = style.paddingLeft;
                if (style.backgroundColor) el.style.backgroundColor = style.backgroundColor;
                break;
              }
            }
            node = node.parentNode;
          }
        }
      } catch (err) {
        console.warn('Block styling error:', err);
      }
    }

    handleUpdateRichContent(richEditorRef.current.innerHTML);
  };

  const handleCreateNewStyle = (category: StyleCategory) => {
    setEditingStyle(null);
    setDefaultStyleCategory(category);
    setIsStyleModalOpen(true);
  };

  const handleEditStyle = (style: TextStylePreset) => {
    setEditingStyle(style);
    setDefaultStyleCategory(style.category);
    setIsStyleModalOpen(true);
  };

  const handleDeleteStyle = (styleId: string) => {
    setCharacterStyles((prev) => prev.filter((s) => s.id !== styleId));
    setParagraphStyles((prev) => prev.filter((s) => s.id !== styleId));
  };

  const handleResetDefaultStyles = () => {
    if (window.confirm('登録されているスタイルを初期状態（デフォルト）に戻しますか？')) {
      setCharacterStyles(INITIAL_CHARACTER_STYLES);
      setParagraphStyles(INITIAL_PARAGRAPH_STYLES);
    }
  };

  const handleToggleHideStyle = (styleId: string) => {
    setCharacterStyles((prev) => prev.map(s => s.id === styleId ? { ...s, isHidden: !s.isHidden } : s));
    setParagraphStyles((prev) => prev.map(s => s.id === styleId ? { ...s, isHidden: !s.isHidden } : s));
  };

  const handleSaveStyle = (savedStyle: TextStylePreset) => {
    if (savedStyle.category === 'character') {
      setCharacterStyles((prev) => {
        const exists = prev.some((s) => s.id === savedStyle.id);
        if (exists) {
          return prev.map((s) => (s.id === savedStyle.id ? savedStyle : s));
        }
        return [...prev, savedStyle];
      });
    } else {
      setParagraphStyles((prev) => {
        const exists = prev.some((s) => s.id === savedStyle.id);
        if (exists) {
          return prev.map((s) => (s.id === savedStyle.id ? savedStyle : s));
        }
        return [...prev, savedStyle];
      });
    }
  };

  // Format Painter: Auto apply on drag-selection and finish
  const handleAutoApplyFormatPainter = () => {
    if (copiedFormat) {
      applyFormatToCurrentSelection(copiedFormat);
      if (richEditorRef.current) {
        handleUpdateRichContent(richEditorRef.current.innerHTML);
      }
      setIsFormatPainterActive(false);
    }
  };

  const handleCancelFormatPainter = () => {
    setIsFormatPainterActive(false);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 400);
  };

  // Toggle bookmark status on a node
  const handleToggleBookmark = (nodeId: string) => {
    setNodes((prev) => {
      const target = prev[nodeId];
      if (!target) return prev;
      const nextIsBookmarked = !target.isBookmarked;
      return {
        ...prev,
        [nodeId]: {
          ...target,
          isBookmarked: nextIsBookmarked,
          bookmarkedAt: nextIsBookmarked ? new Date().toISOString() : undefined,
        },
      };
    });
  };

  // Bookmark sentence from current text selection
  const handleBookmarkCurrentSentence = () => {
    if (!activeNode) return;
    
    // Check if user has selected text in window selection
    const sel = window.getSelection();
    let selectedText = sel ? sel.toString().trim() : '';

    // If no text is actively selected, look for active node title or fallback
    if (!selectedText) {
      const promptText = window.prompt('ブックマークに登録する文章または要約を入力してください:', activeNode.title);
      if (promptText && promptText.trim()) {
        selectedText = promptText.trim();
      } else {
        return;
      }
    }

    const anchorId = `sbm-anchor-${Date.now()}`;

    // If there's an active text selection in rich editor, wrap with span anchor
    if (sel && sel.rangeCount > 0 && richEditorRef.current && richEditorRef.current.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.id = anchorId;
      span.className = 'sentence-bookmark-target bg-amber-100/70 border-b border-amber-400 px-0.5 rounded-xs transition-colors duration-500';
      span.setAttribute('data-sbm-id', anchorId);
      span.textContent = range.toString();

      try {
        range.deleteContents();
        range.insertNode(span);
        if (richEditorRef.current) {
          handleUpdateRichContent(richEditorRef.current.innerHTML);
        }
      } catch (err) {
        console.error('Failed to wrap sentence bookmark anchor in editor:', err);
      }
    }

    const newBookmark: SentenceBookmark = {
      id: `sbm-${Date.now()}`,
      nodeId: activeNode.id,
      notebookId: activeNode.notebookId,
      noteTitle: activeNode.title,
      text: selectedText,
      anchorId,
      createdAt: new Date().toISOString(),
      color: '#f59e0b',
    };

    setSentenceBookmarks((prev) => [newBookmark, ...prev]);
    setResourcePanelTab('ブックマーク');
    logSuccess('editor', `文章ブックマークを登録しました: "${selectedText.slice(0, 30)}${selectedText.length > 30 ? '...' : ''}"`);
  };

  const handleDeleteSentenceBookmark = (bookmarkId: string) => {
    setSentenceBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    logInfo('editor', '文章ブックマークを解除しました');
  };

  const handleUpdateSentenceBookmark = (updated: SentenceBookmark) => {
    setSentenceBookmarks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    logSuccess('editor', '文章ブックマークのメモを更新しました');
  };

  const handleDeleteFigureCaption = (captionId: string) => {
    const captionToDelete = figureCaptions.find(c => c.id === captionId);
    if (!captionToDelete) return;

    setFigureCaptions(prev => prev.filter(c => c.id !== captionId));

    if (activeNode && activeNode.id === captionToDelete.nodeId) {
      if (richEditorRef.current) {
        const el = richEditorRef.current.querySelector(`[data-caption-id="${captionId}"]`);
        if (el) {
          el.remove();
          handleUpdateRichContent(richEditorRef.current.innerHTML);
        }
      }
    } else {
      setNodes(prev => {
        const node = prev[captionToDelete.nodeId];
        if (!node) return prev;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = node.content;
        const el = tempDiv.querySelector(`[data-caption-id="${captionId}"]`);
        if (el) {
          el.remove();
          return {
            ...prev,
            [captionToDelete.nodeId]: {
              ...node,
              content: tempDiv.innerHTML,
              updatedAt: new Date().toISOString()
            }
          };
        }
        return prev;
      });
    }
  };

  const handleEditFigureCaption = (captionId: string, newLabel: string, newTitle: string) => {
    const captionToEdit = figureCaptions.find(c => c.id === captionId);
    if (!captionToEdit) return;

    setFigureCaptions(prev => prev.map(c => c.id === captionId ? { ...c, label: newLabel, title: newTitle } : c));

    const updateHtml = (html: string) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const el = tempDiv.querySelector(`[data-caption-id="${captionId}"]`);
      if (el) {
        const labelDiv = el.children[0] as HTMLElement;
        const titleDiv = el.children[1] as HTMLElement;
        if (labelDiv) labelDiv.innerText = newLabel;
        if (titleDiv) titleDiv.innerText = newTitle;
      }
      return tempDiv.innerHTML;
    };

    if (activeNode && activeNode.id === captionToEdit.nodeId) {
      if (richEditorRef.current) {
        const el = richEditorRef.current.querySelector(`[data-caption-id="${captionId}"]`);
        if (el) {
          const labelDiv = el.children[0] as HTMLElement;
          const titleDiv = el.children[1] as HTMLElement;
          if (labelDiv) labelDiv.innerText = newLabel;
          if (titleDiv) titleDiv.innerText = newTitle;
          handleUpdateRichContent(richEditorRef.current.innerHTML);
        }
      }
    } else {
      setNodes(prev => {
        const node = prev[captionToEdit.nodeId];
        if (!node) return prev;
        
        return {
          ...prev,
          [captionToEdit.nodeId]: {
            ...node,
            content: updateHtml(node.content),
            updatedAt: new Date().toISOString()
          }
        };
      });
    }
  };

  // Jump to sentence bookmark inside rich editor
  const handleSelectSentenceBookmark = (bookmark: SentenceBookmark) => {
    // 1. Select the note
    handleSelectNode(bookmark.nodeId);

    // 2. Wait for note to render, then scroll to anchor or search for text
    setTimeout(() => {
      if (bookmark.anchorId) {
        const el = document.getElementById(bookmark.anchorId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-amber-300', 'ring-2', 'ring-amber-500');
          setTimeout(() => {
            el.classList.remove('bg-amber-300', 'ring-2', 'ring-amber-500');
          }, 3000);
          return;
        }
      }

      // Fallback: search for the text in the editor
      if (richEditorRef.current && bookmark.text) {
        const html = richEditorRef.current.innerHTML;
        const index = html.indexOf(bookmark.text);
        if (index !== -1) {
          // Highlight temporary
          const walker = document.createTreeWalker(richEditorRef.current, NodeFilter.SHOW_TEXT, null);
          let node: Node | null;
          while ((node = walker.nextNode())) {
            if (node.textContent && node.textContent.includes(bookmark.text.slice(0, 20))) {
              const parent = node.parentElement;
              if (parent) {
                parent.scrollIntoView({ behavior: 'smooth', block: 'center' });
                parent.classList.add('bg-amber-200', 'transition-all', 'duration-500');
                setTimeout(() => {
                  parent.classList.remove('bg-amber-200');
                }, 3000);
                break;
              }
            }
          }
        }
      }
    }, 120);
  };

  // Clear all bookmarks in the current database (both notes and sentences)
  const handleClearAllBookmarks = () => {
    setNodes((prev) => {
      const next = { ...prev };
      for (const id in next) {
        if (next[id].isBookmarked) {
          next[id] = { ...next[id], isBookmarked: false, bookmarkedAt: undefined };
        }
      }
      return next;
    });
    setSentenceBookmarks([]);
    logInfo('database', 'すべてのブックマークをクリアしました');
  };

  // Switch ResourcePanel directly to Bookmarks tab
  const handleOpenBookmarksTab = () => {
    setResourcePanelTab('ブックマーク');
  };

  // Search & Replace Handlers (タブ内検索・置換 & DB全体検索)
  const handleOpenFind = () => {
    setIsFindBarOpen(true);
    setIsReplaceMode(false);
  };

  const handleOpenReplace = () => {
    setIsFindBarOpen(true);
    setIsReplaceMode(true);
  };

  const handleOpenGlobalSearch = (initialQuery?: string) => {
    setGlobalSearchInitialQuery(initialQuery || '');
    setIsGlobalSearchOpen(true);
  };

  const handleSelectNodeFromGlobalSearch = (nodeId: string, searchKeyword?: string) => {
    const targetNode = nodes[nodeId];
    if (!targetNode) return;

    if (targetNode.notebookId && targetNode.notebookId !== activeNotebookId) {
      setActiveNotebookId(targetNode.notebookId);
      const targetNb = notebooks.find((nb) => nb.id === targetNode.notebookId);
      if (targetNb?.folderId) {
        setActiveTabFolderId(targetNb.folderId);
      }
    }

    setActiveNodeId(nodeId);

    if (searchKeyword) {
      setIsFindBarOpen(true);
    }
  };

  // Global Keyboard Shortcuts (Ctrl+F: Tab Find, Ctrl+H: Tab Replace, Ctrl+Shift+F: Global DB Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleOpenGlobalSearch();
      } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleOpenFind();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        handleOpenReplace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // DOCX Import Execution Handler (１つのファイルに１つのタブを設定、最大3階層のフォルダ・ノートを展開)
  const handleConfirmDocxImport = (
    previewResult: DocxImportPreviewResult,
    targetFolderId: string | null,
    newFolderName?: string
  ) => {
    let finalFolderId = targetFolderId;

    // If user created a new folder inline
    if (newFolderName) {
      finalFolderId = `tf-${Date.now()}`;
      const newFolder: TabFolder = {
        id: finalFolderId,
        name: newFolderName,
        parentId: null,
      };
      setTabFolders((prev) => [...prev, newFolder]);
    }

    const newNotebookId = `nb-docx-${Date.now()}`;
    const { notebook, nodesToInsert, rootNodeIds } = convertPreviewToAppNodes(
      previewResult,
      newNotebookId
    );

    // Set destination folder
    notebook.folderId = finalFolderId;

    // 1. Append new notebook tab
    setNotebooks((prev) => [...prev, notebook]);

    // Ensure newly imported notebook is open in the top tab bar
    setOpenNotebookIds((prev) => (prev.includes(newNotebookId) ? prev : [...prev, newNotebookId]));

    // 2. Append all generated tree nodes
    setNodes((prev) => ({
      ...prev,
      ...nodesToInsert,
    }));

    // 3. Switch active tab folder and active notebook, then open first note with content/footnotes
    setActiveTabFolderId(finalFolderId);
    setActiveNotebookId(newNotebookId);
    if (rootNodeIds.length > 0) {
      let targetNodeId = rootNodeIds[0];
      const firstNode = nodesToInsert[targetNodeId];
      if (firstNode && firstNode.isFolder && firstNode.children && firstNode.children.length > 0) {
        // If top-level node is a folder title, select first child with text or footnotes
        const childWithContent = firstNode.children.find((cid) => {
          const c = nodesToInsert[cid];
          return c && (c.content?.richHtml?.length || 0) > 30;
        });
        if (childWithContent) {
          targetNodeId = childWithContent;
        }
      }
      setActiveNodeId(targetNodeId);
    }

    // 4. Save to databases state with immediate physical storage commit
    setDatabases((prev) => {
      const next = prev.map((db) => {
        if (db.id === activeDatabaseId) {
          const updatedFolders = newFolderName && finalFolderId
            ? [...(db.tabFolders || tabFolders), { id: finalFolderId, name: newFolderName, parentId: null }]
            : (db.tabFolders || tabFolders);

          return {
            ...db,
            tabFolders: updatedFolders,
            notebooks: [...(db.notebooks || []), notebook],
            nodes: { ...(db.nodes || {}), ...nodesToInsert },
            activeNotebookId: newNotebookId,
            activeNodeId: rootNodeIds[0] || db.activeNodeId,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return db;
      });

      // Single Storage: Write immediately and exclusively to IndexedDB
      localforage.setItem('hierarchical_databases', next);
      return next;
    });
  };

  // DOCX Batch Import Handler (複数DOCXファイルを指定フォルダ配下に一括でノートブック・階層ノート展開)
  const handleConfirmBatchDocxImport = (
    previewResults: DocxImportPreviewResult[],
    targetFolderId: string | null,
    newFolderName?: string
  ) => {
    let finalFolderId = targetFolderId;

    if (newFolderName) {
      finalFolderId = `tf-${Date.now()}`;
      const newFolder: TabFolder = {
        id: finalFolderId,
        name: newFolderName,
        parentId: null,
      };
      setTabFolders((prev) => [...prev, newFolder]);
    }

    const newNotebooks: Notebook[] = [];
    const newNodesToInsert: Record<string, TreeNode> = {};
    const newNotebookIds: string[] = [];

    previewResults.forEach((previewResult, idx) => {
      const newNotebookId = `nb-docx-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      const { notebook, nodesToInsert } = convertPreviewToAppNodes(
        previewResult,
        newNotebookId
      );
      notebook.folderId = finalFolderId;
      newNotebooks.push(notebook);
      newNotebookIds.push(newNotebookId);
      Object.assign(newNodesToInsert, nodesToInsert);
    });

    setNotebooks((prev) => [...prev, ...newNotebooks]);
    setOpenNotebookIds((prev) => {
      const set = new Set([...prev, ...newNotebookIds]);
      return Array.from(set);
    });
    setNodes((prev) => ({
      ...prev,
      ...newNodesToInsert,
    }));

    if (finalFolderId) {
      setActiveTabFolderId(finalFolderId);
    }
    if (newNotebookIds.length > 0) {
      setActiveNotebookId(newNotebookIds[0]);
      const firstNb = newNotebooks[0];
      if (firstNb.nodeIds && firstNb.nodeIds.length > 0) {
        setActiveNodeId(firstNb.nodeIds[0]);
      }
    }

    // Single Storage: Immediate physical commit exclusively to IndexedDB
    setDatabases((prev) => {
      const next = prev.map((db) => {
        if (db.id === activeDatabaseId) {
          const updatedFolders = newFolderName && finalFolderId
            ? [...(db.tabFolders || tabFolders), { id: finalFolderId, name: newFolderName, parentId: null }]
            : (db.tabFolders || tabFolders);

          return {
            ...db,
            tabFolders: updatedFolders,
            notebooks: [...(db.notebooks || []), ...newNotebooks],
            nodes: { ...(db.nodes || {}), ...newNodesToInsert },
            activeNotebookId: newNotebookIds[0] || db.activeNotebookId,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return db;
      });

      localforage.setItem('hierarchical_databases', next);
      return next;
    });
  };

  const handleOpenInsertBookmarkCard = () => {
    let rangeToSave: Range | null = null;
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && richEditorRef.current && richEditorRef.current.contains(sel.anchorNode)) {
        rangeToSave = sel.getRangeAt(0).cloneRange();
      } else if (lastEditorRangeRef.current && richEditorRef.current && richEditorRef.current.contains(lastEditorRangeRef.current.commonAncestorContainer)) {
        rangeToSave = lastEditorRangeRef.current.cloneRange();
      }
    } catch {
      rangeToSave = lastEditorRangeRef.current;
    }
    setSavedEditorRangeForBookmark(rangeToSave);
    setIsInsertBookmarkCardOpen(true);
  };

  // Insert a Web Bookmark Card into the document or append to bookmark list
  const handleInsertBookmarkCard = (data: {
    title: string;
    url: string;
    notes: string;
    thumbnailUrl?: string;
  }) => {
    if (!activeNode) return;

    if (activeNode.type === 'bookmark') {
      const newBm: BookmarkItem = {
        id: `bm-${Date.now()}`,
        title: data.title,
        url: data.url,
        notes: data.notes,
        favicon: '🌐',
        thumbnailUrl: data.thumbnailUrl,
      };
      const currentList = activeNode.content.bookmarks || [];
      handleUpdateBookmarks([...currentList, newBm]);
      return;
    }

    // Default: Insert HTML card block into RichTextEditor at exact cursor position
    const cardHtml = `
      <div class="my-3 p-3 bg-stone-50 border border-stone-300 rounded-lg shadow-xs hover:border-indigo-400 transition" contenteditable="false" style="user-select: text;">
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          ${data.thumbnailUrl ? `<img src="${data.thumbnailUrl}" alt="${data.title}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 6px; flex-shrink: 0; border: 1px solid #cbd5e1;" />` : ''}
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <a href="${data.url}" target="_blank" rel="noopener noreferrer" style="font-weight: 700; color: #2563eb; text-decoration: none; font-size: 13px;">
                🔖 ${data.title} ↗
              </a>
            </div>
            ${data.notes ? `<p style="margin: 2px 0 4px; font-size: 11px; color: #475569; line-height: 1.4;">${data.notes}</p>` : ''}
            <div style="font-size: 10px; color: #94a3b8; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${data.url}</div>
          </div>
        </div>
      </div>
      <p><br></p>
    `;

    insertHtmlAtSelection(cardHtml, savedEditorRangeForBookmark);
    setSavedEditorRangeForBookmark(null);

    if (richEditorRef.current) {
      handleUpdateRichContent(richEditorRef.current.innerHTML);
    }
  };

  const handleOpenInsertFigureCaption = () => {
    let rangeToSave: Range | null = null;
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && richEditorRef.current && richEditorRef.current.contains(sel.anchorNode)) {
        rangeToSave = sel.getRangeAt(0).cloneRange();
      } else if (lastEditorRangeRef.current && richEditorRef.current && richEditorRef.current.contains(lastEditorRangeRef.current.commonAncestorContainer)) {
        rangeToSave = lastEditorRangeRef.current.cloneRange();
      }
    } catch {
      rangeToSave = lastEditorRangeRef.current;
    }
    setSavedEditorRangeForFigureCaption(rangeToSave);

    if (richEditorRef.current) {
      const targetEls = richEditorRef.current.querySelectorAll('img, table');
      const targets: FigureTarget[] = [];
      let domModified = false;
      targetEls.forEach((el, index) => {
        const id = el.id || `auto-target-${Date.now()}-${index}`;
        if (!el.id) {
          el.id = id;
          domModified = true;
        }

        if (el.tagName.toLowerCase() === 'img') {
          targets.push({
            id,
            type: 'image',
            preview: (el as HTMLImageElement).src,
            html: el.outerHTML
          });
        } else {
          targets.push({
            id,
            type: 'table',
            preview: (el as HTMLTableElement).innerText.substring(0, 30).replace(/\\s+/g, ' ') + '...',
            html: el.outerHTML
          });
        }
      });
      if (domModified) {
        handleUpdateRichContent(richEditorRef.current.innerHTML);
      }
      setFigureTargets(targets);
    } else {
      setFigureTargets([]);
    }

    setIsInsertFigureCaptionOpen(true);
  };

  const handleInsertFigureCaption = (captions: {label: string, title: string, targetId: string | null}[]) => {
    setIsInsertFigureCaptionOpen(false);
    if (!activeNode || captions.length === 0) return;

    const newCaptions: FigureCaption[] = [];
    let usedSelection = false;

    captions.forEach((cap, index) => {
      const captionId = `figcap-${Date.now()}-${index}`;
      const anchorId = `fig-anchor-${captionId}`;
      
      const newCaption: FigureCaption = {
        id: captionId,
        nodeId: activeNode.id,
        anchorId,
        label: cap.label,
        title: cap.title,
        createdAt: new Date().toISOString(),
      };

      const captionHtml = `
      <div id="${anchorId}" class="figure-caption-block my-2 p-2 rounded-lg border bg-stone-50 flex flex-col gap-1" style="border-left: 4px solid #10b981;" contenteditable="false" data-caption-id="${captionId}">
        <div style="font-weight: bold; color: #047857; font-size: 12px;">${cap.label}</div>
        <div style="font-size: 14px; color: #334155;">${cap.title}</div>
      </div>
      <p><br></p>
      `;

      if (cap.targetId && richEditorRef.current) {
        const targetEl = richEditorRef.current.querySelector(`#${cap.targetId}`);
        if (targetEl) {
          targetEl.insertAdjacentHTML('afterend', captionHtml);
          newCaptions.push(newCaption);
          return;
        }
      }

      if (!usedSelection) {
        insertHtmlAtSelection(captionHtml, savedEditorRangeForFigureCaption);
        usedSelection = true;
        newCaptions.push(newCaption);
      }
    });

    setSavedEditorRangeForFigureCaption(null);
    if (newCaptions.length > 0) {
      setFigureCaptions(prev => [...prev, ...newCaptions]);
      if (richEditorRef.current) {
        handleUpdateRichContent(richEditorRef.current.innerHTML);
      }
    }
  };

  const handleExportAllJson = () => {
    const exportData = { notebooks, nodes, tags };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hierarchical_notes_backup_${Date.now()}.json`;
    a.click();
  };

  const handleImportDatabase = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.notebooks && data.nodes) {
          const newDb: DatabaseProfile = {
            id: `db-${Date.now()}`,
            name: file.name.replace(/\.[^/.]+$/, "") || 'インポートされたDB',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDemo: false,
            storageLocation: 'ブラウザ内蔵セキュアデータベース (IndexedDB)',
            storageType: 'browser_storage',
            notebooks: data.notebooks,
            nodes: data.nodes,
            tags: data.tags || [],
            sentenceBookmarks: data.sentenceBookmarks || [],
            figureCaptions: data.figureCaptions || [],
            activeNotebookId: data.notebooks[0]?.id || '',
            activeNodeId: Object.keys(data.nodes)[0] || '',
          };
          setDatabases(prev => {
            const next = [...prev, newDb];
            localforage.setItem('hierarchical_databases', next);
            return next;
          });
          // Switch to the newly imported DB immediately
          setActiveDatabaseId(newDb.id);
          setNotebooks(newDb.notebooks);
          setNodes(newDb.nodes);
          setTags(newDb.tags || []);
          setSentenceBookmarks(newDb.sentenceBookmarks || []);
          setFigureCaptions(newDb.figureCaptions || []);
          setActiveNotebookId(newDb.activeNotebookId || '');
          setActiveNodeId(newDb.activeNodeId || '');
          setSelectedTagFilter(null);
          
          logSuccess('system', `データベース「${newDb.name}」をインポートしました。`);
          setIsDbManagerOpen(false); // Close modal if open
        } else {
          logError('system', '不正な形式のファイルです。', new Error('Invalid file format'));
        }
      } catch (error) {
        console.error(error);
        logError('system', 'ファイルの読み込みに失敗しました。', error as Error);
      }
    };
    reader.readAsText(file);
  };

  const handleAddNotebook = (name: string, color: string, folderId?: string | null) => {
    const newNbId = `nb-${Date.now()}`;
    const rootNodeId = `node-${Date.now()}`;
    const targetFolderId = folderId !== undefined ? folderId : activeTabFolderId;

    const newRootNode: TreeNode = {
      id: rootNodeId,
      notebookId: newNbId,
      parentId: null,
      title: `${name} の最初のノート`,
      type: 'rich',
      tags: [],
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString().split('T')[0],
      content: {
        richHtml: `<h2>${name}</h2><p>ノートの内容をここに入力してください...</p>`,
        plainText: name,
      },
    };

    const newNb: Notebook = {
      id: newNbId,
      name,
      color,
      bgClass: 'bg-stone-100 text-stone-800 border-stone-300',
      borderClass: 'border-t-stone-500',
      nodeIds: [rootNodeId],
      folderId: targetFolderId,
    };

    setNodes((prev) => ({ ...prev, [rootNodeId]: newRootNode }));
    setNotebooks((prev) => [...prev, newNb]);
    setActiveNotebookId(newNbId);
    setOpenNotebookIds((prev) => [...prev, newNbId]);
    setActiveNodeId(rootNodeId);
  };

  // Global Keyboard Navigation & Hierarchy Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D / Cmd+Shift+D: Bookmark selected sentence
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        if (activeNodeId) {
          e.preventDefault();
          handleBookmarkCurrentSentence();
          return;
        }
      }

      // Ctrl+D / Cmd+D: Bookmark Toggle (works anytime a note is active)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        if (activeNodeId) {
          e.preventDefault();
          handleToggleBookmark(activeNodeId);
          return;
        }
      }

      // Ctrl+Shift+C: Copy text format (Format Painter)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        handleCopyFormat();
        return;
      }

      // Ctrl+Shift+V: Paste text format
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
        e.preventDefault();
        handlePasteFormat();
        return;
      }

      // Ctrl+, / Cmd+,: Open Options Modal (システム設定・フォント・折り返し)
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsOptionsOpen(true);
        return;
      }

      // If user is currently typing in an input, textarea or contenteditable element, don't trigger tree reorder shortcuts
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        (activeEl as HTMLElement).isContentEditable
      );

      if (isTyping) return;
      if (!activeNodeId) return;

      // Shift+B: Open Bookmark tab
      if (e.shiftKey && (e.key === 'B' || e.key === 'b')) {
        e.preventDefault();
        handleOpenBookmarksTab();
        return;
      }

      // Alt+Up: Move active node up
      if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        handleReorderNode(activeNodeId, 'up');
      }
      // Alt+Down: Move active node down
      else if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault();
        handleReorderNode(activeNodeId, 'down');
      }
      // Alt+Left: Promote (raise hierarchy 1 level)
      else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePromoteNode(activeNodeId);
      }
      // Alt+Right: Demote (indent hierarchy into previous sibling)
      else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleDemoteNode(activeNodeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNodeId, nodes, rootNodeIds, activeNotebookId, copiedFormat, isFormatPainterActive]);

  const totalBookmarkedCount = (Object.values(nodes) as TreeNode[]).filter((n) => n.isBookmarked).length;


  const handleExportAllDatabases = () => {
    const backupData = {
      version: '1.0',
      type: 'hierarchical_notes_full_backup',
      databases: databases
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hierarchical_notes_FULL_BACKUP_${Date.now()}.json`;
    a.click();
  };

  const handleImportAllDatabases = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.type === 'hierarchical_notes_full_backup' && Array.isArray(data.databases)) {
          if (confirm('既存のすべてのデータベースが上書き（または結合）されます。続行しますか？\n※「キャンセル」で既存のデータは保持されますが、今回は完全に上書きする形で移行します。')) {
            setDatabases(data.databases);
            localforage.setItem('hierarchical_databases', data.databases);
            const fallbackId = data.databases[0]?.id || 'demo';
            setActiveDatabaseId(fallbackId);
            localforage.setItem('hierarchical_active_db_id', fallbackId);
            
            // Re-sync states for the active DB
            const fallbackDb = data.databases[0];
            if (fallbackDb) {
              setNotebooks(fallbackDb.notebooks || []);
              setNodes(fallbackDb.nodes || {});
              setTags(fallbackDb.tags || []);
              setSentenceBookmarks(fallbackDb.sentenceBookmarks || []);
              setFigureCaptions(fallbackDb.figureCaptions || []);
              setActiveNotebookId(fallbackDb.activeNotebookId || '');
              setActiveNodeId(fallbackDb.activeNodeId || '');
            }
            
            alert('全環境のデータ移行（インポート）が完了しました。');
          }
        } else {
          alert('正しいフルバックアップファイルではありません。');
        }
      } catch (err) {
        console.error(err);
        alert('ファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
  };

  const handleExportDataOnlyZip = async () => {
    try {
      await exportDataOnlyZip(databases);
    } catch (err: any) {
      console.error('Failed to export data only zip:', err);
      alert('データ保存（ZIP）に失敗しました: ' + err.message);
    }
  };

  const handleImportDataOnlyZip = async (file: File) => {
    try {
      const zip = await JSZip.loadAsync(file);
      const sanitize = (name: string) => (name || 'Untitled').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();

      // Pre-read any .kaiso_tab_meta.json files per database
      const dbMetaMap = new Map<string, {
        tabFolders: TabFolder[];
        notebooks: Array<{
          id: string;
          name: string;
          folderId: string | null;
          color?: string;
          bgClass?: string;
          borderClass?: string;
          description?: string;
        }>;
        tags?: any[];
        sentenceBookmarks?: any[];
        figureCaptions?: any[];
      }>();

      for (const rawPath of Object.keys(zip.files)) {
        if (rawPath.endsWith('.kaiso_tab_meta.json')) {
          try {
            const content = await zip.files[rawPath].async('string');
            const parsed = JSON.parse(content);
            const dbName = rawPath.replace(/\\/g, '/').split('/')[0];
            dbMetaMap.set(dbName, parsed);
          } catch (e) {}
        }
      }

      const dbMap = new Map<string, {
        name: string;
        tabFolders: TabFolder[];
        notebookMap: Map<string, Notebook>;
        folderMap: Map<string, string>;
        nodes: Record<string, TreeNode>;
        sentenceBookmarks: any[];
        tags: any[];
        figureCaptions: any[];
      }>();

      const getDb = (dbName: string) => {
        if (!dbMap.has(dbName)) {
          const meta = dbMetaMap.get(dbName);
          dbMap.set(dbName, {
            name: dbName,
            tabFolders: meta?.tabFolders ? [...meta.tabFolders] : [],
            notebookMap: new Map(),
            folderMap: new Map(),
            nodes: {},
            sentenceBookmarks: meta?.sentenceBookmarks ? [...meta.sentenceBookmarks] : [],
            tags: meta?.tags ? [...meta.tags] : [...INITIAL_TAGS],
            figureCaptions: meta?.figureCaptions ? [...meta.figureCaptions] : [],
          });
        }
        return dbMap.get(dbName)!;
      };

      const getNotebook = (dbEntry: ReturnType<typeof getDb>, nbName: string, folderId: string | null) => {
        if (!dbEntry.notebookMap.has(nbName)) {
          const meta = dbMetaMap.get(dbEntry.name);
          const nbMeta = meta?.notebooks.find(n => n.name === nbName || sanitize(n.name) === nbName);
          const nbId = nbMeta?.id || ('nb-' + Math.random().toString(36).substr(2, 9));
          dbEntry.notebookMap.set(nbName, {
            id: nbId,
            name: nbName,
            color: nbMeta?.color || '#3b82f6',
            bgClass: nbMeta?.bgClass || 'bg-blue-500',
            borderClass: nbMeta?.borderClass || 'border-blue-600',
            description: nbMeta?.description || '',
            folderId: nbMeta !== undefined ? nbMeta.folderId : folderId,
            nodeIds: [],
          });
        }
        return dbEntry.notebookMap.get(nbName)!;
      };

      // Markdown + Rich HTML Lossless Parser
      const parseMarkdownContent = (rawText: string): { 
        richHtml: string; 
        frontMatter?: any; 
        tags?: string[]; 
        bookmarks?: any[];
      } => {
        if (!rawText) return { richHtml: '<p></p>' };
        
        let frontMatter: any = null;
        let body = rawText;

        // 1. Extract YAML / JSON front-matter between --- markers
        const fmMatch = rawText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n*([\s\S]*)$/);
        if (fmMatch) {
          try {
            frontMatter = JSON.parse(fmMatch[1]);
            body = fmMatch[2];
          } catch (e) {
            try {
              const lines = fmMatch[1].split(/\r?\n/);
              const obj: any = {};
              lines.forEach((l) => {
                const parts = l.split(':');
                if (parts.length >= 2) {
                  const k = parts[0].trim();
                  const v = parts.slice(1).join(':').trim().replace(/^["']|["']$/g, '');
                  obj[k] = v;
                }
              });
              frontMatter = obj;
              body = fmMatch[2];
            } catch (e2) {}
          }
        }

        // 2. Extract standard markdown footnote definitions: [^1]: text
        const fnMap = new Map<string, string>();
        const lines = body.split(/\r?\n/);
        const nonFnLines: string[] = [];
        let insideFootnoteSection = false;

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '---' || trimmed === '### 脚注・注釈' || trimmed === '## 脚注') {
            insideFootnoteSection = true;
            continue;
          }
          const fnDefMatch = trimmed.match(/^\[\^(\d+)\]:\s*(.+)$/);
          if (fnDefMatch) {
            fnMap.set(fnDefMatch[1], fnDefMatch[2]);
            continue;
          }
          if (!insideFootnoteSection) {
            nonFnLines.push(line);
          }
        }

        const cleanBody = nonFnLines.join('\n').trim();

        // 3. Convert markdown body to richHtml:
        let htmlResult = '';
        const hasHtmlTags = /<([a-z]+[1-6]?)\b[^>]*>/i.test(cleanBody);

        if (hasHtmlTags) {
          htmlResult = cleanBody;
        } else {
          const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const bodyLines = cleanBody.split(/\r?\n/);
          const parts: string[] = [];
          let inList = false;
          for (const bl of bodyLines) {
            const tr = bl.trim();
            if (!tr) {
              if (inList) { parts.push('</ul>'); inList = false; }
              continue;
            }
            if (tr.startsWith('# ')) {
              if (inList) { parts.push('</ul>'); inList = false; }
              parts.push(`<h1>${escape(tr.slice(2))}</h1>`);
            } else if (tr.startsWith('## ')) {
              if (inList) { parts.push('</ul>'); inList = false; }
              parts.push(`<h2>${escape(tr.slice(3))}</h2>`);
            } else if (tr.startsWith('### ')) {
              if (inList) { parts.push('</ul>'); inList = false; }
              parts.push(`<h3>${escape(tr.slice(4))}</h3>`);
            } else if (tr.startsWith('- ')) {
              if (!inList) { parts.push('<ul>'); inList = true; }
              parts.push(`<li>${escape(tr.slice(2))}</li>`);
            } else {
              if (inList) { parts.push('</ul>'); inList = false; }
              parts.push(`<p>${tr}</p>`);
            }
          }
          if (inList) parts.push('</ul>');
          htmlResult = parts.join('');
        }

        // 4. Link footnote references: replace [^1] with interactive footnote badges if not already sup
        if (fnMap.size > 0) {
          fnMap.forEach((fnText, fnNum) => {
            const fnRegex = new RegExp(`\\[\\^${fnNum}\\]`, 'g');
            const uid = `fn-${Date.now()}-${fnNum}-${Math.random().toString(36).substr(2, 5)}`;
            const fnBadge = createFootnoteHtml(fnText, uid);
            htmlResult = htmlResult.replace(fnRegex, fnBadge);
          });

          // Ensure footnotes section is present
          if (!htmlResult.includes('footnotes-section') && !htmlResult.includes('footnotes-list')) {
            const fnItems = Array.from(fnMap.entries())
              .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
              .map(([num, text]) => `<li id="footnote-${num}" data-fn-id="fn-${num}"><p>${text} <a href="#footnote-ref-${num}" class="footnote-backref">↑</a></p></li>`)
              .join('');
            htmlResult += `<div class="footnotes-section mt-8 pt-4 border-t border-slate-300 text-xs text-slate-600"><div class="font-bold mb-2">脚注・注釈:</div><ol class="footnotes-list list-decimal pl-5 space-y-1">${fnItems}</ol></div>`;
          }
        }

        return {
          richHtml: htmlResult,
          frontMatter,
          tags: Array.isArray(frontMatter?.tags) ? frontMatter.tags : [],
          bookmarks: Array.isArray(frontMatter?.bookmarks) ? frontMatter.bookmarks : [],
        };
      };

      const fileNames = Object.keys(zip.files).sort((a, b) => a.localeCompare(b));
      const demoTabFolderNames = new Set(['📘 ガイド・仕様書', '🌱 ライフ・ヘルス', '💻 開発・機能検証', '🛠️ 応用機能・ツール']);

      for (const rawPath of fileNames) {
        if (rawPath.includes('__MACOSX') || rawPath.endsWith('.DS_Store') || rawPath.endsWith('Thumbs.db') || rawPath.endsWith('.kaiso_tab_meta.json')) continue;
        const entry = zip.files[rawPath];
        const normalized = rawPath.replace(/\\/g, '/');
        const segments = normalized.split('/').filter(Boolean);

        if (segments.length <= 1) continue;

        const dbName = segments[0];
        const dbEntry = getDb(dbName);
        const meta = dbMetaMap.get(dbName);
        const isDemo = dbName.includes('DEMO');

        // Determine TabFolder path, Notebook name, and Node folders
        let tabFolderNames: string[] = [];
        let nbName = '';
        let nodeFolderNames: string[] = [];
        let fileName: string | null = null;

        if (meta?.notebooks && meta.notebooks.length > 0) {
          const nbIdx = segments.findIndex((seg, idx) => idx >= 1 && meta.notebooks.some(n => n.name === seg || sanitize(n.name) === seg));
          if (nbIdx >= 1) {
            tabFolderNames = segments.slice(1, nbIdx);
            nbName = segments[nbIdx];
            nodeFolderNames = segments.slice(nbIdx + 1, entry.dir ? segments.length : segments.length - 1);
            if (!entry.dir) fileName = segments[segments.length - 1];
          }
        }

        if (!nbName) {
          if (isDemo) {
            if (segments.length >= 4 && demoTabFolderNames.has(segments[2])) {
              tabFolderNames = [segments[1], segments[2]];
              nbName = segments[3];
              nodeFolderNames = segments.slice(4, entry.dir ? segments.length : segments.length - 1);
              if (!entry.dir) fileName = segments[segments.length - 1];
            } else if (segments.length >= 3 && demoTabFolderNames.has(segments[1])) {
              tabFolderNames = [segments[1]];
              nbName = segments[2];
              nodeFolderNames = segments.slice(3, entry.dir ? segments.length : segments.length - 1);
              if (!entry.dir) fileName = segments[segments.length - 1];
            } else {
              nbName = segments[1];
              nodeFolderNames = segments.slice(2, entry.dir ? segments.length : segments.length - 1);
              if (!entry.dir) fileName = segments[segments.length - 1];
            }
          } else {
            const isRootNotebook = (segments.length === 2) || (segments.length === 3 && !entry.dir && segments[2].endsWith('.md')) || (segments[1] === 'マイノート');
            if (isRootNotebook) {
              tabFolderNames = [];
              nbName = segments[1];
              nodeFolderNames = segments.slice(2, entry.dir ? segments.length : segments.length - 1);
              if (!entry.dir) fileName = segments[segments.length - 1];
            } else {
              tabFolderNames = [segments[1]];
              if (segments.length >= 3) {
                nbName = segments[2];
                nodeFolderNames = segments.slice(3, entry.dir ? segments.length : segments.length - 1);
                if (!entry.dir) fileName = segments[segments.length - 1];
              } else {
                let currentTabFolderId: string | null = null;
                for (const tfName of tabFolderNames) {
                  let foundTf = dbEntry.tabFolders.find(f => f.name === tfName && f.parentId === currentTabFolderId);
                  if (!foundTf) {
                    foundTf = {
                      id: 'tf-' + Math.random().toString(36).substr(2, 9),
                      name: tfName,
                      parentId: currentTabFolderId,
                      color: '#3b82f6',
                    };
                    dbEntry.tabFolders.push(foundTf);
                  }
                  currentTabFolderId = foundTf.id;
                }
                continue;
              }
            }
          }
        }

        if (!nbName) continue;

        // Reconstruct TabFolders in database
        let currentTabFolderId: string | null = null;
        for (const tfName of tabFolderNames) {
          let foundTf = dbEntry.tabFolders.find(f => f.name === tfName && f.parentId === currentTabFolderId);
          if (!foundTf) {
            foundTf = {
              id: 'tf-' + Math.random().toString(36).substr(2, 9),
              name: tfName,
              parentId: currentTabFolderId,
              color: '#3b82f6',
            };
            dbEntry.tabFolders.push(foundTf);
          }
          currentTabFolderId = foundTf.id;
        }

        // Reconstruct Notebook
        const notebook = getNotebook(dbEntry, nbName, currentTabFolderId);

        if (entry.dir && nodeFolderNames.length === 0) {
          continue;
        }

        // Reconstruct intermediate note folders inside notebook
        let currentParentId: string | null = null;
        let folderPathKey = '';
        for (const folderName of nodeFolderNames) {
          folderPathKey += (folderPathKey ? '/' : '') + folderName;
          const fullKey = `${notebook.id}:${folderPathKey}`;

          if (!dbEntry.folderMap.has(fullKey)) {
            const folderId = 'fld-' + Math.random().toString(36).substr(2, 9);
            const folderNode: TreeNode = {
              id: folderId,
              notebookId: notebook.id,
              parentId: currentParentId,
              title: folderName,
              isFolder: true,
              children: [],
              type: 'rich',
              tags: [],
              created: new Date().toISOString().split('T')[0],
              updated: new Date().toISOString().split('T')[0],
              content: {},
            };
            dbEntry.nodes[folderId] = folderNode;
            dbEntry.folderMap.set(fullKey, folderId);
            
            if (currentParentId && dbEntry.nodes[currentParentId]) {
              const parentNode = dbEntry.nodes[currentParentId];
              if (!parentNode.children) parentNode.children = [];
              if (!parentNode.children.includes(folderId)) {
                parentNode.children.push(folderId);
              }
              parentNode.isFolder = true;
            } else if (currentParentId === null) {
              if (!notebook.nodeIds.includes(folderId)) {
                notebook.nodeIds.push(folderId);
              }
            }
            currentParentId = folderId;
          } else {
            currentParentId = dbEntry.folderMap.get(fullKey)!;
          }
        }

        // Process file (.md, .json, etc.)
        if (!entry.dir && fileName) {
          const rawText = await entry.async('string');

          if (fileName === '_content.md' && currentParentId && dbEntry.nodes[currentParentId]) {
            const parsed = parseMarkdownContent(rawText);
            dbEntry.nodes[currentParentId].content = { richHtml: parsed.richHtml };
            continue;
          }

          const noteTitle = fileName.replace(/\.md$/i, '');
          let noteType: NoteType = 'rich';
          let noteContent: TreeNode['content'] = {};

          let parsedJson: any = null;
          if (rawText.trim().startsWith('{') && rawText.trim().endsWith('}')) {
            try {
              parsedJson = JSON.parse(rawText.trim());
            } catch (e) {}
          }

          const parsedMd = parseMarkdownContent(rawText);

          if (parsedJson && parsedJson.spreadsheet) {
            noteType = 'spreadsheet';
            noteContent = parsedJson;
          } else if (parsedJson && parsedJson.bookmarks) {
            noteType = 'bookmark';
            noteContent = parsedJson;
          } else if (rawText.trim().startsWith('```')) {
            const codeMatch = rawText.trim().match(/^```([a-zA-Z0-9_\-#+]*)\r?\n([\s\S]*?)```$/);
            if (codeMatch) {
              noteType = 'code';
              noteContent = {
                code: {
                  language: codeMatch[1] || 'python',
                  code: codeMatch[2],
                },
              };
            } else {
              noteType = 'rich';
              noteContent = { richHtml: parsedMd.richHtml };
            }
          } else {
            noteType = 'rich';
            noteContent = { richHtml: parsedMd.richHtml };
          }

          const noteId = parsedMd.frontMatter?.id || ('node-' + Math.random().toString(36).substr(2, 9));
          const noteNode: TreeNode = {
            id: noteId,
            notebookId: notebook.id,
            parentId: currentParentId,
            title: parsedMd.frontMatter?.title || noteTitle,
            isFolder: false,
            children: [],
            type: noteType,
            tags: parsedMd.tags && parsedMd.tags.length > 0 ? parsedMd.tags : [],
            created: parsedMd.frontMatter?.created || new Date().toISOString().split('T')[0],
            updated: parsedMd.frontMatter?.updated || new Date().toISOString().split('T')[0],
            content: noteContent,
          };
          dbEntry.nodes[noteId] = noteNode;

          // Connect bookmarks from note front-matter
          if (parsedMd.bookmarks && parsedMd.bookmarks.length > 0) {
            parsedMd.bookmarks.forEach((bm: any) => {
              if (!dbEntry.sentenceBookmarks.some((e) => e.id === bm.id)) {
                dbEntry.sentenceBookmarks.push({
                  id: bm.id || ('bm-' + Math.random().toString(36).substr(2, 9)),
                  nodeId: noteId,
                  notebookId: notebook.id,
                  noteTitle: noteNode.title,
                  text: bm.text || '',
                  anchorId: bm.anchorId || `bm-anchor-${Date.now()}`,
                  createdAt: bm.createdAt || new Date().toISOString().split('T')[0],
                  color: bm.color || '#f59e0b',
                  comment: bm.comment,
                });
              }
            });
          }

          // Connect to parent folder
          if (currentParentId && dbEntry.nodes[currentParentId]) {
            const parentNode = dbEntry.nodes[currentParentId];
            if (!parentNode.children) parentNode.children = [];
            if (!parentNode.children.includes(noteId)) {
              parentNode.children.push(noteId);
            }
            parentNode.isFolder = true;
          } else if (currentParentId === null) {
            if (!notebook.nodeIds.includes(noteId)) {
              notebook.nodeIds.push(noteId);
            }
          }
        }
      }

      if (dbMap.size === 0) {
        alert('ZIP内に有効なデータベースまたはノートデータが見つかりませんでした。');
        return;
      }

      // Post-process tree hierarchy validation & parent-child synchronization pass
      dbMap.forEach((entry) => {
        const nodes = entry.nodes;
        Object.values(nodes).forEach((n) => {
          if (!n.children) n.children = [];
          if (n.parentId && nodes[n.parentId]) {
            const p = nodes[n.parentId];
            if (!p.children) p.children = [];
            if (!p.children.includes(n.id)) {
              p.children.push(n.id);
            }
            p.isFolder = true;
          } else if (n.parentId === null) {
            const nb = Array.from(entry.notebookMap.values()).find((x) => x.id === n.notebookId);
            if (nb && !nb.nodeIds.includes(n.id)) {
              nb.nodeIds.push(n.id);
            }
          }
          if (n.children.length > 0) {
            n.isFolder = true;
          }
        });
      });

      const importedDbs: DatabaseProfile[] = [];
      dbMap.forEach((entry) => {
        const nbs = Array.from(entry.notebookMap.values());
        const firstNodeId = Object.keys(entry.nodes)[0] || null;
        importedDbs.push({
          id: 'db-' + Math.random().toString(36).substr(2, 9),
          name: entry.name,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
          isDemo: false,
          notebooks: nbs,
          nodes: entry.nodes,
          tags: entry.tags && entry.tags.length > 0 ? entry.tags : INITIAL_TAGS,
          tabFolders: entry.tabFolders,
          sentenceBookmarks: entry.sentenceBookmarks || [],
          figureCaptions: entry.figureCaptions || [],
          activeNotebookId: nbs[0]?.id || '',
          activeNodeId: firstNodeId,
        });
      });

      const totalNotes = importedDbs.reduce((acc, d) => acc + Object.keys(d.nodes).length, 0);
      const totalTabFolders = importedDbs.reduce((acc, d) => acc + (d.tabFolders?.length || 0), 0);
      if (!confirm(`ZIPファイルから ${importedDbs.length} 件のデータベース（計 ${totalTabFolders} 件のタブフォルダ、${totalNotes} 件のフォルダ・ノート）を検出しました。\n\n既存のデータベースと統合して復元しますか？`)) {
        return;
      }

      const mergedList = [...databases];
      importedDbs.forEach((impDb) => {
        const existingIdx = mergedList.findIndex((d) => d.name === impDb.name);
        if (existingIdx >= 0) {
          const existing = mergedList[existingIdx];
          
          // Merge tabFolders
          const mergedTabFolders = [...(existing.tabFolders || [])];
          (impDb.tabFolders || []).forEach(tf => {
            if (!mergedTabFolders.some(e => e.id === tf.id || e.name === tf.name)) {
              mergedTabFolders.push(tf);
            }
          });

          // Merge notebooks
          const newNotebooks = [...existing.notebooks];
          impDb.notebooks.forEach((nb) => {
            const existingNb = newNotebooks.find((e) => e.name === nb.name);
            if (!existingNb) {
              newNotebooks.push(nb);
            } else if (!existingNb.folderId && nb.folderId) {
              existingNb.folderId = nb.folderId;
            }
          });

          mergedList[existingIdx] = {
            ...existing,
            tabFolders: mergedTabFolders,
            notebooks: newNotebooks,
            nodes: { ...existing.nodes, ...impDb.nodes },
            sentenceBookmarks: [
              ...(existing.sentenceBookmarks || []),
              ...(impDb.sentenceBookmarks || []).filter(bm => !(existing.sentenceBookmarks || []).some(e => e.id === bm.id))
            ],
            tags: [
              ...(existing.tags || []),
              ...(impDb.tags || []).filter(t => !(existing.tags || []).some(e => e.id === t.id || e.name === t.name))
            ],
            figureCaptions: [
              ...(existing.figureCaptions || []),
              ...(impDb.figureCaptions || []).filter(fc => !(existing.figureCaptions || []).some(e => e.id === fc.id))
            ],
            updatedAt: new Date().toISOString().split('T')[0],
          };
        } else {
          mergedList.push(impDb);
        }
      });

      // Single Storage: Immediate physical commit exclusively to IndexedDB
      setDatabases(mergedList);
      await localforage.setItem('hierarchical_databases', mergedList);

      const activeUpdated = mergedList.find((d) => d.id === activeDatabaseId);
      if (activeUpdated) {
        setTabFolders(activeUpdated.tabFolders || []);
        setNotebooks(activeUpdated.notebooks);
        setNodes(activeUpdated.nodes);
        if (activeUpdated.sentenceBookmarks) {
          setSentenceBookmarks(activeUpdated.sentenceBookmarks);
        }
      }

      alert('ZIPファイルからのデータ復元（タブフォルダ、注釈、修飾、ブックマークを含む）が正常に完了しました！');
    } catch (err) {
      console.error(err);
      alert('ZIPファイルの読み込み・復元中にエラーが発生しました。');
    }
  };

  // Determine display name for active 階層1 folder
  const getTabFolderDisplayName = (folderId: string | null): string => {
    if (!folderId) return '未分類';
    const folder = tabFolders.find((f) => f.id === folderId);
    if (!folder) return '未分類';
    if (folder.parentId) {
      const parent = tabFolders.find((f) => f.id === folder.parentId);
      if (parent) {
        return `${parent.name} / ${folder.name}`;
      }
    }
    return folder.name;
  };

  const currentSelectedNotebook = notebooks.find((nb) => nb.id === activeNotebookId);
  const activeTabFolderDisplayName = getTabFolderDisplayName(
    activeTabFolderId || currentSelectedNotebook?.folderId || null
  );

  return (
    <div id="hierarchical-app-root" className="h-screen w-screen flex flex-col overflow-hidden bg-[#efebe4] font-sans text-stone-900">
      {/* 1. Word-Style Ribbon Interface (ホーム / 挿入 / レイアウト / ツール / ヘルプ) */}
      <RibbonBar
        activeRibbonTab={activeRibbonTab}
        onChangeRibbonTab={setActiveRibbonTab}
        isRibbonMinimized={Boolean(systemSettings.ribbonMinimized)}
        onToggleRibbonMinimized={handleToggleRibbonMinimized}
        activeNotebookName={activeNotebook?.name || 'Notebook'}
        activeNoteTitle={activeNode?.title}
        activeNoteType={activeNode?.type}
        isSaving={isSaving}
        onSave={handleSave}
        onNewNote={() => handleAddChildNode(null)}
        onNewFolder={handleNewFolder}
        databases={databases}
        activeDatabaseId={activeDatabaseId}
        activeDatabaseName={currentDb?.name || 'DEMO（デモデータ）'}
        onSelectDatabase={handleSelectDatabase}
        onOpenCreateDatabase={() => setIsCreateDbOpen(true)}
        onOpenDatabaseManager={() => setIsDbManagerOpen(true)}
        onApplyFormat={handleApplyFormat}
        onInsertImage={handleOpenInsertImage}
        onInsertTable={handleInsertTable}
        onInsertCallout={handleInsertCallout}
        onInsertLink={handleInsertLink}
        onInsertFootnote={handleOpenInsertFootnote}
        onInsertFigureCaption={handleOpenInsertFigureCaption}
        onInsertBookmarkCard={handleOpenInsertBookmarkCard}
        onInsertTextbox={handleInsertTextbox}
        showRuler={Boolean(systemSettings.showRuler)}
        onToggleRuler={() => handleUpdateSettingsPartial({ showRuler: !systemSettings.showRuler })}
        isHierarchy1Collapsed={isHierarchy1Collapsed}
        onToggleHierarchy1={() => setIsHierarchy1Collapsed(!isHierarchy1Collapsed)}
        isBookmarked={Boolean(activeNode?.isBookmarked)}
        onToggleBookmark={() => activeNodeId && handleToggleBookmark(activeNodeId)}
        onBookmarkSentence={handleBookmarkCurrentSentence}
        sentenceBookmarksCount={sentenceBookmarks.filter((b) => b.nodeId === activeNode?.id).length}
        onCopyFormat={handleCopyFormat}
        onPasteFormat={handlePasteFormat}
        onClearFormat={handleClearFormat}
        isFormatPainterActive={isFormatPainterActive}
        hasCopiedFormat={Boolean(copiedFormat)}
        copiedFormatSummary={copiedFormat ? formatStateToDescription(copiedFormat) : ''}
        characterStyles={characterStyles}
        paragraphStyles={paragraphStyles}
        activeStyleId={activeStyleId}
        onApplyStyle={handleApplyStyle}
        onCreateNewStyle={handleCreateNewStyle}
        onEditStyle={handleEditStyle}
        onDeleteStyle={handleDeleteStyle}
        onToggleHideStyle={handleToggleHideStyle}
        onResetDefaultStyles={handleResetDefaultStyles}
        onOpenFind={handleOpenFind}
        onOpenReplace={handleOpenReplace}
        onOpenGlobalSearch={handleOpenGlobalSearch}
        onOpenDocxImport={() => setIsDocxImportOpen(true)}
        onOpenOptions={() => setIsOptionsOpen(true)}
        onOpenSpecs={() => setIsSpecsOpen(true)}
        onOpenManual={() => setIsManualOpen(true)}
        onExportAllJson={handleExportAllJson}
        onImportAllJson={handleImportAllDatabases}
        onExportDataOnlyZip={handleExportDataOnlyZip}
        onImportDataOnlyZip={handleImportDataOnlyZip}
        onResetSampleData={handleResetDemoDatabase}
        onCleanAndOptimizeDatabase={handleCleanAndOptimizeDatabase}
        onOpenGitPushModal={() => setIsGitPushModalOpen(true)}
        onOpenErrorLog={() => setIsErrorLogOpen(true)}
        settings={systemSettings}
        onUpdateSettings={handleUpdateSettingsPartial}
      />

      {/* 2. Top Horizontal Tab Bar: Displays when tabPosition is 'top' */}
      {systemSettings.tabPosition === 'top' && (
        <NotebookTabBar
          notebooks={notebooks}
          tabFolders={tabFolders}
          activeFolderId={activeTabFolderId}
          activeNotebookId={activeNotebookId}
          openNotebookIds={openNotebookIds}
          onSelectNotebook={handleSelectNotebook}
          onSelectFolder={handleSelectTabFolder}
          onAddNotebook={handleAddNotebook}
          onDeleteNotebook={handleDeleteNotebook}
          onRenameNotebook={handleRenameNotebook}
          onCloseNotebooks={handleCloseNotebooks}
        />
      )}

      {/* 3. Main Workspace Multi-Panel Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Far Left: Tab List & Hierarchical Folder Management (タブ一覧・フォルダ階層管理) */}
        {showBirdEyeFolders && (
          <TabListPanel
            tabFolders={tabFolders}
            notebooks={notebooks}
            activeFolderId={activeTabFolderId}
            activeNotebookId={activeNotebookId}
            onSelectFolder={handleSelectTabFolder}
            onSelectNotebook={handleSelectNotebook}
            onCreateFolder={handleCreateTabFolder}
            onRenameFolder={handleRenameTabFolder}
            onDeleteFolder={handleDeleteTabFolder}
            onMoveFolder={handleMoveTabFolder}
            onAddNotebookToFolder={(folderId, name, color) => handleAddNotebook(name, color || '#e0f2fe', folderId)}
            onMoveNotebookToFolder={handleMoveNotebookToFolder}
            onDeleteNotebook={handleDeleteNotebook}
            onRestoreNotebooks={handleRestoreNotebooks}
            isCollapsed={isHierarchy1Collapsed}
            onToggleCollapse={() => setIsHierarchy1Collapsed(!isHierarchy1Collapsed)}
          />
        )}

        {/* Left: Hierarchical Outliner Tree */}
        <TreeSidebar
          nodes={notebookNodes}
          rootNodeIds={rootNodeIds}
          activeNodeId={activeNodeId}
          activeTabFolderName={activeTabFolderDisplayName}
          onSelectNode={handleSelectNode}
          onAddChildNode={handleAddChildNode}
          onDeleteNode={handleRequestDeleteNode}
          onRenameNode={handleRenameNode}
          onChangeNodeType={(id, type) => handleChangeNodeType(id, type)}
          onChangeColorBadge={(id, color) => handleChangeColorBadge(id, color)}
          onMoveNode={handleMoveNode}
          onReorderNode={handleReorderNode}
          onPromoteNode={handlePromoteNode}
          onDemoteNode={handleDemoteNode}
          selectedTagFilter={selectedTagFilter}
          onClearTagFilter={() => setSelectedTagFilter(null)}
          onToggleBookmark={handleToggleBookmark}
          isBookmarkFiltered={isBookmarkFiltered}
          onToggleBookmarkFilter={() => setIsBookmarkFiltered(!isBookmarkFiltered)}
          isHierarchy1Collapsed={isHierarchy1Collapsed}
          onToggleHierarchy1={() => setIsHierarchy1Collapsed(!isHierarchy1Collapsed)}
        />

        {/* Center: Main Multi-Mode Document Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* In-Tab Find & Replace Floating Toolbar */}
          <InTabFindReplaceBar
            isOpen={isFindBarOpen}
            isReplaceMode={isReplaceMode}
            onClose={() => setIsFindBarOpen(false)}
            onToggleReplaceMode={() => setIsReplaceMode(!isReplaceMode)}
            onOpenGlobalSearch={handleOpenGlobalSearch}
            activeNode={activeNode}
            onUpdateContent={(newContent) => {
              if (activeNode?.type === 'rich') {
                handleUpdateRichContent(newContent);
              } else if (activeNode?.type === 'code') {
                handleUpdateCode(activeNode.content.code?.language || 'python', newContent);
              }
            }}
          />

          {/* Desktop Margin Ruler Bar */}
          {systemSettings.showRuler && activeNode?.type === "rich" && <RulerBar />}

          {/* Dynamic Note Body Editor based on node type */}
          {activeNode ? (
            activeNode.type === 'rich' ? (
              <RichTextEditor
                node={activeNode}
                onUpdateContent={handleUpdateRichContent}
                onUpdateTitle={(title) => handleRenameNode(activeNode.id, title)}
                editorRef={richEditorRef}
                onOpenInsertFootnote={handleOpenInsertFootnote}
                isFormatPainterActive={isFormatPainterActive}
                onAutoApplyFormatPainter={handleAutoApplyFormatPainter}
                onCancelFormatPainter={handleCancelFormatPainter}
                copiedFormatSummary={copiedFormat ? formatStateToDescription(copiedFormat) : ''}
                settings={systemSettings}
                onOpenOptions={() => setIsOptionsOpen(true)}
              />
            ) : activeNode.type === 'spreadsheet' ? (
              <SpreadsheetEditor
                node={activeNode}
                onUpdateSpreadsheet={handleUpdateSpreadsheet}
                onUpdateTitle={(title) => handleRenameNode(activeNode.id, title)}
                onActiveCellChange={(coord) => setActiveCellCoord(coord)}
              />
            ) : activeNode.type === 'code' ? (
              <SourceCodeEditor
                node={activeNode}
                onUpdateCode={handleUpdateCode}
                onUpdateTitle={(title) => handleRenameNode(activeNode.id, title)}
              />
            ) : activeNode.type === 'bookmark' ? (
              <BookmarkEditor
                node={activeNode}
                onUpdateBookmarks={handleUpdateBookmarks}
                onUpdateTitle={(title) => handleRenameNode(activeNode.id, title)}
              />
            ) : (
              <EncryptedNoteEditor
                node={activeNode}
                onUpdateContent={handleUpdateEncrypted}
                onUpdateTitle={(title) => handleRenameNode(activeNode.id, title)}
                settings={systemSettings}
              />
            )
          ) : (
            <div className="flex-1 flex items-center justify-center text-stone-400 text-xs">
              Select or create a note from the tree to begin editing.
            </div>
          )}
        </div>

        {/* Right: Resource Panel (Search, Tags, Bookmarks, History, Scratch, Footnotes) */}
        <ResourcePanel
          tags={tags}
          nodes={nodes}
          activeNode={activeNode}
          history={history}
          notebooks={notebooks}
          activeNotebookId={activeNotebookId}
          activeTab={resourcePanelTab}
          onTabChange={setResourcePanelTab}
          onSelectNode={handleSelectNode}
          onToggleTagOnActiveNode={handleToggleTagOnActiveNode}
          onFilterTreeByTag={(tag) => setSelectedTagFilter(tag)}
          selectedTagFilter={selectedTagFilter}
          onAddTag={handleAddTag}
          onToggleBookmark={handleToggleBookmark}
          onClearAllBookmarks={handleClearAllBookmarks}
          isBookmarkFiltered={isBookmarkFiltered}
          onToggleBookmarkFilter={() => setIsBookmarkFiltered(!isBookmarkFiltered)}
          sentenceBookmarks={sentenceBookmarks}
          figureCaptions={figureCaptions}
          onSelectSentenceBookmark={handleSelectSentenceBookmark}
          onDeleteSentenceBookmark={handleDeleteSentenceBookmark}
          onUpdateSentenceBookmark={handleUpdateSentenceBookmark}
          onEditFigureCaption={handleEditFigureCaption}
          onDeleteFigureCaption={handleDeleteFigureCaption}
        />
      </div>

      {/* 4. Bottom Horizontal Tab Bar: Displays when tabPosition is 'bottom' (Initial / Default value) */}
      {(!systemSettings.tabPosition || systemSettings.tabPosition === 'bottom') && (
        <NotebookTabBar
          notebooks={notebooks}
          tabFolders={tabFolders}
          activeFolderId={activeTabFolderId}
          activeNotebookId={activeNotebookId}
          openNotebookIds={openNotebookIds}
          onSelectNotebook={handleSelectNotebook}
          onSelectFolder={handleSelectTabFolder}
          onAddNotebook={handleAddNotebook}
          onDeleteNotebook={handleDeleteNotebook}
          onRenameNotebook={handleRenameNotebook}
          onCloseNotebooks={handleCloseNotebooks}
        />
      )}

      {/* 5. Bottom Status & Tags Bar */}
      <StatusBar
        activeNode={activeNode}
        totalNodeCount={allNotebookNodeIds.length}
        activeNodeIndex={activeNodeIndex}
        activeCellCoord={activeCellCoord}
        onTagClick={(tag) => setSelectedTagFilter(tag)}
        onOpenErrorLog={() => setIsErrorLogOpen(true)}
        settings={systemSettings}
        onDeleteStyle={handleDeleteStyle}
      />

      {/* Real-time Error Notification Toast */}
      <ErrorToast onOpenLog={() => setIsErrorLogOpen(true)} />

      {/* Restore Modal */}
      <RestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onConfirm={executeRestore}
        restoreCandidates={restoreCandidates}
        tabFolders={tabFolders}
      />
      
      {/* Safe In-App Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={nodeToDelete !== null}
        title={nodeToDelete?.title || ''}
        count={nodeToDelete?.count || 1}
        onConfirm={handleConfirmDeleteNode}
        onCancel={() => setNodeToDelete(null)}
      />

      {/* User Operation Manual Modal */}
      <UserManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        onOpenSpecs={() => setIsSpecsOpen(true)}
      />

      {/* Specifications & System Design Document Modal */}
      <SpecsDocModal
        isOpen={isSpecsOpen}
        onClose={() => setIsSpecsOpen(false)}
      />

      {/* New Database Creation Modal (Specifying DB name first) */}
      <CreateDatabaseModal
        isOpen={isCreateDbOpen}
        onClose={() => setIsCreateDbOpen(false)}
        onCreate={handleCreateDatabase}
        currentDbName={currentDb?.name}
      />

      {/* Database Management & Switcher Modal */}
      <DatabaseManagerModal
        isOpen={isDbManagerOpen}
        onClose={() => setIsDbManagerOpen(false)}
        databases={databases}
        activeDatabaseId={activeDatabaseId}
        onSelectDatabase={handleSelectDatabase}
        onOpenCreateModal={() => setIsCreateDbOpen(true)}
        onRenameDatabase={handleRenameDatabase}
        onUpdateStorageLocation={handleUpdateStorageLocation}
        onDeleteDatabase={handleDeleteDatabase}
        onResetDemoDatabase={handleResetDemoDatabase}
        onImportDatabase={handleImportDatabase}
        onExportAllDatabases={handleExportAllDatabases}
        onImportAllDatabases={handleImportAllDatabases}
        onImportDataOnlyZip={handleImportDataOnlyZip}
        onBatchDeleteDatabases={handleBatchDeleteDatabases}
        onClearAllDatabases={handleClearAllDatabases}
        onRestoreNotebooks={handleRestoreNotebooks}
      />

      {/* Wikipedia-Style Footnote Insertion Modal */}
      <InsertFootnoteModal
        isOpen={isInsertFootnoteOpen}
        onClose={() => setIsInsertFootnoteOpen(false)}
        onInsert={handleInsertFootnote}
        currentCount={
          richEditorRef.current
            ? richEditorRef.current.querySelectorAll('.footnote-ref, [data-fn-id]').length
            : 0
        }
      />

      {/* Web Bookmark Card Insertion Modal */}
      <InsertBookmarkCardModal
        isOpen={isInsertBookmarkCardOpen}
        onClose={() => setIsInsertBookmarkCardOpen(false)}
        onInsert={handleInsertBookmarkCard}
      />

      {/* Insert Figure Caption Modal */}
      <InsertFigureCaptionModal
        isOpen={isInsertFigureCaptionOpen}
        onClose={() => setIsInsertFigureCaptionOpen(false)}
        onInsert={handleInsertFigureCaption}
        targets={figureTargets}
      />

      {/* Insert Image Modal (画像挿入: ファイル/Web URL) */}
      <InsertImageModal
        isOpen={isInsertImageOpen}
        onClose={() => setIsInsertImageOpen(false)}
        onConfirmInsert={handleConfirmInsertImage}
      />

      {/* Character & Paragraph Style Registration/Edit Modal */}
      <StyleEditModal
        isOpen={isStyleModalOpen}
        editingStyle={editingStyle}
        defaultCategory={defaultStyleCategory}
        onSave={handleSaveStyle}
        onClose={() => {
          setIsStyleModalOpen(false);
          setEditingStyle(null);
        }}
        settings={systemSettings}
      />

      {/* Database Global Search Modal (ＤＢ内全体検索) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        nodes={nodes}
        notebooks={notebooks}
        activeNotebookId={activeNotebookId}
        onSelectNode={handleSelectNodeFromGlobalSearch}
        initialQuery={globalSearchInitialQuery}
      />

      {/* DOCX File Import Modal (DOCXインポート・階層プレビュー) */}
      <DocxImportModal
        isOpen={isDocxImportOpen}
        onClose={() => setIsDocxImportOpen(false)}
        tabFolders={tabFolders}
        activeTabFolderId={activeTabFolderId}
        onConfirmImport={handleConfirmDocxImport}
        onConfirmBatchImport={handleConfirmBatchDocxImport}
      />

      {/* System Options & Typography / Wrap Configuration Modal (システムオプション) */}
      <SystemOptionsModal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        settings={systemSettings}
        onSaveSettings={handleSaveSystemSettings}
      />

      {/* System Error & Activity Log Diagnostics Modal */}
      <ErrorLogModal
        isOpen={isErrorLogOpen}
        onClose={() => setIsErrorLogOpen(false)}
      />

      {/* GitHub Remote Sync & Push Modal */}
      <GitPushModal
        isOpen={isGitPushModalOpen}
        onClose={() => setIsGitPushModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [initialDatabases, setInitialDatabases] = useState<DatabaseProfile[]>([]);
  const [initialActiveDatabaseId, setInitialActiveDatabaseId] = useState<string>('');

  useEffect(() => {
    async function loadDb() {
      try {
        let dbs = [INITIAL_DEMO_DB];
        let activeId = 'demo';

        // 1. Try localforage (IndexedDB)
        const savedDbs = await localforage.getItem<DatabaseProfile[]>('hierarchical_databases');
        if (savedDbs && Array.isArray(savedDbs) && savedDbs.length > 0) {
          dbs = savedDbs;
          activeId = (await localforage.getItem<string>('hierarchical_active_db_id')) || dbs[0].id;
        } else {
          // 2. Fallback to localStorage
          const legacySaved = localStorage.getItem('hierarchical_databases');
          if (legacySaved) {
            try {
              const parsed = JSON.parse(legacySaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                dbs = parsed;
                activeId = localStorage.getItem('hierarchical_active_db_id') || dbs[0].id;
                // Migrate to localforage
                await localforage.setItem('hierarchical_databases', dbs);
                await localforage.setItem('hierarchical_active_db_id', activeId);
              }
            } catch(e) {}
          } else {
            // 3. Fallback to legacy single db
            const legacyNotebooks = localStorage.getItem('hierarchical_notebooks');
            const legacyNodes = localStorage.getItem('hierarchical_nodes');
            const legacyTags = localStorage.getItem('hierarchical_tags');
            
            if (legacyNotebooks && legacyNodes) {
              try {
                const nbs = JSON.parse(legacyNotebooks);
                const nds = JSON.parse(legacyNodes);
                const tgs = legacyTags ? JSON.parse(legacyTags) : INITIAL_TAGS;
                dbs = [{
                  id: 'demo',
                  name: 'DEMO（移行データ）',
                  createdAt: '2026-08-24',
                  updatedAt: new Date().toISOString().split('T')[0],
                  isDemo: true,
                  tabFolders: INITIAL_TAB_FOLDERS,
                  notebooks: nbs,
                  nodes: nds,
                  tags: tgs,
                  sentenceBookmarks: INITIAL_SENTENCE_BOOKMARKS,
                  figureCaptions: [],
                  activeNotebookId: nbs[0]?.id || 'recipes',
                  activeNodeId: Object.keys(nds)[0] || 'rec-vegetable',
                }];
                activeId = 'demo';
                await localforage.setItem('hierarchical_databases', dbs);
                await localforage.setItem('hierarchical_active_db_id', activeId);
              } catch(e) {}
            }
          }
        }
        
        // Pure Single-Storage: Purge redundant database blobs from localStorage to prevent double-saving & free up space
        try {
          localStorage.removeItem('hierarchical_databases');
          localStorage.removeItem('hierarchical_notebooks');
          localStorage.removeItem('hierarchical_nodes');
          localStorage.removeItem('hierarchical_tags');
          localStorage.removeItem('hierarchical_active_db_id');
        } catch (e) {}

        setInitialDatabases(dbs);
        setInitialActiveDatabaseId(activeId);
        setIsDbReady(true);
      } catch (e) {
        console.error("Database load error:", e);
        setInitialDatabases([INITIAL_DEMO_DB]);
        setInitialActiveDatabaseId('demo');
        setIsDbReady(true);
      }
    }
    loadDb();
  }, []);

  if (!isDbReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-stone-50 text-stone-500 flex-col space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="font-semibold text-sm">データベースを読み込み中...</p>
      </div>
    );
  }

  return <MainApp initialDatabases={initialDatabases} initialActiveDatabaseId={initialActiveDatabaseId} />;
}
