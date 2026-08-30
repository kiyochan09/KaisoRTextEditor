import fs from 'fs';
let content = fs.readFileSync('./src/App.tsx', 'utf8');
content = "import localforage from 'localforage';\n" + content;
fs.writeFileSync('./src/App.tsx', content);
