import fs from 'fs';

let content = fs.readFileSync('./src/components/EditorToolbar.tsx', 'utf8');

if (!content.includes('onToggleHideStyle?: (styleId: string) => void;')) {
  content = content.replace(
    'onDeleteStyle?: (styleId: string) => void;',
    'onDeleteStyle?: (styleId: string) => void;\n  onToggleHideStyle?: (styleId: string) => void;'
  );
}

content = content.replace(
  'onDeleteStyle,\n  onOpenFind,',
  'onDeleteStyle,\n  onToggleHideStyle,\n  onOpenFind,'
);

content = content.replace(
  /onDeleteStyle=\{\(styleId\) => \{\n\s*onDeleteStyle\?\.arg|\}\}\n\s*onDeleteStyle=\{(.*?)\}/s,
  ''
);
// wait, easier with simple replace
content = content.replace(
  /onDeleteStyle=\{\(styleId\) => \{\n\s*onDeleteStyle\?\.\(styleId\);\n\s*\}\}/,
  'onDeleteStyle={(styleId) => {\n                  onDeleteStyle?.(styleId);\n                }}\n                onToggleHideStyle={(styleId) => {\n                  onToggleHideStyle?.(styleId);\n                }}'
);

fs.writeFileSync('./src/components/EditorToolbar.tsx', content);
