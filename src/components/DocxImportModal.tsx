import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FileText, Upload, Folder, File, ChevronRight, ChevronDown, 
  X, Check, AlertCircle, Sparkles, Hash, BookOpen, Layers, 
  Info, Eye, ArrowRight, CornerDownRight, HelpCircle, FolderPlus,
  CheckCircle2, Plus, Loader2, Image as ImageIcon
} from 'lucide-react';
import { 
  DocxImportPreviewResult, 
  DocxImportPreviewNode, 
  parseDocxFile, 
  buildHierarchyFromHtml 
} from '../utils/docxImporter';
import { TabFolder } from '../types';
import { logError, logInfo, logSuccess } from '../utils/errorLog';

interface DocxImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabFolders: TabFolder[];
  activeTabFolderId: string | null;
  onConfirmImport: (
    previewResult: DocxImportPreviewResult,
    targetFolderId: string | null,
    newFolderName?: string
  ) => void;
}

export const DocxImportModal: React.FC<DocxImportModalProps> = ({
  isOpen,
  onClose,
  tabFolders,
  activeTabFolderId,
  onConfirmImport,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<DocxImportPreviewResult | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedPreviewNode, setSelectedPreviewNode] = useState<DocxImportPreviewNode | null>(null);
  const [customTabName, setCustomTabName] = useState('');

  // Destination folder options
  const [selectedFolderOption, setSelectedFolderOption] = useState<string>('__root__');
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean reset function for all state and input refs
  const resetModalState = useCallback(() => {
    setIsDragging(false);
    setIsLoading(false);
    setErrorMessage(null);
    setPreviewResult(null);
    setExpandedNodes(new Set());
    setSelectedPreviewNode(null);
    setCustomTabName('');
    setIsCreatingNewFolder(false);
    setNewFolderNameInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (activeTabFolderId && tabFolders.some((f) => f.id === activeTabFolderId)) {
      setSelectedFolderOption(activeTabFolderId);
    } else {
      setSelectedFolderOption(tabFolders[0]?.id || '__root__');
    }
  }, [activeTabFolderId, tabFolders]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      resetModalState();
    }
  }, [isOpen, resetModalState]);

  // Handle Escape key to cancel and reset
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Safe close handler that always cleans up state
  const handleClose = () => {
    resetModalState();
    onClose();
  };

  if (!isOpen) return null;

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.doc') && !lowerName.endsWith('.docx')) {
      setErrorMessage('選択されたファイルは古いWord 97-2003形式（.doc）です。Word等で「.docx」形式として保存し直してからインポートしてください。');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await parseDocxFile(file, file.name);
      if (!result || result.rootNodes.length === 0) {
        throw new Error('文書からテキストまたは見出し構造を読み取ることができませんでした。');
      }
      setPreviewResult(result);
      setCustomTabName(result.tabName);
      
      // Auto expand all preview nodes
      const allIds = new Set<string>();
      const collectIds = (nodes: DocxImportPreviewNode[]) => {
        nodes.forEach((n) => {
          allIds.add(n.tempId);
          if (n.children.length > 0) collectIds(n.children);
        });
      };
      collectIds(result.rootNodes);
      setExpandedNodes(allIds);
      if (result.rootNodes.length > 0) {
        setSelectedPreviewNode(result.rootNodes[0]);
      }
    } catch (err: any) {
      console.error('DOCX parse error:', err);
      logError('docx-import', `DOCXファイル「${file.name}」の解析に失敗しました`, err);
      setErrorMessage(`DOCXファイルの解析に失敗しました: ${err.message || 'ファイルが壊れているか、暗号化/パスワード保護されている可能性があります'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Toggle node expand/collapse in tree preview
  const toggleNodeExpand = (tempId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(tempId)) next.delete(tempId);
      else next.add(tempId);
      return next;
    });
  };

  // Load rich sample DOCX structure for instant preview/testing
  const handleLoadSamplePreview = () => {
    setIsLoading(true);
    setTimeout(() => {
      const sampleHtml = `
        <h1>第1章 システム概要とアーキテクチャ</h1>
        <p>本システムは、大規模な情報整理と知識マネジメントを効率化するために設計された高機能ノートシステムです。<sup id="footnote-ref-1"><a href="#footnote-1">[1]</a></sup></p>
        <p>直感的なツリー階層構造とリッチエディタ、表計算、暗号化ノートなどの多種多様なノートタイプを統合管理します。</p>
        <div class="my-3 block"><img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='200' viewBox='0 0 600 200' style='background:%23f8fafc;border:1px solid %23cbd5e1;border-radius:8px;'><text x='300' y='40' font-family='sans-serif' font-size='16' font-weight='bold' fill='%231e293b' text-anchor='middle'>システム構成・データ連携フロー</text><rect x='40' y='70' width='140' height='70' rx='6' fill='%23dbeafe' stroke='%233b82f6' stroke-width='2'/><text x='110' y='110' font-family='sans-serif' font-size='13' font-weight='bold' fill='%231e40af' text-anchor='middle'>DOCX インポーター</text><path d='M190 105 L240 105' stroke='%2364748b' stroke-width='2' marker-end='url(%23arr)'/><rect x='250' y='70' width='140' height='70' rx='6' fill='%23fef3c7' stroke='%23f59e0b' stroke-width='2'/><text x='320' y='110' font-family='sans-serif' font-size='13' font-weight='bold' fill='%2392400e' text-anchor='middle'>3階層構造化エンジン</text><path d='M400 105 L450 105' stroke='%2364748b' stroke-width='2'/><rect x='460' y='70' width='110' height='70' rx='6' fill='%23dcfce7' stroke='%2322c55e' stroke-width='2'/><text x='515' y='110' font-family='sans-serif' font-size='13' font-weight='bold' fill='%23166534' text-anchor='middle'>ノートDB格納</text><defs><marker id='arr' viewBox='0 0 10 10' refX='6' refY='5' markerWidth='6' markerHeight='6' orient='auto-start-reverse'><path d='M 0 0 L 10 5 L 0 10 z' fill='%2364748b'/></marker></defs></svg>" alt="システム構成図" class="max-w-full h-auto rounded-lg border border-slate-200 shadow-xs" /></div>
        
        <h2>1.1 基本設計方針</h2>
        <p>システムの主要なアーキテクチャ方針は以下の通りです。<sup id="endnote-ref-1"><a href="#endnote-1">[2]</a></sup></p>
        <ul>
          <li>Webファーストの軽快なレスポンス</li>
          <li>クライアント側での高精度なHTMLパースと構造化</li>
          <li>3階層までのフォルダ整理と深い見出しの自動集約</li>
        </ul>

        <h3>1.1.1 階層構造の管理仕様</h3>
        <p>見出しレベル1〜3はツリーのフォルダ・ノートとして展開されます。</p>
        <h4>（詳細）第4レベル以降の扱い</h4>
        <p>見出しレベル4以降は、親である第3レベルのノート本文内に見出しスタイルとして自然にインライン配置されます。</p>

        <h3>1.1.2 脚注・文末脚注の自動変換</h3>
        <p>Word文書に含まれる脚注および文末脚注は、アプリ内蔵の脚注管理システムへとシームレスに相互変換されます。<sup id="footnote-ref-2"><a href="#footnote-2">[3]</a></sup></p>

        <h2>1.2 セキュリティとデータ保護</h2>
        <p>安全なデータ保存のため、データベースごとの暗号化ノート機能とローカル検証を提供します。</p>

        <h1>第2章 操作マニュアルと機能一覧</h1>
        <p>ユーザーが利用可能な各種機能の詳細です。</p>

        <h2>2.1 エディタ機能</h2>
        <p>文字装飾、カラーピッカー、表組み、カード挿入をフルサポートします。</p>

        <h3>2.1.1 検索と置換</h3>
        <p>タブ内検索（Ctrl+F）、置換（Ctrl+H）、DB全体検索（Ctrl+Shift+F）が統合されています。</p>

        <h1>第3章 付録・用語集</h1>
        <p>本仕様書で使用されている専門用語の定義一覧です。</p>
        <p>用語の詳細な解説については、オンラインヘルプも参照してください。<sup id="endnote-ref-2"><a href="#endnote-2">[4]</a></sup></p>

        <ol>
          <li id="footnote-1"><p>システム基盤はReact 19およびTailwind CSSで構築されています。<a href="#footnote-ref-1">↑</a></p></li>
          <li id="endnote-1"><p>文末脚注: 2026年改訂版ソフトウェア設計標準規格に準拠。<a href="#endnote-ref-1">↑</a></p></li>
          <li id="footnote-2"><p>番号付けは文書全体の出現順に自動で再採番されます。<a href="#footnote-ref-2">↑</a></p></li>
          <li id="endnote-2"><p>文末脚注: 付録用語集はJIS X 0123に準拠。<a href="#endnote-ref-2">↑</a></p></li>
        </ol>
      `;

      const result = buildHierarchyFromHtml(sampleHtml, '仕様書_設計概要_2026.docx', '仕様書_設計概要_2026');
      setPreviewResult(result);
      setCustomTabName(result.tabName);
      
      const allIds = new Set<string>();
      const collectIds = (nodes: DocxImportPreviewNode[]) => {
        nodes.forEach((n) => {
          allIds.add(n.tempId);
          if (n.children.length > 0) collectIds(n.children);
        });
      };
      collectIds(result.rootNodes);
      setExpandedNodes(allIds);
      if (result.rootNodes.length > 0) {
        setSelectedPreviewNode(result.rootNodes[0]);
      }
      setIsLoading(false);
    }, 150);
  };

  const handleExecuteImport = () => {
    if (!previewResult) return;
    const finalResult: DocxImportPreviewResult = {
      ...previewResult,
      tabName: customTabName.trim() || previewResult.tabName,
    };

    let targetFolderId: string | null = null;
    let newName: string | undefined = undefined;

    if (isCreatingNewFolder && newFolderNameInput.trim()) {
      newName = newFolderNameInput.trim();
    } else if (selectedFolderOption !== '__root__') {
      targetFolderId = selectedFolderOption;
    }

    onConfirmImport(finalResult, targetFolderId, newName);
    handleClose();
  };

  // Render tree node in preview
  const renderPreviewTreeNode = (node: DocxImportPreviewNode) => {
    const isExpanded = expandedNodes.has(node.tempId);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedPreviewNode?.tempId === node.tempId;

    const levelBadgeColor = 
      node.level === 1 ? 'bg-blue-100 text-blue-800 border-blue-200' :
      node.level === 2 ? 'bg-amber-100 text-amber-800 border-amber-200' :
      'bg-emerald-100 text-emerald-800 border-emerald-200';

    return (
      <div key={node.tempId} className="select-none">
        <div
          onClick={() => setSelectedPreviewNode(node)}
          className={`flex items-center py-1.5 px-2 rounded-md transition cursor-pointer text-xs group ${
            isSelected
              ? 'bg-blue-100 text-blue-900 font-semibold'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
          style={{ paddingLeft: `${(node.level - 1) * 16 + 8}px` }}
        >
          {/* Expand/Collapse icon */}
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => toggleNodeExpand(node.tempId, e)}
              className="p-0.5 hover:bg-slate-200 rounded text-slate-500 mr-1"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4 mr-1 inline-block" />
          )}

          {/* Folder or File Icon */}
          {hasChildren ? (
            <Folder className="w-4 h-4 text-amber-500 fill-amber-100 mr-1.5 shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-blue-600 mr-1.5 shrink-0" />
          )}

          {/* Title */}
          <span className="truncate flex-1 font-medium">{node.title}</span>

          {/* Badges */}
          <div className="flex items-center space-x-1 ml-2 shrink-0">
            <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${levelBadgeColor}`}>
              階層 {node.level}
            </span>
            {node.imageCount > 0 && (
              <span className="text-[10px] px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded border border-emerald-200 font-mono flex items-center space-x-0.5">
                <ImageIcon className="w-2.5 h-2.5 inline mr-0.5" />
                <span>画像 {node.imageCount}</span>
              </span>
            )}
            {node.footnoteCount > 0 && (
              <span className="text-[10px] px-1 py-0.2 bg-purple-100 text-purple-700 rounded border border-purple-200 font-mono">
                注釈 {node.footnoteCount}
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-mono">
              {node.characterCount}字
            </span>
          </div>
        </div>

        {/* Render child nodes */}
        {hasChildren && isExpanded && (
          <div className="border-l border-slate-200 ml-4">
            {node.children.map((child) => renderPreviewTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
      onClick={handleClose}
    >
      <div
        id="docx-import-modal"
        className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 text-xs animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">DOCXファイルのインポート</h3>
              <p className="text-[11px] text-slate-300">
                Word文書（見出し1〜3）を自動解析して3階層のフォルダ構造・ノートに変換し、指定のフォルダ内に新しいタブとして追加します
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="閉じる (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
          {/* Destination Folder Selector (はじめのダイアログで指定可能) */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Folder className="w-4 h-4 text-amber-500 fill-amber-100" />
                <span>インポート先フォルダの指定:</span>
              </span>
              <span className="text-[11px] text-slate-500">
                インポートされた新しいタブが配置されるタブフォルダを選択します
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {/* Option: Existing Tab Folders */}
              {tabFolders.map((tf) => {
                const isSelected = !isCreatingNewFolder && selectedFolderOption === tf.id;
                return (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => {
                      setIsCreatingNewFolder(false);
                      setSelectedFolderOption(tf.id);
                    }}
                    className={`flex items-center space-x-2 p-2 rounded-md border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/90 text-blue-900 font-semibold ring-1 ring-blue-400 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-100/80 text-slate-700'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-100 shrink-0" />
                    <span className="truncate flex-1 text-xs">{tf.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })}

              {/* Option: Root (No folder) */}
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewFolder(false);
                  setSelectedFolderOption('__root__');
                }}
                className={`flex items-center space-x-2 p-2 rounded-md border text-left transition cursor-pointer ${
                  !isCreatingNewFolder && selectedFolderOption === '__root__'
                    ? 'border-blue-500 bg-blue-50/90 text-blue-900 font-semibold ring-1 ring-blue-400 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-100/80 text-slate-700'
                }`}
              >
                <File className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate flex-1 text-xs">ルート (フォルダなし)</span>
                {!isCreatingNewFolder && selectedFolderOption === '__root__' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                )}
              </button>

              {/* Option: Create New Folder */}
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewFolder(true);
                }}
                className={`flex items-center space-x-2 p-2 rounded-md border text-left transition cursor-pointer ${
                  isCreatingNewFolder
                    ? 'border-blue-500 bg-blue-50/90 text-blue-900 font-semibold ring-1 ring-blue-400 shadow-2xs'
                    : 'border-dashed border-slate-300 bg-white hover:bg-slate-100 text-slate-600'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate flex-1 text-xs">＋ 新規フォルダを作成...</span>
                {isCreatingNewFolder && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
              </button>
            </div>

            {/* Input if creating a new folder */}
            {isCreatingNewFolder && (
              <div className="flex items-center space-x-2 pt-1 animate-in fade-in">
                <span className="text-xs font-semibold text-slate-700">新規フォルダ名:</span>
                <input
                  type="text"
                  value={newFolderNameInput}
                  onChange={(e) => setNewFolderNameInput(e.target.value)}
                  placeholder="例: マニュアル・仕様書"
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-60"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* File Upload Zone */}
          {!previewResult ? (
            <div className="space-y-3">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.docm,.dotx,.dotm,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {isLoading ? (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-xs animate-spin">
                    <Loader2 className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                )}

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {isLoading ? 'DOCXファイルを解析中...' : 'ここにDOCXファイルをドラッグ＆ドロップ'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {isLoading ? '見出し階層、段落スタイル、脚注・文末脚注を抽出しています' : 'またはクリックしてパソコンからファイルを選択 (.docx)'}
                  </p>
                </div>

                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white border border-slate-300 rounded-md text-[11px] text-slate-600 shadow-2xs">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>見出し1〜3をフォルダ階層化し、文末脚注をアプリ内脚注に自動変換します</span>
                </div>
              </div>

              {/* Sample test button */}
              <div className="flex items-center justify-between p-3 bg-blue-50/70 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">手元にDOCXファイルがない場合</span>
                    <p className="text-[11px] text-slate-600">
                      サンプル文書（3階層の見出し構造＋文末脚注・脚注入り）を読み込んで階層プレビューを試せます。
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSamplePreview}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
                >
                  サンプル文書で試す
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            /* Preview and Confirmation Layout */
            <div className="flex flex-col space-y-3">
              {/* Import Specs Info Bar */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-slate-700">ファイル名:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-900">
                      {previewResult.fileName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-slate-700">作成されるタブ名:</span>
                    <input
                      type="text"
                      value={customTabName}
                      onChange={(e) => setCustomTabName(e.target.value)}
                      className="px-2 py-0.5 bg-white border border-slate-300 rounded font-semibold text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
                      placeholder="タブ名を入力..."
                    />
                  </div>
                </div>

                {/* Re-select file button */}
                <button
                  type="button"
                  onClick={() => {
                    setPreviewResult(null);
                    setSelectedPreviewNode(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>別のファイルを選択</span>
                </button>
              </div>

              {/* Statistics Overview Card */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-blue-50/50 p-2.5 rounded-lg border border-blue-200/80">
                <div className="bg-white p-2 rounded border border-blue-100 text-center">
                  <div className="text-[10px] text-slate-500 font-medium">作成フォルダ数 (最大3階層)</div>
                  <div className="text-sm font-bold text-amber-600">{previewResult.totalFolders} フォルダ</div>
                </div>
                <div className="bg-white p-2 rounded border border-blue-100 text-center">
                  <div className="text-[10px] text-slate-500 font-medium">作成ノート・節数</div>
                  <div className="text-sm font-bold text-blue-600">{previewResult.totalNotes} ノート</div>
                </div>
                <div className="bg-white p-2 rounded border border-blue-100 text-center">
                  <div className="text-[10px] text-slate-500 font-medium">抽出本文文字数</div>
                  <div className="text-sm font-bold text-slate-700">{previewResult.totalCharacters.toLocaleString()} 文字</div>
                </div>
                <div className="bg-white p-2 rounded border border-blue-100 text-center">
                  <div className="text-[10px] text-slate-500 font-medium">抽出画像数</div>
                  <div className="text-sm font-bold text-emerald-600 flex items-center justify-center space-x-1">
                    <ImageIcon className="w-3.5 h-3.5 inline text-emerald-500" />
                    <span>{previewResult.totalImages} 枚</span>
                  </div>
                </div>
                <div className="bg-white p-2 rounded border border-blue-100 text-center">
                  <div className="text-[10px] text-slate-500 font-medium">変換される脚注・文末脚注</div>
                  <div className="text-sm font-bold text-purple-600">{previewResult.totalFootnotes} 箇所</div>
                </div>
              </div>

              {/* Two Column: Left Tree Hierarchy vs Right Note Content Preview */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[300px] max-h-[380px]">
                {/* Left: 3-Level Folder Hierarchy Preview */}
                <div className="md:col-span-6 border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 overflow-y-auto flex flex-col">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200">
                    <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>作成予定のフォルダ・ノート階層</span>
                    </span>
                    <span className="text-[10px] text-slate-500">クリックで内容プレビュー</span>
                  </div>

                  <div className="space-y-0.5 overflow-y-auto flex-1 pr-1">
                    {previewResult.rootNodes.map((root) => renderPreviewTreeNode(root))}
                  </div>
                </div>

                {/* Right: Selected Node Content Preview */}
                <div className="md:col-span-6 border border-slate-300 rounded-lg p-2.5 bg-white overflow-y-auto flex flex-col">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200">
                    <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ノート本文プレビュー</span>
                    </span>
                    {selectedPreviewNode && (
                      <span className="text-[10px] text-slate-500">
                        階層 {selectedPreviewNode.level} / {selectedPreviewNode.characterCount}文字
                      </span>
                    )}
                  </div>

                  {selectedPreviewNode ? (
                    <div className="flex-1 overflow-y-auto space-y-2 text-slate-700">
                      <div className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-1">
                        {selectedPreviewNode.title}
                      </div>
                      <div 
                        className="prose prose-xs max-w-none text-slate-800 text-xs leading-relaxed docx-preview-html"
                        dangerouslySetInnerHTML={{ __html: selectedPreviewNode.htmlContent || '<p className="text-slate-400 italic">（本文なし）</p>' }}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic">
                      左のツリーからノートを選択すると本文を確認できます
                    </div>
                  )}
                </div>
              </div>

              {/* Notice regarding 3-level folder depth rule */}
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex items-start space-x-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-normal">
                  <span className="font-bold">階層化ルール: </span>
                  フォルダは最大3階層（見出し1→見出し2→見出し3）まで作成されます。第4レベル以降の見出しや本文は、第3レベルのノート本文内に自動的に収められ、一切のテキスト脱落がありません。また文末脚注はすべて脚注へ変換されます。
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Buttons */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {previewResult ? '上記の構造を確認して「インポート実行」を押してください' : 'インポート先フォルダとDOCXファイルを選択してください'}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-slate-700 font-medium transition cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={!previewResult || isLoading}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition cursor-pointer flex items-center space-x-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>インポート実行 (OK)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
