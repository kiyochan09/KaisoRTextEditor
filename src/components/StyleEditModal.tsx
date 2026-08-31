import React, { useState, useEffect } from 'react';
import { TextStylePreset, StyleCategory, SystemSettings } from '../types';
import {  X, Check, Eye, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, Laptop, RefreshCw, Plus , Trash2 } from 'lucide-react';
import { 
  getAllAvailableFonts, 
  queryPCLoaclFonts, 
  addCustomFont, 
  SystemFontInfo, 
  getFriendlyFontName 
} from '../utils/fontManager';

interface StyleEditModalProps {
  isOpen: boolean;
  editingStyle: TextStylePreset | null; // null for create new
  defaultCategory?: StyleCategory;
  onSave: (style: TextStylePreset) => void;
  onClose: () => void;
  onDeleteStyle?: (styleId: string) => void;
  settings?: SystemSettings;
}

const FONT_SIZES_OPTIONS = [
  { label: '指定なし (標準サイズ)', value: '' },
  { label: '8pt (10.7px)', value: '8pt' },
  { label: '9pt (12px)', value: '9pt' },
  { label: '10pt (13.3px)', value: '10pt' },
  { label: '10.5pt (14px) ★標準', value: '10.5pt' },
  { label: '11pt (14.7px)', value: '11pt' },
  { label: '12pt (16px)', value: '12pt' },
  { label: '13pt (17.3px)', value: '13pt' },
  { label: '14pt (18.7px)', value: '14pt' },
  { label: '16pt (21.3px)', value: '16pt' },
  { label: '18pt (24px)', value: '18pt' },
  { label: '20pt (26.7px)', value: '20pt' },
  { label: '24pt (32px)', value: '24pt' },
  { label: '28pt (37.3px)', value: '28pt' },
  { label: '32pt (42.7px)', value: '32pt' },
  { label: '36pt (48px)', value: '36pt' },
];

