import fs from 'fs';

let content = fs.readFileSync('./src/App.tsx', 'utf8');

content = content.replace(
  /settings=\{systemSettings\}\n      \/>/,
  "settings={systemSettings}\n        onDeleteStyle={handleDeleteStyle}\n      />"
);

fs.writeFileSync('./src/App.tsx', content, 'utf8');
