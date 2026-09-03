import React, { useState, useEffect } from 'react';
import { SystemSettings, BodyWrapMode } from '../types';
import { 
  FONT_FAMILY_PRESETS, 
  FONT_SIZE_PRESETS, 
  WRAP_MODE_OPTIONS, 
  DEFAULT_SYSTEM_SETTINGS 
} from '../data/initialSettings';
import { 
  Settings, Type, AlignLeft, AlignCenter, Sliders, Check, 
  RotateCcw, X, Eye, Sparkles, BookOpen, Monitor, 
  Columns, WrapText, ChevronRight, HelpCircle, Laptop, RefreshCw, Plus
} from 'lucide-react';
import { 
  getAllAvailableFonts, 
  queryPCLoaclFonts, 
  addCustomFont, 
  SystemFontInfo,
  isLocalFontAccessSupported
} from '../utils/fontManager';

interface SystemOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onSaveSettings: (newSettings: SystemSettings) => void;
}

export const SystemOptionsModal: React.FC<SystemOptionsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [tempSettings, setTempSettings] = useState<SystemSettings>(settings);
  const [activeTab, setActiveTab] = useState<'font' | 'wrap' | 'layout'>('font');
  const [customFontInput, setCustomFontInput] = useState<string>('');
  const [isCustomFont, setIsCustomFont] = useState<boolean>(false);
  const [availableFonts, setAvailableFonts] = useState<SystemFontInfo[]>(() => getAllAvailableFonts());
  const [isLoadingPCFonts, setIsLoadingPCFonts] = useState<boolean>(false);
  const [pcScanMessage, setPcScanMessage] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempSettings(settings);
      setAvailableFonts(getAllAvailableFonts());
      const isPreset = FONT_FAMILY_PRESETS.some((f) => f.family === settings.fontFamily);
      if (!isPreset) {
        setIsCustomFont(true);
        setCustomFontInput(settings.fontFamily);
      } else {
        setIsCustomFont(false);
        setCustomFontInput('');
      }
    }
  }, [isOpen, settings]);

  const handleScanPCFonts = async () => {
    setIsLoadingPCFonts(true);
    setPcScanMessage('PCフォントを読み込み中...');
    try {
      const fonts = await queryPCLoaclFonts();
      setAvailableFonts(getAllAvailableFonts());
      setPcScanMessage(`PCローカルフォントを ${fonts.length} 件 読み込みました`);
      setTimeout(() => setPcScanMessage(''), 4000);
    } catch (err: any) {
      setPcScanMessage('PCフォント読み込みに失敗しました');
    } finally {
      setIsLoadingPCFonts(false);
    }
  };

  const handleAddCustomFont = () => {
    if (!customFontInput.trim()) return;
    addCustomFont(customFontInput.trim());
    setAvailableFonts(getAllAvailableFonts());
    handleFontSelect(customFontInput.trim());
  };

  if (!isOpen) return null;

  const handleFontSelect = (family: string) => {
    setIsCustomFont(false);
    setTempSettings((prev) => ({ ...prev, fontFamily: family }));
  };

  const handleCustomFontChange = (val: string) => {
    setCustomFontInput(val);
    setTempSettings((prev) => ({ ...prev, fontFamily: val || DEFAULT_SYSTEM_SETTINGS.fontFamily }));
  };

  const handleFontSizeSelect = (size: string) => {
    setTempSettings((prev) => ({ ...prev, fontSize: size }));
  };

  const handleWrapModeSelect = (mode: BodyWrapMode) => {
    const wrapOption = WRAP_MODE_OPTIONS.find((o) => o.mode === mode);
    const defaultVal = wrapOption?.defaultVal || (mode === 'characters' ? 80 : 800);
    setTempSettings((prev) => ({
      ...prev,
      bodyWrapMode: mode,
      bodyWrapValue: prev.bodyWrapMode === mode && prev.bodyWrapValue ? prev.bodyWrapValue : defaultVal,
    }));
  };

  const handleWrapValueChange = (val: number) => {
    setTempSettings((prev) => ({ ...prev, bodyWrapValue: val }));
  };

  const handleLineHeightSelect = (lh: string) => {
    setTempSettings((prev) => ({ ...prev, lineHeight: lh }));
  };

  const handleAlignmentSelect = (align: 'left' | 'center') => {
    setTempSettings((prev) => ({ ...prev, contentAlignment: align }));
  };

  const handleResetDefaults = () => {
    setTempSettings(DEFAULT_SYSTEM_SETTINGS);
    setIsCustomFont(false);
    setCustomFontInput('');
    setShowResetConfirm(false);
  };

  const handleSave = () => {
    onSaveSettings(tempSettings);
    onClose();
  };

  // Calculate live preview container styles based on tempSettings
  const getPreviewWrapStyle = () => {
    if (tempSettings.bodyWrapMode === 'characters') {
      return {
        maxWidth: `${tempSettings.bodyWrapValue}ch`,
        margin: tempSettings.contentAlignment === 'left' ? '0' : '0 auto',
        whiteSpace: 'normal' as const,
      };
    }
    if (tempSettings.bodyWrapMode === 'pixels') {
      return {
        maxWidth: `${Math.min(tempSettings.bodyWrapValue, 750)}px`,
        margin: tempSettings.contentAlignment === 'left' ? '0' : '0 auto',
        whiteSpace: 'normal' as const,
      };
    }
    if (tempSettings.bodyWrapMode === 'none') {
      return {
        maxWidth: 'none',
        whiteSpace: 'pre' as const,
        overflowX: 'auto' as const,
      };
    }
    return {
      maxWidth: '100%',
      margin: '0',
      whiteSpace: 'normal' as const,
    };
  };

  const currentFontObj = FONT_FAMILY_PRESETS.find((f) => f.family === tempSettings.fontFamily);
  const currentFontSizeObj = FONT_SIZE_PRESETS.find((s) => s.value === tempSettings.fontSize);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in select-none">
      <div 
        id="system-options-dialog"
        className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-100 via-slate-50 to-blue-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>システム設定・表示オプション (System Options)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ノートエディタ全体のフォント、基本文字サイズ、本文折り返し位置を設定します
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 p-1.5 rounded-lg transition"
            title="閉じる (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}

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
                </div>
        

                  {pcScanMessage && (
                    <div className="mb-2 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded text-[11px] animate-in fade-in flex items-center justify-between">
                      <span>{pcScanMessage}</span>
                      <span className="text-[10px] text-blue-600 font-mono">計 {availableFonts.length} フォント</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-slate-50/50">
                    {/* Default Presets first */}
                    {FONT_FAMILY_PRESETS.map((preset) => {
                      const isSelected = !isCustomFont && (tempSettings.fontFamily === preset.family || tempSettings.fontFamily === preset.name);
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleFontSelect(preset.family)}
                          className={`p-2.5 text-left rounded-md border text-xs transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-50/90 border-blue-500 text-blue-900 ring-2 ring-blue-400/40 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="font-semibold truncate">{preset.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          </div>
                          <span 
                            className="text-[13px] text-slate-600 truncate py-0.5"
                            style={{ fontFamily: preset.family }}
                          >
                            あいうえお ABC 123
                          </span>
                          <span className="text-[10px] text-slate-400 truncate mt-0.5">
                            {preset.description}
                          </span>
                        </button>
                      );
                    })}

                    {/* Scanned PC Local / Custom Fonts */}
                    {availableFonts
                      .filter((f) => !FONT_FAMILY_PRESETS.some((p) => p.family.toLowerCase() === f.family.toLowerCase()))
                      .map((font) => {
                        const isSelected = tempSettings.fontFamily.toLowerCase() === font.family.toLowerCase();
                        return (
                          <button
                            key={font.family}
                            type="button"
                            onClick={() => handleFontSelect(font.family)}
                            className={`p-2.5 text-left rounded-md border text-xs transition flex flex-col justify-between ${
                              isSelected
                                ? 'bg-blue-50/90 border-blue-500 text-blue-900 ring-2 ring-blue-400/40 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className="font-semibold truncate flex items-center gap-1">
                                <span>{font.name}</span>
                                {font.isLocalPC && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 py-0.2 rounded">
                                    PC
                                  </span>
                                )}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                            </div>
                            <span 
                              className="text-[13px] text-slate-600 truncate py-0.5"
                              style={{ fontFamily: font.family }}
                            >
                              あいうえお ABC 123
                            </span>
                            <span className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                              {font.family}
                            </span>
                          </button>
                        );
                      })}
                  </div>

                  {/* Custom Font Input Toggle */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="フォント名を手動入力（例: Noto Sans JP, Meiryo, 游ゴシック）"
                      value={customFontInput}
                      onChange={(e) => {
                        setIsCustomFont(true);
                        handleCustomFontChange(e.target.value);
                      }}
                      className={`flex-1 px-3 py-1.5 text-xs rounded border transition ${
                        isCustomFont
                          ? 'border-blue-500 bg-blue-50/30 text-slate-900 focus:ring-1 focus:ring-blue-500'
                          : 'border-slate-300 bg-white text-slate-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomFont}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-medium flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>追加</span>
                    </button>
                    {isCustomFont && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded">
                        カスタム適用中
                      </span>
                    )}
                  </div>
                </div>

                {/* Font Size Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="font-serif text-sm text-blue-600 font-bold">Aa</span>
                      <span>基本文字サイズ (Font Size)</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {tempSettings.fontSize}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {FONT_SIZE_PRESETS.map((sz) => {
                      const isSelected = tempSettings.fontSize === sz.value;
                      return (
                        <button
                          key={sz.value}
                          type="button"
                          onClick={() => handleFontSizeSelect(sz.value)}
                          className={`px-2.5 py-2 text-center rounded-lg border text-xs font-medium transition ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>{sz.value}</div>
                          <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            {sz.px}px
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    ※ <strong className="text-slate-700">10.5pt (14px)</strong> は日本語Word文書・公用文の業界標準サイズです。
                  </p>
                </div>
              </div>

            {/* TAB 2: Note Body Wrap Position */}
            <div className="space-y-8 animate-in fade-in mt-8 border-t border-slate-200 pt-8">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <WrapText className="w-3.5 h-3.5 text-blue-600" />
                      <span>ノート本文の折り返しモード (Word Wrap Mode)</span>
                    </label>
                  </div>

                  {/* 4 Wrap Mode Cards */}
                  <div className="space-y-2.5">
                    {WRAP_MODE_OPTIONS.map((opt) => {
                      const isSelected = tempSettings.bodyWrapMode === opt.mode;
                      return (
                        <div
                          key={opt.mode}
                          onClick={() => handleWrapModeSelect(opt.mode)}
                          className={`p-3 rounded-lg border cursor-pointer transition ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-400/40 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2.5">
                              <input
                                type="radio"
                                name="wrapMode"
                                checked={isSelected}
                                onChange={() => handleWrapModeSelect(opt.mode)}
                                className="w-4 h-4 text-blue-600 text-xs mt-0.5 cursor-pointer"
                              />
                              <div>
                                <span className="text-xs font-bold text-slate-900">{opt.title}</span>
                                <p className="text-[11px] text-slate-500 mt-0.5">{opt.subtitle}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full shrink-0">
                                選択中
                              </span>
                            )}
                          </div>

                          {/* Controls when 'characters' is selected */}
                          {isSelected && opt.mode === 'characters' && (
                            <div className="mt-3 pt-3 border-t border-blue-200/80 pl-6 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-700">
                                  折り返し文字数: <strong className="text-blue-700 font-mono text-sm">{tempSettings.bodyWrapValue} 文字</strong>
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  ({tempSettings.bodyWrapValue}ch)
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {opt.presets.map((num) => (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleWrapValueChange(num);
                                    }}
                                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                                      tempSettings.bodyWrapValue === num
                                        ? 'bg-blue-600 text-white shadow-2xs'
                                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    {num}文字 {num === 40 ? '（原稿用紙）' : ''}
                                  </button>
                                ))}
                              </div>
                              <input
                                type="range"
                                min={20}
                                max={160}
                                step={5}
                                value={tempSettings.bodyWrapValue}
                                onChange={(e) => handleWrapValueChange(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              />
                            </div>
                          )}

                          {/* Controls when 'pixels' is selected */}
                          {isSelected && opt.mode === 'pixels' && (
                            <div className="mt-3 pt-3 border-t border-blue-200/80 pl-6 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-700">
                                  固定幅: <strong className="text-blue-700 font-mono text-sm">{tempSettings.bodyWrapValue} px</strong>
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {tempSettings.bodyWrapValue === 800 ? 'A4ノート標準幅' : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {opt.presets.map((num) => (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleWrapValueChange(num);
                                    }}
                                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                                      tempSettings.bodyWrapValue === num
                                        ? 'bg-blue-600 text-white shadow-2xs'
                                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    {num}px
                                  </button>
                                ))}
                              </div>
                              <input
                                type="range"
                                min={500}
                                max={1400}
                                step={50}
                                value={tempSettings.bodyWrapValue}
                                onChange={(e) => handleWrapValueChange(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            {/* TAB 3: Line Height & Layout Alignment */}
            <div className="space-y-8 animate-in fade-in mt-8 border-t border-slate-200 pt-8">
                
                {/* Tab Position: Bottom (Default) vs Top */}
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <Columns className="w-3.5 h-3.5 text-blue-600" />
                    <span>開いているタブの表示位置 (Notebook Tabs Position)</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.5 rounded">初期値: 下部</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTempSettings(prev => ({ ...prev, tabPosition: 'bottom' }))}
                      className={`p-3 rounded-lg border text-left text-xs transition flex items-center space-x-2.5 ${
                        (tempSettings.tabPosition || 'bottom') === 'bottom'
                          ? 'bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-400/40'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded bg-blue-100 flex flex-col justify-end p-0.5 border border-blue-300 shrink-0">
                        <div className="w-full h-2 bg-blue-600 rounded-xs"></div>
                      </div>
                      <div>
                        <div className="font-bold flex items-center gap-1">
                          <span>下部に表示 (Bottom)</span>
                          <span className="text-[10px] text-blue-600 bg-blue-100 px-1 rounded">初期値・推奨</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">エディタ下部・ステータスバーの上に配置</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTempSettings(prev => ({ ...prev, tabPosition: 'top' }))}
                      className={`p-3 rounded-lg border text-left text-xs transition flex items-center space-x-2.5 ${
                        tempSettings.tabPosition === 'top'
                          ? 'bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-400/40'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded bg-blue-100 flex flex-col justify-start p-0.5 border border-blue-300 shrink-0">
                        <div className="w-full h-2 bg-blue-600 rounded-xs"></div>
                      </div>
                      <div>
                        <div className="font-bold">上部に表示 (Top)</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">リボン・ツールバーの直下に配置</div>
                      </div>
                    </button>
                  </div>
                </div>

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

                {/* Line Height */}
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    <span>行間・行送り (Line Spacing)</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { val: '1.4', label: '1.4 (狭め)', desc: '高密度表示' },
                      { val: '1.6', label: '1.6 (標準)', desc: '推奨・自然' },
                      { val: '1.8', label: '1.8 (広め)', desc: '長文読解向け' },
                      { val: '2.0', label: '2.0 (2倍)', desc: 'ゆったり行送り' },
                    ].map((item) => {
                      const isSelected = tempSettings.lineHeight === item.val;
                      return (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => handleLineHeightSelect(item.val)}
                          className={`p-2.5 rounded-lg border text-center text-xs transition ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div>{item.label}</div>
                          <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            {item.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content Alignment when wrap is enabled */}
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <AlignCenter className="w-3.5 h-3.5 text-blue-600" />
                    <span>ノート本文の用紙配置 (Page Alignment)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleAlignmentSelect('center')}
                      className={`p-3 rounded-lg border text-left text-xs transition flex items-center space-x-2.5 ${
                        (tempSettings.contentAlignment || 'center') === 'center'
                          ? 'bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-400/40'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <AlignCenter className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <div className="font-bold">中央揃え (Center) - 推奨</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">用紙のように画面中央に配置</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAlignmentSelect('left')}
                      className={`p-3 rounded-lg border text-left text-xs transition flex items-center space-x-2.5 ${
                        tempSettings.contentAlignment === 'left'
                          ? 'bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-400/40'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <AlignLeft className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <div className="font-bold">左寄せ (Left Align)</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">画面左端から固定幅で折り返し</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Page Margin / Padding */}
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <Columns className="w-3.5 h-3.5 text-blue-600" />
                    <span>用紙余白 (Page Padding)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'compact', label: 'コンパクト (16px)' },
                      { val: 'normal', label: '標準 (24px)' },
                      { val: 'spacious', label: 'ゆったり (32px)' },
                    ].map((item) => {
                      const isSelected = (tempSettings.pagePadding || 'normal') === item.val;
                      return (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setTempSettings((prev) => ({ ...prev, pagePadding: item.val as any }))}
                          className={`p-2 rounded-lg border text-center text-xs transition ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
          </div>
          {/* Right Column: Dynamic Live Preview Box (5 cols) */}
          <div className="md:col-span-5 p-6 bg-slate-50/80 flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>リアルタイム プレビュー (Live Preview)</span>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-mono px-2 py-0.5 rounded border border-indigo-200">
                  {tempSettings.bodyWrapMode === 'characters'
                    ? `${tempSettings.bodyWrapValue}文字折り返し`
                    : tempSettings.bodyWrapMode === 'pixels'
                    ? `${tempSettings.bodyWrapValue}px幅`
                    : tempSettings.bodyWrapMode === 'none'
                    ? '折り返しなし'
                    : '全幅 (100%)'}
                </span>
              </div>

              {/* Sample Note Rendering Area */}
              <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-4 overflow-y-auto max-h-[38vh]">
                <div 
                  className="transition-all duration-200"
                  style={getPreviewWrapStyle()}
                >
                  <h3 
                    className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 mb-2"
                    style={{
                      fontFamily: tempSettings.fontFamily,
                      fontSize: `calc(${tempSettings.fontSize} * 1.25)`,
                    }}
                  >
                    📝 サンプルノート見出し
                  </h3>

                  <div 
                    className="text-slate-800 space-y-2 leading-relaxed"
                    style={{
                      fontFamily: tempSettings.fontFamily,
                      fontSize: tempSettings.fontSize,
                      lineHeight: tempSettings.lineHeight,
                    }}
                  >
                    <p>
                      これは階層型リッチノートマネージャーのプレビューです。指定したフォント、文字サイズ（{tempSettings.fontSize}）、および本文折り返し位置が即座に反映されます。
                    </p>
                    <p>
                      設定を保存すると、すべてのノート本文（リッチテキスト、暗号化ノート等）にこの設定が自動適用されます。
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                      <li>フォント: <span className="font-semibold">{currentFontObj?.name || 'カスタム'}</span></li>
                      <li>折り返し: <span className="font-semibold">{tempSettings.bodyWrapMode}</span></li>
                      <li>行間: <span className="font-semibold">{tempSettings.lineHeight}</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Hint Box */}
            <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-slate-700 flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-snug text-[11px]">
                設定したオプションはブラウザのローカル環境に永続保存され、次回起動時も維持されます。
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-300 flex items-center justify-between">
          <div className="relative">
            <button
              id="btn-reset-default-options"
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md border border-slate-300 font-medium flex items-center space-x-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>初期値にリセット</span>
            </button>
            {showResetConfirm && (
              <div className="absolute bottom-full left-0 mb-2 p-3 bg-white border border-red-200 shadow-xl rounded-lg z-20 w-64 animate-in fade-in zoom-in-95">
                <p className="text-xs font-bold text-slate-800 mb-2 leading-relaxed">
                  設定を既定値（デフォルト）に戻しますか？
                </p>
                <div className="flex space-x-2 justify-start">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleResetDefaults}
                    className="px-2.5 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition shadow-sm font-medium"
                  >
                    リセットする
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              id="btn-cancel-options"
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-200 rounded-md border border-slate-300 font-semibold transition"
            >
              キャンセル
            </button>
            <button
              id="btn-save-options"
              onClick={handleSave}
              className="px-5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold shadow-sm flex items-center space-x-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>設定を保存して適用</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
