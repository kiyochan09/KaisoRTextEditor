import React, { useState } from 'react';
import { TreeNode, NoteType } from '../types';
import { 
  ChevronRight, ChevronDown, Folder, FileText, Table, Code, 
  Bookmark, Lock, Plus, Trash2, Edit3, Search,
  GripVertical, ArrowUp, ArrowDown, CornerLeftUp, CornerDownRight,
  FolderPlus, ArrowLeft, Star
} from 'lucide-react';

export type DropPosition = 'before' | 'inside' | 'after' | 'root' | 'promote';

interface TreeSidebarProps {
  nodes: Record<string, TreeNode>;
  rootNodeIds: string[];
  activeNodeId: string;
  onSelectNode: (id: string) => void;
  onAddChildNode: (parentId: string | null) => void;
  onDeleteNode: (id: string) => void;
  onRenameNode: (id: string, newTitle: string) => void;
  onChangeNodeType: (id: string, newType: NoteType) => void;
  onChangeColorBadge: (id: string, color?: string) => void;
  onMoveNode: (sourceId: string, targetParentId: string | null, position?: DropPosition) => void;
  onReorderNode?: (nodeId: string, direction: 'up' | 'down') => void;
  onPromoteNode?: (nodeId: string) => void;
  onDemoteNode?: (nodeId: string) => void;
  selectedTagFilter?: string | null;
  onClearTagFilter?: () => void;
  onToggleBookmark?: (nodeId: string) => void;
  isBookmarkFiltered?: boolean;
  onToggleBookmarkFilter?: () => void;
}

