import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldHandleRenameTabFolder = `  const handleRenameTabFolder = (folderId: string, newName: string) => {`;
const newHandleRenameTabFolder = `  const handleRenameNotebook = (notebookId: string, newName: string) => {
    setNotebooks((prev) =>
      prev.map((nb) => (nb.id === notebookId ? { ...nb, name: newName } : nb))
    );
  };

  const handleRenameTabFolder = (folderId: string, newName: string) => {`;

content = content.replace(oldHandleRenameTabFolder, newHandleRenameTabFolder);

const oldProps = `        onAddNotebook={handleAddNotebook}
        onDeleteNotebook={handleDeleteNotebook}
        onRestoreNotebooks={handleRestoreNotebooks}`;
const newProps = `        onAddNotebook={handleAddNotebook}
        onDeleteNotebook={handleDeleteNotebook}
        onRestoreNotebooks={handleRestoreNotebooks}
        onRenameNotebook={handleRenameNotebook}`;
content = content.replace(oldProps, newProps);

const oldPropsTabList = `            onAddNotebookToFolder={(folderId, name, color) => handleAddNotebook(name, color || '#e0f2fe', folderId)}
            onMoveNotebookToFolder={handleMoveNotebookToFolder}
            onDeleteNotebook={handleDeleteNotebook}`;
const newPropsTabList = `            onAddNotebookToFolder={(folderId, name, color) => handleAddNotebook(name, color || '#e0f2fe', folderId)}
            onMoveNotebookToFolder={handleMoveNotebookToFolder}
            onDeleteNotebook={handleDeleteNotebook}
            onRenameNotebook={handleRenameNotebook}`;
content = content.replace(oldPropsTabList, newPropsTabList);

fs.writeFileSync('src/App.tsx', content);
