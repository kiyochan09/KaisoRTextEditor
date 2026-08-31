import fs from 'fs';

let content = fs.readFileSync('./src/components/EditorToolbar.tsx', 'utf8');

if (!content.includes('NODE_COLOR_BADGES')) {
  // It shouldn't happen, I already added it in the previous script. Let's check imports.
  content = content.replace(
    'import { TEXTBOX_PRESETS } from \'../utils/textboxUtils\';',
    'import { TEXTBOX_PRESETS } from \'../utils/textboxUtils\';\nimport { NODE_COLOR_BADGES } from \'../data/initialData\';'
  );
} else if (!content.match(/import\s+\{.*NODE_COLOR_BADGES.*\}\s+from/)) {
  content = content.replace(
    'import { TEXTBOX_PRESETS } from \'../utils/textboxUtils\';',
    'import { TEXTBOX_PRESETS } from \'../utils/textboxUtils\';\nimport { NODE_COLOR_BADGES } from \'../data/initialData\';'
  );
}

fs.writeFileSync('./src/components/EditorToolbar.tsx', content);
