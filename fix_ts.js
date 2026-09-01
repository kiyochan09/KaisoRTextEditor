import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/Object\.values\(nodes\)\.forEach/g, '(Object.values(nodes) as TreeNode[]).forEach');
content = content.replace(/Object\.values\(nodes\)\.filter/g, '(Object.values(nodes) as TreeNode[]).filter');
content = content.replace(/Object\.values\(nodes\)\.find/g, '(Object.values(nodes) as TreeNode[]).find');
content = content.replace(/Object\.values\(nodes\)\.some/g, '(Object.values(nodes) as TreeNode[]).some');
fs.writeFileSync('src/App.tsx', content);
