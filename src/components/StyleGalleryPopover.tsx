import React, { useState, useRef, useEffect } from 'react';
import { TextStylePreset, StyleCategory } from '../types';
import { 
  Sparkles, Plus, Eraser, Edit3, Trash2, X, Check, 
  Settings, Type, AlignLeft, ChevronRight, Eye, EyeOff, RotateCcw 
} from 'lucide-react';

interface StyleGalleryPopoverProps {
  characterStyles: TextStylePreset[];
  paragraphStyles: TextStylePreset[];
  activeStyleId?: string | null;
  onApplyStyle: (style: TextStylePreset) => void;
  onClearFormat: () => void;
  onCreateNewStyle: (category: StyleCategory) => void;
  onEditStyle: (style: TextStylePreset) => void;
  onDeleteStyle: (styleId: string) => void;
  onToggleHideStyle?: (styleId: string) => void;
  onResetDefaultStyles?: () => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  savedRange?: Range | null;
  initialTab?: 'all' | 'character' | 'paragraph';
}

export const StyleGalleryPopover: React.FC<StyleGalleryPopoverProps> = ({
  characterStyles,
  paragraphStyles,
  activeStyleId,
  onApplyStyle,
  onClearFormat,
  onCreateNewStyle,
  onEditStyle,
  onDeleteStyle,
  onToggleHideStyle,
  onResetDefaultStyles,
  onClose,
  triggerRef,
  savedRange,
  initialTab = 'all',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'character' | 'paragraph'>(initialTab);
  const [hoveredStyleId, setHoveredStyleId] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState<boolean>(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'c' || e.key === 'C') {
        // shortcut 'C' for clear
        if (e.altKey) {
          onClearFormat();
          onClose();
        }
      } else if (e.key === 'n' || e.key === 'N') {
        // shortcut 'N' for new style
        if (e.altKey) {
          onCreateNewStyle(activeTab === 'paragraph' ? 'paragraph' : 'character');
        }
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
  }, [onClose, triggerRef, onClearFormat, onCreateNewStyle, activeTab]);

  // Restore selection before applying style
  const handleApplyWithSelection = (style: TextStylePreset) => {
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
    onApplyStyle(style);
    onClose();
  };

  // Filter displayed styles based on active tab
  const baseStyles: TextStylePreset[] = 
    activeTab === 'all'
      ? [...characterStyles, ...paragraphStyles]
      : activeTab === 'character'
      ? characterStyles
      : paragraphStyles;
  const displayedStyles = baseStyles.filter(s => showHidden || !s.isHidden);

  // Render preview sample text with style
  const renderSampleContent = (style: TextStylePreset) => {
    const isParagraph = style.category === 'paragraph';

    // Compute sample CSS style
    const sampleCss: React.CSSProperties = {
      fontFamily: style.fontFamily || 'inherit',
      fontSize: style.fontSize ? (parseInt(style.fontSize) > 22 ? '19px' : parseInt(style.fontSize) < 12 ? '11px' : '14px') : '14px',
      fontWeight: style.fontWeight || 'normal',
      fontStyle: style.fontStyle || 'normal',
      color: style.textColor || '#0f172a',
      backgroundColor: style.backgroundColor || 'transparent',
      textDecoration: style.textDecoration || 'none',
      textDecorationStyle: style.underlineStyle as any,
      textDecorationColor: style.underlineColor,
      textAlign: isParagraph && style.textAlign === 'center' ? 'center' : 'inherit',
      lineHeight: style.lineHeight ? parseFloat(style.lineHeight) : 1.2,
      display: 'inline-block',
      maxWidth: '100%',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      padding: style.backgroundColor && style.backgroundColor !== 'transparent' ? '1px 3px' : '0',
      borderRadius: style.backgroundColor && style.backgroundColor !== 'transparent' ? '2px' : '0',
    };

    return (
      <span style={sampleCss} className="transition-transform">
        か力漢
      </span>
    );
  };

  return (
    <div
      ref={popoverRef}
      id="style-gallery-popover"
      className="absolute top-full right-0 mt-1.5 w-[460px] bg-white rounded-lg shadow-2xl border border-slate-300 z-50 text-slate-800 text-xs select-none overflow-hidden animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Top Header with Tabs */}
      <div className="bg-slate-100/90 px-3 pt-2.5 pb-2 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={`px-2 py-1 rounded text-[10px] font-medium transition ${
              showHidden ? 'bg-slate-200 text-slate-700' : 'text-slate-500 hover:bg-slate-200'
            }`}
            title={showHidden ? "非表示スタイルを隠す" : "非表示スタイルも表示"}
          >
            {showHidden ? <EyeOff className="w-3 h-3 inline mr-1"/> : <Eye className="w-3 h-3 inline mr-1"/>}
            非表示
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-300/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            すべて一覧
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('character')}
            className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'character'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-300/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-blue-600" />
            <span>文字書式 ({characterStyles.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paragraph')}
            className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'paragraph'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-300/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5 text-amber-600" />
            <span>段落書式 ({paragraphStyles.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer"
          title="閉じる (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Styles Gallery Grid (Matches screenshot: 6 columns of square cards) */}
      <div className="p-3 max-h-[360px] overflow-y-auto bg-white">
        <div className="grid grid-cols-6 gap-2">
          {displayedStyles.map((style) => {
            const isSelected = activeStyleId === style.id;
            const isHovered = hoveredStyleId === style.id;
            const displayName = style.symbolPrefix ? `${style.symbolPrefix}${style.name}` : style.name;

            return (
              <div
                key={style.id}
                onMouseEnter={() => setHoveredStyleId(style.id)}
                onMouseLeave={() => setHoveredStyleId(null)}
                className="relative group flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => handleApplyWithSelection(style)}
                  title={`${style.name} (${style.category === 'paragraph' ? '段落書式' : '文字書式'})`}
                  className={`w-full h-18 rounded border flex flex-col items-center justify-between p-1.5 transition cursor-pointer bg-white ${
                    isSelected
                      ? 'border-2 border-blue-500 bg-blue-50/20 shadow-xs ring-1 ring-blue-400/50 z-10'
                      : 'border-slate-200 hover:border-blue-400 hover:shadow-xs hover:bg-slate-50/60'
                  }`}
                >
                  {/* Top Preview Text: "か力漢" with exact applied styling */}
                  <div className="h-8 w-full flex items-center justify-center overflow-hidden">
                    {renderSampleContent(style)}
                  </div>

                  {/* Bottom Style Name */}
                  <div className="w-full text-center">
                    <span className="text-[11px] text-slate-700 font-sans truncate block leading-tight">
                      {displayName}
                    </span>
                  </div>
                </button>

                {/* Edit / Configure button on hover */}
                {isHovered && (
                  <div className="absolute top-0.5 right-0.5 flex space-x-0.5 z-20 bg-white/95 backdrop-blur-xs rounded shadow-xs p-0.5 border border-slate-300">
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditStyle(style);
                      }}
                      title="このスタイルを変更・編集"
                      className="p-0.5 hover:bg-blue-100 hover:text-blue-700 text-slate-600 rounded transition cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    {style.isBuiltin && onToggleHideStyle && (
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleHideStyle(style.id);
                        }}
                        title={style.isHidden ? "このスタイルを表示" : "このスタイルを非表示"}
                        className={`p-0.5 rounded transition cursor-pointer ${
                          style.isHidden
                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            : 'hover:bg-amber-100 hover:text-amber-700 text-slate-600'
                        }`}
                      >
                        {style.isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`スタイル「${style.name}」を削除してもよろしいですか？`)) {
                          onDeleteStyle(style.id);
                        }
                      }}
                      title="このスタイルを削除"
                      className="p-0.5 hover:bg-red-100 hover:text-red-700 text-slate-600 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dark Footer Action Bar (Matches screenshot: 書式のクリア, 新しいスタイル) */}
      <div className="bg-[#2d3339] text-white px-3 py-2 border-t border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Clear Formatting button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onClearFormat();
              onClose();
            }}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-700/80 hover:bg-slate-600 text-slate-200 hover:text-white transition cursor-pointer text-xs font-medium"
            title="書式のクリア (Alt+C)"
          >
            <Eraser className="w-3.5 h-3.5 text-amber-400" />
            <span>書式のクリア(<u>C</u>)</span>
          </button>

          {/* New Style button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onCreateNewStyle(activeTab === 'paragraph' ? 'paragraph' : 'character');
            }}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-blue-600/90 hover:bg-blue-500 text-white transition cursor-pointer text-xs font-medium shadow-xs"
            title="新しいスタイルの登録 (Alt+N)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新しいスタイル(<u>N</u>)...</span>
          </button>
        </div>

        {onResetDefaultStyles && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onResetDefaultStyles();
            }}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs"
            title="削除したスタイルを初期状態に戻す"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>初期状態に戻す</span>
          </button>
        )}

        <div className="text-[10px] text-slate-400">
          合計 {displayedStyles.length} スタイル
        </div>
      </div>
    </div>
  );
};
