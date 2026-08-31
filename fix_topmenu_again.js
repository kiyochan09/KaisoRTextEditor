import fs from 'fs';

let content = fs.readFileSync('./src/components/TopMenuBar.tsx', 'utf8');

// Ensure activeNoteType and onChangeNoteType exist on the interface
if (!content.includes('activeNoteType?: NoteType;')) {
  content = content.replace(
    '  activeNotebookName: string;',
    '  activeNotebookName: string;\n  activeNoteType?: NoteType;\n  onChangeNoteType?: (type: any) => void;'
  );
}

// Ensure activeNoteType and onChangeNoteType exist in destructuring
if (!content.includes('activeNoteType,')) {
  content = content.replace(
    '  activeNotebookName,\n',
    '  activeNotebookName,\n  activeNoteType,\n  onChangeNoteType,\n'
  );
}

fs.writeFileSync('./src/components/TopMenuBar.tsx', content);
