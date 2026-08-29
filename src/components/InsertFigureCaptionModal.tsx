import React, { useState, useEffect } from 'react';
import { X, Captions } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface FigureTarget {
  id: string;
  type: 'image' | 'table';
  preview: string;
  html: string;
}

interface InsertFigureCaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (captions: {label: string, title: string, targetId: string | null}[]) => void;
  targets: FigureTarget[];
}

export const InsertFigureCaptionModal: React.FC<InsertFigureCaptionModalProps> = ({ isOpen, onClose, onInsert, targets }) => {
  const [targetInputs, setTargetInputs] = useState<{id: string, label: string, title: string}[]>([]);
  const [fallbackLabel, setFallbackLabel] = useState('図');
  const [fallbackTitle, setFallbackTitle] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (targets.length > 0) {
        let imgCount = 1;
        let tableCount = 1;
        const initial = targets.map(t => {
          const defaultLabel = t.type === 'image' ? `図${imgCount++}` : `表${tableCount++}`;
          return {
            id: t.id,
            label: defaultLabel,
            title: ''
          };
        });
        setTargetInputs(initial);
      } else {
        setFallbackLabel('図');
        setFallbackTitle('');
      }
    }
  }, [isOpen, targets]);

  if (!isOpen) return null;

  const handleInsert = () => {
    if (targets.length > 0) {
      const validCaptions = targetInputs
        .filter(t => t.label.trim() && t.title.trim())
        .map(t => ({
          label: t.label.trim(),
          title: t.title.trim(),
          targetId: t.id
        }));
      if (validCaptions.length > 0) {
        onInsert(validCaptions);
      }
    } else {
      if (fallbackLabel.trim() && fallbackTitle.trim()) {
        onInsert([{
          label: fallbackLabel.trim(),
          title: fallbackTitle.trim(),
          targetId: null
        }]);
      }
    }
  };

  const updateInput = (id: string, field: 'label' | 'title', value: string) => {
    setTargetInputs(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const isValid = targets.length > 0 
    ? targetInputs.some(t => t.label.trim() && t.title.trim())
    : fallbackLabel.trim() && fallbackTitle.trim();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50 shrink-0">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Captions size={18} className="text-blue-500" />
              <span>図表キャプションの挿入</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col gap-4 overflow-y-auto">
            
            {targets.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-slate-500 mb-2">
                  ノート内の図表が検出されました。キャプションを追加したい図表のタイトルを入力してください。（空欄のものはスキップされます）
                </div>
                {targets.map(t => {
                  const inputState = targetInputs.find(i => i.id === t.id) || { label: '', title: '' };
                  return (
                    <div key={t.id} className="flex flex-col gap-2 p-4 border rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        {t.type === 'image' ? (
                          <div className="w-32 h-32 flex-shrink-0 bg-white rounded border flex items-center justify-center overflow-hidden relative">
                            <img src={t.preview} alt="preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-32 h-32 flex-shrink-0 bg-white rounded border flex items-center justify-center overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-[400%] h-[400%] origin-top-left scale-[0.25] pointer-events-none p-4" dangerouslySetInnerHTML={{ __html: t.html }} />
                          </div>
                        )}
                        
                        {/* Inputs */}
                        <div className="flex-1 flex flex-col gap-3 justify-center">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              ラベル
                            </label>
                            <input
                              type="text"
                              value={inputState.label}
                              onChange={(e) => updateInput(t.id, 'label', e.target.value)}
                              className="w-full px-3 py-2 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              placeholder={t.type === 'image' ? '図1' : '表1'}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              タイトル
                            </label>
                            <input
                              type="text"
                              value={inputState.title}
                              onChange={(e) => updateInput(t.id, 'title', e.target.value)}
                              className="w-full px-3 py-2 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              placeholder="キャプションを入力..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInsert();
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    ラベル (例: 図1, 表2)
                  </label>
                  <input
                    type="text"
                    value={fallbackLabel}
                    onChange={(e) => setFallbackLabel(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="図1"
                  />
                </div>
                <div className="flex-[3]">
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    タイトル
                  </label>
                  <input
                    type="text"
                    value={fallbackTitle}
                    onChange={(e) => setFallbackTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="システム構成図"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInsert();
                    }}
                  />
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t bg-slate-50 flex justify-end gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded transition-colors font-medium"
            >
              キャンセル
            </button>
            <button
              onClick={handleInsert}
              disabled={!isValid}
              className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors font-medium"
            >
              挿入
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
