import fs from 'fs';

let content = fs.readFileSync('src/components/NotebookTabBar.tsx', 'utf8');
content = content.replace('onDeleteNotebook?: (id: string) => void;', 'onDeleteNotebook?: (id: string | string[]) => void;');

// closeRightTabs
content = content.replace(
  /const closeRightTabs = \(tabId: string\) => \{\n    if \(!onDeleteNotebook\) return;\n    const idx = displayedNotebooks.findIndex\(nb => nb.id === tabId\);\n    if \(idx !== -1\) \{\n      const toDelete = displayedNotebooks.slice\(idx \+ 1\);\n      toDelete.forEach\(nb => onDeleteNotebook\(nb.id\)\);\n    \}\n  \};/g,
  `const closeRightTabs = (tabId: string) => {
    if (!onDeleteNotebook) return;
    const idx = displayedNotebooks.findIndex(nb => nb.id === tabId);
    if (idx !== -1) {
      const toDelete = displayedNotebooks.slice(idx + 1).map(nb => nb.id);
      if (toDelete.length > 0) onDeleteNotebook(toDelete);
    }
  };`
);

// closeOtherTabs
content = content.replace(
  /const closeOtherTabs = \(tabId: string\) => \{\n    if \(!onDeleteNotebook\) return;\n    const toDelete = displayedNotebooks.filter\(nb => nb.id !== tabId\);\n    toDelete.forEach\(nb => onDeleteNotebook\(nb.id\)\);\n  \};/g,
  `const closeOtherTabs = (tabId: string) => {
    if (!onDeleteNotebook) return;
    const toDelete = displayedNotebooks.filter(nb => nb.id !== tabId).map(nb => nb.id);
    if (toDelete.length > 0) onDeleteNotebook(toDelete);
  };`
);

fs.writeFileSync('src/components/NotebookTabBar.tsx', content);
