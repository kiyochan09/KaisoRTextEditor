import fs from 'fs';

let content = fs.readFileSync('src/components/NotebookTabBar.tsx', 'utf8');

// Remove unused functions
content = content.replace(/const closeTab = [\s\S]*?};\n/g, '');
content = content.replace(/const closeRightTabs = [\s\S]*?};\n/g, '');
content = content.replace(/const closeOtherTabs = [\s\S]*?};\n/g, '');

// Remove the hover delete button (X button on tabs)
content = content.replace(/\{\/\* Optional tab delete \*\/\}[\s\S]*?<\/span>\s*\)\}/g, '');

const menuStart = content.indexOf('{contextMenuState && (');
const menuEnd = content.indexOf('    </div>\n  );\n};');

if (menuStart !== -1 && menuEnd !== -1) {
  const beforeMenu = content.substring(0, menuStart);
  const afterMenu = content.substring(menuEnd);

  const newMenu = `{contextMenuState && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenuState(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenuState(null);
            }}
          />
          <div
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
          </div>
        </>
      )}`;

  content = beforeMenu + newMenu + afterMenu;
}

fs.writeFileSync('src/components/NotebookTabBar.tsx', content);
