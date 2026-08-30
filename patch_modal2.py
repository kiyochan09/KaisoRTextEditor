import sys
content = open('./src/components/CreateDatabaseModal.tsx', 'r').read()

option_c = """
              {/* Storage Option C: Custom File */}
              <button
                type="button"
                onClick={() => setStorageType('custom_file')}
                className={`p-2.5 text-left rounded-lg border flex items-start space-x-2 transition ${
                  storageType === 'custom_file'
                    ? 'border-blue-600 bg-blue-50/90 ring-1 ring-blue-500 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-md mt-0.5 ${
                  storageType === 'custom_file' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    専用ファイル指定
                    <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1 rounded">単一ファイル</span>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-snug mt-0.5">
                    1つの.jsonファイルとして明示的なパスを指定して保存。
                  </div>
                </div>
              </button>
"""

content = content.replace(
    'grid-cols-1 sm:grid-cols-2',
    'grid-cols-1 sm:grid-cols-3'
)
content = content.replace(
    '</button>\n            </div>\n\n            {/* Folder Path Details when Local Folder is selected */}',
    '</button>\n' + option_c + '            </div>\n\n            {/* Folder Path Details when Local Folder is selected */}'
)
content = content.replace(
    "{storageType === 'local_folder' && (",
    "{(storageType === 'local_folder' || storageType === 'custom_file') && ("
)
content = content.replace(
    "保存先フォルダのプリセット / 指定:",
    "保存先パスのプリセット / 指定:"
)
open('./src/components/CreateDatabaseModal.tsx', 'w').write(content)
