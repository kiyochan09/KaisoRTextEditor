import fs from 'fs';

let content = fs.readFileSync('./src/components/SystemOptionsModal.tsx', 'utf8');

const missingHTML = `
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <div className="md:col-span-7 p-6 overflow-y-auto max-h-[56vh] space-y-6">
            <div className="space-y-8 animate-in fade-in">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-blue-600" />
                    <span>既定フォント (Font Family) - 選択フォント・サイズを基本表示に設定</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleScanPCFonts}
                      disabled={isLoadingPCFonts}
                      title="PC端末にインストールされているフォントを読み込みます"
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded text-[11px] font-medium flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                    >
                      {isLoadingPCFonts ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                      ) : (
                        <Laptop className="w-3 h-3 text-blue-600" />
                      )}
                      <span>PCフォントを読み込む</span>
                    </button>
                    <span className="text-[11px] text-slate-500 font-mono">
                      現在: {currentFontObj ? currentFontObj.name : tempSettings.fontFamily}
                    </span>
                  </div>
                </div>`;

content = content.replace(
  '{/* Tab Navigation */}',
  `{/* Tab Navigation */}\n${missingHTML}`
);

fs.writeFileSync('./src/components/SystemOptionsModal.tsx', content);
