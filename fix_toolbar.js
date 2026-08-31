import fs from 'fs';

let content = fs.readFileSync('./src/components/EditorToolbar.tsx', 'utf8');

// Remove noteType and onChangeNoteType from EditorToolbarProps
content = content.replace('  noteType: NoteType;\n  onChangeNoteType: (type: NoteType) => void;\n', '');
content = content.replace('  noteType,\n  onChangeNoteType,\n', '');

// Wait, I should not remove noteType completely, because we need to know if it's 'rich' or not to display the tools.
// But wait, it seems `EditorToolbarProps` uses `NoteType`.
// And TopMenuBar also needs NoteType? No, TopMenuBar uses `string` in my previous edit.
fs.writeFileSync('./src/components/EditorToolbar.tsx', content);
