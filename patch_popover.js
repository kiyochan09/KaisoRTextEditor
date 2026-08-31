import fs from 'fs';

let content = fs.readFileSync('./src/components/StyleGalleryPopover.tsx', 'utf8');

if (!content.includes('Eye, EyeOff')) {
  content = content.replace(
    'Settings, Type, AlignLeft, ChevronRight } from \'lucide-react\';',
    'Settings, Type, AlignLeft, ChevronRight, Eye, EyeOff } from \'lucide-react\';'
  );
}

if (!content.includes('onToggleHideStyle?: (styleId: string) => void;')) {
  content = content.replace(
    'onDeleteStyle: (styleId: string) => void;',
    'onDeleteStyle: (styleId: string) => void;\n  onToggleHideStyle?: (styleId: string) => void;'
  );
}

content = content.replace(
  'onDeleteStyle,\n  onClose,',
  'onDeleteStyle,\n  onToggleHideStyle,\n  onClose,'
);

// Add showHidden state
if (!content.includes('const [showHidden, setShowHidden]')) {
  content = content.replace(
    "const [hoveredStyleId, setHoveredStyleId] = useState<string | null>(null);",
    "const [hoveredStyleId, setHoveredStyleId] = useState<string | null>(null);\n  const [showHidden, setShowHidden] = useState<boolean>(false);"
  );
}

// Modify displayedStyles to filter based on showHidden
content = content.replace(
  "const displayedStyles: TextStylePreset[] = \n    activeTab === 'all'\n      ? [...characterStyles, ...paragraphStyles]\n      : activeTab === 'character'\n      ? characterStyles\n      : paragraphStyles;",
  "const baseStyles: TextStylePreset[] = \n    activeTab === 'all'\n      ? [...characterStyles, ...paragraphStyles]\n      : activeTab === 'character'\n      ? characterStyles\n      : paragraphStyles;\n  const displayedStyles = baseStyles.filter(s => showHidden || !s.isHidden);"
);

// Add toggle button to header
const headerTabs = `<div className="flex items-center space-x-1">`;
const headerTabsReplacement = `<div className="flex items-center space-x-1">
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={\`px-2 py-1 rounded text-[10px] font-medium transition \${
              showHidden ? 'bg-slate-200 text-slate-700' : 'text-slate-500 hover:bg-slate-200'
            }\`}
            title={showHidden ? "非表示スタイルを隠す" : "非表示スタイルも表示"}
          >
            {showHidden ? <EyeOff className="w-3 h-3 inline mr-1"/> : <Eye className="w-3 h-3 inline mr-1"/>}
            非表示
          </button>`;

if (!content.includes('非表示スタイルも表示')) {
  content = content.replace(headerTabs, headerTabsReplacement);
}

// Add the EyeOff/Eye button for built-in styles
const deleteBtnPattern = /\{!style\.isBuiltin && \(\s+<button[\s\S]*?<Trash2 className="w-3 h-3" \/>\s+<\/button>\s+\)\}/;
const eyeBtnHtml = `{style.isBuiltin && onToggleHideStyle && (
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleHideStyle(style.id);
                        }}
                        title={style.isHidden ? "このスタイルを表示" : "このスタイルを非表示"}
                        className={\`p-0.5 rounded transition cursor-pointer \${
                          style.isHidden
                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            : 'hover:bg-amber-100 hover:text-amber-700 text-slate-600'
                        }\`}
                      >
                        {style.isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
                    {!style.isBuiltin && (`;

content = content.replace('{!style.isBuiltin && (', eyeBtnHtml);

fs.writeFileSync('./src/components/StyleGalleryPopover.tsx', content);
