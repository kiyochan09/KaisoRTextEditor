import fs from 'fs';

let content = fs.readFileSync('./src/components/StyleGalleryPopover.tsx', 'utf8');

if (!content.includes('EyeOff')) {
  content = content.replace(
    "} from 'lucide-react';",
    ", Eye, EyeOff } from 'lucide-react';"
  );
  fs.writeFileSync('./src/components/StyleGalleryPopover.tsx', content);
}
