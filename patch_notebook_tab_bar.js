import fs from 'fs';

let content = fs.readFileSync('src/components/NotebookTabBar.tsx', 'utf8');

// 1. Add onRenameNotebook to props
content = content.replace(
  '  onDeleteNotebook?: (id: string | string[]) => void;\n  onRestoreNotebooks?: () => void;',
  '  onDeleteNotebook?: (id: string | string[]) => void;\n  onRestoreNotebooks?: () => void;\n  onRenameNotebook?: (id: string, name: string) => void;'
);

content = content.replace(
  '  onDeleteNotebook,\n  onRestoreNotebooks,\n})',
  '  onDeleteNotebook,\n  onRestoreNotebooks,\n  onRenameNotebook,\n})'
);

// 2. Add edit state
const stateReplacement = `  const [showAllTabsDropdown, setShowAllTabsDropdown] = useState(false);
  const [contextMenuState, setContextMenuState] = useState<{ x: number, y: number, tabId: string } | null>(null);
  
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState<string>('');
  
  const handleStartRename = (tabId: string, currentName: string) => {
    setEditingTabId(tabId);
    setEditingTabName(currentName);
  };
  
  const handleSaveRename = (tabId: string) => {
    if (editingTabName.trim() && onRenameNotebook) {
      onRenameNotebook(tabId, editingTabName.trim());
    }
    setEditingTabId(null);
  };
`;
content = content.replace(/  const \[showAllTabsDropdown, setShowAllTabsDropdown\] = useState\(false\);\n  const \[contextMenuState, setContextMenuState\] = useState<\{ x: number, y: number, tabId: string \} \| null>\(null\);/, stateReplacement);

// 3. Update tab render to include input when editing
const tabRenderOld = `              <button
                key={nb.id}
                id={\`notebook-tab-\${nb.id}\`}
                onClick={() => onSelectNotebook(nb.id)}
                onContextMenu={(e) => handleContextMenu(e, nb.id)}
                style={{
                  backgroundColor: isActive ? '#ffffff' : nb.color || '#fdf8f0',
                }}
                className={\`group relative px-4 py-1.5 text-xs font-semibold rounded-t-md transition-all duration-100 flex items-center space-x-2 border-t-2 border-l border-r shrink-0 cursor-pointer \${
                  isActive
                    ? 'border-t-orange-500 border-l-stone-300 border-r-stone-300 text-stone-900 shadow-sm z-10 -mb-[2px] pb-2'
                    : 'border-t-stone-300 border-l-stone-300 border-r-stone-300 text-stone-700 hover:brightness-95 opacity-85'
                }\`}
                title={nb.description || nb.name}
              >
                <span>{nb.name}</span>
                
              </button>`;
const tabRenderNew = `              <div
                key={nb.id}
                id={\`notebook-tab-\${nb.id}\`}
                onClick={() => { if (editingTabId !== nb.id) onSelectNotebook(nb.id); }}
                onContextMenu={(e) => handleContextMenu(e, nb.id)}
                style={{
                  backgroundColor: isActive ? '#ffffff' : nb.color || '#fdf8f0',
                }}
                className={\`group relative px-4 py-1.5 text-xs font-semibold rounded-t-md transition-all duration-100 flex items-center space-x-2 border-t-2 border-l border-r shrink-0 cursor-pointer \${
                  isActive
                    ? 'border-t-orange-500 border-l-stone-300 border-r-stone-300 text-stone-900 shadow-sm z-10 -mb-[2px] pb-2'
                    : 'border-t-stone-300 border-l-stone-300 border-r-stone-300 text-stone-700 hover:brightness-95 opacity-85'
                }\`}
                title={nb.description || nb.name}
              >
                {editingTabId === nb.id ? (
                  <input
                    type="text"
                    value={editingTabName}
                    onChange={(e) => setEditingTabName(e.target.value)}
                    onBlur={() => handleSaveRename(nb.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(nb.id);
                      if (e.key === 'Escape') setEditingTabId(null);
                    }}
                    autoFocus
                    className="text-xs px-1 py-0.5 border border-blue-400 rounded bg-white text-stone-900 w-24 focus:outline-none"
                  />
                ) : (
                  <span>{nb.name}</span>
                )}
              </div>`;
content = content.replace(tabRenderOld, tabRenderNew);

// 4. Update context menu (remove delete, add rename)
const contextMenuOld = `          <div
            className="fixed z-50 bg-white border border-stone-200 rounded-lg shadow-xl py-1 text-xs text-stone-800 min-w-[160px]"
            style={{ top: contextMenuState.y, left: contextMenuState.x }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="px-3 py-1.5 text-[10px] text-stone-500 font-bold bg-stone-100 border-b border-stone-200 mb-1">
              データ操作 (取り消し不可)
            </div>
            <button
              className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center space-x-2 font-bold"
              onClick={() => {
                deleteTabWithConfirm(contextMenuState.tabId);
                setContextMenuState(null);
              }}
            >
              <Trash2 className="w-4 h-4" />
              <span>このノートを完全に削除...</span>
            </button>
          </div>`;
          
const contextMenuNew = `          <div
            className="fixed z-50 bg-white border border-stone-200 rounded-lg shadow-xl py-1 text-xs text-stone-800 min-w-[160px]"
            style={{ top: contextMenuState.y, left: contextMenuState.x }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <button
              className="w-full px-4 py-2 text-left hover:bg-stone-100 text-stone-700 flex items-center space-x-2"
              onClick={() => {
                const tab = notebooks.find(n => n.id === contextMenuState.tabId);
                if (tab) {
                  handleStartRename(tab.id, tab.name);
                }
                setContextMenuState(null);
              }}
            >
              <Edit3 className="w-4 h-4 text-stone-500" />
              <span>タブ名を変更</span>
            </button>
          </div>`;
content = content.replace(contextMenuOld, contextMenuNew);

// We also need to add Edit3 to imports in NotebookTabBar if it's not there.
if (!content.includes('Edit3')) {
  content = content.replace('Plus, X, FolderOpen,', 'Edit3, Plus, X, FolderOpen,');
}

fs.writeFileSync('src/components/NotebookTabBar.tsx', content);

