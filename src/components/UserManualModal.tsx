import React, { useState } from 'react';
import { USER_MANUAL_SECTIONS, ManualSection } from '../data/userManualDoc';
import {
  BookOpen,
  Copy,
  Check,
  Download,
  X,
  Search,
  Layout,
  FolderTree,
  Layers,
  Keyboard,
  Save,
  Server,
  HelpCircle,
  Printer,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSpecs?: () => void;
  onOpenFlaskCode?: () => void;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({
  isOpen,
  onClose,
  onOpenSpecs,
  onOpenFlaskCode,
}) => {
  const [activeSectionId, setActiveSectionId] = useState(USER_MANUAL_SECTIONS[0].id);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const currentSection =
    USER_MANUAL_SECTIONS.find((s) => s.id === activeSectionId) || USER_MANUAL_SECTIONS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSection.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAllMarkdown = () => {
    const fullContent = `# 階層型リッチノートマネージャー 総合操作マニュアル\n\n作成日時: ${new Date().toLocaleDateString('ja-JP')}\n\n---\n\n` +
      USER_MANUAL_SECTIONS.map((s) => s.content).join('\n\n---\n\n');
    const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '階層型リッチノート_操作マニュアル_ユーザーガイド.md';
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredSections = USER_MANUAL_SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSectionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layout':
        return <Layout className="w-4 h-4 text-blue-500" />;
      case 'FolderTree':
        return <FolderTree className="w-4 h-4 text-amber-500" />;
      case 'Layers':
        return <Layers className="w-4 h-4 text-emerald-500" />;
      case 'Search':
        return <Search className="w-4 h-4 text-purple-500" />;
      case 'Keyboard':
        return <Keyboard className="w-4 h-4 text-pink-500" />;
      case 'Save':
        return <Save className="w-4 h-4 text-sky-500" />;
      case 'Server':
        return <Server className="w-4 h-4 text-indigo-500" />;
      case 'HelpCircle':
        return <HelpCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-blue-500" />;
    }
  };

  // Convert markdown to clean HTML presentation
  const renderMarkdownFormatted = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableHeader: string[] = [];
    let tableRows: string[][] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    const flushTable = (key: string) => {
      if (tableHeader.length > 0 || tableRows.length > 0) {
        elements.push(
          <div key={`table-${key}`} className="my-4 overflow-x-auto border border-slate-300 rounded-lg shadow-2xs">
            <table className="w-full text-left text-xs border-collapse bg-white">
              {tableHeader.length > 0 && (
                <thead className="bg-slate-100 border-b border-slate-300 font-semibold text-slate-800">
                  <tr>
                    {tableHeader.map((th, i) => (
                      <th key={i} className="px-3 py-2 border-r border-slate-200 last:border-r-0">
                        {renderInlineFormatting(th.trim())}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70 hover:bg-blue-50/40'}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 border-r border-slate-200 last:border-r-0">
                        {renderInlineFormatting(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableHeader = [];
        tableRows = [];
        inTable = false;
      }
    };

    const flushCodeBlock = (key: string) => {
      if (codeBlockContent.length > 0) {
        elements.push(
          <div key={`code-${key}`} className="my-3 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 text-slate-100 font-mono text-xs shadow-md">
            <div className="bg-slate-800 px-3 py-1 text-[11px] text-slate-400 border-b border-slate-700 flex items-center justify-between">
              <span>図解 / コードスニペット</span>
            </div>
            <pre className="p-3 overflow-x-auto leading-relaxed text-[11px] text-emerald-400 bg-slate-950/80">
              {codeBlockContent.join('\n')}
            </pre>
          </div>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      }
    };

    lines.forEach((line, idx) => {
      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock(`cb-${idx}`);
        } else {
          if (inTable) flushTable(`tbl-${idx}`);
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Tables
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const rawCells = line.split('|').slice(1, -1);
        if (rawCells.every((c) => c.trim().match(/^:?-+:?$/))) {
          // Separator line, ignore
          return;
        }
        if (!inTable) {
          inTable = true;
          tableHeader = rawCells;
        } else {
          tableRows.push(rawCells);
        }
        return;
      } else if (inTable) {
        flushTable(`tbl-${idx}`);
      }

      // Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="text-xl font-bold text-slate-900 mt-2 mb-3 pb-2 border-b border-slate-200 flex items-center space-x-2">
            <span>{line.replace('# ', '')}</span>
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="text-base font-bold text-slate-800 mt-5 mb-2 flex items-center space-x-1.5 text-blue-900">
            <span>{line.replace('## ', '')}</span>
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-sm font-semibold text-slate-800 mt-3 mb-1.5 flex items-center space-x-1">
            <span>{line.replace('### ', '')}</span>
          </h3>
        );
      } else if (line.startsWith('---')) {
        elements.push(<hr key={idx} className="my-4 border-slate-200" />);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        const itemText = line.substring(2);
        elements.push(
          <li key={idx} className="ml-5 list-disc text-xs text-slate-700 leading-relaxed my-0.5">
            {renderInlineFormatting(itemText)}
          </li>
        );
      } else if (line.match(/^\d+\.\s/)) {
        const num = line.match(/^\d+/)?.[0];
        const itemText = line.replace(/^\d+\.\s/, '');
        elements.push(
          <li key={idx} className="ml-5 list-decimal text-xs text-slate-700 leading-relaxed my-0.5" value={num ? parseInt(num, 10) : undefined}>
            {renderInlineFormatting(itemText)}
          </li>
        );
      } else if (line.trim().length > 0) {
        elements.push(
          <p key={idx} className="text-xs text-slate-700 leading-relaxed my-1.5">
            {renderInlineFormatting(line)}
          </p>
        );
      }
    });

    if (inTable) flushTable('end');
    if (inCodeBlock) flushCodeBlock('end');

    return elements;
  };

  const renderInlineFormatting = (text: string) => {
    // Replace **bold** with <strong>
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      } else if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <kbd
            key={i}
            className="px-1.5 py-0.5 mx-0.5 text-[11px] font-mono font-medium text-slate-800 bg-slate-100 border border-slate-300 rounded shadow-2xs inline-block"
          >
            {part.slice(1, -1)}
          </kbd>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-indigo-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
              <BookOpen className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight">階層型リッチノートマネージャー 操作マニュアル</h2>
                <span className="bg-blue-600/60 text-blue-200 text-[10px] px-2 py-0.5 rounded-full border border-blue-400/40">
                  公式ガイド v1.0
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                RightNote互換 階層ノート・スプレッドシート・コード・暗号化・タグの全機能ガイド
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-md transition border border-slate-700 shadow-sm"
              title="現在表示中のセクション内容をクリップボードにコピー"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'コピー完了' : '本文コピー'}</span>
            </button>

            <button
              onClick={handleDownloadAllMarkdown}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-md transition font-medium shadow-sm"
              title="マニュアル全体をMarkdown形式(.md)でダウンロード"
            >
              <Download className="w-3.5 h-3.5" />
              <span>全マニュアル保存 (.md)</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-300 hover:text-white rounded-md hover:bg-slate-800"
              title="印刷"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-md hover:bg-slate-800 ml-2"
              title="マニュアルを閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Navigation & Right Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Table of Contents */}
          <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col p-3 shrink-0">
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="マニュアル内を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-1 flex items-center justify-between">
              <span>目次・セクション一覧</span>
              <span className="text-[10px] text-slate-400">全 {USER_MANUAL_SECTIONS.length} 項目</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {filteredSections.map((section) => {
                const isActive = section.id === activeSectionId;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSectionId(section.id)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition flex items-start space-x-2.5 ${
                      isActive
                        ? 'bg-blue-50 border border-blue-300 text-blue-950 shadow-2xs'
                        : 'hover:bg-slate-200/70 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{getSectionIcon(section.iconName)}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold truncate ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
                        {section.title}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{section.summary}</div>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600 mt-1 shrink-0" />}
                  </button>
                );
              })}

              {filteredSections.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">該当する項目がありません。</div>
              )}
            </div>

            {/* Quick Links Footer */}
            <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
              {onOpenSpecs && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSpecs();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-white hover:bg-blue-50 border border-slate-300 text-slate-700 text-[11px] transition"
                >
                  <span className="flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>仕様書・設計書を見る</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </button>
              )}
              {onOpenFlaskCode && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenFlaskCode();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-white hover:bg-emerald-50 border border-slate-300 text-slate-700 text-[11px] transition"
                >
                  <span className="flex items-center space-x-1.5">
                    <Server className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Flask ソースコードを見る</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Right Main Content Panel */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Header Badge */}
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold tracking-wide">
                  マニュアルガイド
                </span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs text-slate-500">{currentSection.summary}</span>
              </div>

              {/* Formatted Content */}
              <div className="prose prose-slate max-w-none">
                {renderMarkdownFormatted(currentSection.content)}
              </div>

              {/* Bottom Next/Prev Navigation */}
              <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                {(() => {
                  const currentIndex = USER_MANUAL_SECTIONS.findIndex((s) => s.id === currentSection.id);
                  const prevSection = currentIndex > 0 ? USER_MANUAL_SECTIONS[currentIndex - 1] : null;
                  const nextSection = currentIndex < USER_MANUAL_SECTIONS.length - 1 ? USER_MANUAL_SECTIONS[currentIndex + 1] : null;

                  return (
                    <>
                      {prevSection ? (
                        <button
                          onClick={() => setActiveSectionId(prevSection.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center space-x-1"
                        >
                          <span>← 前の章: {prevSection.title}</span>
                        </button>
                      ) : (
                        <div />
                      )}

                      {nextSection ? (
                        <button
                          onClick={() => setActiveSectionId(nextSection.id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center space-x-1 shadow-xs"
                        >
                          <span>次の章: {nextSection.title} →</span>
                        </button>
                      ) : (
                        <div />
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
