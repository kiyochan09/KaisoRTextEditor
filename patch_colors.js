import fs from 'fs';

// 1. App.tsx (Main App Background)
let appStr = fs.readFileSync('src/App.tsx', 'utf8');
appStr = appStr.replace(/bg-\[#f3efe6\]/g, 'bg-stone-300'); // Deeper background for the app window
fs.writeFileSync('src/App.tsx', appStr);

// 2. TabListPanel.tsx (Far left panel)
let tabStr = fs.readFileSync('src/components/TabListPanel.tsx', 'utf8');
// Panel bg
tabStr = tabStr.replace(/className="w-60 bg-\[#fbf9f6\]/g, 'className="w-60 bg-stone-200'); 
// Header/Footer bg
tabStr = tabStr.replace(/bg-\[#f3efe6\]/g, 'bg-stone-300');
// Inner items bg (default)
tabStr = tabStr.replace(/bg-\[#fdfcfb\]/g, 'bg-stone-100');
// Active items (was blue)
tabStr = tabStr.replace(/bg-blue-800 text-blue-100/g, 'bg-orange-800 text-orange-100');
tabStr = tabStr.replace(/bg-blue-100/g, 'bg-orange-100');
tabStr = tabStr.replace(/text-blue-600/g, 'text-orange-700');
tabStr = tabStr.replace(/bg-blue-50/g, 'bg-orange-50');
tabStr = tabStr.replace(/text-blue-800/g, 'text-orange-900');
tabStr = tabStr.replace(/border-blue-200/g, 'border-orange-300');
tabStr = tabStr.replace(/text-slate-700 hover:bg-slate-200/g, 'text-stone-700 hover:bg-stone-300');
fs.writeFileSync('src/components/TabListPanel.tsx', tabStr);

// 3. TreeSidebar.tsx (Middle left panel)
let treeStr = fs.readFileSync('src/components/TreeSidebar.tsx', 'utf8');
// Panel bg
treeStr = treeStr.replace(/className="w-72 bg-\[#fbf9f6\]/g, 'className="w-72 bg-stone-50'); 
// Header/Footer bg
treeStr = treeStr.replace(/bg-\[#f3efe6\]/g, 'bg-stone-100');
treeStr = treeStr.replace(/hover:bg-\[#fbf9f6\]/g, 'hover:bg-stone-200');
// Inner items bg
treeStr = treeStr.replace(/bg-\[#fdfcfb\]/g, 'bg-white');
// Active tree item (was blue)
treeStr = treeStr.replace(/bg-blue-100\/90 border-blue-500 ring-2 ring-blue-400 text-blue-950/g, 'bg-amber-100 border-amber-500 ring-2 ring-amber-300 text-amber-950');
treeStr = treeStr.replace(/bg-blue-100\/90 text-blue-950 border-blue-300/g, 'bg-amber-50 text-amber-950 border-amber-300');
treeStr = treeStr.replace(/text-slate-700 border-transparent hover:bg-slate-200\/80/g, 'text-stone-700 border-transparent hover:bg-stone-200');
// Active indicator line/dot
treeStr = treeStr.replace(/bg-blue-600 z-20/g, 'bg-amber-600 z-20');
treeStr = treeStr.replace(/bg-blue-600 -ml-1/g, 'bg-amber-600 -ml-1');
fs.writeFileSync('src/components/TreeSidebar.tsx', treeStr);

// 4. NotebookTabBar.tsx (Tabs)
let navStr = fs.readFileSync('src/components/NotebookTabBar.tsx', 'utf8');
navStr = navStr.replace(/bg-\[#fef9f0\]/g, 'bg-stone-200'); // bar background
navStr = navStr.replace(/bg-\[#fdf8f0\]/g, 'bg-stone-100'); // inactive tab
navStr = navStr.replace(/border-t-amber-500/g, 'border-t-orange-500'); // active tab border
fs.writeFileSync('src/components/NotebookTabBar.tsx', navStr);

// 5. TopMenuBar.tsx (Header)
let topStr = fs.readFileSync('src/components/TopMenuBar.tsx', 'utf8');
topStr = topStr.replace(/bg-\[#fbf9f6\]/g, 'bg-stone-100');
topStr = topStr.replace(/from-\[#fdfcfb\]/g, 'from-stone-50');
topStr = topStr.replace(/to-\[#f3efe6\]/g, 'to-stone-200');
topStr = topStr.replace(/bg-\[#f3efe6\]/g, 'bg-stone-200');
fs.writeFileSync('src/components/TopMenuBar.tsx', topStr);

// 6. EditorToolbar.tsx
let editorStr = fs.readFileSync('src/components/EditorToolbar.tsx', 'utf8');
editorStr = editorStr.replace(/bg-gradient-to-b from-slate-50 to-slate-100/g, 'bg-gradient-to-b from-stone-50 to-stone-100');
editorStr = editorStr.replace(/bg-slate-50/g, 'bg-stone-50');
editorStr = editorStr.replace(/border-slate-200/g, 'border-stone-200');
fs.writeFileSync('src/components/EditorToolbar.tsx', editorStr);

