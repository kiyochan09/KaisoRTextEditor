import fs from 'fs';

// Fix EditorToolbar.tsx
let editorContent = fs.readFileSync('./src/components/EditorToolbar.tsx', 'utf8');

const colorBadgesCode = `
const NODE_COLOR_BADGES = [
  { name: 'ブルー (標準)', color: '#60a5fa' },
  { name: 'オレンジ', color: '#fb923c' },
  { name: 'パープル', color: '#c084fc' },
  { name: 'イエロー', color: '#fde047' },
  { name: 'グリーン', color: '#86efac' },
  { name: 'シアン', color: '#67e8f9' },
  { name: 'ピンク', color: '#f472b6' },
  { name: 'レッド', color: '#ef4444' },
];
`;

editorContent = editorContent.replace('import { NODE_COLOR_BADGES } from \'../data/initialData\';', '');
editorContent = editorContent.replace('export const EditorToolbar', colorBadgesCode + '\nexport const EditorToolbar');
fs.writeFileSync('./src/components/EditorToolbar.tsx', editorContent);


// Fix TopMenuBar.tsx
let topMenuContent = fs.readFileSync('./src/components/TopMenuBar.tsx', 'utf8');
if (!topMenuContent.includes('import { NoteType } from')) {
  topMenuContent = topMenuContent.replace(
    'import { DatabaseProfile } from \'../types\';',
    'import { DatabaseProfile, NoteType } from \'../types\';'
  );
  fs.writeFileSync('./src/components/TopMenuBar.tsx', topMenuContent);
}

