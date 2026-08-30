import fs from 'fs';
let content = fs.readFileSync('./src/components/CreateDatabaseModal.tsx', 'utf8');

content = content.replace(
    "setCustomPath(`~/Documents/HierarchicalNotes/${sanitizedName}/`);",
    "setCustomPath(`~/Documents/HierarchicalNotes/${sanitizedName}${storageType === 'custom_file' ? '.json' : '/'}`);"
);
content = content.replace(
    "setCustomPath(`~/Desktop/HierarchicalNotes/${sanitizedName}/`);",
    "setCustomPath(`~/Desktop/HierarchicalNotes/${sanitizedName}${storageType === 'custom_file' ? '.json' : '/'}`);"
);
content = content.replace(
    "}, [dbName, selectedFolderPreset]);",
    "}, [dbName, selectedFolderPreset, storageType]);"
);

fs.writeFileSync('./src/components/CreateDatabaseModal.tsx', content);
