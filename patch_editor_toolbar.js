import fs from 'fs';

let content = fs.readFileSync('./src/components/EditorToolbar.tsx', 'utf8');

// The Note Type Selector Dropdown has already been moved, so remove it from EditorToolbar
content = content.replace(
  /\{\/\* Note Type Selector Dropdown \*\/\}[\s\S]*?<\/select>\s*<\/div>/,
  ''
);

// We need to reorganize the toolbar.
// I will just rewrite the `EditorToolbar.tsx` rendering part. 
// It's easier to just match the start of the return statement and replace the whole thing.

fs.writeFileSync('./src/components/EditorToolbar.tsx', content);
