import fs from 'fs';

let content = fs.readFileSync('./src/components/DatabaseManagerModal.tsx', 'utf8');

// Add to props
content = content.replace(
  'onImportDatabase?: (file: File) => void;',
  'onImportDatabase?: (file: File) => void;\n  onExportAllDatabases?: () => void;\n  onImportAllDatabases?: (file: File) => void;'
);

// Destructure
content = content.replace(
  'onImportDatabase,',
  'onImportDatabase,\n  onExportAllDatabases,\n  onImportAllDatabases,'
);

// Add the UI buttons at the bottom of the modal, in the footer or before it. Let's find the footer.
