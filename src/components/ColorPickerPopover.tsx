import React, { useState, useRef, useEffect } from 'react';
import { Pipette, Check, RotateCcw, Sparkles, X } from 'lucide-react';

interface ColorPickerPopoverProps {
  mode: 'textColor' | 'highlight';
  currentColor: string;
  onSelectColor: (color: string) => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  savedRange?: Range | null;
}

// 10 Theme Hues × 5 Brightness steps
const THEME_COLOR_MATRIX = [
  // 1. Grays / Neutrals
  ['#ffffff', '#f8fafc', '#cbd5e1', '#64748b', '#0f172a'],
  // 2. Red
  ['#fef2f2', '#fca5a5', '#ef4444', '#b91c1c', '#7f1d1d'],
  // 3. Orange
  ['#fff7ed', '#fdba74', '#f97316', '#c2410c', '#7c2d12'],
  // 4. Amber / Warm Yellow
  ['#fffbeb', '#fcd34d', '#f59e0b', '#b45309', '#78350f'],
  // 5. Green
  ['#f0fdf4', '#86efac', '#22c55e', '#15803d', '#14532d'],
  // 6. Teal / Mint
  ['#f0fdfa', '#5eead4', '#14b8a6', '#0f766e', '#134e4a'],
  // 7. Sky Blue
  ['#f0f9ff', '#7dd3fc', '#0ea5e9', '#0369a1', '#0c4a6e'],
  // 8. Blue / Indigo
  ['#eff6ff', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'],
  // 9. Purple / Violet
  ['#f5f3ff', '#c4b5fd', '#8b5cf6', '#6d28d9', '#4c1d95'],
  // 10. Pink / Rose
  ['#fff1f2', '#fda4af', '#f43f5e', '#be123c', '#881337'],
];

// Standard high-visibility colors
const STANDARD_COLORS = [
  { name: 'ブラック', hex: '#000000' },
  { name: 'ダークグレー', hex: '#475569' },
  { name: 'レッド', hex: '#dc2626' },
  { name: 'オレンジ', hex: '#ea580c' },
  { name: 'イエロー', hex: '#ca8a04' },
  { name: 'グリーン', hex: '#16a34a' },
  { name: 'シアン', hex: '#0891b2' },
  { name: 'ブルー', hex: '#2563eb' },
  { name: 'パープル', hex: '#7c3aed' },
  { name: 'マゼンタ', hex: '#db2777' },
];

// Highlight / Marker preset colors
const HIGHLIGHT_COLORS = [
  { name: 'イエロー', hex: '#fef08a' },
  { name: 'グリーン', hex: '#bbf7d0' },
  { name: 'シアン', hex: '#bae6fd' },
  { name: 'ピンク', hex: '#fbcfe8' },
  { name: 'オレンジ', hex: '#fed7aa' },
  { name: 'パープル', hex: '#e9d5ff' },
  { name: 'ライム', hex: '#d9f99d' },
  { name: 'グレー', hex: '#e2e8f0' },
];

const RECENT_COLORS_STORAGE_KEY = 'marp_editor_recent_colors';

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  mode,
  currentColor,
  onSelectColor,
  onClose,
  triggerRef,
  savedRange,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [customHex, setCustomHex] = useState(
    currentColor && currentColor.startsWith('#') ? currentColor : '#2563eb'
  );
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_COLORS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['#dc2626', '#2563eb', '#16a34a', '#ca8a04'];
    } catch {
      return ['#dc2626', '#2563eb', '#16a34a', '#ca8a04'];
    }
  });

  // Restore selection before applying
  const applyColorSafely = (color: string) => {
    if (savedRange) {
      try {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(savedRange);
        }
      } catch (err) {
        console.warn('Could not restore selection:', err);
      }
    }

    onSelectColor(color);

    // Save to recent colors
    if (color && color !== 'transparent') {
      setRecentColors((prev) => {
        const next = [color, ...prev.filter((c) => c.toLowerCase() !== color.toLowerCase())].slice(0, 10);
        try {
          localStorage.setItem(RECENT_COLORS_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }

    onClose();
  };

  // Close on click outside or escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const isOutsidePopover = popoverRef.current && !popoverRef.current.contains(e.target as Node);
      const isOutsideTrigger = !triggerRef?.current || !triggerRef.current.contains(e.target as Node);
      if (isOutsidePopover && isOutsideTrigger) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, triggerRef]);

  const isTextColor = mode === 'textColor';
  const title = isTextColor ? '文字色の選択 (カラーピッカー)' : '蛍光ペン・マーカー色';

  return (
    <div
      ref={popoverRef}
      id="color-picker-popover"
      className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-lg shadow-2xl border border-slate-300 p-3 z-50 text-slate-800 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
        <div className="flex items-center space-x-1.5 font-bold text-slate-800 text-[12px]">
          <span
            className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
            style={{ backgroundColor: isTextColor ? (customHex || '#0f172a') : (customHex || '#fef08a') }}
          />
          <span>{title}</span>
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
          title="閉じる"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. Default / Automatic Reset Button */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => applyColorSafely(isTextColor ? '#0f172a' : 'transparent')}
        className="w-full flex items-center justify-between px-2.5 py-1.5 mb-2.5 rounded bg-slate-50 hover:bg-blue-50 hover:text-blue-900 border border-slate-200 hover:border-blue-300 font-medium transition cursor-pointer"
      >
        <div className="flex items-center space-x-2">
          {isTextColor ? (
            <span className="w-4 h-4 rounded border border-slate-400 bg-slate-900 shadow-2xs flex items-center justify-center text-[10px] text-white font-bold">
              A
            </span>
          ) : (
            <span className="w-4 h-4 rounded border border-slate-300 bg-white flex items-center justify-center text-[10px] text-slate-400">
              ✕
            </span>
          )}
          <span>{isTextColor ? '自動 (標準の黒色に戻す)' : 'なし (ハイライトを解除)'}</span>
        </div>
        <RotateCcw className="w-3 h-3 text-slate-400" />
      </button>

      {/* 2. Highlight Specific Presets (if highlight mode) */}
      {!isTextColor && (
        <div className="mb-3">
          <div className="text-[10px] font-semibold text-slate-500 mb-1.5">蛍光マーカー色</div>
          <div className="grid grid-cols-4 gap-1.5">
            {HIGHLIGHT_COLORS.map((item) => (
              <button
                key={item.hex}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyColorSafely(item.hex)}
                style={{ backgroundColor: item.hex }}
                className="h-7 rounded border border-slate-300 hover:scale-105 hover:shadow-sm transition flex items-center justify-center font-medium text-[10px] text-slate-800 cursor-pointer"
                title={item.name}
              >
                {currentColor.toLowerCase() === item.hex.toLowerCase() && <Check className="w-3 h-3 text-slate-900 stroke-[3]" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Theme Colors Grid (50 colors) */}
      <div className="mb-2.5">
        <div className="text-[10px] font-semibold text-slate-500 mb-1">テーマカラー</div>
        <div className="grid grid-cols-10 gap-1 bg-slate-50 p-1.5 rounded border border-slate-200">
          {THEME_COLOR_MATRIX.map((column, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1">
              {column.map((hex) => {
                const isSelected = (currentColor || '').toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setCustomHex(hex);
                      applyColorSafely(hex);
                    }}
                    style={{ backgroundColor: hex }}
                    title={hex}
                    className={`w-5 h-5 rounded-xs border transition cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500 ring-offset-1 z-10 scale-110'
                        : 'border-slate-300/80 hover:scale-115 hover:border-slate-700 hover:z-10'
                    }`}
                  >
                    {isSelected && (
                      <Check className={`w-2.5 h-2.5 ${hex === '#ffffff' || hex === '#f8fafc' || hex === '#fef2f2' || hex === '#fff7ed' || hex === '#fffbeb' || hex === '#f0fdf4' || hex === '#f0fdfa' || hex === '#f0f9ff' || hex === '#eff6ff' || hex === '#f5f3ff' || hex === '#fff1f2' ? 'text-slate-900 stroke-[3]' : 'text-white stroke-[3]'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Standard Colors (10 quick colors) */}
      <div className="mb-3">
        <div className="text-[10px] font-semibold text-slate-500 mb-1">標準カラー</div>
        <div className="grid grid-cols-10 gap-1">
          {STANDARD_COLORS.map((item) => {
            const isSelected = (currentColor || '').toLowerCase() === item.hex.toLowerCase();
            return (
              <button
                key={item.hex}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setCustomHex(item.hex);
                  applyColorSafely(item.hex);
                }}
                style={{ backgroundColor: item.hex }}
                title={`${item.name} (${item.hex})`}
                className={`w-5 h-5 rounded-xs border transition cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500 ring-offset-1 z-10 scale-110'
                    : 'border-slate-300 hover:scale-115 hover:border-slate-700 hover:z-10'
                }`}
              >
                {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Custom Color Picker & HEX Input */}
      <div className="pt-2 border-t border-slate-200">
        <div className="text-[10px] font-semibold text-slate-500 mb-1.5 flex items-center justify-between">
          <span>カスタムカラー (自由選択)</span>
          <span className="text-[9px] text-slate-400">スポイト/HEX対応</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Native HTML5 Color Picker trigger */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => colorInputRef.current?.click()}
              className="w-8 h-8 rounded border border-slate-300 shadow-2xs hover:border-blue-500 transition cursor-pointer flex items-center justify-center p-0.5"
              style={{ backgroundColor: customHex }}
              title="カラーピッカー (色相サークル・スポイト) を開く"
            >
              <Pipette className={`w-3.5 h-3.5 ${customHex === '#ffffff' || customHex === '#fef08a' ? 'text-slate-800' : 'text-white'} drop-shadow-xs`} />
            </button>
            <input
              ref={colorInputRef}
              type="color"
              value={customHex.startsWith('#') && customHex.length === 7 ? customHex : '#2563eb'}
              onChange={(e) => {
                setCustomHex(e.target.value);
              }}
              className="sr-only"
            />
          </div>

          {/* HEX code text field */}
          <div className="flex-1 flex items-center space-x-1">
            <input
              type="text"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              placeholder="#000000"
              className="w-full h-8 px-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyColorSafely(customHex)}
              className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded text-xs transition cursor-pointer whitespace-nowrap shadow-2xs"
            >
              適用
            </button>
          </div>
        </div>
      </div>

      {/* 6. Recent Colors */}
      {recentColors.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-slate-100">
          <div className="text-[10px] font-semibold text-slate-400 mb-1">最近使用した色</div>
          <div className="flex flex-wrap gap-1">
            {recentColors.map((hex, idx) => (
              <button
                key={`${hex}-${idx}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setCustomHex(hex);
                  applyColorSafely(hex);
                }}
                style={{ backgroundColor: hex }}
                title={hex}
                className="w-4 h-4 rounded-xs border border-slate-300 hover:scale-120 transition cursor-pointer"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
