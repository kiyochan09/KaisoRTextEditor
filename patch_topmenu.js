import fs from 'fs';

let content = fs.readFileSync('src/components/TopMenuBar.tsx', 'utf8');

// Find the Database Selector Dropdown
const dbSelectorStart = content.indexOf('          {/* Database Selector Dropdown */}');
const dbSelectorEnd = content.indexOf('          <button\n            id="toolbar-btn-new-db"');
if (dbSelectorStart === -1 || dbSelectorEnd === -1) {
  console.error("Could not find db selector bounds");
  process.exit(1);
}

const dbSelectorCode = content.substring(dbSelectorStart, dbSelectorEnd).trim();

// Find Flask tag
const flaskTag = '<span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-1.5 py-0.2 rounded border border-blue-200">Flask 対応</span>';

// Replace Flask tag with DB selector
content = content.replace(flaskTag, dbSelectorCode);

// Remove the entire second row
const row2Start = content.indexOf('      {/* Main Quick Action Toolbar */}');
const row2End = content.indexOf('    </div>\n  );\n};');
if (row2Start === -1 || row2End === -1) {
  console.error("Could not find row2 bounds");
  process.exit(1);
}

const contentBeforeRow2 = content.substring(0, row2Start);
const contentAfterRow2 = content.substring(row2End);

content = contentBeforeRow2 + contentAfterRow2;

fs.writeFileSync('src/components/TopMenuBar.tsx', content);
