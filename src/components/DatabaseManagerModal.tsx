import React, { useState } from 'react';
import { DatabaseProfile } from '../types';
import { 
  Database, Plus, Trash2, Edit2, Check, X, RefreshCw, 
  FolderTree, Calendar, Layers, ShieldCheck, Copy, ArrowRight,
  Folder, HardDrive, Laptop, FolderOpen, Upload, Download
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
}) => {
  const [editingDbId, setEditingDbId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  
  // Storage location editing state
  const [editingStorageDbId, setEditingStorageDbId] = useState<string | null>(null);
  const [editStoragePath, setEditStoragePath] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
      onUpdateStorageLocation(dbId, 'ブラウザ内蔵セキュア領域 (IndexedDB / LocalStorage)', '');
    }
    setEditingStorageDbId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col">
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
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600">
            登録中のデータベース: <span className="font-bold text-slate-900">{databases.length} 件</span>
          </div>
          <div className="flex items-center space-x-2">
            <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs flex items-center space-x-1 transition shadow-sm">
              <Upload className="w-3.5 h-3.5" />
              <span>DB読込</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onImportDatabase) {
                    onImportDatabase(file);
                  }
                  e.target.value = ''; // Reset input
                }}
              />
            </label>
            <button
              onClick={() => {
                onClose();
                onOpenCreateModal();
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新規DBを作成</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs flex items-center space-x-1 transition"
                title="DEMOデータを初期サンプルデータにリセット"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>DEMOを初期化</span>
              </button>
              {showResetConfirm && (
                <div className="absolute top-full right-0 mt-2 p-3 bg-white border border-red-200 shadow-xl rounded-lg z-20 w-64 animate-in fade-in zoom-in-95">
                  <p className="text-xs font-bold text-slate-800 mb-2 leading-relaxed">
                    DEMOデータベースのデータを初期サンプル状態に戻しますか？
                  </p>
                  <div className="flex space-x-2 justify-end">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => {
                        onResetDemoDatabase();
                        setShowResetConfirm(false);
                      }}
                      className="px-2.5 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition shadow-sm font-medium"
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
            const storageLoc = db.storageLocation || (db.isDemo ? 'デモ用内蔵領域 (Read/Write)' : 'ブラウザ内蔵セキュア領域');

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


        {/* Backup and Restore Section */}
        <div className="p-4 bg-blue-50/50 border-t border-slate-200 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <HardDrive className="w-4 h-4 text-blue-600" />
                全環境の一括バックアップと移行 (PC買い替え用)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                作成済みのすべてのデータベースを1つのファイルとして書き出し、新しいPCで復元できます。
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onExportAllDatabases}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition"
                title="全データベースをエクスポート"
              >
                <Download className="w-3.5 h-3.5" />
                バックアップを保存
              </button>
              
              <label className="cursor-pointer px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 transition shadow-sm">
                <Upload className="w-3.5 h-3.5" />
                <span>環境を復元...</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onImportAllDatabases) {
                      onImportAllDatabases(file);
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 text-[11px]">
            ※各データベースに設定された保存場所と内容は安全に個別管理されています。
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
