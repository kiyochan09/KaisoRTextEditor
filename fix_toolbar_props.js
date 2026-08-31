import fs from 'fs';

let content = fs.readFileSync('./src/components/EditorToolbar.tsx', 'utf8');

content = content.replace(
  'interface EditorToolbarProps {\n',
  'interface EditorToolbarProps {\n  noteType: NoteType;\n'
);

content = content.replace(
  'export const EditorToolbar: React.FC<EditorToolbarProps> = ({\n',
  'export const EditorToolbar: React.FC<EditorToolbarProps> = ({\n  noteType,\n'
);

// We need to import NODE_COLOR_BADGES in EditorToolbar.tsx
if (!content.includes('NODE_COLOR_BADGES')) {
  // Wait, NODE_COLOR_BADGES was present in EditorToolbar.tsx before I replaced the render method! I need to add it or import it.
  content = content.replace(
    'import { TEXTBOX_PRESETS } from \'../utils/textboxUtils\';',
    'import { TEXTBOX_PRESETS } from \'../utils/textboxUtils\';\nimport { NODE_COLOR_BADGES } from \'../data/initialData\';'
  );
}

// Add state for ColorBadgeMenu and ref
if (!content.includes('const [showColorBadgeMenu')) {
  content = content.replace(
    'const [fontSize, setFontSize] = useState<string>(defaultFontSize);',
    'const [fontSize, setFontSize] = useState<string>(defaultFontSize);\n  const [showColorBadgeMenu, setShowColorBadgeMenu] = useState(false);\n  const colorBadgeMenuRef = useRef<HTMLDivElement>(null);'
  );
}

fs.writeFileSync('./src/components/EditorToolbar.tsx', content);
