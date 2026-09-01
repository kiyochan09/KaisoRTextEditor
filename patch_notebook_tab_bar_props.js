import fs from 'fs';

let content = fs.readFileSync('src/components/NotebookTabBar.tsx', 'utf8');

content = content.replace(
  '  onRenameNotebook?: (id: string, name: string) => void;',
  '  onRenameNotebook?: (id: string, name: string) => void;\n  onHideNotebooks?: (ids: string[]) => void;'
);

content = content.replace(
  '  onRenameNotebook,\n})',
  '  onRenameNotebook,\n  onHideNotebooks,\n})'
);

const oldFilter = `  const displayedNotebooks = activeFolderId
    ? notebooks.filter((nb) => nb.folderId === activeFolderId)
    : notebooks;`;
const newFilter = `  const displayedNotebooks = (activeFolderId
    ? notebooks.filter((nb) => nb.folderId === activeFolderId)
    : notebooks).filter(nb => !nb.isHidden);`;
content = content.replace(oldFilter, newFilter);

fs.writeFileSync('src/components/NotebookTabBar.tsx', content);

