import fs from 'fs';

let content = fs.readFileSync('./src/components/SystemOptionsModal.tsx', 'utf8');

// Remove tabs container
content = content.replace(/<div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 gap-2">[\s\S]*?<\/div>\s*<\/div>/, '');

// Remove activeTab conditions
content = content.replace(/\{activeTab === 'font' && \(\s*<div className="space-y-6 animate-in fade-in">/g, '<div className="space-y-8 animate-in fade-in">');
content = content.replace(/\{activeTab === 'wrap' && \(\s*<div className="space-y-6 animate-in fade-in">/g, '<div className="space-y-8 animate-in fade-in mt-8 border-t border-slate-200 pt-8">');
content = content.replace(/\{activeTab === 'layout' && \(\s*<div className="space-y-6 animate-in fade-in">/g, '<div className="space-y-8 animate-in fade-in mt-8 border-t border-slate-200 pt-8">');

// Remove closing parentheses for those conditions
content = content.replace(/<\/div>\s*\)\}\s*\{\/\* TAB 2/g, '</div>\n\n            {/* TAB 2');
content = content.replace(/<\/div>\s*\)\}\s*\{\/\* TAB 3/g, '</div>\n\n            {/* TAB 3');
content = content.replace(/<\/div>\s*\)\}\s*<\/div>\s*\{\/\* Right Column/g, '</div>\n          </div>\n          {/* Right Column');

// Add "選択フォント・サイズを基本表示に設定" label if not exists
content = content.replace(
  '<span>既定フォント (Font Family)</span>',
  '<span>既定フォント (Font Family) - 選択フォント・サイズを基本表示に設定</span>'
);

// Add Ruler radio buttons to TAB 3 (or TAB 2)
const rulerHtml = `
                {/* Ruler Toggle */}
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    <span>ルーラーを表示する (Show Ruler)</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={tempSettings.showRuler === true}
                        onChange={() => setTempSettings(prev => ({ ...prev, showRuler: true }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-xs text-slate-700 font-bold">表示する</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={tempSettings.showRuler !== true}
                        onChange={() => setTempSettings(prev => ({ ...prev, showRuler: false }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-xs text-slate-700">表示しない</span>
                    </label>
                  </div>
                </div>
`;

content = content.replace(
  '{/* Line Height Selection */}',
  rulerHtml + '\n                {/* Line Height Selection */}'
);

fs.writeFileSync('./src/components/SystemOptionsModal.tsx', content);
