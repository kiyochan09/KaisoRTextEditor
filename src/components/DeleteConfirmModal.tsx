import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  count,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-300 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-red-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-bold tracking-tight">ノート・フォルダの削除確認</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-white/80 hover:text-white rounded-md hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start space-x-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-full text-amber-700 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-1">
                「<span className="text-red-700 font-bold">{title}</span>」を削除しますか？
              </p>
              {count > 1 ? (
                <p className="text-xs text-slate-600 leading-relaxed">
                  この項目には <strong className="text-red-600 font-bold">{count - 1} 件</strong> のサブノート（子・孫ノード）が含まれています。
                  親フォルダおよび配下のすべてのノートが一括で削除されます。
                </p>
              ) : (
                <p className="text-xs text-slate-600 leading-relaxed">
                  この操作を実行すると、ノートの内容が完全に削除されます。
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-500 mb-4">
            💡 誤って削除した場合は、上部メニュー「ファイル → 初期サンプルデータにリセット」で復元するか、事前にJSONエクスポートを行ってください。
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg transition"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>完全に削除する</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
