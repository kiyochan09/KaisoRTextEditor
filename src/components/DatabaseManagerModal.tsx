import React, { useState } from 'react';
import { DatabaseProfile, TreeNode, TabFolder } from '../types';
import JSZip from 'jszip';
import { parseAndRenumberHtml } from '../utils/footnoteUtils';
import { 
  Database, Plus, Trash2, Edit2, Check, X, RefreshCw, 
  FolderTree, Calendar, Layers, ShieldCheck, Copy, ArrowRight,
  Folder, HardDrive, Laptop, FolderOpen, Upload, Download, FileText, AlertTriangle, LifeBuoy
} from 'lucide-react';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  databases: DatabaseProfile[];
  activeDatabaseId: string;
  onSelectDatabase: (dbId: string) => void;
  onOpenCreateModal: () => void;
  onRenameDatabase: (dbId: string, newName: string) => void;
  onUpdateStorageLocation: (dbId: string, location: string, path: string) => void;
  onDeleteDatabase: (dbId: string) => void;
  onResetDemoDatabase: () => void;
  onImportDatabase?: (file: File) => void;
  onExportAllDatabases?: () => void;
  onImportAllDatabases?: (file: File) => void;
  onImportDataOnlyZip?: (file: File) => void;
  onBatchDeleteDatabases?: (dbIds: string[]) => void;
  onClearAllDatabases?: () => void;
  onRestoreNotebooks?: () => void;
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
  isOpen,
  onClose,
  databases,
  activeDatabaseId,
  onSelectDatabase,
  onOpenCreateModal,
  onRenameDatabase,
  onUpdateStorageLocation,
  onDeleteDatabase,
  onResetDemoDatabase,
  onImportDatabase,
  onExportAllDatabases,
  onImportAllDatabases,
  onImportDataOnlyZip,
  onBatchDeleteDatabases,
  onClearAllDatabases,
  onRestoreNotebooks,
}) => {
  const [editingDbId, setEditingDbId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  
  // Storage location editing state
  const [editingStorageDbId, setEditingStorageDbId] = useState<string | null>(null);
  const [editStoragePath, setEditStoragePath] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isExportingDataZip, setIsExportingDataZip] = useState<boolean>(false);
  const [selectedDbIds, setSelectedDbIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState<boolean>(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState<boolean>(false);

  if (!isOpen) return null;

  const startRename = (db: DatabaseProfile) => {
    setEditingDbId(db.id);
    setEditName(db.name);
  };

  const handleSaveRename = (dbId: string) => {
    if (editName.trim()) {
      onRenameDatabase(dbId, editName.trim());
    }
    setEditingDbId(null);
  };

  const startEditStorage = (db: DatabaseProfile) => {
    setEditingStorageDbId(db.id);
    setEditStoragePath(db.storagePath || db.storageLocation || '~/Documents/HierarchicalNotes/' + db.name);
  };

  const handleSaveStorage = (dbId: string) => {
    const trimmed = editStoragePath.trim();
    if (trimmed) {
      onUpdateStorageLocation(dbId, `ローカルフォルダ (${trimmed})`, trimmed);
    } else {
      onUpdateStorageLocation(dbId, 'ブラウザ内蔵セキュアデータベース (IndexedDB)', '');
    }
    setEditingStorageDbId(null);
  };

  // Batch delete operations
  const handleToggleSelectAll = () => {
    if (selectedDbIds.size === databases.length) {
      setSelectedDbIds(new Set());
    } else {
      setSelectedDbIds(new Set(databases.map((d) => d.id)));
    }
  };

  const handleToggleSelectDb = (dbId: string) => {
    setSelectedDbIds((prev) => {
      const next = new Set(prev);
      if (next.has(dbId)) {
        next.delete(dbId);
      } else {
        next.add(dbId);
      }
      return next;
    });
  };

  const handleExecuteBatchDelete = () => {
    const ids = Array.from(selectedDbIds);
    if (ids.length === 0) return;
    if (onBatchDeleteDatabases) {
      onBatchDeleteDatabases(ids);
    } else {
      ids.forEach((id) => onDeleteDatabase(id));
    }
    setSelectedDbIds(new Set());
    setShowBatchDeleteConfirm(false);
  };

  const handleExecuteClearAll = () => {
    if (onClearAllDatabases) {
      onClearAllDatabases();
    } else {
      onResetDemoDatabase();
    }
    setSelectedDbIds(new Set());
    setShowClearAllConfirm(false);
  };

  const handleExportDataOnlyZip = async () => {
    try {
      setIsExportingDataZip(true);
      const zip = new JSZip();
      
      // OSでファイル名として使用できない禁則文字を置換する関数
      const sanitize = (name: string) => (name || 'Untitled').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
      
      // フォルダ構造を再帰的に巡回してZIPに追加する関数
      const processNodes = (folder: JSZip, nodes: Record<string, TreeNode>, notebookId: string, parentId: string | null, db: DatabaseProfile) => {
        const children = (Object.values(nodes || {}) as TreeNode[]).filter(n => n.notebookId === notebookId && n.parentId === parentId);
        
        children.forEach(node => {
          const nodeName = sanitize(node.title) || 'Untitled';
          
          if (node.isFolder) {
            // フォルダの場合：ZIP内にサブフォルダを作成して再帰処理
            const subFolder = folder.folder(nodeName);
            if (subFolder) processNodes(subFolder, nodes, notebookId, node.id, db);
          } else {
            // ノート（ファイル）の場合：タイプに応じてテキスト化
            let content = '';
            
            if (node.type === 'rich' && node.content?.richHtml) {
              // リッチテキストの場合、汎用的なMarkdown + HTML（GFM規格）として完全保持
              const { cleanHtml, footnotes } = parseAndRenumberHtml(node.content.richHtml);
              
              // 当該ノートに属する文章ブックマークを抽出
              const nodeBookmarks = (db.sentenceBookmarks || []).filter(bm => bm.nodeId === node.id);
              
              // ノート先頭にYAML Front-Matterメタデータを付与
              const frontMatterObj = {
                id: node.id,
                title: node.title,
                type: node.type,
                tags: node.tags || [],
                bookmarks: nodeBookmarks.map(bm => ({
                  id: bm.id,
                  text: bm.text,
                  color: bm.color,
                  comment: bm.comment,
                  createdAt: bm.createdAt
                })),
                created: node.created,
                updated: node.updated,
              };

              let mdText = cleanHtml;

              // 脚注定義をMarkdown標準の [^1]: 形式で末尾に追加
              if (footnotes.length > 0) {
                const fnDefs = footnotes.map((fn) => `[^${fn.number}]: ${fn.text}`).join('\n');
                mdText = `${mdText.trim()}\n\n---\n### 脚注・注釈\n${fnDefs}`;
              }

              content = `---\n${JSON.stringify(frontMatterObj, null, 2)}\n---\n\n${mdText.trim()}`;
            } else if (node.type === 'code' && node.content?.code) {
              // コードブロックの場合
              content = `\`\`\`${node.content.code.language || ''}\n${node.content.code.code}\n\`\`\``;
            } else if ((node.type as any) === 'plainText' && node.content?.plainText) {
              // プレーンテキストの場合
              content = node.content.plainText;
            } else {
              // その他のデータ（スプレッドシート等）はJSONとしてテキスト化
              content = JSON.stringify(node.content || {}, null, 2);
            }
            
            // .md 拡張子でファイルをZIPに追加
            folder.file(`${nodeName}.md`, content.trim());
          }
        });
      };

      // タブフォルダの親階層を辿ってフォルダ名の配列を取得する関数
      const getTabFolderPath = (tabFolderId: string | null | undefined, tabFolders: TabFolder[]): string[] => {
        if (!tabFolderId) return [];
        const path: string[] = [];
        let currId: string | null = tabFolderId;
        const visited = new Set<string>();

        while (currId && !visited.has(currId)) {
          visited.add(currId);
          const f = tabFolders.find(item => item.id === currId);
          if (!f) break;
          path.unshift(sanitize(f.name) || 'Folder');
          currId = f.parentId || null;
        }
        return path;
      };

      // データベース、タブフォルダ、ノートブックをループ処理
      databases.forEach(db => {
        const dbFolder = zip.folder(sanitize(db.name) || 'Database');
        if (!dbFolder) return;

        const tabFolders = db.tabFolders || [];

        // 空のタブフォルダも含め、タブフォルダ階層をZIP内に作成
        tabFolders.forEach(tf => {
          const tfPath = getTabFolderPath(tf.id, tabFolders);
          if (tfPath.length > 0) {
            let current = dbFolder;
            tfPath.forEach(part => {
              current = current.folder(part) || current;
            });
          }
        });

        // ノートブックをそれぞれのタブフォルダ内に配置してノートを書き出し
        (db.notebooks || []).forEach(nb => {
          const tfPath = getTabFolderPath(nb.folderId, tabFolders);
          let targetFolder = dbFolder;
          tfPath.forEach(part => {
            targetFolder = targetFolder.folder(part) || targetFolder;
          });

          const nbFolder = targetFolder.folder(sanitize(nb.name) || 'Notebook');
          if (nbFolder) {
            processNodes(nbFolder, db.nodes || {}, nb.id, null, db);
          }
        });

        // タブフォルダおよびノートブック、注釈・ブックマーク・タグのメタ情報を保存（完全復元用）
        const meta = {
          databaseName: db.name,
          tabFolders: tabFolders,
          notebooks: (db.notebooks || []).map(nb => ({
            id: nb.id,
            name: nb.name,
            folderId: nb.folderId || null,
            color: nb.color,
            bgClass: nb.bgClass,
            borderClass: nb.borderClass,
            description: nb.description,
          })),
          tags: db.tags || [],
          sentenceBookmarks: db.sentenceBookmarks || [],
          figureCaptions: db.figureCaptions || [],
        };
        dbFolder.file('.kaiso_tab_meta.json', JSON.stringify(meta, null, 2));
      });

      // ZIPファイルを生成してダウンロード
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Data_Backup_MD_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (e) {
      console.error(e);
      alert('データバックアップ中にエラーが発生しました。');
    } finally {
      setIsExportingDataZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                データベース（DB / ワークスペース）管理
              </h3>
              <p className="text-[11px] text-blue-200/80">
                保存場所・切り替え・新規作成・名前変更・管理
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Header */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer select-none font-medium hover:text-slate-900">
              <input
                type="checkbox"
                checked={databases.length > 0 && selectedDbIds.size === databases.length}
                onChange={handleToggleSelectAll}
                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>全選択</span>
            </label>
            <span className="text-xs text-slate-300">|</span>
            <div className="text-xs text-slate-600">
              登録中: <span className="font-bold text-slate-900">{databases.length} 件</span>
              {selectedDbIds.size > 0 && (
                <span className="ml-1.5 text-blue-700 font-bold bg-blue-100 px-1.5 py-0.5 rounded text-[11px]">
                  {selectedDbIds.size} 件選択中
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            {/* Batch delete selected button */}
            {selectedDbIds.size > 0 && (
              <div className="relative">
                <button
                  id="btn-batch-delete-databases"
                  onClick={() => setShowBatchDeleteConfirm(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center space-x-1 shadow-sm transition animate-in fade-in"
                  title="選択したデータベースを一括削除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>選択したDBを一括削除 ({selectedDbIds.size})</span>
                </button>

                {showBatchDeleteConfirm && (
                  <div className="absolute top-full right-0 mt-2 p-3.5 bg-white border border-red-300 shadow-2xl rounded-xl z-50 w-72 animate-in fade-in zoom-in-95">
                    <div className="flex items-start space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          選択した {selectedDbIds.size} 件のデータベースを削除しますか？
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          含まれるノートやフォルダのデータもすべて完全に削除されます。
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2 justify-end mt-3">
                      <button
                        onClick={() => setShowBatchDeleteConfirm(false)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={handleExecuteBatchDelete}
                        className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition shadow-xs"
                      >
                        一括削除する
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 1. 新規DBを作成 */}
            <button
              id="btn-modal-create-db"
              onClick={() => {
                onClose();
                onOpenCreateModal();
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新規DB</span>
            </button>

            {/* 2. DB読み込み */}
            <label
              id="btn-modal-import-db"
              className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
              title="JSON形式のデータベースファイルを読み込んで登録"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>DB読み込み</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onImportDatabase) {
                    onImportDatabase(file);
                  }
                  e.target.value = '';
                }}
              />
            </label>

            {/* 3. 全DB削除 */}
            <div className="relative">
              <button
                id="btn-clear-all-databases"
                onClick={() => setShowClearAllConfirm(true)}
                className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                title="すべてのデータベースを一括削除（完全初期化）"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>全DB削除</span>
              </button>

              {showClearAllConfirm && (
                <div className="absolute top-full right-0 mt-2 p-3.5 bg-white border border-red-300 shadow-2xl rounded-xl z-50 w-80 animate-in fade-in zoom-in-95">
                  <div className="flex items-start space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-900 leading-tight">
                        すべてのデータベースを一括消去しますか？
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                        登録されている全 {databases.length} 件のデータベースおよびすべてのノート・タブデータが完全に削除されます。<br />
                        ※削除後はクリーンな新規初期状態にリセットされます。
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 justify-end mt-3">
                    <button
                      onClick={() => setShowClearAllConfirm(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleExecuteClearAll}
                      className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition shadow-xs cursor-pointer"
                    >
                      すべて一括削除
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* DEMO初期化 */}
            <div className="relative">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs flex items-center space-x-1 transition cursor-pointer"
                title="DEMOデータを初期サンプルデータにリセット"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>DEMO初期化</span>
              </button>
              {showResetConfirm && (
                <div className="absolute top-full right-0 mt-2 p-3 bg-white border border-red-200 shadow-xl rounded-lg z-20 w-64 animate-in fade-in zoom-in-95">
                  <p className="text-xs font-bold text-slate-800 mb-2 leading-relaxed">
                    DEMOデータベースのデータを初期サンプル状態に戻しますか？
                  </p>
                  <div className="flex space-x-2 justify-end">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => {
                        onResetDemoDatabase();
                        setShowResetConfirm(false);
                      }}
                      className="px-2.5 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition shadow-sm font-medium cursor-pointer"
                    >
                      初期化する
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Database List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {databases.map((db) => {
            const isActive = db.id === activeDatabaseId;
            const nodeCount = Object.keys(db.nodes || {}).length;
            const notebookCount = db.notebooks?.length || 0;
            const rawLoc = db.storageLocation || (db.isDemo ? 'デモ用内蔵領域 (Read/Write)' : 'ブラウザ内蔵セキュアデータベース (IndexedDB)');
            const storageLoc = rawLoc.replace(' (IndexedDB / LocalStorage)', ' (IndexedDB)').replace('IndexedDB / LocalStorage', 'IndexedDB');

            return (
              <div
                key={db.id}
                className={`p-3.5 rounded-xl border transition flex flex-col gap-2.5 ${
                  isActive
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-400'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Left: DB Name & Badges */}
                  <div className="flex items-center space-x-2.5 flex-1 mr-2">
                    <input
                      type="checkbox"
                      checked={selectedDbIds.has(db.id)}
                      onChange={() => handleToggleSelectDb(db.id)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                      title="このデータベースを選択"
                    />
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                        db.isDemo
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 font-bold'
                          : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {db.isDemo ? 'DEMO' : <Database className="w-4 h-4" />}
                    </div>

                    {editingDbId === db.id ? (
                      <div className="flex items-center space-x-1.5 flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(db.id);
                            if (e.key === 'Escape') setEditingDbId(null);
                          }}
                          autoFocus
                          className="px-2 py-1 text-xs font-bold border border-blue-500 rounded bg-white text-slate-900 focus:outline-hidden w-full max-w-xs"
                        />
                        <button
                          onClick={() => handleSaveRename(db.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="保存"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingDbId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          title="キャンセル"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs">{db.name}</span>
                        {db.isDemo && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-300">
                            公式DEMO
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.2 rounded-full flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> 現在使用中
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => {
                          onSelectDatabase(db.id);
                          onClose();
                        }}
                        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-xs transition"
                      >
                        <span>開く</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {editingDbId !== db.id && (
                      <button
                        onClick={() => startRename(db)}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition"
                        title="データベース名を変更"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!db.isDemo && databases.length > 1 && (
                      confirmDeleteId === db.id ? (
                        <div className="flex items-center space-x-1 bg-red-50 p-1 rounded border border-red-200">
                          <span className="text-[10px] text-red-600 font-bold">削除しますか?</span>
                          <button
                            onClick={() => {
                              onDeleteDatabase(db.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                          >
                            削除
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px]"
                          >
                            止める
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(db.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title="このデータベースを削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Storage Location info row */}
                <div className="bg-slate-100/80 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-600 flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center space-x-1.5 truncate max-w-md">
                    <Folder className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-semibold text-slate-700 shrink-0">保存場所:</span>
                    {editingStorageDbId === db.id ? (
                      <div className="flex items-center space-x-1 flex-1">
                        <input
                          type="text"
                          value={editStoragePath}
                          onChange={(e) => setEditStoragePath(e.target.value)}
                          placeholder="フォルダパスを入力"
                          autoFocus
                          className="px-1.5 py-0.5 text-[11px] border border-blue-500 rounded bg-white text-slate-900 w-60"
                        />
                        <button
                          onClick={() => handleSaveStorage(db.id)}
                          className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="保存"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingStorageDbId(null)}
                          className="p-0.5 text-slate-400 hover:bg-slate-200 rounded"
                          title="キャンセル"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-slate-800 truncate" title={storageLoc}>
                        {storageLoc}
                      </span>
                    )}
                  </div>

                  {!db.isDemo && editingStorageDbId !== db.id && (
                    <button
                      onClick={() => startEditStorage(db)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold hover:underline shrink-0"
                    >
                      変更...
                    </button>
                  )}
                </div>

                {/* Sub stats */}
                <div className="flex items-center space-x-4 text-[11px] text-slate-500 pl-1">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-400" />
                    タブ: <strong className="text-slate-700">{notebookCount}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <FolderTree className="w-3 h-3 text-slate-400" />
                    ノート総数: <strong className="text-slate-700">{nodeCount}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    最終更新: {db.updatedAt || '今日'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>


        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 text-[11px] leading-relaxed">
            ※ 各DBデータはIndexedDBに個別管理されています。「データ保存・復元」「全DBバックアップ」はリボンバーの「ツール・管理」から直接実行できます。
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer shadow-xs"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
