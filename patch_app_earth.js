import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Change main body background
content = content.replace('className="flex flex-col h-screen bg-slate-200 font-sans text-slate-900"', 'className="flex flex-col h-screen bg-[#f3efe6] font-sans text-slate-900"');
content = content.replace('bg-slate-200', 'bg-[#f3efe6]');

// Change TreeSidebar background to a warmer tone?
// Actually I don't need to change everything if they want earth colors, but I should probably change the main backgrounds.
fs.writeFileSync('src/App.tsx', content);
