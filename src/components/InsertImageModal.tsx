import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Image as ImageIcon, Upload, Globe, Check, AlertCircle, 
  AlignLeft, AlignCenter, AlignRight, Maximize2, FileImage, Trash2
} from 'lucide-react';
import { logSuccess, logError, logWarn } from '../utils/errorLog';

interface InsertImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmInsert: (imageHtml: string) => void;
}

type ImageSourceTab = 'upload' | 'url';
type ImageAlignment = 'left' | 'center' | 'right';
type ImageSizePreset = 'small' | 'medium' | 'large' | 'full' | 'custom';

export const InsertImageModal: React.FC<InsertImageModalProps> = ({
  isOpen,
  onClose,
  onConfirmInsert,
}) => {
  const [activeTab, setActiveTab] = useState<ImageSourceTab>('upload');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL state
  const [imageUrl, setImageUrl] = useState<string>('');
  const [urlValidationStatus, setUrlValidationStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');

  // Common options
  const [altText, setAltText] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [alignment, setAlignment] = useState<ImageAlignment>('center');
  const [sizePreset, setSizePreset] = useState<ImageSizePreset>('medium');
  const [customWidth, setCustomWidth] = useState<number>(500);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setSelectedFile(null);
      setPreviewDataUrl('');
      setImageUrl('');
      setUrlValidationStatus('idle');
      setAltText('');
      setCaption('');
      setAlignment('center');
      setSizePreset('medium');
      setCustomWidth(500);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProcessFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('画像ファイル（PNG, JPEG, GIF, WebP, SVG等）を選択してください。');
      logWarn('editor', `無効なファイル形式: ${file.type}`);
      return;
    }

    // Max 15MB limit check
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('ファイルサイズが大きすぎます（上限: 15MB）。');
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);
    if (!altText) {
      setAltText(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewDataUrl(result);
    };
    reader.onerror = (err) => {
      setErrorMessage('画像の読み込みに失敗しました。');
      logError('editor', '画像読み込みエラー', err);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleValidateUrl = (url: string) => {
    setImageUrl(url);
    if (!url.trim()) {
      setUrlValidationStatus('idle');
      return;
    }

    setUrlValidationStatus('loading');
    const img = new Image();
    img.onload = () => {
      setUrlValidationStatus('valid');
      setErrorMessage('');
    };
    img.onerror = () => {
      setUrlValidationStatus('invalid');
    };
    img.src = url.trim();
  };

  const handleInsert = () => {
    const finalSrc = activeTab === 'upload' ? previewDataUrl : imageUrl.trim();
    if (!finalSrc) {
      setErrorMessage(activeTab === 'upload' ? '画像ファイルを選択してください。' : '有効な画像URLを入力してください。');
      return;
    }

    // Determine style based on sizePreset
    let widthStyle = '';
    let maxWidthClass = 'max-w-full';
    if (sizePreset === 'small') {
      widthStyle = 'max-width: 280px; width: 100%;';
    } else if (sizePreset === 'medium') {
      widthStyle = 'max-width: 520px; width: 100%;';
    } else if (sizePreset === 'large') {
      widthStyle = 'max-width: 800px; width: 100%;';
    } else if (sizePreset === 'full') {
      widthStyle = 'width: 100%;';
    } else if (sizePreset === 'custom') {
      widthStyle = `max-width: ${customWidth}px; width: 100%;`;
    }

    // Alignment wrapper classes
    let alignWrapperClass = 'text-center my-3 clear-both';
    let imgDisplayClass = 'inline-block';
    if (alignment === 'left') {
      alignWrapperClass = 'text-left my-3 clear-both';
    } else if (alignment === 'right') {
      alignWrapperClass = 'text-right my-3 clear-both';
    }

    const altAttr = altText.trim() ? ` alt="${altText.replace(/"/g, '&quot;')}"` : ' alt="画像"';
    const captionHtml = caption.trim() 
      ? `<figcaption class="text-center text-xs text-slate-500 mt-1 italic">${caption.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</figcaption>`
      : '';

    const imageHtml = `
      <figure class="${alignWrapperClass} select-none" data-image-figure="true" style="margin-top: 12px; margin-bottom: 12px;">
        <img src="${finalSrc}"${altAttr} class="${maxWidthClass} ${imgDisplayClass} h-auto rounded-lg border border-slate-300 shadow-xs" style="${widthStyle} display: inline-block; vertical-align: middle;" loading="lazy" />
        ${captionHtml}
      </figure>
      <p><br></p>
    `;

    onConfirmInsert(imageHtml);
    logSuccess('editor', `画像を挿入しました (${activeTab === 'upload' ? (selectedFile?.name || 'ローカル画像') : 'Web URL'})`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 font-sans">
        
        {/* Header */}
        <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-emerald-500/20 border border-emerald-400/40 rounded-lg text-emerald-300">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">画像の挿入 (Image Inserter)</h2>
              <p className="text-[11px] text-slate-400">
                パソコン内の画像ファイルまたはWeb画像URLをエディタに配置します
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700 transition"
            title="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-slate-200 bg-slate-100 px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>パソコンから画像を選択 (ファイル)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'url'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web画像URLから指定</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
                    : previewDataUrl
                    ? 'border-slate-300 bg-slate-50 hover:bg-slate-100/80'
                    : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml,image/bmp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewDataUrl ? (
                  <div className="w-full flex flex-col items-center space-y-3">
                    <div className="max-h-56 max-w-full overflow-hidden rounded-lg border border-slate-300 shadow-sm bg-white p-1">
                      <img
                        src={previewDataUrl}
                        alt="Preview"
                        className="max-h-52 max-w-full object-contain mx-auto rounded"
                      />
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-700 font-medium">
                      <FileImage className="w-4 h-4 text-emerald-600" />
                      <span>{selectedFile?.name || '画像ファイル'}</span>
                      <span className="text-slate-400">
                        ({Math.round((selectedFile?.size || 0) / 1024)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setPreviewDataUrl('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-red-500 hover:text-red-700 ml-2 p-1 rounded hover:bg-red-50"
                        title="画像を取り消す"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">クリックして別の画像に変更</p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-emerald-100 rounded-full text-emerald-700">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 text-xs sm:text-sm">
                        クリックして画像ファイルを選択
                      </span>
                      <span className="text-slate-500 text-xs"> またはここにドラッグ＆ドロップ</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      PNG, JPEG, GIF, WebP, SVG, BMP 対応 (最大 15MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: URL Input */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  画像 URL (Direct Link):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    placeholder="https://example.com/image.png"
                    value={imageUrl}
                    onChange={(e) => handleValidateUrl(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  {urlValidationStatus === 'valid' && (
                    <div className="flex items-center text-emerald-600 text-xs space-x-1 shrink-0 font-medium bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-200">
                      <Check className="w-4 h-4" />
                      <span>有効</span>
                    </div>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>インターネット上の画像のアドレス（https://...）を入力してください</span>
                  <button
                    type="button"
                    onClick={() => handleValidateUrl('https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80')}
                    className="text-blue-600 hover:underline"
                  >
                    サンプルURLを入力
                  </button>
                </div>
              </div>

              {/* URL Preview */}
              {imageUrl.trim() && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 mb-1">プレビュー:</div>
                  <div className="max-h-48 overflow-hidden rounded border border-slate-300 bg-white flex items-center justify-center p-2">
                    <img
                      src={imageUrl}
                      alt="URL Preview"
                      className="max-h-44 object-contain rounded"
                      onError={() => setUrlValidationStatus('invalid')}
                      onLoad={() => setUrlValidationStatus('valid')}
                    />
                  </div>
                  {urlValidationStatus === 'invalid' && (
                    <p className="text-[11px] text-red-500 mt-1">
                      ⚠️ 画像の読み込みに失敗しました。URLが正しいか確認してください。
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Alignment & Size Options */}
          <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Alignment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                画像の配置 (Alignment):
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setAlignment('left')}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-medium flex items-center justify-center space-x-1 transition cursor-pointer ${
                    alignment === 'left'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>左揃え</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAlignment('center')}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-medium flex items-center justify-center space-x-1 transition cursor-pointer ${
                    alignment === 'center'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                  <span>中央揃え</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAlignment('right')}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-medium flex items-center justify-center space-x-1 transition cursor-pointer ${
                    alignment === 'right'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                  <span>右揃え</span>
                </button>
              </div>
            </div>

            {/* Size Preset */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                表示サイズ (Size):
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'small', label: '小 (280px)' },
                  { id: 'medium', label: '中 (520px)' },
                  { id: 'large', label: '大 (800px)' },
                  { id: 'full', label: '100% (全幅)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSizePreset(s.id as ImageSizePreset)}
                    className={`py-1.5 px-1 rounded-lg border text-[11px] font-medium text-center transition cursor-pointer ${
                      sizePreset === s.id
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Optional Caption & Alt Text */}
          <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                キャプション・注釈 (任意):
              </label>
              <input
                type="text"
                placeholder="図1: システム構成図"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                代替テキスト (Alt 属性):
              </label>
              <input
                type="text"
                placeholder="画像の概要説明"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            💡 エディタ上のカーソル位置、またはノート末尾に画像が配置されます。
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 text-xs font-medium shadow-2xs transition"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleInsert}
              disabled={activeTab === 'upload' ? !previewDataUrl : !imageUrl.trim()}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>画像を挿入</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
