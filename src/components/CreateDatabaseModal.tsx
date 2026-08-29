import React, { useState, useEffect } from 'react';
import { 
  Database, Sparkles, FolderPlus, FileText, Check, X, Layers, 
  Folder, HardDrive, Laptop, FolderOpen, ShieldCheck, ChevronRight
} from 'lucide-react';

interface CreateDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    name: string, 
    templateType: 'clean' | 'starter' | 'copy_current',
    storageConfig: {
      storageType: 'browser_storage' | 'local_folder' | 'custom_file';
      storageLocation: string;
      storagePath: string;
    }
  ) => void;
  currentDbName?: string;
}

export const CreateDatabaseModal: React.FC<CreateDatabaseModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  currentDbName = '',
}) => {
  const [dbName, setDbName] = useState<string>('');
  const [templateType, setTemplateType] = useState<'clean' | 'starter' | 'copy_current'>('clean');
  
  // Storage Location Configuration state
  const [storageType, setStorageType] = useState<'browser_storage' | 'local_folder' | 'custom_file'>('browser_storage');
  const [selectedFolderPreset, setSelectedFolderPreset] = useState<'documents' | 'desktop' | 'custom'>('documents');
  const [customPath, setCustomPath] = useState<string>('~/Documents/HierarchicalNotes/');
  const [isSelectingNativeFolder, setIsSelectingNativeFolder] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Update default custom path suggestion when dbName changes
  useEffect(() => {
    const sanitizedName = dbName.trim() ? dbName.trim().replace(/[\\/:*?"<>|]/g, '_') : 'MyDatabase';
    if (selectedFolderPreset === 'documents') {
      setCustomPath(`~/Documents/HierarchicalNotes/${sanitizedName}/`);
    } else if (selectedFolderPreset === 'desktop') {
      setCustomPath(`~/Desktop/HierarchicalNotes/${sanitizedName}/`);
    }
  }, [dbName, selectedFolderPreset]);

  if (!isOpen) return null;

  const handlePickDirectory = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        setIsSelectingNativeFolder(true);
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker();
        if (dirHandle && dirHandle.name) {
          const sanitizedName = dbName.trim() ? dbName.trim().replace(/[\\/:*?"<>|]/g, '_') : 'MyDatabase';
          setCustomPath(`${dirHandle.name}/${sanitizedName}/`);
          setSelectedFolderPreset('custom');
          setStorageType('local_folder');
        }
      } else {
        alert('お使いのブラウザ環境ではネイティブフォルダ選択ダイアログが制限されているため、下のテキストボックスからパスを直接ご指定いただけます。');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Directory picker cancelled or unsupported', err);
      }
    } finally {
      setIsSelectingNativeFolder(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = dbName.trim();
    if (!trimmed) {
      setError('データベースの名前を入力してください。');
      return;
    }

    let finalLocationLabel = 'ブラウザ内蔵セキュア領域 (IndexedDB / LocalStorage)';
    let finalPath = '';

    if (storageType === 'local_folder') {
      finalLocationLabel = `ローカルフォルダ (${customPath})`;
      finalPath = customPath.trim();
    } else if (storageType === 'custom_file') {
      finalLocationLabel = `専用ファイル (${customPath})`;
      finalPath = customPath.trim();
    }

    onCreate(trimmed, templateType, {
      storageType,
      storageLocation: finalLocationLabel,
      storagePath: finalPath,
    });

    setDbName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                新規データベースの作成
              </h3>
              <p className="text-[11px] text-blue-200/80">
                名前・保存先場所・テンプレートを設定して新しいデータベースを起こします
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
          {/* Step 1: Database Name (Required) */}
          <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200">
            <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                1. データベース名 <span className="text-red-500 font-normal">*必須</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">例: マイノートDB, 開発プロジェクト</span>
            </label>
            <input
              type="text"
              id="new-db-name-input"
              autoFocus
              value={dbName}
              onChange={(e) => {
                setDbName(e.target.value);
                if (error) setError('');
              }}
              placeholder="データベースの名前を入力してください（例: マイノート 2026）"
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-900 focus:outline-hidden focus:ring-2 ${
                error
                  ? 'border-red-400 focus:ring-red-300 bg-red-50/50'
                  : 'border-slate-300 focus:ring-blue-500/30 focus:border-blue-500'
              }`}
            />
            {error && <p className="text-red-600 text-[11px] mt-1 font-medium">{error}</p>}
          </div>

          {/* Step 2: Storage Location (保存場所の設定) */}
          <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200">
            <label className="block font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-amber-600" />
                2. 保存場所の設定 (Storage Location)
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                保存先ディレクトリまたはストレージ形式
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
              {/* Storage Option A: Browser Storage */}
              <button
                type="button"
                onClick={() => setStorageType('browser_storage')}
                className={`p-2.5 text-left rounded-lg border flex items-start space-x-2 transition ${
                  storageType === 'browser_storage'
                    ? 'border-blue-600 bg-blue-50/90 ring-1 ring-blue-500 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-md mt-0.5 ${
                  storageType === 'browser_storage' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    ブラウザ内蔵領域
                    <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1 rounded">標準</span>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-snug mt-0.5">
                    ブラウザの安全なローカルストレージ（IndexedDB）に自動永続保存。
                  </div>
                </div>
              </button>

              {/* Storage Option B: Local Folder Path */}
              <button
                type="button"
                onClick={() => setStorageType('local_folder')}
                className={`p-2.5 text-left rounded-lg border flex items-start space-x-2 transition ${
                  storageType === 'local_folder'
                    ? 'border-blue-600 bg-blue-50/90 ring-1 ring-blue-500 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-md mt-0.5 ${
                  storageType === 'local_folder' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    ローカルフォルダ指定
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">指定パス</span>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-snug mt-0.5">
                    PCの保存先ディレクトリやエクスポート先フォルダを指定。
                  </div>
                </div>
              </button>
            </div>

            {/* Folder Path Details when Local Folder is selected */}
            {storageType === 'local_folder' && (
              <div className="bg-white p-3 rounded-lg border border-slate-200 mt-2 space-y-2 animate-in fade-in duration-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-[11px]">保存先フォルダのプリセット / 指定:</span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setSelectedFolderPreset('documents')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        selectedFolderPreset === 'documents'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      📁 Documents
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFolderPreset('desktop')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        selectedFolderPreset === 'desktop'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      💻 Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFolderPreset('custom')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        selectedFolderPreset === 'custom'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      ✏️ カスタムパス
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customPath}
                    onChange={(e) => {
                      setCustomPath(e.target.value);
                      setSelectedFolderPreset('custom');
                    }}
                    placeholder="例: C:/Users/YourName/Documents/Notes/ や ~/Documents/MyNotes/"
                    className="flex-1 px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-slate-50 text-slate-800 font-mono focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handlePickDirectory}
                    disabled={isSelectingNativeFolder}
                    className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold flex items-center space-x-1 shrink-0 transition"
                    title="フォルダを選択（ブラウザ対応時）"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                    <span>参照...</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  ※このパスはDBプロファイルに紐付けられ、自動バックアップおよびJSON・ファイル保存時の既定の出力場所として管理されます。
                </p>
              </div>
            )}
          </div>

          {/* Step 3: Initial Template Selection */}
          <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200">
            <label className="block font-bold text-slate-800 mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              3. 初期テンプレートの選択
            </label>
            <div className="grid grid-cols-1 gap-2">
              {/* Option A: Clean Database */}
              <label
                onClick={() => setTemplateType('clean')}
                className={`flex items-start p-2.5 rounded-lg border cursor-pointer transition ${
                  templateType === 'clean'
                    ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="templateType"
                  checked={templateType === 'clean'}
                  onChange={() => setTemplateType('clean')}
                  className="mt-0.5 mr-2 text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      クリーン作成（推奨）
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-medium px-1.5 py-0.2 rounded">
                      まっさらな状態
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    1つのタブ「マイノート」と、開始用の最初の空ノート1件のみを用意します。
                  </p>
                </div>
              </label>

              {/* Option B: Starter 3 Tabs */}
              <label
                onClick={() => setTemplateType('starter')}
                className={`flex items-start p-2.5 rounded-lg border cursor-pointer transition ${
                  templateType === 'starter'
                    ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="templateType"
                  checked={templateType === 'starter'}
                  onChange={() => setTemplateType('starter')}
                  className="mt-0.5 mr-2 text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      スターター構成（3タブ構成）
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.2 rounded">
                      3カテゴリー
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    「業務ノート」「個人・プライベート」「アイデア帳」の3タブを初期配置します。
                  </p>
                </div>
              </label>

              {/* Option C: Duplicate from Current */}
              {currentDbName && (
                <label
                  onClick={() => setTemplateType('copy_current')}
                  className={`flex items-start p-2.5 rounded-lg border cursor-pointer transition ${
                    templateType === 'copy_current'
                      ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="templateType"
                    checked={templateType === 'copy_current'}
                    onChange={() => setTemplateType('copy_current')}
                    className="mt-0.5 mr-2 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-amber-600" />
                        現在のDB（{currentDbName}）の内容を複製
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      現在開いているタブ・フォルダ・ノート構造をそのまま引き継いで別名保存します。
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">独立保存:</span> 設定した保存場所とデータベースは完全に分離して保存され、元のDEMOデータや他のDBデータには一切影響を与えません。
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 mt-1 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              id="submit-create-db-btn"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm flex items-center space-x-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>データベースを作成して開く</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
