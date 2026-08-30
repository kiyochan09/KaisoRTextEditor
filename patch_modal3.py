import sys
content = open('./src/components/CreateDatabaseModal.tsx', 'r').read()

content = content.replace(
    'setCustomPath(`~/Documents/HierarchicalNotes/${sanitizedName}/`);',
    'setCustomPath(`~/Documents/HierarchicalNotes/${sanitizedName}${storageType === \\'custom_file\\' ? \\'.json\\' : \\'/\\'}`);'
)
content = content.replace(
    'setCustomPath(`~/Desktop/HierarchicalNotes/${sanitizedName}/`);',
    'setCustomPath(`~/Desktop/HierarchicalNotes/${sanitizedName}${storageType === \\'custom_file\\' ? \\'.json\\' : \\'/\\'}`);'
)

# And add storageType to the dependency array
content = content.replace(
    '}, [dbName, selectedFolderPreset]);',
    '}, [dbName, selectedFolderPreset, storageType]);'
)

open('./src/components/CreateDatabaseModal.tsx', 'w').write(content)
