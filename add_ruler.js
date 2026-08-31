import fs from 'fs';

let content = fs.readFileSync('./src/components/SystemOptionsModal.tsx', 'utf8');

const rulerHtml = `
                {/* Ruler Toggle */}
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    <span>ルーラーを表示する (Show Ruler)</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded border hover:bg-slate-50 transition border-slate-200">
                      <input
                        type="radio"
                        checked={tempSettings.showRuler === true}
                        onChange={() => setTempSettings(prev => ({ ...prev, showRuler: true }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-xs text-slate-700 font-bold">表示する</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded border hover:bg-slate-50 transition border-slate-200">
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
  '{/* Line Height */}',
  rulerHtml + '\n                {/* Line Height */}'
);

fs.writeFileSync('./src/components/SystemOptionsModal.tsx', content);
