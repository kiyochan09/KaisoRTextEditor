import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add import
content = content.replace(
  "import { DeleteConfirmModal } from './components/DeleteConfirmModal';",
  "import { DeleteConfirmModal } from './components/DeleteConfirmModal';\nimport { RestoreModal } from './components/RestoreModal';"
);

// 2. Add state
const statePattern = "const [isInsertFootnoteOpen, setIsInsertFootnoteOpen] = useState<boolean>(false);";
content = content.replace(
  statePattern,
  statePattern + "\n  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState<boolean>(false);\n  const [restoreCandidates, setRestoreCandidates] = useState<{ id: string; name: string }[]>([]);"
);

// 3. Update handleRestoreNotebooks and remove auto-restore effect
const oldRestore = `  const handleRestoreNotebooks = () => {
    const existingNbIds = new Set(notebooks.map(nb => nb.id));
    const missingNbIds = new Set<string>();
    
    (Object.values(nodes) as TreeNode[]).forEach(node => {
      if (!existingNbIds.has(node.notebookId)) {
        missingNbIds.add(node.notebookId);
      }
    });

    if (missingNbIds.size === 0) {
      alert("すでに全てのデータが復元されています。");
      return;
    }

    const newNotebooks = Array.from(missingNbIds).map(id => {
      const rootNodes = (Object.values(nodes) as TreeNode[]).filter(n => n.notebookId === id && n.parentId === null);
      const rootNode = rootNodes.length > 0 ? rootNodes[0] : (Object.values(nodes) as TreeNode[]).find(n => n.notebookId === id);
      
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
      const hasMissing = (Object.values(nodes) as TreeNode[]).some(node => !existingNbIds.has(node.notebookId));
      if (hasMissing) {
        handleRestoreNotebooks();
      }
    }
  }, [nodes, notebooks.length]);`;

const newRestore = `  const handleRestoreNotebooks = () => {
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
  };

  const executeRestore = (folderId: string | null) => {
    const newNotebooks: Notebook[] = restoreCandidates.map(c => {
      const rootNodes = (Object.values(nodes) as TreeNode[]).filter(n => n.notebookId === c.id && n.parentId === null);
      return {
        id: c.id,
        name: c.name,
        color: '#fef3c7',
        bgClass: 'bg-amber-100',
        borderClass: 'border-amber-300',
        nodeIds: rootNodes.map(n => n.id),
        folderId: folderId
      };
    });

    setNotebooks(prev => [...prev, ...newNotebooks]);
    setActiveNotebookId(newNotebooks[0].id);
    if (folderId !== undefined) {
      setActiveTabFolderId(folderId);
    }
    setIsRestoreModalOpen(false);
  };`;

content = content.replace(oldRestore, newRestore);

// 4. Add RestoreModal inside the render
const modalSpot = "{/* Safe In-App Delete Confirmation Modal */}";
content = content.replace(
  modalSpot,
  `{/* Restore Modal */}
      <RestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onConfirm={executeRestore}
        restoreCandidates={restoreCandidates}
        tabFolders={tabFolders}
      />
      
      ` + modalSpot
);

fs.writeFileSync('src/App.tsx', content);

