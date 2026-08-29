import React, { useState } from 'react';
import { SPECS_AND_DESIGN_DOCS, SpecSection } from '../data/specsAndDesignDoc';
import { BookOpen, Copy, Check, Download, X, Search, FileText, Database, Server, Layers } from 'lucide-react';

interface SpecsDocModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpecsDocModal: React.FC<SpecsDocModalProps> = ({ isOpen, onClose }) => {
  const [activeSectionId, setActiveSectionId] = useState(SPECS_AND_DESIGN_DOCS[0].id);
  const [copied, setCopied] = useState(false);
  const [searchDocQuery, setSearchDocQuery] = useState('');

  if (!isOpen) return null;

  const currentSection = SPECS_AND_DESIGN_DOCS.find((s) => s.id === activeSectionId) || SPECS_AND_DESIGN_DOCS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSection.markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAllMarkdown = () => {
    const fullContent = SPECS_AND_DESIGN_DOCS.map((s) => s.markdownContent).join('\n\n---\n\n');
    const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '階層型リッチテキストエディタ_Flask仕様書・基本設計書.md';
    link.click();
  };

  const filteredSections = SPECS_AND_DESIGN_DOCS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      s.markdownContent.toLowerCase().includes(searchDocQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="px-5 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold tracking-tight">階層型リッチノートエディタ 仕様書・設計書</h2>
              <p className="text-xs text-slate-300">Flask + SQLite/PostgreSQL + Modern Frontend フルスタック設計ドキュメント</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition border border-slate-600"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'コピー完了' : '本文コピー'}</span>
            </button>

            <button
              onClick={handleDownloadAllMarkdown}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition font-medium shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>全仕様書を.mdで保存</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Navigation & Right Markdown Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Table of Contents */}
          <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col p-3 shrink-0">
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ドキュメント内を検索..."
                value={searchDocQuery}
                onChange={(e) => setSearchDocQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
              目次 (Sections)
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5">
              {filteredSections.map((sec) => {
                const isSelected = sec.id === activeSectionId;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`w-full text-left p-2.5 rounded-md transition text-xs flex flex-col space-y-1 border ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-semibold">{sec.title}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-2">{sec.summary}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Document Reader */}
          <div className="flex-1 overflow-y-auto p-8 bg-white text-slate-800 font-sans">
            <div className="max-w-4xl mx-auto space-y-6">
              <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-800">
                {currentSection.markdownContent}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
