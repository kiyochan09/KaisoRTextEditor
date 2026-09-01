import fs from 'fs';
let content = fs.readFileSync('src/components/NotebookTabBar.tsx', 'utf8');

const search = `  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenuState({ x: e.clientX, y: e.clientY, tabId });
  };`;

const replace = `  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    // Ensure menu stays within window bounds
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    setContextMenuState({ x, y, tabId });
  };`;

content = content.replace(search, replace);
fs.writeFileSync('src/components/NotebookTabBar.tsx', content);
