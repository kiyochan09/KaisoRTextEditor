import fs from 'fs';

let content = fs.readFileSync('src/components/NotebookTabBar.tsx', 'utf8');
content = content.replace(/useEffect\(\(\) => \{\n    const handleClickOutside = \(\) => setContextMenuState\(null\);\n    document.addEventListener\('click', handleClickOutside\);\n    return \(\) => document.removeEventListener\('click', handleClickOutside\);\n  \}, \[\]\);/g, '');
fs.writeFileSync('src/components/NotebookTabBar.tsx', content);
