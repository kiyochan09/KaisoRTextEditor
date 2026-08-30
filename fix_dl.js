import fs from 'fs';
let content = fs.readFileSync('./src/components/DatabaseManagerModal.tsx', 'utf8');
content = content.replace(
  'Upload,\n  Download\n} from \'lucide-react\';',
  'Upload,\n  Download\n} from \'lucide-react\';'
);

if(!content.includes('Download,') && !content.includes(' Download ') && !content.includes('Download}')) {
   content = content.replace('Upload', 'Upload, Download');
}

fs.writeFileSync('./src/components/DatabaseManagerModal.tsx', content);
