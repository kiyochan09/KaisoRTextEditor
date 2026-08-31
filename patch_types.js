import fs from 'fs';

let content = fs.readFileSync('./src/types.ts', 'utf8');

if (!content.includes('isHidden?: boolean;')) {
  content = content.replace(
    'isBuiltin?: boolean;',
    'isBuiltin?: boolean;\n  isHidden?: boolean;'
  );
  fs.writeFileSync('./src/types.ts', content);
}
