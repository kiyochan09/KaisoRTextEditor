import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const search = `  const handleDeleteNotebook = (notebookId: string) => {
    if (notebooks.length <= 1) return;
    const remaining = notebooks.filter((nb) => nb.id !== notebookId);
    setNotebooks(remaining);
    if (activeNotebookId === notebookId) {
      handleSelectNotebook(remaining[0].id);
    }
  };`;

const replace = `  const handleDeleteNotebook = (notebookIdOrIds: string | string[]) => {
    const idsToDelete = Array.isArray(notebookIdOrIds) ? notebookIdOrIds : [notebookIdOrIds];
    if (notebooks.length <= idsToDelete.length) return;
    
    const remaining = notebooks.filter((nb) => !idsToDelete.includes(nb.id));
    setNotebooks(remaining);
    
    if (idsToDelete.includes(activeNotebookId)) {
      handleSelectNotebook(remaining[0].id);
    }
  };`;

content = content.replace(search, replace);
fs.writeFileSync('src/App.tsx', content);
