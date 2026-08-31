import fs from 'fs';

let content = fs.readFileSync('./src/components/TopMenuBar.tsx', 'utf8');

// Add import for NoteType
content = content.replace(
  'import { Folder, Search, FileText, ChevronDown, Check, Download, AlertTriangle, Book, FileCode2, Settings } from \'lucide-react\';',
  'import { Folder, Search, FileText, ChevronDown, Check, Download, AlertTriangle, Book, FileCode2, Settings } from \'lucide-react\';\nimport { NoteType } from \'../types\';'
);

content = content.replace(
  'activeNoteType?: string;\n  onChangeNoteType?: (type: any) => void;',
  'activeNoteType?: NoteType;\n  onChangeNoteType?: (type: NoteType) => void;'
);

fs.writeFileSync('./src/components/TopMenuBar.tsx', content);
