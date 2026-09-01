import fs from 'fs';

let content = fs.readFileSync('src/components/TabListPanel.tsx', 'utf8');

const tabListDeleteOld = `                  {onDeleteNotebook && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNotebook(tab.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-rose-100 text-stone-400 hover:text-rose-600 rounded transition"
                      title="このタブを削除"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}`;

content = content.replace(tabListDeleteOld, '');

// The user might also want rename context in the TabListPanel, but they explicitly said "タブの右クリックメニューにタブ名変更を追加せよ。"
// We just added it to NotebookTabBar's context menu.

fs.writeFileSync('src/components/TabListPanel.tsx', content);

