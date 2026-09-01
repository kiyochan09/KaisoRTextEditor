import fs from 'fs';

let content = fs.readFileSync('src/components/NotebookTabBar.tsx', 'utf8');

// Replace the context menu rendering with a backdrop overlay instead of document click listener
const menuStart = content.indexOf('{contextMenuState && (');
const menuEnd = content.indexOf('    </div>\n  );\n};');

if (menuStart === -1 || menuEnd === -1) {
  console.error("Could not find context menu bounds");
  process.exit(1);
}

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
            <button
              className="w-full px-4 py-2 text-left hover:bg-stone-100 flex items-center space-x-2"
              onClick={() => {
                closeTab(contextMenuState.tabId);
                setContextMenuState(null);
              }}
            >
              <X className="w-3.5 h-3.5 text-stone-500" />
              <span>タブを閉じる</span>
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-stone-100 flex items-center space-x-2"
              onClick={() => {
                closeRightTabs(contextMenuState.tabId);
                setContextMenuState(null);
              }}
            >
              <ArrowRightToLine className="w-3.5 h-3.5 text-stone-500" />
              <span>右側のタブを閉じる</span>
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-stone-100 flex items-center space-x-2"
              onClick={() => {
                closeOtherTabs(contextMenuState.tabId);
                setContextMenuState(null);
              }}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-stone-500" />
              <span>このタブ以外を閉じる</span>
            </button>
            <div className="h-px bg-stone-200 my-1 w-full" />
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
        </>
      )}
`;

fs.writeFileSync('src/components/NotebookTabBar.tsx', beforeMenu + newMenu + afterMenu);
