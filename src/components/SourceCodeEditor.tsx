import React, { useState } from 'react';
import { TreeNode } from '../types';
import { Code, Copy, Check, Play, Terminal } from 'lucide-react';

interface SourceCodeEditorProps {
  node: TreeNode;
  onUpdateCode: (language: string, code: string) => void;
  onUpdateTitle: (title: string) => void;
}

export const SourceCodeEditor: React.FC<SourceCodeEditorProps> = ({
  node,
  onUpdateCode,
  onUpdateTitle,
}) => {
  const [language, setLanguage] = useState(node.content.code?.language || 'python');
  const [code, setCode] = useState(node.content.code?.code || '# Enter source code here\n');
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    onUpdateCode(newLang, code);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    onUpdateCode(language, newCode);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateRun = () => {
    setOutput(`[Flask Engine Simulation] ${language.toUpperCase()} スクリプト実行完了:\n> 構文エラーなし (Syntax OK)\n> メモリ使用量: 4.2 MB\n> 実行時間: 14ms\n> ステータス: 終了コード 0 (正常終了)`);
  };

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 15) }, (_, i) => i + 1);

  return (
    <div id="source-code-editor-container" className="flex-1 flex flex-col bg-slate-900 text-slate-100 overflow-hidden font-mono text-xs">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center space-x-3 flex-1 mr-4">
          <input
            type="text"
            value={node.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="text-sm font-bold text-slate-100 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 flex-1 font-sans"
          />
          <div className="flex items-center space-x-1.5 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            <Code className="w-3.5 h-3.5 text-yellow-400" />
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="python" className="bg-slate-900">Python</option>
              <option value="javascript" className="bg-slate-900">JavaScript</option>
              <option value="typescript" className="bg-slate-900">TypeScript</option>
              <option value="csharp" className="bg-slate-900">C#</option>
              <option value="sql" className="bg-slate-900">SQL</option>
              <option value="html" className="bg-slate-900">HTML</option>
              <option value="json" className="bg-slate-900">JSON</option>
              <option value="xml" className="bg-slate-900">XML</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSimulateRun}
            className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs transition"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>実行</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs border border-slate-700 transition"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'コピー完了' : 'コードをコピー'}</span>
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="flex-1 flex overflow-auto bg-slate-900">
        {/* Line Numbers */}
        <div className="bg-slate-950 text-slate-500 text-right pr-3 pl-3 py-3 select-none border-r border-slate-800 text-xs font-mono">
          {lineNumbers.map((n) => (
            <div key={n} className="leading-5 h-5">{n}</div>
          ))}
        </div>

        {/* Code Textarea */}
        <textarea
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-emerald-300 font-mono text-xs leading-5 resize-none focus:outline-none overflow-auto"
        />
      </div>

      {/* Terminal / Output Simulation */}
      {output && (
        <div className="bg-slate-950 border-t border-slate-800 p-2.5 text-xs font-mono flex flex-col">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center space-x-1">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>実行コンソール</span>
            </span>
            <button onClick={() => setOutput(null)} className="text-slate-500 hover:text-slate-300">✕</button>
          </div>
          <pre className="text-emerald-400 whitespace-pre-wrap text-[11px] bg-black/40 p-2 rounded border border-slate-800/80">{output}</pre>
        </div>
      )}
    </div>
  );
};
