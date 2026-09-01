import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldFuncStr = `  const handleRestoreNotebooks = () => {
    const existingNbIds = new Set(notebooks.map(nb => nb.id));
    const missingNbIds = new Set<string>();
    
    Object.values(nodes).forEach(node => {
      if (!existingNbIds.has(node.notebookId)) {
        missingNbIds.add(node.notebookId);
      }
    });

    if (missingNbIds.size === 0) {
      alert("裏側に残っている、復元可能なデータは見つかりませんでした。");
      return;
    }

    const newNotebooks = Array.from(missingNbIds).map(id => {
      const rootNodes = Object.values(nodes).filter(n => n.notebookId === id && n.parentId === null);
      const rootNode = rootNodes.length > 0 ? rootNodes[0] : Object.values(nodes).find(n => n.notebookId === id);
      
      return {
        id,
        name: rootNode ? \`復元: \${rootNode.title}\` : \`復元されたタブ (\${id.slice(0, 4)})\`,
        color: '#fef3c7',
        bgClass: 'bg-amber-100',
        borderClass: 'border-amber-300',
        nodeIds: rootNodes.map(n => n.id)
      };
    });

    setNotebooks(prev => [...prev, ...newNotebooks]);
    alert(\`\${newNotebooks.length} 個のタブ（ノートブック）とそれに紐づくデータを復元しました！\\n画面のタブ一覧をご確認ください。\`);
  };`;

const newFuncStr = `  const handleRestoreNotebooks = () => {
    const existingNbIds = new Set(notebooks.map(nb => nb.id));
    const missingNbIds = new Set<string>();
    
    Object.values(nodes).forEach(node => {
      if (!existingNbIds.has(node.notebookId)) {
        missingNbIds.add(node.notebookId);
      }
    });

    if (missingNbIds.size === 0) {
      alert("すでに全てのデータが復元されています。");
      return;
    }

    const newNotebooks = Array.from(missingNbIds).map(id => {
      const rootNodes = Object.values(nodes).filter(n => n.notebookId === id && n.parentId === null);
      const rootNode = rootNodes.length > 0 ? rootNodes[0] : Object.values(nodes).find(n => n.notebookId === id);
      
      return {
        id,
        name: rootNode ? \`\${rootNode.title}\` : \`復元タブ (\${id.slice(0, 4)})\`,
        color: '#fef3c7',
        bgClass: 'bg-amber-100',
        borderClass: 'border-amber-300',
        nodeIds: rootNodes.map(n => n.id),
        folderId: activeTabFolderId // 確実に見えるように現在のフォルダに割り当て
      };
    });

    setNotebooks(prev => [...prev, ...newNotebooks]);
    setActiveNotebookId(newNotebooks[0].id); // 復元したタブをすぐに表示
    
    // アラートなしでサイレントに復元、または通知
  };

  // 自動復元用エフェクト
  useEffect(() => {
    if (Object.keys(nodes).length > 0 && notebooks.length > 0) {
      const existingNbIds = new Set(notebooks.map(nb => nb.id));
      const hasMissing = Object.values(nodes).some(node => !existingNbIds.has(node.notebookId));
      if (hasMissing) {
        handleRestoreNotebooks();
      }
    }
  }, [nodes, notebooks.length]);`;

content = content.replace(oldFuncStr, newFuncStr);

fs.writeFileSync('src/App.tsx', content);

