import React, { useState, useEffect } from 'react';
import { Notebook, TabFolder } from '../types';
import { 
  Folder, FolderPlus, ChevronRight, ChevronLeft, ChevronDown, Plus, 
  FolderOpen, Edit3, Trash2, Layers, Bookmark, Sparkles, Move
} from 'lucide-react';

export interface TabListPanelProps {
  tabFolders: TabFolder[];
  notebooks: Notebook[];
  activeFolderId: string | null;
  activeNotebookId: string;
  onSelectFolder: (folderId: string | null) => void;
  onSelectNotebook: (notebookId: string) => void;
  onCreateFolder: (parentId: string | null, name?: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveFolder: (folderId: string, targetParentId: string | null) => void;
  onAddNotebookToFolder: (folderId: string | null, name: string, color?: string) => void;
  onMoveNotebookToFolder: (notebookId: string, targetFolderId: string | null) => void;
  onDeleteNotebook?: (notebookId: string | string[]) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const TabListPanel: React.FC<TabListPanelProps> = ({
  tabFolders,
  notebooks,
  activeFolderId,
  activeNotebookId,
  onSelectFolder,
  onSelectNotebook,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveFolder,
  onAddNotebookToFolder,
  onMoveNotebookToFolder,
  onDeleteNotebook,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set(tabFolders.map((f) => f.id))
  );

  useEffect(() => {
    setExpandedFolderIds(new Set(tabFolders.map((f) => f.id)));
  }, [tabFolders]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  // Drag & drop state for re-ordering or nesting tabs & folders
  const [draggedItem, setDraggedItem] = useState<{ type: 'folder' | 'notebook'; id: string } | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleStartRename = (folder: TabFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  const handleSaveRename = (folderId: string) => {
    if (editingFolderName.trim()) {
      onRenameFolder(folderId, editingFolderName.trim());
    }
    setEditingFolderId(null);
  };

  // Helper to prevent cyclical nesting
  const isDescendantFolder = (potentialParentId: string, targetFolderId: string): boolean => {
    if (potentialParentId === targetFolderId) return true;
    const subfolders = tabFolders.filter((f) => f.parentId === potentialParentId);
    return subfolders.some((sub) => isDescendantFolder(sub.id, targetFolderId));
  };

  // 50音順 (Japanese alphabetical collation) 比較関数
  const compare50On = (aName: string, bName: string): number => {
    const cleanA = (aName || '').replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s・_\-★☆]+/gu, '').trim() || aName;
    const cleanB = (bName || '').replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s・_\-★☆]+/gu, '').trim() || bName;
    const res = cleanA.localeCompare(cleanB, 'ja', { numeric: true });
    if (res !== 0) return res;
    return (aName || '').localeCompare(bName || '', 'ja');
  };

  // Count tabs inside a folder (and its nested subfolders) 50音順
  const getTabsInFolder = (folderId: string | null): Notebook[] => {
    const list = folderId === null
      ? notebooks.filter((nb) => !nb.folderId)
      : notebooks.filter((nb) => nb.folderId === folderId);
    return [...list].sort((a, b) => compare50On(a.name, b.name));
  };

