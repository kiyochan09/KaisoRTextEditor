import fs from 'fs';

let content = fs.readFileSync('./src/components/DatabaseManagerModal.tsx', 'utf8');

const backupUi = `
        {/* Backup and Restore Section */}
        <div className="p-4 bg-blue-50/50 border-t border-slate-200 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <HardDrive className="w-4 h-4 text-blue-600" />
                全環境の一括バックアップと移行 (PC買い替え用)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                作成済みのすべてのデータベースを1つのファイルとして書き出し、新しいPCで復元できます。
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onExportAllDatabases}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition"
                title="全データベースをエクスポート"
              >
                <Download className="w-3.5 h-3.5" />
                バックアップを保存
              </button>
              
              <label className="cursor-pointer px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 transition shadow-sm">
                <Upload className="w-3.5 h-3.5" />
                <span>環境を復元...</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onImportAllDatabases) {
                      onImportAllDatabases(file);
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
        </div>
`;

content = content.replace(
  '        {/* Footer */}',
  backupUi + '\n        {/* Footer */}'
);

// We need to import Download if not imported
if (!content.includes('Download')) {
  content = content.replace(
    'Upload\n} from \'lucide-react\';',
    'Upload,\n  Download\n} from \'lucide-react\';'
  );
}

fs.writeFileSync('./src/components/DatabaseManagerModal.tsx', content);
console.log('DatabaseManagerModal.tsx patched');
