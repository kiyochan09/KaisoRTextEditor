import fs from 'fs';

let content = fs.readFileSync('./src/components/EditorToolbar.tsx', 'utf8');

content = content.replace(
  /\s*\{\/\* Ruler Toggle \*\/\}\s*<button\s*onClick=\{onToggleRuler\}[\s\S]*?ルーラー\s*<\/button>/,
  ''
);

fs.writeFileSync('./src/components/EditorToolbar.tsx', content);
