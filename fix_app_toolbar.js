import fs from 'fs';

let content = fs.readFileSync('./src/App.tsx', 'utf8');

content = content.replace(
  '              onChangeNoteType={(type) => handleChangeNodeType(activeNode.id, type)}\n',
  ''
);

fs.writeFileSync('./src/App.tsx', content);
