import React, { useState } from 'react';
import { TabFolder } from '../types';

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (folderId: string | null) => void;
  restoreCandidates: { id: string; name: string }[];
  tabFolders: TabFolder[];
}

export const RestoreModal: React.FC<RestoreModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  restoreCandidates,
  tabFolders,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[480px] max-w-full overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
          <h2 className="text-lg font-bold text-stone-800">迷子データの復元</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition"
          >
            ✕
          </button>
        </div>
        
        {restoreCandidates.length === 0 ? (
          <div className="px-6 py-6 text-center">
            <p className="text-stone-800 font-medium mb-2 text-lg">
              迷子データは見つかりませんでした。
            </p>
            <p className="text-sm text-stone-600 mb-6 leading-relaxed text-left">
              裏側に残されている（タブを失った）データは 0 件です。<br/><br/>
              おそらくデータは既に安全な状態で存在しています。
              左端の「タブ一覧」パネルから「すべてのフォルダ」や各フォルダを開き、タブが隠れていないかご確認ください。
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm text-white bg-stone-600 hover:bg-stone-700 rounded shadow transition font-medium w-full"
            >
              閉じる
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 flex-1 overflow-y-auto">
              <p className="text-sm text-stone-600 mb-4">
                裏側に残っている <strong>{restoreCandidates.length}</strong> 件のタブ（ノートブック）データが見つかりました。復元先のフォルダを選択してください。
              </p>
              <div className="max-h-40 overflow-y-auto bg-stone-50 border border-stone-200 rounded p-2 mb-4 space-y-1">
                {restoreCandidates.map((c, i) => (
                  <div key={c.id} className="text-xs text-stone-700 px-2 py-1 bg-white border border-stone-100 rounded flex items-center justify-between">
                    <span className="font-medium truncate">{i + 1}. {c.name}</span>
                    <span className="text-[10px] text-stone-400">ID: {c.id.slice(0, 6)}</span>
                  </div>
                ))}
              </div>
              
              <label className="block text-sm font-medium text-stone-700 mb-2">
                復元先のフォルダ:
              </label>
              <select
                className="w-full border-stone-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm py-2 px-3 border"
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value || null)}
              >
                <option value="">（フォルダなし - ルート階層）</option>
                {tabFolders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    📁 {folder.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-stone-600 hover:text-stone-800 hover:bg-stone-200 rounded transition"
              >
                キャンセル
              </button>
              <button
                onClick={() => onConfirm(selectedFolderId)}
                className="px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow transition font-medium"
              >
                復元を実行
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
