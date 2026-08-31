import fs from 'fs';
let content = fs.readFileSync('src/components/TabListPanel.tsx', 'utf8');

content = content.replace(/bg-slate-100/g, 'bg-[#fbf9f6]');
content = content.replace(/bg-slate-200/g, 'bg-[#f3efe6]');
content = content.replace(/bg-slate-50/g, 'bg-[#fdfcfb]');

fs.writeFileSync('src/components/TabListPanel.tsx', content);
