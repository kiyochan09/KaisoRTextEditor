import fs from 'fs';

let content = fs.readFileSync('./src/components/StyleEditModal.tsx', 'utf8');

// Add Trash2 to imports
if (!content.includes('Trash2')) {
  content = content.replace(
    /import \{([^}]+)\} from 'lucide-react';/,
    "import { $1, Trash2 } from 'lucide-react';"
  );
}

// Add onDeleteStyle prop
if (!content.includes('onDeleteStyle?: (styleId: string) => void;')) {
  content = content.replace(
    /onClose: \(\) => void;/,
    "onClose: () => void;\n  onDeleteStyle?: (styleId: string) => void;"
  );
}

// Add onDeleteStyle to destructured props
content = content.replace(
  /onClose,\n  settings/,
  "onClose,\n  settings,\n  onDeleteStyle"
);

// Replace Footer
const originalFooter = `<div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end space-x-2">`;
const newFooter = `<div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div>
            {isEditing && !editingStyle?.isBuiltin && onDeleteStyle && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('このスタイルを削除してもよろしいですか？')) {
                    onDeleteStyle(editingStyle.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded text-xs font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 transition flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>削除</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">`;

content = content.replace(originalFooter, newFooter);
content = content.replace(
  /<span>\{isEditing \? '変更を保存' : 'スタイルを登録'\}<\/span>\n          <\/button>\n        <\/div>/,
  `<span>{isEditing ? '変更を保存' : 'スタイルを登録'}</span>\n          </button>\n          </div>\n        </div>`
);

fs.writeFileSync('./src/components/StyleEditModal.tsx', content, 'utf8');
