import fs from 'fs';

let content = fs.readFileSync('./src/App.tsx', 'utf8');

content = content.replace(
  'activeDatabaseName={currentDb?.name || \'DEMO（デモデータ）\'}',
  'activeDatabaseName={currentDb?.name || \'DEMO（デモデータ）\'}\n        activeNoteType={activeNode?.type}\n        onChangeNoteType={(type) => activeNode && handleChangeNodeType(activeNode.id, type)}'
);

fs.writeFileSync('./src/App.tsx', content);
