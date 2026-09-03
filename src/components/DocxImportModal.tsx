import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FileText, Upload, Folder, File as FileIcon, ChevronRight, ChevronDown, 
  X, Check, AlertCircle, Sparkles, Hash, BookOpen, Layers, 
  Info, Eye, ArrowRight, CornerDownRight, HelpCircle, FolderPlus,
  CheckCircle2, Plus, Loader2, Image as ImageIcon, FolderSearch,
  CheckSquare, Square, Search, RefreshCw, Files
} from 'lucide-react';
import { 
  DocxImportPreviewResult, 
  DocxImportPreviewNode, 
  parseDocxFile, 
  buildHierarchyFromHtml 
} from '../utils/docxImporter';
import { parseAndRenumberHtml } from '../utils/footnoteUtils';
import { TabFolder } from '../types';
import { logError, logInfo, logSuccess } from '../utils/errorLog';

interface BatchFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  relativePath: string;
  selected: boolean;
  status: 'idle' | 'parsing' | 'ready' | 'error';
  previewResult?: DocxImportPreviewResult;
  errorMessage?: string;
}

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
  onConfirmBatchImport?: (
    previewResults: DocxImportPreviewResult[],
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
  onConfirmBatchImport,
}) => {
  // Mode: 'batch' (フォルダ一括インポート) or 'single' (単一ファイル)
  const [importMode, setImportMode] = useState<'batch' | 'single'>('batch');

  // Common destination folder options
  const [selectedFolderOption, setSelectedFolderOption] = useState<string>('__root__');
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState('');

  // --- Batch Import States ---
  const [sourceFolderPath, setSourceFolderPath] = useState<string>('');
  const [batchFiles, setBatchFiles] = useState<BatchFileItem[]>([]);
  const [activeBatchFileId, setActiveBatchFileId] = useState<string | null>(null);
  const [fileFilterText, setFileFilterText] = useState('');
  const [batchPreviewSubTab, setBatchPreviewSubTab] = useState<'tree' | 'content'>('tree');
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; name: string } | null>(null);

  // --- Single File States ---
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingSingle, setIsLoadingSingle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [singlePreviewResult, setSinglePreviewResult] = useState<DocxImportPreviewResult | null>(null);
  const [singleCustomTabName, setSingleCustomTabName] = useState('');

  // Tree & Node selection shared
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedPreviewNode, setSelectedPreviewNode] = useState<DocxImportPreviewNode | null>(null);

  // Input refs
  const folderInputRef = useRef<HTMLInputElement>(null);
  const multiFilesInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);

  // Reset modal state
  const resetModalState = useCallback(() => {
    setIsDragging(false);
    setIsLoadingSingle(false);
    setErrorMessage(null);
    setSinglePreviewResult(null);
    setSingleCustomTabName('');
    setBatchFiles([]);
    setSourceFolderPath('');
    setActiveBatchFileId(null);
    setFileFilterText('');
    setBatchPreviewSubTab('tree');
    setIsBatchProcessing(false);
    setBatchProgress(null);
    setExpandedNodes(new Set());
    setSelectedPreviewNode(null);
    setIsCreatingNewFolder(false);
    setNewFolderNameInput('');

    if (singleFileInputRef.current) singleFileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
    if (multiFilesInputRef.current) multiFilesInputRef.current.value = '';

    if (activeTabFolderId && tabFolders.some((f) => f.id === activeTabFolderId)) {
      setSelectedFolderOption(activeTabFolderId);
    } else {
      setSelectedFolderOption(tabFolders[0]?.id || '__root__');
    }
  }, [activeTabFolderId, tabFolders]);

  useEffect(() => {
    if (isOpen) {
      resetModalState();
    }
  }, [isOpen, resetModalState]);

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

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  if (!isOpen) return null;

  // Destination folder display name
  const getDestinationFolderName = (): string => {
    if (isCreatingNewFolder && newFolderNameInput.trim()) {
      return `新規: ${newFolderNameInput.trim()}`;
    }
    if (selectedFolderOption === '__root__') {
      return 'ルート (フォルダなし)';
    }
    const found = tabFolders.find((f) => f.id === selectedFolderOption);
    return found ? found.name : '指定フォルダ';
  };

  // Helper to expand all nodes
  const expandAllNodes = (nodes: DocxImportPreviewNode[]) => {
    const allIds = new Set<string>();
    const collect = (list: DocxImportPreviewNode[]) => {
      list.forEach((n) => {
        allIds.add(n.tempId);
        if (n.children.length > 0) collect(n.children);
      });
    };
    collect(nodes);
    setExpandedNodes(allIds);
  };

  // ==========================================
  // BATCH IMPORT LOGIC
  // ==========================================

  // Process a list of incoming File objects (from directory picker, multi-file picker, or drag-and-drop)
  const handleIncomingFileList = (files: FileList | File[], sourceName?: string) => {
    const fileArray = Array.from(files);
    const docxFiles = fileArray.filter((f) => {
      const lower = f.name.toLowerCase();
      return (lower.endsWith('.docx') || lower.endsWith('.docm')) && !f.name.startsWith('~$');
    });

    if (docxFiles.length === 0) {
      setErrorMessage('指定されたフォルダ内に有効なWord文書（.docx）が見つかりませんでした。');
      return;
    }

    // Determine source folder path/name
    let detectedSource = sourceName || '';
    if (!detectedSource && docxFiles[0]) {
      const rel = (docxFiles[0] as any).webkitRelativePath || '';
      if (rel) {
        const parts = rel.split('/');
        if (parts.length > 1) {
          detectedSource = parts[0];
        }
      }
    }
    if (!detectedSource) {
      detectedSource = '選択したローカルフォルダ';
    }

    setSourceFolderPath(detectedSource);
    setErrorMessage(null);

    const newItems: BatchFileItem[] = docxFiles.map((file, idx) => ({
      id: `bf-${Date.now()}-${idx}-${file.name}`,
      file,
      name: file.name,
      size: file.size,
      relativePath: (file as any).webkitRelativePath || file.name,
      selected: true,
      status: 'idle',
    }));

    setBatchFiles(newItems);
    // Automatically select the first file and begin parsing its preview
    if (newItems.length > 0) {
      handleSelectBatchFileForPreview(newItems[0]);
    }
  };

  // Parse a specific batch file on demand when clicked
  const handleSelectBatchFileForPreview = async (item: BatchFileItem) => {
    setActiveBatchFileId(item.id);
    setSelectedPreviewNode(null);

    // If already parsed, just show it
    if (item.previewResult && item.status === 'ready') {
      expandAllNodes(item.previewResult.rootNodes);
      if (item.previewResult.rootNodes.length > 0) {
        setSelectedPreviewNode(item.previewResult.rootNodes[0]);
      }
      return;
    }

    // Set parsing state
    setBatchFiles((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: 'parsing', errorMessage: undefined } : f))
    );

    try {
      const result = await parseDocxFile(item.file, item.name);
      if (!result || result.rootNodes.length === 0) {
        throw new Error('文書の見出し構造またはテキストの抽出に失敗しました');
      }

      setBatchFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: 'ready', previewResult: result }
            : f
        )
      );

      expandAllNodes(result.rootNodes);
      if (result.rootNodes.length > 0) {
        setSelectedPreviewNode(result.rootNodes[0]);
      }
    } catch (err: any) {
      setBatchFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: 'error', errorMessage: err?.message || '解析失敗' }
            : f
        )
      );
    }
  };

  // Toggle selection checkbox of a batch file
  const toggleBatchFileSelected = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBatchFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  const handleSelectAll = () => {
    setBatchFiles((prev) => prev.map((f) => ({ ...f, selected: true })));
  };

  const handleDeselectAll = () => {
    setBatchFiles((prev) => prev.map((f) => ({ ...f, selected: false })));
  };

  // Execute Batch Import for all selected files
  const handleExecuteBatchImport = async () => {
    const selectedItems = batchFiles.filter((f) => f.selected);
    if (selectedItems.length === 0) {
      setErrorMessage('インポートするファイルが選択されていません。チェックボックスを確認してください。');
      return;
    }

    setIsBatchProcessing(true);
    setErrorMessage(null);

    const parsedResults: DocxImportPreviewResult[] = [];

    try {
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        setBatchProgress({
          current: i + 1,
          total: selectedItems.length,
          name: item.name,
        });

        let result = item.previewResult;
        if (!result || item.status !== 'ready') {
          result = await parseDocxFile(item.file, item.name);
        }
        parsedResults.push(result);
      }

      // Target folder resolution
      let targetFolderId: string | null = null;
      let newName: string | undefined = undefined;

      if (isCreatingNewFolder && newFolderNameInput.trim()) {
        newName = newFolderNameInput.trim();
      } else if (selectedFolderOption !== '__root__') {
        targetFolderId = selectedFolderOption;
      }

      logSuccess(
        'docx-import',
        `一括インポート実行: ${parsedResults.length} 件のWord文書を「${getDestinationFolderName()}」へ展開します`
      );

      if (onConfirmBatchImport) {
        onConfirmBatchImport(parsedResults, targetFolderId, newName);
      } else {
        // Fallback: call onConfirmImport for each
        parsedResults.forEach((res) => {
          onConfirmImport(res, targetFolderId, newName);
        });
      }

      handleClose();
    } catch (err: any) {
      console.error('Batch import error:', err);
      logError('docx-import', '一括インポート処理中にエラーが発生しました', err);
      setErrorMessage(`一括インポート中にエラーが発生しました: ${err.message || '不明なエラー'}`);
      setIsBatchProcessing(false);
      setBatchProgress(null);
    }
  };

  // Execute import for currently viewed individual file from the batch preview
  const handleExecuteSingleFromBatch = (item: BatchFileItem) => {
    if (!item.previewResult) return;
    let targetFolderId: string | null = null;
    let newName: string | undefined = undefined;

    if (isCreatingNewFolder && newFolderNameInput.trim()) {
      newName = newFolderNameInput.trim();
    } else if (selectedFolderOption !== '__root__') {
      targetFolderId = selectedFolderOption;
    }

    onConfirmImport(item.previewResult, targetFolderId, newName);
    handleClose();
  };

  // Load 3 rich sample DOCX structures for instant batch preview/testing
  const handleLoadSampleBatchPreview = () => {
    setIsBatchProcessing(true);
    setTimeout(() => {
      const sample1Html = `
        <h1>第1章 システム概要とアーキテクチャ</h1>
        <p>本システムは、大規模な階層型ドキュメント管理を効率化するために開発されました。<sup id="footnote-ref-1"><a href="#footnote-1">[1]</a></sup></p>
        <p>直感的なツリー階層構造とリッチエディタを統合し、<span style="color: #e11d48; text-decoration: underline; text-decoration-style: wavy; text-decoration-color: #e11d48;">波線下線スタイル</span>や<span style="background-color: #fef08a; font-weight: bold;">黄色マーカー</span>を忠実に保持します。</p>
        <h2>1.1 基本設計思想</h2>
        <p>クライアント完結の軽快な動作と、3階層フォルダ自動集約アーキテクチャを採用しています。</p>
        <h3>1.1.1 階層化仕様</h3>
        <p>見出しレベル1〜3をツリーのフォルダ・ノートとして展開し、第4レベル以降はインライン保持されます。</p>
        <ol><li id="footnote-1"><p>設計基準書 2026年改訂版に完全準拠。<a href="#footnote-ref-1">↑</a></p></li></ol>
      `;

      const sample2Html = `
        <h1>第2章 操作マニュアルと機能一覧</h1>
        <p>ユーザーが利用可能な各種機能の操作手順です。<sup id="footnote-ref-2"><a href="#footnote-2">[1]</a></sup></p>
        <h2>2.1 リッチエディタの操作</h2>
        <p><span style="color: #0284c7; font-weight: bold;">書式設定ツールバー</span>から文字色、マーカー、下線スタイルを自由に設定できます。</p>
        <h2>2.2 脚注・注釈の管理</h2>
        <p>右側の注釈パネルにアクティブな階層2の全脚注が集約表示されます。</p>
        <h3>2.2.1 ジャンプ機能</h3>
        <p>注釈一覧の項目をクリックすると、該当ノートの脚注位置へ瞬時にスクロールします。</p>
        <ol><li id="footnote-2"><p>操作に関するお問い合わせは社内ヘルプデスクまで。<a href="#footnote-ref-2">↑</a></p></li></ol>
      `;

      const sample3Html = `
        <h1>第3章 付録・用語集と参考文献</h1>
        <p>本設計書で用いられる専門用語の一覧および規格標準です。<sup id="footnote-ref-3"><a href="#footnote-3">[1]</a></sup></p>
        <h2>3.1 用語定義</h2>
        <p>階層1はタブフォルダ、階層2はノートブックタブ、階層3は各ノート・節を示します。</p>
        <h2>3.2 参考文献</h2>
        <p>JIS X 0123 ソフトウェアドキュメンテーション標準規格。</p>
        <ol><li id="footnote-3"><p>最新の正誤表はWebポータルを参照。<a href="#footnote-ref-3">↑</a></p></li></ol>
      `;

      const res1 = buildHierarchyFromHtml(sample1Html, '第1章_システム概要.docx', '第1章_システム概要');
      const res2 = buildHierarchyFromHtml(sample2Html, '第2章_操作マニュアル.docx', '第2章_操作マニュアル');
      const res3 = buildHierarchyFromHtml(sample3Html, '第3章_付録・用語集.docx', '第3章_付録・用語集');

      const mockItems: BatchFileItem[] = [
        {
          id: 'mock-1',
          file: typeof window !== 'undefined' && window.File ? new window.File([new Blob([''])], '第1章_システム概要.docx') : ({} as any),
          name: '第1章_システム概要.docx',
          size: 45200,
          relativePath: '図書/第1章_システム概要.docx',
          selected: true,
          status: 'ready',
          previewResult: res1,
        },
        {
          id: 'mock-2',
          file: typeof window !== 'undefined' && window.File ? new window.File([new Blob([''])], '第2章_操作マニュアル.docx') : ({} as any),
          name: '第2章_操作マニュアル.docx',
          size: 68100,
          relativePath: '図書/第2章_操作マニュアル.docx',
          selected: true,
          status: 'ready',
          previewResult: res2,
        },
        {
          id: 'mock-3',
          file: typeof window !== 'undefined' && window.File ? new window.File([new Blob([''])], '第3章_付録・用語集.docx') : ({} as any),
          name: '第3章_付録・用語集.docx',
          size: 32400,
          relativePath: '図書/第3章_付録・用語集.docx',
          selected: true,
          status: 'ready',
          previewResult: res3,
        },
      ];

      setSourceFolderPath('D:\\図書 (デモフォルダ)');
      setBatchFiles(mockItems);
      setActiveBatchFileId(mockItems[0].id);
      expandAllNodes(res1.rootNodes);
      if (res1.rootNodes.length > 0) {
        setSelectedPreviewNode(res1.rootNodes[0]);
      }
      setIsBatchProcessing(false);
    }, 150);
  };

  // ==========================================
  // SINGLE FILE IMPORT LOGIC
  // ==========================================
  const handleSingleFileSelect = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.doc') && !lowerName.endsWith('.docx')) {
      setErrorMessage('選択されたファイルは古いWord 97-2003形式（.doc）です。Word等で「.docx」形式として保存し直してからインポートしてください。');
      return;
    }

    setIsLoadingSingle(true);
    setErrorMessage(null);

    try {
      const result = await parseDocxFile(file, file.name);
      if (!result || result.rootNodes.length === 0) {
        throw new Error('文書からテキストまたは見出し構造を読み取ることができませんでした。');
      }
      setSinglePreviewResult(result);
      setSingleCustomTabName(result.tabName);
      expandAllNodes(result.rootNodes);
      if (result.rootNodes.length > 0) {
        setSelectedPreviewNode(result.rootNodes[0]);
      }
    } catch (err: any) {
      console.error('DOCX parse error:', err);
      logError('docx-import', `DOCXファイル「${file.name}」の解析に失敗しました`, err);
      setErrorMessage(`DOCXファイルの解析に失敗しました: ${err.message || 'ファイルが壊れているか、暗号化/パスワード保護されている可能性があります'}`);
    } finally {
      setIsLoadingSingle(false);
    }
  };

  const handleExecuteSingleImport = () => {
    if (!singlePreviewResult) return;
    const finalResult: DocxImportPreviewResult = {
      ...singlePreviewResult,
      tabName: singleCustomTabName.trim() || singlePreviewResult.tabName,
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

  // Tree node expand/collapse
  const toggleNodeExpand = (tempId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(tempId)) next.delete(tempId);
      else next.add(tempId);
      return next;
    });
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
              ? 'bg-blue-100 text-blue-900 font-semibold shadow-2xs'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
          style={{ paddingLeft: `${(node.level - 1) * 16 + 8}px` }}
        >
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

          {hasChildren ? (
            <Folder className="w-4 h-4 text-amber-500 fill-amber-100 mr-1.5 shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-blue-600 mr-1.5 shrink-0" />
          )}

          <span className="truncate flex-1 font-medium">{node.title}</span>

          <div className="flex items-center space-x-1 ml-2 shrink-0">
            <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${levelBadgeColor}`}>
              階層 {node.level}
            </span>
            {node.imageCount > 0 && (
              <span className="text-[10px] px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded border border-emerald-200 font-mono flex items-center space-x-0.5">
                <ImageIcon className="w-2.5 h-2.5 inline mr-0.5" />
                <span>{node.imageCount}</span>
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

        {hasChildren && isExpanded && (
          <div className="border-l border-slate-200 ml-4">
            {node.children.map((child) => renderPreviewTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  // Currently viewed batch item
  const activeBatchItem = batchFiles.find((f) => f.id === activeBatchFileId) || null;
  const activeBatchPreview = activeBatchItem?.previewResult || null;

  // Selected files stats
  const selectedBatchItems = batchFiles.filter((f) => f.selected);
  const totalBatchBytes = selectedBatchItems.reduce((acc, f) => acc + f.size, 0);
  const totalBatchKb = (totalBatchBytes / 1024).toFixed(1);

  // Filtered batch files list
  const filteredBatchFiles = batchFiles.filter((f) => {
    if (!fileFilterText.trim()) return true;
    return f.name.toLowerCase().includes(fileFilterText.toLowerCase().trim());
  });

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs animate-in fade-in"
      onClick={handleClose}
    >
      <div
        id="docx-import-modal"
        className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 text-xs animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-600 rounded-lg shadow-xs">
              <Files className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm">Word文書（.docx）インポート</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  一括対応
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                指定フォルダ内のDOCXファイルを一括インポートし、アプリの指定フォルダ内にノートブックタブとして展開します
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center space-x-2">
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setImportMode('batch')}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  importMode === 'batch'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>📂 フォルダ一括インポート</span>
              </button>
              <button
                type="button"
                onClick={() => setImportMode('single')}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  importMode === 'single'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📄 単一ファイル</span>
              </button>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
              title="閉じる (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-3.5">
          {/* ==================================================== */}
          {/* 1. DESTINATION FOLDER SELECTOR (インポート先フォルダの指定) */}
          {/* ==================================================== */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center space-x-1.5 text-xs">
                <Folder className="w-4 h-4 text-amber-500 fill-amber-100 shrink-0" />
                <span>インポート先フォルダ（階層１）の選択:</span>
              </span>
              <span className="text-[11px] text-slate-500">
                インポートされたファイルは、ここで選択したフォルダ内に新しいタブとして追加されます
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
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
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-100 shrink-0" />
                    <span className="truncate flex-1 text-xs">{tf.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })}

              {/* Option: Root */}
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewFolder(false);
                  setSelectedFolderOption('__root__');
                }}
                className={`flex items-center space-x-2 p-2 rounded-md border text-left transition cursor-pointer ${
                  !isCreatingNewFolder && selectedFolderOption === '__root__'
                    ? 'border-blue-500 bg-blue-50/90 text-blue-900 font-semibold ring-1 ring-blue-400 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                <FileIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate flex-1 text-xs">ルート (フォルダなし)</span>
                {!isCreatingNewFolder && selectedFolderOption === '__root__' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                )}
              </button>

              {/* Option: Create New Folder */}
              <button
                type="button"
                onClick={() => setIsCreatingNewFolder(true)}
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

            {isCreatingNewFolder && (
              <div className="flex items-center space-x-2 pt-1 animate-in fade-in">
                <span className="text-xs font-semibold text-slate-700">新規フォルダ名:</span>
                <input
                  type="text"
                  value={newFolderNameInput}
                  onChange={(e) => setNewFolderNameInput(e.target.value)}
                  placeholder="例: 図書・文献資料"
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 font-semibold"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {/* ==================================================== */}
          {/* 2. MODE: BATCH IMPORT (一括インポート) */}
          {/* ==================================================== */}
          {importMode === 'batch' ? (
            <div className="flex-1 flex flex-col space-y-3">
              {/* If no files loaded yet: Big Folder Drop/Pick Zone */}
              {batchFiles.length === 0 ? (
                <div className="space-y-3">
                  <div
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleIncomingFileList(e.dataTransfer.files, 'ドロップされたフォルダ');
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center space-y-3 ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
                        : 'border-slate-300 hover:border-blue-400 bg-slate-50'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                      <FolderSearch className="w-7 h-7" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        DOCXファイルが格納されているフォルダを指定してください
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        フォルダ内のすべての .docx ファイルを自動スキャンし、一括で解析・インポートします
                      </p>
                    </div>

                    {/* Hidden folder & multi-file inputs */}
                    <input
                      ref={folderInputRef}
                      type="file"
                      {...({ webkitdirectory: '', directory: '' } as any)}
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleIncomingFileList(e.target.files);
                        }
                      }}
                    />

                    <input
                      ref={multiFilesInputRef}
                      type="file"
                      multiple
                      accept=".docx,.docm"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleIncomingFileList(e.target.files, '選択したファイル一覧');
                        }
                      }}
                    />

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => folderInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs flex items-center space-x-2 transition cursor-pointer"
                      >
                        <Folder className="w-4 h-4" />
                        <span>📁 フォルダを選択...</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => multiFilesInputRef.current?.click()}
                        className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg font-semibold shadow-2xs flex items-center space-x-2 transition cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>📄 複数ファイルを直接選択...</span>
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      ※ Windowsのエクスプローラーからフォルダごとドラッグ＆ドロップすることも可能です
                    </div>
                  </div>

                  {/* Sample test button */}
                  <div className="flex items-center justify-between p-3 bg-blue-50/80 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-800">手元にフォルダがない場合</span>
                        <p className="text-[11px] text-slate-600">
                          デモ用フォルダ（第1章・第2章・第3章の3ファイル、装飾・脚注入り）を一括読み込みして動作を確認できます。
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadSampleBatchPreview}
                      disabled={isBatchProcessing}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
                    >
                      デモフォルダ（3ファイル）で試す
                    </button>
                  </div>
                </div>
              ) : (
                /* Files are loaded: Show Explicit Summary Bar + 2-Column Inspector */
                <div className="space-y-3 flex-1 flex flex-col">
                  {/* ==================================================== */}
                  {/* 3. CONFIRMATION SUMMARY BAR (確認メッセージ: 明示エリア) */}
                  {/* ==================================================== */}
                  <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-3 shadow-2xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* Source & Destination */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-blue-900 flex items-center space-x-1">
                            <Folder className="w-3.5 h-3.5 text-blue-600" />
                            <span>インポート元:</span>
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-bold text-slate-800 font-mono">
                            {sourceFolderPath || '選択フォルダ'}
                          </span>
                          <span className="text-[11px] text-blue-700 font-medium">
                            （検出: {batchFiles.length} 件）
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                          <span className="font-bold text-blue-900 flex items-center space-x-1">
                            <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-100" />
                            <span>インポート先:</span>
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded border border-amber-300 font-bold text-amber-900">
                            📁 {getDestinationFolderName()}
                          </span>
                        </div>
                      </div>

                      {/* Reselect Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setBatchFiles([]);
                          setSourceFolderPath('');
                          setActiveBatchFileId(null);
                        }}
                        className="text-xs text-blue-700 hover:text-blue-900 hover:underline flex items-center space-x-1 font-medium cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>別のフォルダを選択</span>
                      </button>
                    </div>

                    {/* Stats & Quick Select Controls */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-blue-200/70 text-[11px]">
                      <div className="text-slate-700">
                        インポート対象: <strong className="text-blue-700 font-bold">{selectedBatchItems.length}</strong> / {batchFiles.length} ファイル（選択合計: {totalBatchKb} KB）
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="text-blue-600 hover:underline font-semibold cursor-pointer"
                        >
                          すべて選択
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={handleDeselectAll}
                          className="text-slate-500 hover:underline cursor-pointer"
                        >
                          選択解除
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ==================================================== */}
                  {/* 4. TWO-COLUMN: FILE LIST vs INDIVIDUAL CONTENT PREVIEW */}
                  {/* ==================================================== */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-[360px] max-h-[460px]">
                    {/* Left: File List (4 Cols) */}
                    <div className="md:col-span-5 border border-slate-300 rounded-lg bg-slate-50/50 flex flex-col overflow-hidden">
                      {/* List Header */}
                      <div className="p-2 border-b border-slate-200 bg-slate-100 flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                          <Files className="w-3.5 h-3.5 text-blue-600" />
                          <span>検出ファイル一覧 ({batchFiles.length})</span>
                        </span>
                        <span className="text-[10px] text-slate-500">クリックで個別確認</span>
                      </div>

                      {/* Filter Box */}
                      {batchFiles.length > 4 && (
                        <div className="p-1.5 border-b border-slate-200 bg-white">
                          <div className="relative">
                            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                            <input
                              type="text"
                              value={fileFilterText}
                              onChange={(e) => setFileFilterText(e.target.value)}
                              placeholder="ファイル名を検索..."
                              className="w-full pl-6 pr-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:bg-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* File Items */}
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-200/70">
                        {filteredBatchFiles.map((item) => {
                          const isActive = item.id === activeBatchFileId;
                          const fileSizeKb = (item.size / 1024).toFixed(0);

                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelectBatchFileForPreview(item)}
                              className={`p-2 flex items-center space-x-2 transition cursor-pointer text-xs ${
                                isActive
                                  ? 'bg-blue-100/90 text-blue-950 font-semibold border-l-4 border-l-blue-600'
                                  : 'hover:bg-slate-100/80 text-slate-700'
                              }`}
                            >
                              {/* Checkbox */}
                              <button
                                type="button"
                                onClick={(e) => toggleBatchFileSelected(item.id, e)}
                                className="text-slate-500 hover:text-blue-600 shrink-0 cursor-pointer"
                                title={item.selected ? 'インポート対象から外す' : 'インポート対象に含める'}
                              >
                                {item.selected ? (
                                  <CheckSquare className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                              </button>

                              {/* File Icon */}
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />

                              {/* Name & Details */}
                              <div className="flex-1 min-w-0">
                                <div className="truncate font-medium">{item.name}</div>
                                <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                                  <span>{fileSizeKb} KB</span>
                                  {item.status === 'ready' && item.previewResult && (
                                    <>
                                      <span>•</span>
                                      <span className="text-emerald-700 font-semibold">
                                        見出し{item.previewResult.totalNotes}件 / 注釈{item.previewResult.totalFootnotes}件
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div className="shrink-0">
                                {item.status === 'parsing' ? (
                                  <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                                ) : item.status === 'ready' ? (
                                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold border border-emerald-200">
                                    解析済
                                  </span>
                                ) : item.status === 'error' ? (
                                  <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold border border-rose-200">
                                    失敗
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px]">
                                    未解析
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Individual Content Inspection & Preview (7 Cols) */}
                    <div className="md:col-span-7 border border-slate-300 rounded-lg bg-white flex flex-col overflow-hidden">
                      {activeBatchItem ? (
                        <>
                          {/* File Detail Header */}
                          <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center space-x-2 min-w-0">
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="font-bold text-slate-900 truncate">
                                {activeBatchItem.name}
                              </span>
                            </div>

                            {/* Quick single-import button */}
                            {activeBatchPreview && (
                              <button
                                type="button"
                                onClick={() => handleExecuteSingleFromBatch(activeBatchItem)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-xs font-semibold shadow-2xs flex items-center space-x-1 shrink-0 cursor-pointer"
                                title="この1ファイルだけを今すぐインポートします"
                              >
                                <ArrowRight className="w-3 h-3 text-blue-600" />
                                <span>このファイルのみインポート</span>
                              </button>
                            )}
                          </div>

                          {/* Preview Sub-tabs (階層ツリー vs 本文プレビュー) */}
                          <div className="px-3 pt-2 pb-1 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => setBatchPreviewSubTab('tree')}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                                  batchPreviewSubTab === 'tree'
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <Layers className="w-3 h-3" />
                                <span>階層ツリー構造 (見出し1〜3)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setBatchPreviewSubTab('content')}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                                  batchPreviewSubTab === 'content'
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <Eye className="w-3 h-3" />
                                <span>本文・装飾・注釈プレビュー</span>
                              </button>
                            </div>

                            {activeBatchPreview && (
                              <div className="text-[11px] text-slate-500 font-mono">
                                本文 {activeBatchPreview.totalCharacters.toLocaleString()}字 / 注釈 {activeBatchPreview.totalFootnotes}件
                              </div>
                            )}
                          </div>

                          {/* Preview Panel Body */}
                          <div className="flex-1 overflow-y-auto p-3">
                            {activeBatchItem.status === 'parsing' ? (
                              <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-500">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                <span>Word文書のスタイル・階層を解析中...</span>
                              </div>
                            ) : activeBatchItem.status === 'error' ? (
                              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{activeBatchItem.errorMessage || '解析に失敗しました'}</span>
                              </div>
                            ) : activeBatchPreview ? (
                              batchPreviewSubTab === 'tree' ? (
                                <div className="space-y-1">
                                  <div className="text-[11px] text-slate-500 mb-2">
                                    ※ 見出し1〜3がノート・フォルダとして自動階層化されます（項目をクリックすると本文プレビューが切り替わります）
                                  </div>
                                  {activeBatchPreview.rootNodes.map((root) => renderPreviewTreeNode(root))}
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {selectedPreviewNode ? (
                                    <div>
                                      <div className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-1 flex items-center justify-between">
                                        <span>{selectedPreviewNode.title}</span>
                                        <span className="text-[10px] text-slate-500 font-normal">
                                          階層 {selectedPreviewNode.level} / {selectedPreviewNode.characterCount}文字
                                        </span>
                                      </div>
                                      <div
                                        className="prose prose-xs max-w-none text-slate-800 text-xs leading-relaxed docx-preview-html pt-2"
                                        dangerouslySetInnerHTML={{
                                          __html: selectedPreviewNode.htmlContent || '<p className="text-slate-400 italic">（本文なし）</p>',
                                        }}
                                      />

                                      {/* Footnotes preview */}
                                      {(() => {
                                        const { footnotes } = parseAndRenumberHtml(selectedPreviewNode.htmlContent || '');
                                        if (footnotes.length === 0) return null;
                                        return (
                                          <div className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 mb-1.5">
                                              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                                              <span>注釈・脚注 ({footnotes.length}件)</span>
                                            </div>
                                            <ol className="space-y-1 text-xs text-slate-700 list-none pl-0">
                                              {footnotes.map((fn) => (
                                                <li key={fn.id} className="flex items-start space-x-1.5 leading-snug">
                                                  <span className="text-blue-600 font-bold shrink-0">[{fn.number}]</span>
                                                  <span className="text-slate-700">{fn.text}</span>
                                                </li>
                                              ))}
                                            </ol>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 text-slate-400 italic">
                                      左のツリーからノートを選択すると本文を確認できます
                                    </div>
                                  )}
                                </div>
                              )
                            ) : (
                              <div className="h-full flex items-center justify-center text-slate-400 italic">
                                ファイル一覧からファイルを選択してください
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 italic">
                          左の一覧から確認したいファイルを選択してください
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ==================================================== */
            /* 3. MODE: SINGLE FILE IMPORT (単一ファイル) */
            /* ==================================================== */
            <div className="space-y-3">
              {!singlePreviewResult ? (
                <div className="space-y-3">
                  <div
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleSingleFileSelect(e.dataTransfer.files[0]);
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => singleFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
                        : 'border-slate-300 hover:border-blue-400 bg-slate-50'
                    }`}
                  >
                    <input
                      ref={singleFileInputRef}
                      type="file"
                      accept=".docx,.docm"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleSingleFileSelect(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {isLoadingSingle ? (
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
                        {isLoadingSingle ? 'DOCXファイルを解析中...' : 'ここにWordファイル（.docx）をドラッグ＆ドロップ'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {isLoadingSingle ? '見出し階層、文字色、マーカー、脚注を抽出しています' : 'またはクリックしてパソコンから単一ファイルを選択'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Single preview display */
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-slate-700">ファイル名:</span>
                      <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300">
                        {singlePreviewResult.fileName}
                      </span>
                      <span className="font-semibold text-slate-700 ml-2">作成タブ名:</span>
                      <input
                        type="text"
                        value={singleCustomTabName}
                        onChange={(e) => setSingleCustomTabName(e.target.value)}
                        className="px-2 py-0.5 bg-white border border-slate-300 rounded font-semibold text-blue-700 w-48"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSinglePreviewResult(null)}
                      className="text-xs text-slate-500 hover:underline cursor-pointer"
                    >
                      別のファイルを選択
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[300px] max-h-[380px]">
                    <div className="md:col-span-6 border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 overflow-y-auto">
                      <div className="font-bold text-slate-800 mb-2 pb-1 border-b border-slate-200">
                        作成予定のフォルダ・ノート階層
                      </div>
                      {singlePreviewResult.rootNodes.map((root) => renderPreviewTreeNode(root))}
                    </div>
                    <div className="md:col-span-6 border border-slate-300 rounded-lg p-2.5 bg-white overflow-y-auto">
                      {selectedPreviewNode ? (
                        <div>
                          <div className="font-bold text-sm text-slate-900 border-b pb-1">
                            {selectedPreviewNode.title}
                          </div>
                          <div
                            className="prose prose-xs max-w-none text-slate-800 text-xs leading-relaxed docx-preview-html pt-2"
                            dangerouslySetInnerHTML={{
                              __html: selectedPreviewNode.htmlContent || '<p className="text-slate-400 italic">（本文なし）</p>',
                            }}
                          />
                        </div>
                      ) : (
                        <div className="text-slate-400 italic">左のツリーからノートを選択してください</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-600 flex items-center space-x-2">
            {importMode === 'batch' && batchFiles.length > 0 && (
              <span>
                インポート元: <strong>{sourceFolderPath || '指定フォルダ'}</strong> → インポート先: <strong>{getDestinationFolderName()}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isBatchProcessing}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-slate-700 font-medium transition cursor-pointer"
            >
              キャンセル
            </button>

            {importMode === 'batch' ? (
              <button
                type="button"
                onClick={handleExecuteBatchImport}
                disabled={batchFiles.length === 0 || selectedBatchItems.length === 0 || isBatchProcessing}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition cursor-pointer flex items-center space-x-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isBatchProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {batchProgress ? `${batchProgress.current}/${batchProgress.total} 件処理中...` : '一括インポート中...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      選択した全ファイル（{selectedBatchItems.length}件）を一括インポート実行
                    </span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExecuteSingleImport}
                disabled={!singlePreviewResult || isLoadingSingle}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition cursor-pointer flex items-center space-x-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span>インポート実行 (OK)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
