import fs from 'fs';

let content = fs.readFileSync('src/components/NotebookTabBar.tsx', 'utf8');
content = content.replace(/  const deleteTabWithConfirm = [\s\S]*?};\n/, '');
fs.writeFileSync('src/components/NotebookTabBar.tsx', content);