  // Recursive folder renderer
  const renderFolder = (folder: TabFolder, depth = 0): React.ReactNode => {
    const subfolders = tabFolders
      .filter((f) => f.parentId === folder.id)
      .sort((a, b) => compare50On(a.name, b.name));
    const tabsInThisFolder = getTabsInFolder(folder.id);
    const isExpanded = expandedFolderIds.has(folder.id);
    const isActive = folder.id === activeFolderId;
    const isDragOver = dragOverFolderId === folder.id;

    return (
      <div key={folder.id} className="flex flex-col select-none">
        {/* Folder Header Item */}
        <div
          id={`tablist-folder-${folder.id}`}
          draggable={editingFolderId !== folder.id}
          onDragStart={(e) => {
            setDraggedItem({ type: 'folder', id: folder.id });
            e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'folder', id: folder.id }));
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (draggedItem) {
              if (draggedItem.type === 'folder' && !isDescendantFolder(draggedItem.id, folder.id)) {
                setDragOverFolderId(folder.id);
                e.dataTransfer.dropEffect = 'move';
              } else if (draggedItem.type === 'notebook') {
                setDragOverFolderId(folder.id);
                e.dataTransfer.dropEffect = 'move';
              }
            }
          }}
          onDragLeave={() => {
            if (dragOverFolderId === folder.id) setDragOverFolderId(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverFolderId(null);
            if (!draggedItem) return;

            if (draggedItem.type === 'folder' && draggedItem.id !== folder.id) {
              if (!isDescendantFolder(draggedItem.id, folder.id)) {
                onMoveFolder(draggedItem.id, folder.id);
                setExpandedFolderIds((prev) => new Set(prev).add(folder.id));
              }
            } else if (draggedItem.type === 'notebook') {
              onMoveNotebookToFolder(draggedItem.id, folder.id);
              setExpandedFolderIds((prev) => new Set(prev).add(folder.id));
            }
            setDraggedItem(null);
          }}
          onClick={() => {
            onSelectFolder(folder.id);
            // If the folder has tabs and active notebook is not in this folder, select first tab
            if (tabsInThisFolder.length > 0) {
              const currentInFolder = tabsInThisFolder.some((t) => t.id === activeNotebookId);
              if (!currentInFolder) {
                onSelectNotebook(tabsInThisFolder[0].id);
              }
            }
          }}
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
          className={`group relative flex items-center justify-between py-1.5 pr-2 rounded text-xs transition cursor-pointer border ${
            isDragOver
              ? 'bg-orange-100 border-blue-500 ring-2 ring-blue-400 font-bold'
              : isActive
                ? 'bg-blue-600 text-white font-semibold border-blue-700 shadow-xs'
                : 'text-stone-700 hover:bg-stone-300 border-transparent'
          }`}
          title={`${folder.name} (クリックしてこのフォルダのタブ一覧を表示)`}
        >
          <div className="flex items-center space-x-1.5 min-w-0 flex-1">
            {/* Expand Chevron */}
            {subfolders.length > 0 || tabsInThisFolder.length > 0 ? (
              <button
                type="button"
                onClick={(e) => toggleFolder(folder.id, e)}
                className={`p-0.5 rounded hover:bg-black/10 transition shrink-0 ${
                  isActive ? 'text-white' : 'text-stone-500'
                }`}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            ) : (
              <span className="w-3.5 shrink-0" />
            )}

            {/* Folder Icon */}
            {isActive ? (
              <FolderOpen className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-200 shrink-0" />
            )}

            {/* Custom Color Dot */}
            {folder.color && (
              <span
                className="w-2 h-2 rounded-full shrink-0 border border-black/15"
                style={{ backgroundColor: folder.color }}
              />
            )}

            {/* Title / Inline Rename */}
            {editingFolderId === folder.id ? (
              <input
                type="text"
                value={editingFolderName}
                onChange={(e) => setEditingFolderName(e.target.value)}
                onBlur={() => handleSaveRename(folder.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename(folder.id);
                  if (e.key === 'Escape') setEditingFolderId(null);
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-1 py-0.5 border border-blue-400 rounded bg-white text-stone-900 w-full focus:outline-none"
              />
            ) : (
              <span className="truncate flex-1 font-medium">{folder.name}</span>
            )}
          </div>

          {/* Right badges & quick actions */}
          <div className="flex items-center space-x-1 shrink-0 ml-1">
            {tabsInThisFolder.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono transition ${
                  isActive ? 'bg-orange-800 text-orange-100' : 'bg-stone-300 text-stone-600'
                }`}
                title={`${tabsInThisFolder.length} 個のタブ`}
              >
                {tabsInThisFolder.length}
              </span>
            )}

            {/* Hover Actions: Add Subfolder / Add Tab / Rename / Delete */}
            <div className="hidden group-hover:flex items-center space-x-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateFolder(folder.id, '新規サブフォルダ');
                  setExpandedFolderIds((prev) => new Set(prev).add(folder.id));
                }}
                title="このフォルダ内にサブフォルダを追加 (階層化)"
                className={`p-0.5 rounded hover:bg-black/10 ${
                  isActive ? 'text-blue-100 hover:text-white' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <FolderPlus className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddNotebookToFolder(folder.id, '新規タブ', '#e0f2fe');
                  setExpandedFolderIds((prev) => new Set(prev).add(folder.id));
                }}
                title="このフォルダ内に新規タブを追加"
                className={`p-0.5 rounded hover:bg-black/10 ${
                  isActive ? 'text-blue-100 hover:text-white' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Plus className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={(e) => handleStartRename(folder, e)}
                title="フォルダ名を変更"
                className={`p-0.5 rounded hover:bg-black/10 ${
                  isActive ? 'text-blue-100 hover:text-white' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Edit3 className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFolder(folder.id);
                }}
                title="フォルダを削除"
                className={`p-0.5 rounded hover:bg-rose-500 hover:text-white ${
                  isActive ? 'text-blue-100' : 'text-stone-500'
                }`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Content inside folder when expanded */}
        {isExpanded && (
          <div className="flex flex-col space-y-0.5 my-0.5">
            {/* 1. Subfolders (階層化) */}
            {subfolders.map((sub) => renderFolder(sub, depth + 1))}

            {/* 2. Tabs inside this folder */}
            {tabsInThisFolder.map((tab) => {
              const isTabActive = tab.id === activeNotebookId;
              return (
                <div
                  key={tab.id}
                  id={`tablist-item-${tab.id}`}
                  draggable
                  onDragStart={(e) => {
                    setDraggedItem({ type: 'notebook', id: tab.id });
                    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'notebook', id: tab.id }));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onClick={() => {
                    onSelectFolder(folder.id);
                    onSelectNotebook(tab.id);
                  }}
                  style={{ paddingLeft: `${(depth + 1) * 14 + 10}px` }}
                  className={`group relative flex items-center justify-between py-1 pr-2 rounded text-xs transition cursor-pointer ${
                    isTabActive
                      ? 'bg-orange-100 text-blue-950 font-semibold border border-blue-300'
                      : 'text-stone-700 hover:bg-stone-300 border border-transparent'
                  }`}
                  title={`タブ: ${tab.name} (クリックして開く)`}
                >
                  <div className="flex items-center space-x-1.5 truncate flex-1">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0 border border-stone-400"
                      style={{ backgroundColor: tab.color || '#e0f2fe' }}
                    />
                    <span className="truncate">{tab.name}</span>
                  </div>


                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Top level folders (parentId === null) 50音順
  const topLevelFolders = tabFolders
    .filter((f) => !f.parentId)
    .sort((a, b) => compare50On(a.name, b.name));

  // Unfiled tabs (folderId === null or invalid) 50音順
  const unfiledTabs = notebooks
    .filter((nb) => !nb.folderId || !tabFolders.some((f) => f.id === nb.folderId))
    .sort((a, b) => compare50On(a.name, b.name));

  // If collapsed, render slim vertical rail
  if (isCollapsed) {
    return (
      <div
        id="tab-list-hierarchy-panel-collapsed"
        onClick={onToggleCollapse}
        className="w-9 bg-stone-200 hover:bg-stone-300/80 border-r border-stone-300 flex flex-col items-center py-2 shrink-0 select-none cursor-pointer transition-colors shadow-2xs group"
        title="階層1（タブ・フォルダ管理）を展開する"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse?.();
          }}
          title="階層1を展開する"
          className="p-1 bg-white hover:bg-orange-50 text-stone-700 hover:text-orange-700 rounded border border-stone-300 shadow-2xs mb-2 transition cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <div className="p-1 rounded bg-orange-100 text-orange-700 mb-2 border border-orange-200">
          <Layers className="w-3.5 h-3.5" />
        </div>
        <div className="writing-vertical-rl text-[11px] font-bold text-stone-700 tracking-widest my-1 flex items-center">
          <span>階層１</span>
        </div>
        <div className="mt-auto flex flex-col items-center space-y-1 text-stone-500">
          <span className="text-[10px] bg-stone-300 px-1 py-0.5 rounded-full font-mono font-bold" title={`${tabFolders.length} フォルダ`}>
            {tabFolders.length}
          </span>
          <span className="text-[9px] text-stone-400">展開</span>
        </div>
      </div>
    );
  }

  return (
    <div id="tab-list-hierarchy-panel" className="w-60 bg-stone-200 border-r border-stone-300 flex flex-col text-xs shrink-0 select-none">
      {/* Header */}
      <div className="p-2 bg-stone-300 border-b border-stone-300 flex flex-col space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 font-bold text-stone-800">
            <Layers className="w-4 h-4 text-orange-700" />
            <span className="text-xs">階層1</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-[10px] bg-orange-100 text-blue-700 font-semibold px-1.5 py-0.2 rounded border border-orange-300">
              タブ・フォルダ管理
            </span>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="階層1のウィンドウを折りたたむ"
                className="p-1 hover:bg-stone-400/50 rounded text-stone-600 hover:text-stone-900 transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between gap-1 pt-0.5">
          <button
            type="button"
            onClick={() => onCreateFolder(null, '新規フォルダ')}
            className="flex-1 px-2 py-1 bg-white hover:bg-stone-100 text-stone-800 rounded border border-stone-300 font-medium text-[11px] flex items-center justify-center space-x-1 shadow-2xs transition hover:border-stone-400 cursor-pointer"
            title="ルート階層に新しいタブフォルダを作成"
          >
            <FolderPlus className="w-3 h-3 text-amber-600" />
            <span>+ フォルダ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeFolderId) {
                onCreateFolder(activeFolderId, '新規サブフォルダ');
                setExpandedFolderIds((prev) => new Set(prev).add(activeFolderId));
              } else {
                onCreateFolder(null, '新規サブフォルダ');
              }
            }}
            className="flex-1 px-2 py-1 bg-white hover:bg-stone-100 text-stone-800 rounded border border-stone-300 font-medium text-[11px] flex items-center justify-center space-x-1 shadow-2xs transition hover:border-stone-400 cursor-pointer"
            title={activeFolderId ? `「${tabFolders.find((f) => f.id === activeFolderId)?.name || '選択中'}」内にサブフォルダを追加 (階層化)` : 'サブフォルダを追加'}
          >
            <Plus className="w-3 h-3 text-orange-700" />
            <span>+ サブ階層</span>
          </button>
        </div>
      </div>

      {/* Root All Tabs / Home Item */}
      <div className="p-1.5 border-b border-stone-200 bg-stone-100/60">
        <button
          type="button"
          onClick={() => {
            onSelectFolder(null);
            if (notebooks.length > 0) {
              onSelectNotebook(notebooks[0].id);
            }
          }}
          className={`w-full text-left px-2 py-1.5 rounded text-xs transition flex items-center justify-between cursor-pointer ${
            activeFolderId === null
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-stone-700 hover:bg-stone-300'
          }`}
          title="すべてのタブを表示"
        >
          <div className="flex items-center space-x-1.5">
            <Layers className={`w-3.5 h-3.5 ${activeFolderId === null ? 'text-blue-200' : 'text-orange-700'}`} />
            <span>すべてのタブ (全体表示)</span>
          </div>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            activeFolderId === null ? 'bg-orange-800 text-orange-100' : 'bg-stone-300 text-stone-600'
          }`}>
            {notebooks.length}
          </span>
        </button>
      </div>

      {/* Hierarchical Tab Folders & Tabs List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider px-1 py-0.5 flex items-center justify-between">
          <span>フォルダ階層</span>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setExpandedFolderIds(new Set(tabFolders.map((f) => f.id)))}
              className="text-[9px] text-stone-500 hover:text-stone-900 bg-white px-1 py-0.2 rounded border border-stone-300 cursor-pointer"
              title="すべて展開"
            >
              展開
            </button>
            <button
              type="button"
              onClick={() => setExpandedFolderIds(new Set())}
              className="text-[9px] text-stone-500 hover:text-stone-900 bg-white px-1 py-0.2 rounded border border-stone-300 cursor-pointer"
              title="すべて折りたたむ"
            >
              折畳
            </button>
          </div>
        </div>

        {/* Render Hierarchical Folders */}
        {topLevelFolders.map((folder) => renderFolder(folder, 0))}

        {/* Unfiled Tabs Section (if any) */}
        {unfiledTabs.length > 0 && (
          <div className="mt-2 pt-1 border-t border-stone-200">
            <div className="text-[10px] font-bold text-stone-400 px-1 py-0.5">
              未分類のタブ ({unfiledTabs.length})
            </div>
            {unfiledTabs.map((tab) => {
              const isTabActive = tab.id === activeNotebookId;
              return (
                <div
                  key={tab.id}
                  onClick={() => onSelectNotebook(tab.id)}
                  draggable
                  onDragStart={(e) => {
                    setDraggedItem({ type: 'notebook', id: tab.id });
                    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'notebook', id: tab.id }));
                  }}
                  className={`flex items-center justify-between py-1 px-2 rounded text-xs transition cursor-pointer ${
                    isTabActive
                      ? 'bg-orange-100 text-blue-950 font-semibold border border-blue-300'
                      : 'text-stone-700 hover:bg-stone-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0 border border-stone-400"
                      style={{ backgroundColor: tab.color || '#e0f2fe' }}
                    />
                    <span className="truncate">{tab.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="p-1.5 bg-stone-300 border-t border-stone-300 text-[10px] text-stone-500 text-center leading-tight">
        フォルダを選択すると上部にそのタブ群が表示されます
      </div>
    </div>
  );
};
