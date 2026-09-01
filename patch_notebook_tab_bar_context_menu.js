import fs from 'fs';

let content = fs.readFileSync('src/components/NotebookTabBar.tsx', 'utf8');

const oldContextMenu = `          <div
            className="fixed z-50 bg-white border border-stone-200 rounded-lg shadow-xl py-1 text-xs text-stone-800 min-w-[200px]"
            style={{ top: contextMenuState.y, left: contextMenuState.x }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <button
              className="w-full px-4 py-2 text-left hover:bg-stone-100 text-stone-700 flex items-center space-x-2"
              onClick={() => {
                if (onHideNotebooks) {
                  const targetIndex = displayedNotebooks.findIndex(nb => nb.id === contextMenuState.tabId);
                  if (targetIndex !== -1 && targetIndex < displayedNotebooks.length - 1) {
                    const idsToHide = displayedNotebooks.slice(targetIndex + 1).map(nb => nb.id);
                    onHideNotebooks(idsToHide);
                  }
                }
                setContextMenuState(null);
              }}
            >
              <ArrowRightToLine className="w-4 h-4 text-stone-500" />
              <span>右側のタブを閉じる</span>
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-stone-100 text-stone-700 flex items-center space-x-2"
              onClick={() => {
                if (onHideNotebooks) {
                  const idsToHide = displayedNotebooks.filter(nb => nb.id !== contextMenuState.tabId).map(nb => nb.id);
                  if (idsToHide.length > 0) {
                    onHideNotebooks(idsToHide);
                  }
                }
                setContextMenuState(null);
              }}
            >
              <ArrowRightLeft className="w-4 h-4 text-stone-500" />
              <span>このタブ以外を閉じる</span>
            </button>
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
            <div className="border-t border-stone-200 my-1"></div>
            <button
              className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center space-x-2 font-bold"
              onClick={() => {
                if (window.confirm('本当にこのタブを削除しますか？')) {
                  if (onDeleteNotebook) onDeleteNotebook(contextMenuState.tabId);
                }
                setContextMenuState(null);
              }}
            >
              <Trash2 className="w-4 h-4" />
              <span>タブを削除する</span>
            </button>
          </div>`;

const newContextMenu = `          <div
            className="fixed z-50 bg-white border border-stone-200 rounded-lg shadow-xl py-1 text-xs text-stone-800 min-w-[220px]"
            style={{ top: contextMenuState.y, left: contextMenuState.x }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <button
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
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-stone-100 text-stone-700 flex items-center space-x-2"
              onClick={() => {
                if (onHideNotebooks) {
                  const targetIndex = displayedNotebooks.findIndex(nb => nb.id === contextMenuState.tabId);
                  if (targetIndex !== -1 && targetIndex < displayedNotebooks.length - 1) {
                    const idsToHide = displayedNotebooks.slice(targetIndex + 1).map(nb => nb.id);
                    onHideNotebooks(idsToHide);
                  }
                }
                setContextMenuState(null);
              }}
            >
              <ArrowRightToLine className="w-4 h-4 text-stone-500" />
              <span>右側のタブを閉じる</span>
            </button>
            <button
              className="w-full px-4 py-2 text-left hover:bg-stone-100 text-stone-700 flex items-center space-x-2"
              onClick={() => {
                if (onHideNotebooks) {
                  const idsToHide = displayedNotebooks.filter(nb => nb.id !== contextMenuState.tabId).map(nb => nb.id);
                  if (idsToHide.length > 0) {
                    onHideNotebooks(idsToHide);
                  }
                }
                setContextMenuState(null);
              }}
            >
              <ArrowRightLeft className="w-4 h-4 text-stone-500" />
              <span>このタブ以外を閉じる</span>
            </button>
            <div className="border-t border-stone-200 my-1"></div>
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
              <span>タブ名を変更する</span>
            </button>
            <div className="border-t border-stone-200 my-1"></div>
            <button
              className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center space-x-2 font-bold"
              onClick={() => {
                if (window.confirm('本当にこのタブを削除しますか？\n（復元できなくなります）')) {
                  if (onDeleteNotebook) onDeleteNotebook(contextMenuState.tabId);
                }
                setContextMenuState(null);
              }}
            >
              <Trash2 className="w-4 h-4" />
              <span>タブを削除する</span>
            </button>
          </div>`;

content = content.replace(oldContextMenu, newContextMenu);
fs.writeFileSync('src/components/NotebookTabBar.tsx', content);