export const TreeSidebar: React.FC<TreeSidebarProps> = ({
  nodes,
  rootNodeIds,
  activeNodeId,
  onSelectNode,
  onAddChildNode,
  onDeleteNode,
  onRenameNode,
  onChangeNodeType,
  onChangeColorBadge,
  onMoveNode,
  onReorderNode,
  onPromoteNode,
  onDemoteNode,
  selectedTagFilter,
  onClearTagFilter,
  onToggleBookmark,
  isBookmarkFiltered,
  onToggleBookmarkFilter,
}) => {
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(
    new Set(Object.keys(nodes))
  );
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [treeSearchQuery, setTreeSearchQuery] = useState('');

  // Drag and Drop state with high-precision position detection
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);
  const [isOverRootDropZone, setIsOverRootDropZone] = useState(false);
  const [isOverPromoteDropZone, setIsOverPromoteDropZone] = useState(false);

  // Helper to check if a node is descendant of another (to prevent circular tree nesting)
  const isDescendant = (potentialParentId: string, targetNodeId: string): boolean => {
    if (potentialParentId === targetNodeId) return true;
    const parentNode = nodes[potentialParentId];
    if (!parentNode || !parentNode.children) return false;
    return parentNode.children.some((cid) => isDescendant(cid, targetNodeId));
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startRename = (node: TreeNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNodeId(node.id);
    setEditTitle(node.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameNode(id, editTitle.trim());
    }
    setEditingNodeId(null);
  };

  const getNodeIcon = (node: TreeNode) => {
    if (node.isEncrypted) return <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    
    // Only display folder icon if the node currently has child notes
    const hasChildren = Boolean(node.children && node.children.length > 0);
    if (hasChildren) {
      return <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-100 shrink-0" />;
    }

    switch (node.type) {
      case 'spreadsheet':
        return <Table className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
      case 'code':
        return <Code className="w-3.5 h-3.5 text-yellow-600 shrink-0" />;
      case 'bookmark':
        return <Bookmark className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
      case 'encrypted':
        return <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
    }
  };

  // Drag Handlers
  const handleDragStart = (nodeId: string, e: React.DragEvent) => {
    setDraggedNodeId(nodeId);
    e.dataTransfer.setData('text/plain', nodeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedNodeId(null);
    setDragOverNodeId(null);
    setDropPosition(null);
    setIsOverRootDropZone(false);
    setIsOverPromoteDropZone(false);
  };

  const handleDragOverNode = (nodeId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedNodeId || draggedNodeId === nodeId) return;

    // Check circular drop
    if (isDescendant(draggedNodeId, nodeId)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    e.dataTransfer.dropEffect = 'move';

    // Calculate vertical ratio within node item for (before / inside / after)
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const height = rect.height;

    let pos: DropPosition = 'inside';
    if (offsetY < height * 0.28) {
      pos = 'before';
    } else if (offsetY > height * 0.72) {
      pos = 'after';
    } else {
      pos = 'inside';
    }

    setDragOverNodeId(nodeId);
    setDropPosition(pos);
  };

  const handleDropOnNode = (targetNodeId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceId = e.dataTransfer.getData('text/plain') || draggedNodeId;
    const finalPos = dropPosition || 'inside';

    setDragOverNodeId(null);
    setDropPosition(null);
    setDraggedNodeId(null);

    if (!sourceId || sourceId === targetNodeId) return;

    // Prevent moving parent into its own child
    if (isDescendant(sourceId, targetNodeId)) {
      return;
    }

    // Auto expand the target folder if inserting inside
    if (finalPos === 'inside') {
      setExpandedNodeIds((prev) => new Set(prev).add(targetNodeId));
    }

    onMoveNode(sourceId, targetNodeId, finalPos);
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceId = e.dataTransfer.getData('text/plain') || draggedNodeId;
    setIsOverRootDropZone(false);
    setIsOverPromoteDropZone(false);
    setDragOverNodeId(null);
    setDropPosition(null);
    setDraggedNodeId(null);

    if (sourceId) {
      onMoveNode(sourceId, null, 'root');
    }
  };

  const handleDropOnPromote = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceId = e.dataTransfer.getData('text/plain') || draggedNodeId;
    setIsOverRootDropZone(false);
    setIsOverPromoteDropZone(false);
    setDragOverNodeId(null);
    setDropPosition(null);
    setDraggedNodeId(null);

    if (sourceId) {
      if (onPromoteNode) {
        onPromoteNode(sourceId);
      } else {
        onMoveNode(sourceId, null, 'promote');
      }
    }
  };

  const draggedNode = draggedNodeId ? nodes[draggedNodeId] : null;
  const draggedParent = draggedNode?.parentId ? nodes[draggedNode.parentId] : null;

  const renderNode = (nodeId: string, depth = 0) => {
    const node = nodes[nodeId];
    if (!node) return null;

    // Filter by bookmark if enabled
    if (isBookmarkFiltered && !node.isBookmarked) {
      const hasMatchingChild = (childrenIds?: string[]): boolean => {
        if (!childrenIds) return false;
        return childrenIds.some((cid) => {
          const c = nodes[cid];
          if (!c) return false;
          if (c.isBookmarked) return true;
          return hasMatchingChild(c.children);
        });
      };
      if (!hasMatchingChild(node.children)) return null;
    }

    // Filter by tag if selected
    if (selectedTagFilter && !node.tags.includes(selectedTagFilter)) {
      const hasMatchingChild = (childrenIds?: string[]): boolean => {
        if (!childrenIds) return false;
        return childrenIds.some((cid) => {
          const c = nodes[cid];
          if (!c) return false;
          if (c.tags.includes(selectedTagFilter)) return true;
          return hasMatchingChild(c.children);
        });
      };
      if (!hasMatchingChild(node.children)) return null;
    }

    // Filter by search query if typed
    if (treeSearchQuery.trim()) {
      const match = node.title.toLowerCase().includes(treeSearchQuery.toLowerCase());
      const hasMatchingChild = (childrenIds?: string[]): boolean => {
        if (!childrenIds) return false;
        return childrenIds.some((cid) => {
          const c = nodes[cid];
          if (!c) return false;
          if (c.title.toLowerCase().includes(treeSearchQuery.toLowerCase())) return true;
          return hasMatchingChild(c.children);
        });
      };
      if (!match && !hasMatchingChild(node.children)) return null;
    }

    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodeIds.has(nodeId);
    const isSelected = nodeId === activeNodeId;
    const isBeingDragged = draggedNodeId === nodeId;
    const isDragOver = dragOverNodeId === nodeId;

    return (
      <div 
        key={node.id} 
        className={`select-none text-xs transition-colors ${
          isBeingDragged ? 'opacity-35' : ''
        }`}
      >
        <div
          id={`tree-node-${node.id}`}
          draggable={editingNodeId !== node.id}
          onDragStart={(e) => handleDragStart(node.id, e)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOverNode(node.id, e)}
          onDrop={(e) => handleDropOnNode(node.id, e)}
          onClick={() => onSelectNode(node.id)}
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
          className={`group relative flex items-center justify-between py-1 pr-2 rounded transition-all cursor-pointer border ${
            isDragOver && dropPosition === 'inside'
              ? 'bg-blue-100/90 border-blue-500 ring-2 ring-blue-400 text-blue-950 font-bold shadow-xs' 
              : isSelected 
                ? 'bg-blue-100/90 text-blue-950 font-medium border-blue-300 shadow-2xs' 
                : 'text-slate-700 border-transparent hover:bg-[#f3efe6]/80'
          }`}
          title="ドラッグして他のフォルダ・ノートの上/中/下に移動可能"
        >
          {/* Drop Before Indicator Line */}
          {isDragOver && dropPosition === 'before' && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 z-20 flex items-center pointer-events-none rounded-full">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 -ml-1 border-2 border-white shadow-xs" />
              <span className="ml-auto text-[9px] bg-blue-600 text-white font-bold px-1 rounded-xs shadow-2xs mr-1">
                ↑ 直前に配置
              </span>
            </div>
          )}

          {/* Drop After Indicator Line */}
          {isDragOver && dropPosition === 'after' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 z-20 flex items-center pointer-events-none rounded-full">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 -ml-1 border-2 border-white shadow-xs" />
              <span className="ml-auto text-[9px] bg-blue-600 text-white font-bold px-1 rounded-xs shadow-2xs mr-1">
                ↓ 直後に配置
              </span>
            </div>
          )}

          <div className="flex items-center space-x-1.5 min-w-0 flex-1">
            {/* Drag Handle */}
            <div 
              className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-700 cursor-grab active:cursor-grabbing -ml-1 mr-0.5"
              title="ドラッグして並び替え・階層移動"
            >
              <GripVertical className="w-3 h-3" />
            </div>

            {/* Expand / Collapse toggle */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.id, e)}
                className="p-0.5 hover:bg-slate-300 rounded text-slate-500 shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}

            {/* Custom Color Badge */}
            {node.colorBadge ? (
              <span
                className="w-3 h-3 rounded-xs shrink-0 border border-black/15 shadow-2xs"
                style={{ backgroundColor: node.colorBadge }}
                title={`カラーバッジ: ${node.colorBadge}`}
              />
            ) : (
              getNodeIcon(node)
            )}

            {/* Title / Inline Rename Input */}
            {editingNodeId === node.id ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => handleSaveRename(node.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename(node.id);
                  if (e.key === 'Escape') setEditingNodeId(null);
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="px-1.5 py-0.5 text-xs bg-white border border-blue-500 rounded text-slate-900 w-full focus:outline-hidden shadow-xs"
              />
            ) : (
              <span className="truncate text-[11px] leading-tight text-slate-800 flex-1 flex items-center gap-1">
                <span className="truncate">{node.title}</span>
                {node.isBookmarked && (
                  <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-400 shrink-0" title="ブックマーク登録済み" />
                )}
                {isDragOver && dropPosition === 'inside' && (
                  <span className="ml-1 text-[10px] text-blue-800 bg-blue-200 px-1 py-0.2 rounded font-bold shadow-2xs">
                    ↳ 子ノートに配置
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Action buttons (hover or when selected) */}
          <div className={`flex items-center space-x-0.5 shrink-0 ml-1.5 ${
            isSelected || node.isBookmarked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } transition-opacity`}>
            {/* Bookmark star toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark?.(node.id);
              }}
              title={node.isBookmarked ? 'ブックマークを解除' : 'ブックマークに追加 (Ctrl+D)'}
              className={`p-1 hover:bg-amber-100 rounded transition ${
                node.isBookmarked ? 'text-amber-500' : 'text-slate-400 hover:text-amber-600'
              }`}
            >
              <Star className={`w-3 h-3 ${node.isBookmarked ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>

            {/* Add child note */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddChildNode(node.id);
                setExpandedNodeIds((prev) => new Set(prev).add(node.id));
              }}
              title="この配下に子ノートを追加"
              className="p-1 hover:bg-emerald-100 hover:text-emerald-700 rounded text-slate-600 transition"
            >
              <Plus className="w-3 h-3" />
            </button>

            {/* Rename note */}
            <button
              type="button"
              onClick={(e) => startRename(node, e)}
              title="タイトルを変更"
              className="p-1 hover:bg-blue-100 hover:text-blue-700 rounded text-slate-600 transition"
            >
              <Edit3 className="w-3 h-3" />
            </button>

            {/* Delete note */}
            <button
              type="button"
              id={`delete-btn-${node.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNode(node.id);
              }}
              title="このノート/フォルダを削除"
              className="p-1 hover:bg-red-100 hover:text-red-700 rounded text-red-500 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Render child nodes if expanded */}
        {hasChildren && isExpanded && (
          <div className="border-l border-slate-300 ml-3.5 my-0.5 pl-0.5">
            {node.children!.map((cid) => renderNode(cid, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const activeNode = nodes[activeNodeId];
  const bookmarkedCount = (Object.values(nodes) as TreeNode[]).filter((n) => n.isBookmarked).length;

  return (
    <div id="tree-sidebar" className="w-72 bg-[#fbf9f6] border-r border-slate-300 flex flex-col shrink-0 select-none">
      {/* Tree header toolbar */}
      <div className="p-2 bg-[#f3efe6] border-b border-slate-300 flex flex-col space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1">
            <Folder className="w-3.5 h-3.5 text-blue-600" />
            <span>階層ツリー & 整理</span>
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setExpandedNodeIds(new Set(Object.keys(nodes)))}
              title="すべての階層を展開"
              className="px-1.5 py-0.5 text-[10px] bg-white hover:bg-[#fdfcfb] text-slate-700 rounded border border-slate-300 shadow-2xs"
            >
              全展開
            </button>
            <button
              onClick={() => setExpandedNodeIds(new Set())}
              title="すべての階層を折りたたむ"
              className="px-1.5 py-0.5 text-[10px] bg-white hover:bg-[#fdfcfb] text-slate-700 rounded border border-slate-300 shadow-2xs"
            >
              全折畳
            </button>
          </div>
        </div>

        {/* Quick Filter: Bookmarks */}
        {bookmarkedCount > 0 && onToggleBookmarkFilter && (
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={onToggleBookmarkFilter}
              title={isBookmarkFiltered ? 'ブックマーク絞り込みを解除' : 'ブックマーク登録されたノートのみツリーに表示'}
              className={`flex-1 py-1 px-2 rounded text-[10px] font-bold border flex items-center justify-center space-x-1.5 transition shadow-2xs ${
                isBookmarkFiltered
                  ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-xs'
                  : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-300'
              }`}
            >
              <Star className={`w-3 h-3 ${isBookmarkFiltered ? 'fill-amber-950 text-amber-950' : 'text-amber-500 fill-amber-400'}`} />
              <span>★ ブックマーク ({bookmarkedCount})</span>
              {isBookmarkFiltered && (
                <span className="ml-1 bg-amber-950 text-white text-[9px] px-1 rounded-xs">絞込中</span>
              )}
            </button>
          </div>
        )}

        {/* Quick action bar for active node */}
        {activeNode && (
          <div className="flex flex-col bg-white border border-slate-300 rounded p-1.5 text-[11px] shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="truncate text-slate-700 text-[11px] font-semibold max-w-[140px]" title={activeNode.title}>
                選択: {activeNode.title}
              </span>
              <div className="flex items-center space-x-0.5">
                {/* Promote (Raise hierarchy) */}
                {activeNode.parentId && onPromoteNode && (
                  <button
                    onClick={() => onPromoteNode(activeNode.id)}
                    title="階層を1段上げる (親階層へ昇格)"
                    className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200 transition"
                  >
                    <CornerLeftUp className="w-3 h-3" />
                  </button>
                )}
                {/* Demote (Indent into previous sibling) */}
                {onDemoteNode && (
                  <button
                    onClick={() => onDemoteNode(activeNode.id)}
                    title="階層を1段下げる (上のノート配下にインデント)"
                    className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded border border-amber-200 transition"
                  >
                    <CornerDownRight className="w-3 h-3" />
                  </button>
                )}
                {/* Move Up */}
                {onReorderNode && (
                  <button
                    onClick={() => onReorderNode(activeNode.id, 'up')}
                    title="上へ並び替え (Alt+Up)"
                    className="p-1 hover:bg-[#fbf9f6] text-slate-700 rounded border border-slate-200 transition"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                )}
                {/* Move Down */}
                {onReorderNode && (
                  <button
                    onClick={() => onReorderNode(activeNode.id, 'down')}
                    title="下へ並び替え (Alt+Down)"
                    className="p-1 hover:bg-[#fbf9f6] text-slate-700 rounded border border-slate-200 transition"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => onDeleteNode(activeNode.id)}
                  title="選択中のノートを削除"
                  className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tree Search filter */}
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="ツリー内をキーワードで絞り込み..."
            value={treeSearchQuery}
            onChange={(e) => setTreeSearchQuery(e.target.value)}
            className="w-full pl-6 pr-2 py-1 text-[11px] bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        {/* Tag filter notification if active */}
        {selectedTagFilter && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-800 px-2 py-1 rounded text-[11px]">
            <span className="truncate">タグ絞り込み: <strong>{selectedTagFilter}</strong></span>
            <button onClick={onClearTagFilter} className="text-blue-600 hover:underline font-bold ml-1">✕</button>
          </div>
        )}
      </div>

      {/* Drag & drop guide banner */}
      <div className="bg-amber-50/90 border-b border-amber-200 px-2 py-1 text-[10px] text-amber-900 flex items-center justify-between">
        <span>✋ 上/中/下にドラッグして順番・階層変更</span>
      </div>

      {/* Hierarchical Outliner Tree list */}
      <div 
        className="flex-1 overflow-y-auto p-1.5 space-y-0.5"
        onDragOver={(e) => {
          e.preventDefault();
          if (!draggedNodeId) return;
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={handleDropOnRoot}
      >
        {/* Promoting drop zone (Visible when dragging a child note) */}
        {draggedNode?.parentId && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsOverPromoteDropZone(true);
            }}
            onDragLeave={() => setIsOverPromoteDropZone(false)}
            onDrop={handleDropOnPromote}
            className={`mb-2 p-2 border-2 border-dashed rounded-lg text-center text-xs font-semibold transition-all cursor-copy ${
              isOverPromoteDropZone
                ? 'border-indigo-600 bg-indigo-100 text-indigo-950 scale-[1.02] shadow-sm'
                : 'border-indigo-300 bg-indigo-50/80 text-indigo-700 hover:border-indigo-400'
            }`}
          >
            <div className="flex items-center justify-center space-x-1">
              <CornerLeftUp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">⬆️ 親（{draggedParent?.title || '親階層'}）から出して1段昇格</span>
            </div>
          </div>
        )}

        {rootNodeIds.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs">
            ノートがありません。「新規ノート」ボタンから作成してください。
          </div>
        ) : (
          rootNodeIds.map((rid) => renderNode(rid, 0))
        )}

        {/* Drop zone for moving node back to root level */}
        {draggedNodeId && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsOverRootDropZone(true);
            }}
            onDragLeave={() => setIsOverRootDropZone(false)}
            onDrop={handleDropOnRoot}
            className={`mt-3 p-2.5 border-2 border-dashed rounded-lg text-center text-xs transition-all ${
              isOverRootDropZone
                ? 'border-blue-500 bg-blue-100 text-blue-900 font-bold scale-[1.02]'
                : 'border-slate-300 bg-[#fdfcfb] text-slate-600 hover:border-slate-400'
            }`}
          >
            📂 ここにドロップするとルート（最上位）階層へ移動
          </div>
        )}
      </div>

      {/* Bottom quick actions */}
      <div className="p-2 border-t border-slate-300 bg-[#f3efe6] flex items-center space-x-1.5">
        <button
          onClick={() => onAddChildNode(null)}
          className="flex-1 flex items-center justify-center space-x-1 bg-white hover:bg-[#fdfcfb] border border-slate-300 text-slate-800 px-2 py-1.5 rounded text-xs shadow-2xs font-medium transition"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-600" />
          <span>+ ノート作成</span>
        </button>
      </div>
    </div>
  );
};
