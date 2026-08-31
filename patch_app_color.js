import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace('bg-slate-200', 'bg-[#efebe4]'); // Earth color background
fs.writeFileSync('src/App.tsx', content);