export const StyleEditModal: React.FC<StyleEditModalProps> = ({
  isOpen,
  editingStyle,
  defaultCategory = 'character',
  onSave,
  onClose,
  settings,
  onDeleteStyle,
}) => {
  const isEditing = Boolean(editingStyle);

  const [name, setName] = useState(editingStyle?.name || '');
  const [category, setCategory] = useState<StyleCategory>(
    editingStyle?.category || defaultCategory
  );
  const [symbolPrefix, setSymbolPrefix] = useState(editingStyle?.symbolPrefix || (defaultCategory === 'paragraph' ? '↵' : ''));

  // PC System Fonts list & dynamic loading
  const [availableFonts, setAvailableFonts] = useState<SystemFontInfo[]>(() => getAllAvailableFonts());
  const [isLoadingPCFonts, setIsLoadingPCFonts] = useState<boolean>(false);
  const [fontScanMessage, setFontScanMessage] = useState<string>('');
  const [showCustomFontModal, setShowCustomFontModal] = useState<boolean>(false);
  const [customFontInput, setCustomFontInput] = useState<string>('');

  // Character styles
  const [fontFamily, setFontFamily] = useState(editingStyle?.fontFamily || '');
  const [fontSize, setFontSize] = useState(editingStyle?.fontSize || (category === 'paragraph' ? '16px' : ''));
  const [isBold, setIsBold] = useState(editingStyle?.fontWeight === 'bold' || editingStyle?.fontWeight === '700');
  const [isItalic, setIsItalic] = useState(editingStyle?.fontStyle === 'italic');
  const [textColor, setTextColor] = useState(editingStyle?.textColor || '#0f172a');
  
  // Underline / Strike
  const [hasUnderline, setHasUnderline] = useState(editingStyle?.textDecoration?.includes('underline') || false);
  const [hasStrike, setHasStrike] = useState(editingStyle?.textDecoration?.includes('line-through') || false);
  const [underlineStyle, setUnderlineStyle] = useState<'solid' | 'double' | 'dotted' | 'dashed' | 'wavy'>(
    editingStyle?.underlineStyle || 'solid'
  );
  const [underlineColor, setUnderlineColor] = useState(editingStyle?.underlineColor || '#991b1b');
  
  // Background / Marker
  const [backgroundColor, setBackgroundColor] = useState(editingStyle?.backgroundColor || 'transparent');
  const [hasBackground, setHasBackground] = useState(
    Boolean(editingStyle?.backgroundColor && editingStyle.backgroundColor !== 'transparent')
  );

  // Paragraph styles
  const [headingLevel, setHeadingLevel] = useState<'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'blockquote'>(
    editingStyle?.headingLevel || 'p'
  );
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>(
    editingStyle?.textAlign || 'left'
  );
  const [lineHeight, setLineHeight] = useState(editingStyle?.lineHeight || '1.6');
  const [hasIndent, setHasIndent] = useState(Boolean(editingStyle?.textIndent));
  const [textIndent, setTextIndent] = useState(editingStyle?.textIndent || '1.2em');
  const [marginTop, setMarginTop] = useState(editingStyle?.marginTop || '');
  const [marginBottom, setMarginBottom] = useState(editingStyle?.marginBottom || '');

  // Reset and synchronize when modal opens or editingStyle changes
  useEffect(() => {
    if (isOpen) {
      setName(editingStyle?.name || '');
      setCategory(editingStyle?.category || defaultCategory);
      setSymbolPrefix(editingStyle?.symbolPrefix || (defaultCategory === 'paragraph' ? '↵' : ''));
      setFontFamily(editingStyle?.fontFamily || '');
      setFontSize(editingStyle?.fontSize || (defaultCategory === 'paragraph' ? '16px' : ''));
      setIsBold(editingStyle?.fontWeight === 'bold' || editingStyle?.fontWeight === '700');
      setIsItalic(editingStyle?.fontStyle === 'italic');
      setTextColor(editingStyle?.textColor || '#0f172a');
      setHasUnderline(editingStyle?.textDecoration?.includes('underline') || false);
      setHasStrike(editingStyle?.textDecoration?.includes('line-through') || false);
      setUnderlineStyle(editingStyle?.underlineStyle || 'solid');
      setUnderlineColor(editingStyle?.underlineColor || '#991b1b');
      setBackgroundColor(editingStyle?.backgroundColor || 'transparent');
      setHasBackground(Boolean(editingStyle?.backgroundColor && editingStyle.backgroundColor !== 'transparent'));
      setHeadingLevel(editingStyle?.headingLevel || 'p');
      setTextAlign(editingStyle?.textAlign || 'left');
      setLineHeight(editingStyle?.lineHeight || '1.6');
      setHasIndent(Boolean(editingStyle?.textIndent));
      setTextIndent(editingStyle?.textIndent || '1.2em');
      setMarginTop(editingStyle?.marginTop || '');
      setMarginBottom(editingStyle?.marginBottom || '');
      setAvailableFonts(getAllAvailableFonts());
    }
  }, [isOpen, editingStyle, defaultCategory]);

  const handleScanPCFonts = async () => {
    setIsLoadingPCFonts(true);
    setFontScanMessage('PCフォントを読み込み中...');
    try {
      const fonts = await queryPCLoaclFonts();
      const updated = getAllAvailableFonts();
      setAvailableFonts(updated);
      setFontScanMessage(`PCフォントを ${fonts.length} 件 読み込みました`);
      setTimeout(() => setFontScanMessage(''), 3500);
    } catch {
      setFontScanMessage('PCフォントの読み込みに失敗しました');
    } finally {
      setIsLoadingPCFonts(false);
    }
  };

  const handleAddCustomFont = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customFontInput.trim();
    if (!clean) return;
    addCustomFont(clean);
    setAvailableFonts(getAllAvailableFonts());
    setFontFamily(clean);
    setShowCustomFontModal(false);
    setCustomFontInput('');
  };

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;

    let textDecoration = 'none';
    if (hasUnderline && hasStrike) {
      textDecoration = 'underline line-through';
    } else if (hasUnderline) {
      textDecoration = 'underline';
    } else if (hasStrike) {
      textDecoration = 'line-through';
    }

    const newStyle: TextStylePreset = {
      id: editingStyle?.id || `style-${Date.now()}`,
      name: name.trim(),
      category,
      symbolPrefix: category === 'paragraph' ? (symbolPrefix || '↵') : undefined,
      fontFamily: fontFamily || undefined,
      fontSize: fontSize || undefined,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      textColor: textColor || '#0f172a',
      textDecoration: textDecoration !== 'none' ? textDecoration : undefined,
      underlineStyle: hasUnderline ? underlineStyle : undefined,
      underlineColor: hasUnderline ? underlineColor : undefined,
      backgroundColor: hasBackground && backgroundColor !== 'transparent' ? backgroundColor : undefined,
      isBuiltin: false,
    };

    if (category === 'paragraph') {
      newStyle.headingLevel = headingLevel;
      newStyle.textAlign = textAlign;
      newStyle.lineHeight = lineHeight;
      newStyle.textIndent = hasIndent ? textIndent : undefined;
      newStyle.marginTop = marginTop || undefined;
      newStyle.marginBottom = marginBottom || undefined;
      if (headingLevel === 'blockquote') {
        newStyle.borderLeft = '4px solid #94a3b8';
        newStyle.paddingLeft = '12px';
      }
    }

    onSave(newStyle);
    onClose();
  };

  // Compute preview style object, falling back to systemSettings if not specified
  const effectiveFontFamily = fontFamily || settings?.fontFamily || 'sans-serif';
  const effectiveFontSize = fontSize || settings?.fontSize || '14px';

  const previewStyle: React.CSSProperties = {
    fontFamily: effectiveFontFamily,
    fontSize: effectiveFontSize,
    fontWeight: isBold ? 'bold' : 'normal',
    fontStyle: isItalic ? 'italic' : 'normal',
    color: textColor,
    backgroundColor: hasBackground ? backgroundColor : 'transparent',
    textDecoration: hasUnderline && hasStrike ? 'underline line-through' : hasUnderline ? 'underline' : hasStrike ? 'line-through' : 'none',
    textDecorationStyle: hasUnderline ? underlineStyle : undefined,
    textDecorationColor: hasUnderline ? underlineColor : undefined,
    textAlign,
    lineHeight,
    textIndent: category === 'paragraph' && hasIndent ? textIndent : undefined,
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-xl flex flex-col overflow-hidden text-slate-800 text-xs">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Type className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-sm">
              {isEditing ? `書式スタイルの変更 (${editingStyle?.name})` : '新しい書式スタイルの登録'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto max-h-[75vh] space-y-4">
          
          {/* 1. Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                スタイル名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 重要見出し, 赤色マーカー..."
                className="w-full h-8 px-2.5 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">スタイル種別</label>
              <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCategory('character')}
                  className={`flex-1 py-1.5 rounded font-medium text-xs transition ${
                    category === 'character' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600'
                  }`}
                >
                  文字書式
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('paragraph')}
                  className={`flex-1 py-1.5 rounded font-medium text-xs transition ${
                    category === 'paragraph' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600'
                  }`}
                >
                  段落書式
                </button>
              </div>
            </div>
          </div>

          {/* 2. Live Preview Box */}
          <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/70">
            <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center space-x-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>プレビュー表示</span>
            </div>
            <div className="min-h-[64px] bg-white border border-slate-200 rounded p-3 flex flex-col justify-center overflow-hidden">
              <div style={previewStyle}>
                か力漢 Sample Text 日本語の文章です。
              </div>
            </div>
          </div>

          {/* 3. Font & Text Settings */}
          <div className="space-y-3 pt-1 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-blue-600" />
                <span>フォント・文字設定</span>
              </div>
              <button
                type="button"
                onClick={handleScanPCFonts}
                disabled={isLoadingPCFonts}
                title="PC端末にインストールされているフォントを読み込みます"
                className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded text-[10px] font-medium flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
              >
                {isLoadingPCFonts ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                ) : (
                  <Laptop className="w-3 h-3 text-blue-600" />
                )}
                <span>PCフォント読込</span>
              </button>
            </div>

            {fontScanMessage && (
              <div className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded text-[11px] flex items-center justify-between">
                <span>{fontScanMessage}</span>
                <span className="text-[10px] font-mono font-bold text-blue-600">{availableFonts.length} 種類</span>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  フォント種類 <span className="text-[10px] text-slate-400 font-normal">（PCシステム連動）</span>
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__scan_pc_fonts__') {
                      handleScanPCFonts();
                      return;
                    }
                    if (val === '__add_custom_font__') {
                      setShowCustomFontModal(true);
                      return;
                    }
                    setFontFamily(val);
                  }}
                  className="w-full h-8 px-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:border-blue-500 font-sans"
                >
                  <option value="">
                    指定なし (既定: {getFriendlyFontName(settings?.fontFamily || 'Meiryo')})
                  </option>

                  {availableFonts.some((f) => f.isLocalPC) && (
                    <optgroup label="--- 💻 読み込み済み PC フォント ---">
                      {availableFonts
                        .filter((f) => f.isLocalPC)
                        .map((f) => (
                          <option key={f.family} value={f.family}>
                            💻 {f.name}
                          </option>
                        ))}
                    </optgroup>
                  )}

                  <optgroup label="--- システム標準・プリセットフォント ---">
                    {availableFonts
                      .filter((f) => !f.isLocalPC)
                      .map((f) => (
                        <option key={f.family} value={f.family}>
                          {f.name}
                        </option>
                      ))}
                  </optgroup>

                  <optgroup label="--- アクション ---">
                    <option value="__scan_pc_fonts__">💻 PCフォントを読み込む...</option>
                    <option value="__add_custom_font__">＋ フォント名を追加...</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  フォントサイズ <span className="text-[10px] text-slate-400 font-normal">（pt / px）</span>
                </label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="w-full h-8 px-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="">
                    指定なし (既定: {settings?.fontSize || '10.5pt (14px)'})
                  </option>
                  {FONT_SIZES_OPTIONS.filter((s) => s.value !== '').map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Bold / Italic toggles */}
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setIsBold(!isBold)}
                  className={`w-8 h-8 rounded border font-bold flex items-center justify-center transition ${
                    isBold ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-slate-50 border-slate-300 text-slate-700'
                  }`}
                  title="太字"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => setIsItalic(!isItalic)}
                  className={`w-8 h-8 rounded border italic flex items-center justify-center font-serif transition ${
                    isItalic ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-slate-50 border-slate-300 text-slate-700'
                  }`}
                  title="斜体"
                >
                  I
                </button>
              </div>

              {/* Text Color */}
              <div className="flex items-center space-x-2 flex-1">
                <span className="text-[11px] text-slate-600">文字色:</span>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-20 h-7 px-1.5 font-mono text-[11px] bg-slate-50 border border-slate-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* 4. Underline & Highlighting */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="font-semibold text-slate-700 text-xs">下線・マーカー装飾</div>

            <div className="grid grid-cols-2 gap-3">
              {/* Underline settings */}
              <div className="space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasUnderline}
                    onChange={(e) => setHasUnderline(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="font-medium text-[11px] text-slate-800">下線を付ける</span>
                </label>

                {hasUnderline && (
                  <div className="pt-1.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">スタイル:</span>
                      <select
                        value={underlineStyle}
                        onChange={(e) => setUnderlineStyle(e.target.value as any)}
                        className="h-6 px-1.5 bg-white border border-slate-300 rounded text-[10px]"
                      >
                        <option value="solid">実線</option>
                        <option value="double">二重線</option>
                        <option value="dotted">点線</option>
                        <option value="dashed">破線</option>
                        <option value="wavy">波線 (LINE3)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">線の色:</span>
                      <div className="flex items-center space-x-1">
                        <input
                          type="color"
                          value={underlineColor}
                          onChange={(e) => setUnderlineColor(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer p-0"
                        />
                        <input
                          type="text"
                          value={underlineColor}
                          onChange={(e) => setUnderlineColor(e.target.value)}
                          className="w-16 h-5 px-1 font-mono text-[10px] bg-white border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Marker / Background settings */}
              <div className="space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasBackground}
                    onChange={(e) => {
                      setHasBackground(e.target.checked);
                      if (e.target.checked && backgroundColor === 'transparent') {
                        setBackgroundColor('#fef08a');
                      }
                    }}
                    className="rounded text-blue-600"
                  />
                  <span className="font-medium text-[11px] text-slate-800">蛍光マーカー / 背景色</span>
                </label>

                {hasBackground && (
                  <div className="pt-1.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">背景色:</span>
                      <div className="flex items-center space-x-1">
                        <input
                          type="color"
                          value={backgroundColor === 'transparent' ? '#fef08a' : backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer p-0"
                        />
                        <input
                          type="text"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-16 h-5 px-1 font-mono text-[10px] bg-white border border-slate-300 rounded"
                        />
                      </div>
                    </div>

                    {/* Preset color swatches */}
                    <div className="flex space-x-1 pt-0.5">
                      {['#fef08a', '#bbf7d0', '#bae6fd', '#fbcfe8', '#fed7aa', '#c2410c'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setBackgroundColor(c)}
                          style={{ backgroundColor: c }}
                          className="w-4 h-4 rounded-xs border border-slate-300 hover:scale-115 transition"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Strike-through checkbox */}
            <label className="flex items-center space-x-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={hasStrike}
                onChange={(e) => setHasStrike(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="text-[11px] text-slate-700">取り消し線 (ストライクスルー)</span>
            </label>
          </div>

          {/* 5. Paragraph-Specific Settings */}
          {category === 'paragraph' && (
            <div className="space-y-3 pt-2 border-t border-slate-200 animate-in fade-in">
              <div className="font-semibold text-slate-700 text-xs">段落・レイアウト設定</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">見出しレベル / 要素</label>
                  <select
                    value={headingLevel}
                    onChange={(e) => setHeadingLevel(e.target.value as any)}
                    className="w-full h-8 px-2 bg-slate-50 border border-slate-300 rounded text-xs"
                  >
                    <option value="p">標準段落 (p)</option>
                    <option value="h1">大見出し 1 (h1)</option>
                    <option value="h2">見出し 2 (h2)</option>
                    <option value="h3">見出し 3 (h3)</option>
                    <option value="h4">見出し 4 (h4)</option>
                    <option value="h5">見出し 5 (h5)</option>
                    <option value="blockquote">引用枠 (blockquote)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">文字配置 (アライメント)</label>
                  <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 h-8 items-center">
                    <button
                      type="button"
                      onClick={() => setTextAlign('left')}
                      className={`flex-1 h-full rounded flex items-center justify-center ${
                        textAlign === 'left' ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-slate-600'
                      }`}
                      title="左揃え"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextAlign('center')}
                      className={`flex-1 h-full rounded flex items-center justify-center ${
                        textAlign === 'center' ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-slate-600'
                      }`}
                      title="中央揃え"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextAlign('right')}
                      className={`flex-1 h-full rounded flex items-center justify-center ${
                        textAlign === 'right' ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-slate-600'
                      }`}
                      title="右揃え"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextAlign('justify')}
                      className={`flex-1 h-full rounded flex items-center justify-center ${
                        textAlign === 'justify' ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-slate-600'
                      }`}
                      title="両端揃え"
                    >
                      <AlignJustify className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Indent / Text Indent (字下げ) */}
                <div className="p-2 bg-slate-50 border border-slate-200 rounded space-y-1.5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasIndent}
                      onChange={(e) => setHasIndent(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="font-medium text-[11px] text-slate-800">字下げ (1行目のインデント)</span>
                  </label>
                  {hasIndent && (
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        value={textIndent}
                        onChange={(e) => setTextIndent(e.target.value)}
                        placeholder="1.2em"
                        className="w-20 h-6 px-1.5 text-[11px] bg-white border border-slate-300 rounded font-mono"
                      />
                      <span className="text-[10px] text-slate-500">(例: 1em, 1.2em, 20px)</span>
                    </div>
                  )}
                </div>

                {/* Line Height (行間) */}
                <div className="p-2 bg-slate-50 border border-slate-200 rounded space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-800">行間 (行の高さ)</label>
                  <select
                    value={lineHeight}
                    onChange={(e) => setLineHeight(e.target.value)}
                    className="w-full h-6 px-1.5 bg-white border border-slate-300 rounded text-[11px]"
                  >
                    <option value="1.1">詰める (1.1 - 行間詰め)</option>
                    <option value="1.3">やや狭め (1.3)</option>
                    <option value="1.6">標準 (1.6)</option>
                    <option value="1.8">やや広め (1.8)</option>
                    <option value="2.0">広め (2.0 - ダブルスペース)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div>
            {isEditing && !editingStyle?.isBuiltin && onDeleteStyle && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('このスタイルを削除してもよろしいですか？')) {
                    onDeleteStyle(editingStyle.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded text-xs font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 transition flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>削除</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className={`px-4 py-1.5 rounded text-xs font-medium text-white transition flex items-center space-x-1.5 cursor-pointer ${
              name.trim() ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-xs' : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isEditing ? '変更を保存' : 'スタイルを登録'}</span>
          </button>
          </div>
        </div>

      </div>

      {/* Custom Font Addition Subdialog */}
      {showCustomFontModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 p-5 max-w-md w-full animate-in zoom-in-95">
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Type className="w-4 h-4 text-blue-600" />
              <span>カスタムフォント名の追加</span>
            </h4>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              PCにインストールされているフォント名、またはWebフォント名を入力してください。（例: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800">Noto Sans JP</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800">YuGothic</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800">Meiryo</code>）
            </p>
            <form onSubmit={handleAddCustomFont} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={customFontInput}
                onChange={(e) => setCustomFontInput(e.target.value)}
                placeholder="フォント名（例: Noto Serif JP）"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomFontModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!customFontInput.trim()}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 transition"
                >
                  追加して選択
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
