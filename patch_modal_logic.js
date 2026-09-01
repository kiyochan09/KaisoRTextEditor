import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldLogic = `  const handleRestoreNotebooks = () => {
    const existingNbIds = new Set(notebooks.map(nb => nb.id));
    const missingNbIds = new Set<string>();
    
    (Object.values(nodes) as TreeNode[]).forEach(node => {
      if (!existingNbIds.has(node.notebookId)) {
        missingNbIds.add(node.notebookId);
      }
    });

    if (missingNbIds.size === 0) {
      alert("裏側に残っている、復元可能な迷子データは見つかりませんでした。");
      return;
    }

    const candidates = Array.from(missingNbIds).map(id => {
      const rootNodes = (Object.values(nodes) as TreeNode[]).filter(n => n.notebookId === id && n.parentId === null);
      const rootNode = rootNodes.length > 0 ? rootNodes[0] : (Object.values(nodes) as TreeNode[]).find(n => n.notebookId === id);
      return {
        id,
        name: rootNode ? rootNode.title : \`復元タブ (\${id.slice(0, 4)})\`
      };
    });

    setRestoreCandidates(candidates);
    setIsRestoreModalOpen(true);
  };`;

const newLogic = `  const handleRestoreNotebooks = () => {
    const existingNbIds = new Set(notebooks.map(nb => nb.id));
    const missingNbIds = new Set<string>();
    
    (Object.values(nodes) as TreeNode[]).forEach(node => {
      if (!existingNbIds.has(node.notebookId)) {
        missingNbIds.add(node.notebookId);
      }
    });

    const candidates = Array.from(missingNbIds).map(id => {
      const rootNodes = (Object.values(nodes) as TreeNode[]).filter(n => n.notebookId === id && n.parentId === null);
      const rootNode = rootNodes.length > 0 ? rootNodes[0] : (Object.values(nodes) as TreeNode[]).find(n => n.notebookId === id);
      return {
        id,
        name: rootNode ? rootNode.title : \`復元タブ (\${id.slice(0, 4)})\`
      };
    });

    setRestoreCandidates(candidates);
    setIsRestoreModalOpen(true);
  };`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('src/App.tsx', content);

