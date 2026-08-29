import React from 'react';
import { TreeNode } from '../types';
import { Folder } from 'lucide-react';

interface BirdEyeFolderViewProps {
  nodes: Record<string, TreeNode>;
  activeNodeId: string;
  onSelectNode: (id: string) => void;
}

export const BirdEyeFolderView: React.FC<BirdEyeFolderViewProps> = ({
  nodes,
  activeNodeId,
  onSelectNode,
}) => {
  // Collect all folder nodes that have child nodes
  const folderNodes = (Object.values(nodes) as TreeNode[]).filter((n) => n.isFolder && n.children && n.children.length > 0);

  return (
    <div id="bird-eye-folders-panel" className="w-40 bg-slate-50 border-r border-slate-300 flex flex-col text-xs shrink-0 select-none">
      <div className="px-2.5 py-1.5 bg-slate-200 border-b border-slate-300 font-bold text-slate-700 flex items-center justify-between text-[11px]">
        <div className="flex items-center space-x-1">
          <Folder className="w-3.5 h-3.5 text-amber-600" />
          <span>フォルダ一覧</span>
        </div>
      </div>

      <div className="overflow-y-auto p-1.5 space-y-1">
        {folderNodes.map((folder) => {
          const isSelected = folder.id === activeNodeId;
          return (
            <button
              key={folder.id}
              id={`bird-folder-${folder.id}`}
              onClick={() => onSelectNode(folder.id)}
              className={`w-full text-left px-2 py-1 rounded text-xs transition flex items-center justify-between group ${
                isSelected
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center space-x-1.5 truncate">
                {folder.colorBadge && (
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                    style={{ backgroundColor: folder.colorBadge }}
                  />
                )}
                <span className="truncate">{folder.title.replace(/^[^a-zA-Z0-9\u3000-\u9fff\uac00-\ud7af]+/, '') || folder.title}</span>
              </div>
              {folder.children && folder.children.length > 0 && (
                <span
                  className={`text-[10px] px-1 rounded ${
                    isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {folder.children.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
