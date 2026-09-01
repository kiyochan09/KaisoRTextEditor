import fs from 'fs';
let content = fs.readFileSync('src/components/NotebookTabBar.tsx', 'utf8');

const closeThisTab = `            <button
              className="w-full px-4 py-2 text-left hover:bg-stone-100 text-stone-700 flex items-center space-x-2"
              onClick={() => {
                if (onHideNotebooks) {
                  onHideNotebooks([contextMenuState.tabId]);
                }
                setContextMenuState(null);
              }}
            >
              <X className="w-4 h-4 text-stone-500" />
              <span>タブを閉じる (非表示)</span>
            </button>`;

content = content.replace(closeThisTab, '');
fs.writeFileSync('src/components/NotebookTabBar.tsx', content);
