import fs from 'fs';

let content = fs.readFileSync('src/components/NotebookTabBar.tsx', 'utf8');

// Replace the breadcrumbs with "全タブリスト" dropdown
const newCode = `import React, { useState, useRef, useEffect } from 'react';
import { Notebook, TabFolder } from '../types';
import { Plus, X, FolderOpen, ChevronRight, Layers, ChevronUp, MoreHorizontal, Check, List, Trash2, ArrowRightToLine, ArrowRightLeft } from 'lucide-react';

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

  const [showAllTabsDropdown, setShowAllTabsDropdown] = useState(false);
  const [contextMenuState, setContextMenuState] = useState<{ x: number, y: number, tabId: string } | null>(null);

  // Filter notebooks that belong to this active folder (if any folder is active)
  // If activeFolderId is null, maybe we show all? The previous code:
  const displayedNotebooks = activeFolderId
    ? notebooks.filter((nb) => nb.folderId === activeFolderId)
    : notebooks;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTabName.trim()) return;
    onAddNotebook(newTabName.trim(), newTabColor, activeFolderId);
    setNewTabName('');
    setIsAdding(false);
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenuState({ x: e.clientX, y: e.clientY, tabId });
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenuState(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const closeTab = (tabId: string) => {
    if (onDeleteNotebook) onDeleteNotebook(tabId);
  };

  const closeRightTabs = (tabId: string) => {
    if (!onDeleteNotebook) return;
    const idx = displayedNotebooks.findIndex(nb => nb.id === tabId);
    if (idx !== -1) {
      const toDelete = displayedNotebooks.slice(idx + 1);
      toDelete.forEach(nb => onDeleteNotebook(nb.id));
    }
  };

  const closeOtherTabs = (tabId: string) => {
    if (!onDeleteNotebook) return;
    const toDelete = displayedNotebooks.filter(nb => nb.id !== tabId);
    toDelete.forEach(nb => onDeleteNotebook(nb.id));
  };

  const deleteTabWithConfirm = (tabId: string) => {
    if (window.confirm('本当にこのタブを削除しますか？')) {
      if (onDeleteNotebook) onDeleteNotebook(tabId);
    }
  };

  return (
    <div
      id="notebook-tab-bar"
      className="flex items-center px-2 pt-1 bg-[#fef9f0] border-b border-slate-300 gap-1 overflow-x-auto select-none min-h-[38px] relative"
    >
      {/* "全タブリスト" Dropdown on Left */}
      <div className="flex items-center space-x-1 pr-2 border-r border-slate-300 mr-1 shrink-0 text-xs relative">
        <button
          onClick={() => setShowAllTabsDropdown(!showAllTabsDropdown)}
          className="flex items-center space-x-1.5 text-slate-800 font-bold bg-white/70 hover:bg-white px-2.5 py-1 rounded border border-slate-300 shadow-2xs transition"
          title="すべてのタブを一覧表示"
        >
          <List className="w-4 h-4 text-amber-700" />
          <span>全タブリスト</span>
        </button>

        {showAllTabsDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowAllTabsDropdown(false)} />
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-300 shadow-xl rounded-lg z-50 py-1.5 text-slate-800 max-h-96 overflow-y-auto animate-in fade-in">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                全タブ一覧
              </div>
              {notebooks.map((nb) => {
                const isActive = nb.id === activeNotebookId;
                const folderName = nb.folderId ? tabFolders.find(f => f.id === nb.folderId)?.name : 'ルート';
                return (
                  <button
                    key={nb.id}
                    onClick={() => {
                      if (nb.folderId !== activeFolderId) {
                        onSelectFolder(nb.folderId || null);
                      }
                      onSelectNotebook(nb.id);
                      setShowAllTabsDropdown(false);
                    }}
                    className={\`w-full px-3 py-2 text-left text-xs flex items-center space-x-2 hover:bg-amber-50 transition \${
                      isActive ? 'bg-amber-50 font-bold text-amber-900' : 'text-slate-700'
                    }\`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm border border-black/10" style={{ backgroundColor: nb.color || '#f1f5f9' }} />
                    <div className="flex flex-col flex-1 truncate">
                      <span className="truncate">{nb.name}</span>
                      <span className="text-[9px] text-slate-400 truncate">{folderName}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Dynamic Tabs belonging to the Active Folder */}
      <div className="flex items-end gap-1 flex-1 overflow-x-auto pb-[1px] no-scrollbar">
        {displayedNotebooks.length === 0 ? (
          <div className="text-xs text-slate-500 italic py-1 px-3 flex items-center space-x-1.5">
            <span>タブがありません。</span>
          </div>
        ) : (
          displayedNotebooks.map((nb) => {
            const isActive = nb.id === activeNotebookId;
            return (
              <button
                key={nb.id}
                id={\`notebook-tab-\${nb.id}\`}
                onClick={() => onSelectNotebook(nb.id)}
                onContextMenu={(e) => handleContextMenu(e, nb.id)}
                style={{
                  backgroundColor: isActive ? '#ffffff' : nb.color || '#fdf8f0',
                }}
                className={\`group relative px-4 py-1.5 text-xs font-semibold rounded-t-md transition-all duration-100 flex items-center space-x-2 border-t-2 border-l border-r shrink-0 cursor-pointer \${
                  isActive
                    ? 'border-t-amber-500 border-l-slate-300 border-r-slate-300 text-slate-900 shadow-sm z-10 -mb-[2px] pb-2'
                    : 'border-t-slate-300 border-l-slate-300 border-r-slate-300 text-slate-700 hover:brightness-95 opacity-85'
                }\`}
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
                    title="このタブを閉じる"
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
              placeholder="新しいタブ名"
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              autoFocus
              className="text-xs px-1.5 py-0.5 border border-slate-300 rounded w-28 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <select
              value={newTabColor}
              onChange={(e) => setNewTabColor(e.target.value)}
              className="text-[10px] border border-slate-300 rounded px-1 py-0.5"
            >
              <option value="#fdf8f0">クリーム (標準)</option>
              <option value="#e0f2fe">ブルー (青)</option>
              <option value="#fef3c7">イエロー (黄)</option>
              <option value="#fce7f3">ピンク (桃)</option>
              <option value="#dcfce7">グリーン (緑)</option>
              <option value="#e0e7ff">パープル (紫)</option>
              <option value="#f3f4f6">グレー (灰)</option>
            </select>
            <button type="submit" className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded font-medium cursor-pointer">
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
            className="px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 hover:bg-amber-100 rounded-t flex items-center space-x-1 transition shrink-0 cursor-pointer border border-transparent hover:border-amber-300"
            title="新規タブを追加"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px] font-medium">+ 新規タブ</span>
          </button>
        )}
      </div>

      {/* Custom Context Menu */}
      {contextMenuState && (
        <div
          className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-xl py-1 text-xs text-slate-800 min-w-[160px] animate-in fade-in zoom-in-95"
          style={{ top: contextMenuState.y, left: contextMenuState.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left hover:bg-slate-100 flex items-center space-x-2"
            onClick={() => {
              closeTab(contextMenuState.tabId);
              setContextMenuState(null);
            }}
          >
            <X className="w-3.5 h-3.5 text-slate-500" />
            <span>タブを閉じる</span>
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-slate-100 flex items-center space-x-2"
            onClick={() => {
              closeRightTabs(contextMenuState.tabId);
              setContextMenuState(null);
            }}
          >
            <ArrowRightToLine className="w-3.5 h-3.5 text-slate-500" />
            <span>右側のタブを閉じる</span>
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-slate-100 flex items-center space-x-2"
            onClick={() => {
              closeOtherTabs(contextMenuState.tabId);
              setContextMenuState(null);
            }}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>このタブ以外を閉じる</span>
          </button>
          <div className="h-px bg-slate-200 my-1 w-full" />
          <button
            className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center space-x-2 font-medium"
            onClick={() => {
              deleteTabWithConfirm(contextMenuState.tabId);
              setContextMenuState(null);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>タブの削除...</span>
          </button>
        </div>
      )}
    </div>
  );
};
`;

fs.writeFileSync('src/components/NotebookTabBar.tsx', newCode);
