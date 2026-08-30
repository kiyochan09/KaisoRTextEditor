import fs from 'fs';
let content = fs.readFileSync('./src/components/DatabaseManagerModal.tsx', 'utf8');
content = content.replace(
  'onImportDatabase?: (file: File) => void;',
  'onImportDatabase?: (file: File) => void;\n  onExportAllDatabases?: () => void;\n  onImportAllDatabases?: (file: File) => void;'
);
content = content.replace(
  'onImportDatabase,',
  'onImportDatabase,\n  onExportAllDatabases,\n  onImportAllDatabases,'
);
fs.writeFileSync('./src/components/DatabaseManagerModal.tsx', content);
