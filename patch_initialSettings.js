import fs from 'fs';

let content = fs.readFileSync('./src/data/initialSettings.ts', 'utf8');

content = content.replace(
  "pagePadding: 'normal',",
  "pagePadding: 'normal',\n  showRuler: false,"
);

fs.writeFileSync('./src/data/initialSettings.ts', content);
