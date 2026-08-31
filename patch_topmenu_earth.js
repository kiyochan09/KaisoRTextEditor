import fs from 'fs';
let content = fs.readFileSync('src/components/TopMenuBar.tsx', 'utf8');

content = content.replace(/bg-slate-100/g, 'bg-[#fbf9f6]');
content = content.replace(/from-slate-50/g, 'from-[#fdfcfb]');
content = content.replace(/to-slate-200/g, 'to-[#f3efe6]');
content = content.replace(/bg-slate-200/g, 'bg-[#f3efe6]');

fs.writeFileSync('src/components/TopMenuBar.tsx', content);
