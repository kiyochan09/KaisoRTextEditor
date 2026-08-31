import fs from 'fs';

let content = fs.readFileSync('./src/types.ts', 'utf8');

content = content.replace(
  "pagePadding?: 'compact' | 'normal' | 'spacious';",
  "pagePadding?: 'compact' | 'normal' | 'spacious';\n  showRuler?: boolean;"
);

fs.writeFileSync('./src/types.ts', content);
