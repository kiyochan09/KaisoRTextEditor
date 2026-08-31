import fs from 'fs';

let content = fs.readFileSync('./src/App.tsx', 'utf8');

// Remove state
content = content.replace(/const \[showRuler, setShowRuler\] = useState<boolean>\(true\);\n\s*/, '');

// Replace EditorToolbar props
content = content.replace(
  /showRuler=\{showRuler\}\n\s*onToggleRuler=\{.*?\}\n/,
  'showRuler={systemSettings.showRuler ?? false}\n              onToggleRuler={() => {}}\n'
);

// Replace RulerBar condition
content = content.replace(
  /\{showRuler && activeNode\?\.type === 'rich' && <RulerBar \/>\}/,
  '{systemSettings.showRuler && activeNode?.type === "rich" && <RulerBar />}'
);

fs.writeFileSync('./src/App.tsx', content);
