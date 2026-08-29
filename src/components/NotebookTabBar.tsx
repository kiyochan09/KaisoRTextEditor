import React, { useState } from 'react';
import { Notebook, TabFolder } from '../types';
import { Plus, X, Folder, FolderOpen, ChevronRight, Layers, ChevronUp, MoreHorizontal } from 'lucide-react';

interface NotebookTabBarProps {
  notebooks: Notebook[];
  tabFolders: TabFolder[];
  activeFolderId: string | null;
  activeNotebookId: string;
  onSelectNotebook: (id: string) => void;
  onSelectFolder: (folderId: string | null) => void;
  onAddNotebook: (name: string, color: string, folderId?: string | null) => void;
  onDeleteNotebook?: (id: string) => void;
}

export const NotebookTabBar: React.FC<NotebookTabBarProps> = ({
  notebooks,
  tabFolders,
  activeFolderId,
  activeNotebookId,
  onSelectNotebook,
  onSelectFolder,
  onAddNotebook,
  onDeleteNotebook,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [newTabColor, setNewTabColor] = useState('#e0f2fe');

  // Find the active tab folder
  const activeFolder = activeFolderId
    ? tabFolders.find((f) => f.id === activeFolderId) || null
    : null;

  // Filter notebooks that belong to this active folder
  const displayedNotebooks = activeFolderId
    ? notebooks.filter((nb) => nb.folderId === activeFolderId)
    : notebooks;

  // Build folder breadcrumb hierarchy
  const folderBreadcrumbs: Array<{ id: string | null; name: string }> = [
    { id: null, name: '全タブ' },
  ];

  if (activeFolder) {
    const chain: Array<{ id: string; name: string }> = [];
    let curr: TabFolder | null = activeFolder;
    while (curr) {
      chain.unshift({ id: curr.id, name: curr.name });
      curr = curr.parentId ? tabFolders.find((f) => f.id === curr?.parentId) || null : null;
    }
    folderBreadcrumbs.push(...chain);
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTabName.trim()) return;
    onAddNotebook(newTabName.trim(), newTabColor, activeFolderId);
    setNewTabName('');
    setIsAdding(false);
  };

  return (
    <div
      id="notebook-tab-bar"
      className="flex items-center px-2 pt-1 bg-slate-200 border-b border-slate-300 gap-1 overflow-x-auto select-none min-h-[38px]"
    >
      {/* Folder Context & Breadcrumb Indicator on Left */}
      <div className="flex items-center space-x-1 pr-2 border-r border-slate-300 mr-1 shrink-0 text-xs">
        <div className="flex items-center space-x-1 text-slate-700 font-semibold bg-white/70 px-2 py-1 rounded border border-slate-300 shadow-2xs">
          {activeFolder ? (
            <FolderOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          ) : (
            <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          )}

          <div className="flex items-center space-x-1 text-[11px] max-w-[200px] truncate">
            {folderBreadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id || 'root-all'}>
                {idx > 0 && <ChevronRight className="w-2.5 h-2.5 text-slate-400 shrink-0" />}
                <button
                  type="button"
                  onClick={() => onSelectFolder(crumb.id)}
                  className={`hover:text-blue-600 hover:underline truncate cursor-pointer ${
                    idx === folderBreadcrumbs.length - 1 ? 'font-bold text-slate-900' : 'text-slate-500'
                  }`}
                  title={`フォルダ「${crumb.name}」へ移動`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Up One Level Button if nested */}
          {activeFolder && (
            <button
              type="button"
              onClick={() => onSelectFolder(activeFolder.parentId || null)}
              className="p-0.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 ml-1 cursor-pointer"
              title="親フォルダへ戻る"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Tabs belonging to the Active Folder */}
      <div className="flex items-end gap-1 flex-1 overflow-x-auto pb-[1px] no-scrollbar">
        {displayedNotebooks.length === 0 ? (
          <div className="text-xs text-slate-500 italic py-1 px-3 flex items-center space-x-1.5">
            <span>このフォルダにはまだタブがありません。</span>
          </div>
        ) : (
          displayedNotebooks.map((nb) => {
            const isActive = nb.id === activeNotebookId;
            return (
              <button
                key={nb.id}
                id={`notebook-tab-${nb.id}`}
                onClick={() => onSelectNotebook(nb.id)}
                style={{
                  backgroundColor: isActive ? '#ffffff' : nb.color || '#f1f5f9',
                }}
                className={`group relative px-4 py-1.5 text-xs font-semibold rounded-t-md transition-all duration-100 flex items-center space-x-2 border-t-2 border-l border-r shrink-0 cursor-pointer ${
                  isActive
                    ? 'border-t-blue-600 border-l-slate-400 border-r-slate-400 text-slate-900 shadow-sm z-10 -mb-[2px] pb-2'
                    : 'border-t-slate-300 border-l-slate-300 border-r-slate-300 text-slate-700 hover:brightness-95 opacity-85'
                }`}
                title={nb.description || nb.name}
              >
                <span>{nb.name}</span>

                {/* Optional tab delete */}
                {onDeleteNotebook && displayedNotebooks.length > 1 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNotebook(nb.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/10 rounded-full text-slate-400 hover:text-rose-600 transition -mr-1.5"
                    title="このタブを削除"
                  >
                    <X className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            );
          })
        )}

        {/* Add New Notebook Tab Button in this Folder */}
        {isAdding ? (
          <form onSubmit={handleCreate} className="flex items-center space-x-1 bg-white px-2 py-1 rounded-t border border-slate-300 shrink-0">
            <input
              type="text"
              placeholder={activeFolder ? `「${activeFolder.name}」内のタブ名` : '新しいタブ名'}
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              autoFocus
              className="text-xs px-1.5 py-0.5 border border-slate-300 rounded w-28 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={newTabColor}
              onChange={(e) => setNewTabColor(e.target.value)}
              className="text-[10px] border border-slate-300 rounded px-1 py-0.5"
            >
              <option value="#e0f2fe">ブルー (青)</option>
              <option value="#fef3c7">イエロー (黄)</option>
              <option value="#fce7f3">ピンク (桃)</option>
              <option value="#dcfce7">グリーン (緑)</option>
              <option value="#e0e7ff">パープル (紫)</option>
              <option value="#f3f4f6">グレー (灰)</option>
            </select>
            <button type="submit" className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-medium cursor-pointer">
              追加
            </button>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <button
            id="btn-add-notebook-tab"
            onClick={() => setIsAdding(true)}
            className="px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-300 rounded-t flex items-center space-x-1 transition shrink-0 cursor-pointer border border-transparent hover:border-slate-400"
            title={activeFolder ? `フォルダ「${activeFolder.name}」に新しいタブを追加` : '新規タブを追加'}
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] font-medium">+ 新規タブ</span>
          </button>
        )}
      </div>
    </div>
  );
};
