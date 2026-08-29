import React, { useState } from 'react';
import { TreeNode, SpreadsheetData } from '../types';
import { 
  Sigma, ArrowDownAZ, ArrowUpAZ, Plus, Trash2, Download, 
  Upload, Lock, CheckSquare, Table, HelpCircle
} from 'lucide-react';

interface SpreadsheetEditorProps {
  node: TreeNode;
  onUpdateSpreadsheet: (data: SpreadsheetData) => void;
  onUpdateTitle: (title: string) => void;
  onActiveCellChange?: (cellCoord: string) => void;
}

export const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({
  node,
  onUpdateSpreadsheet,
  onUpdateTitle,
  onActiveCellChange,
}) => {
  const initialData: SpreadsheetData = node.content.spreadsheet || {
    hasHeaderRow: true,
    lockHeader: true,
    headers: ['A', 'B', 'C', 'D', 'E'],
    rows: [
      [
        { value: 'First Name', style: { bold: true } },
        { value: 'Last Name', style: { bold: true } },
        { value: 'Home Number', style: { bold: true } },
        { value: 'Cell Number', style: { bold: true } },
        { value: 'Status', style: { bold: true } },
      ],
      [{ value: 'George' }, { value: 'Bailey' }, { value: '011-485-1234' }, { value: '0820000900' }, { value: 'Active' }],
      [{ value: 'Gillian' }, { value: 'Barne' }, { value: '011-485-0129' }, { value: '0820000007' }, { value: 'Active' }],
      [{ value: 'Dennis' }, { value: 'Bentley' }, { value: '011-485-0200' }, { value: '0820000089' }, { value: 'Pending' }],
    ],
  };

  const [sheetData, setSheetData] = useState<SpreadsheetData>(initialData);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 1, col: 0 });
  const [formulaValue, setFormulaValue] = useState('');
  const [showHelpCallout, setShowHelpCallout] = useState(true);

  const getCellLabel = (row: number, col: number) => {
    const colName = sheetData.headers[col] || String.fromCharCode(65 + col);
    return `${colName}${row + 1}`;
  };

  const handleCellClick = (rIdx: number, cIdx: number) => {
    setSelectedCell({ row: rIdx, col: cIdx });
    const cell = sheetData.rows[rIdx]?.[cIdx];
    setFormulaValue(cell?.formula || cell?.value || '');
    if (onActiveCellChange) {
      onActiveCellChange(getCellLabel(rIdx, cIdx));
    }
  };

  const updateCellValue = (rIdx: number, cIdx: number, newVal: string) => {
    const nextRows = sheetData.rows.map((row, r) =>
      row.map((cell, c) => {
        if (r === rIdx && c === cIdx) {
          return { ...cell, value: newVal };
        }
        return cell;
      })
    );
    const updated = { ...sheetData, rows: nextRows };
    setSheetData(updated);
    onUpdateSpreadsheet(updated);
  };

  const handleFormulaCommit = () => {
    updateCellValue(selectedCell.row, selectedCell.col, formulaValue);
  };

  const toggleHeaderRow = () => {
    const updated = { ...sheetData, hasHeaderRow: !sheetData.hasHeaderRow };
    setSheetData(updated);
    onUpdateSpreadsheet(updated);
  };

  const toggleLockHeader = () => {
    const updated = { ...sheetData, lockHeader: !sheetData.lockHeader };
    setSheetData(updated);
    onUpdateSpreadsheet(updated);
  };

  const sortColumn = (ascending: boolean) => {
    const startRowIndex = sheetData.hasHeaderRow ? 1 : 0;
    const headerRows = sheetData.hasHeaderRow ? [sheetData.rows[0]] : [];
    const dataRows = sheetData.rows.slice(startRowIndex);

    const sortedData = [...dataRows].sort((a, b) => {
      const valA = a[selectedCell.col]?.value || '';
      const valB = b[selectedCell.col]?.value || '';
      return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    const updated = { ...sheetData, rows: [...headerRows, ...sortedData] };
    setSheetData(updated);
    onUpdateSpreadsheet(updated);
  };

  const addRow = () => {
    const newRow = sheetData.headers.map(() => ({ value: '' }));
    const updated = { ...sheetData, rows: [...sheetData.rows, newRow] };
    setSheetData(updated);
    onUpdateSpreadsheet(updated);
  };

  const addColumn = () => {
    const nextColChar = String.fromCharCode(65 + sheetData.headers.length);
    const nextHeaders = [...sheetData.headers, nextColChar];
    const nextRows = sheetData.rows.map((r) => [...r, { value: '' }]);
    const updated = { ...sheetData, headers: nextHeaders, rows: nextRows };
    setSheetData(updated);
    onUpdateSpreadsheet(updated);
  };

  const exportCSV = () => {
    const csvContent = sheetData.rows
      .map((row) => row.map((c) => `"${c.value.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${node.title || 'spreadsheet'}.csv`;
    link.click();
  };

  return (
    <div id="spreadsheet-editor-container" className="flex-1 flex flex-col bg-white overflow-hidden select-none">
      {/* Header & Created date */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
        <input
          type="text"
          value={node.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          className="text-lg font-bold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 flex-1 mr-4"
        />
        <span className="text-xs text-slate-500 font-sans">
          作成日: {node.created || '2025年1月10日'}
        </span>
      </div>

      {/* Formula & Table Action Bar (matching Screenshot 2) */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-slate-100 border-b border-slate-300 gap-2 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[280px]">
          {/* Active Cell Box */}
          <div className="bg-white border border-slate-300 px-2.5 py-1 rounded text-xs font-mono font-bold text-slate-700 min-w-[45px] text-center shadow-2xs">
            {getCellLabel(selectedCell.row, selectedCell.col)}
          </div>

          <span className="font-serif italic font-bold text-slate-500 text-sm">fx</span>

          {/* Formula Input */}
          <input
            id="spreadsheet-formula-input"
            type="text"
            value={formulaValue}
            onChange={(e) => {
              setFormulaValue(e.target.value);
              updateCellValue(selectedCell.row, selectedCell.col, e.target.value);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleFormulaCommit()}
            placeholder="値または数式を入力 (例: =SUM(A1:A10)...)"
            className="flex-1 bg-white border border-slate-300 px-2 py-1 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
          />
        </div>

        {/* Action Controls & Toggles */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => sortColumn(true)}
            title="列を昇順でソート (A→Z)"
            className="p-1 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-700"
          >
            <ArrowDownAZ className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => sortColumn(false)}
            title="列を降順でソート (Z→A)"
            className="p-1 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-700"
          >
            <ArrowUpAZ className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {/* Has Header Row Button */}
          <button
            onClick={toggleHeaderRow}
            title="ヘッダー行の有無を切替"
            className={`flex items-center space-x-1 px-2 py-1 rounded text-[11px] border transition ${
              sheetData.hasHeaderRow
                ? 'bg-blue-600 text-white border-blue-700 font-semibold'
                : 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            <Table className="w-3 h-3" />
            <span>ヘッダー行</span>
          </button>

          {/* Lock Header Button */}
          <button
            onClick={toggleLockHeader}
            title="ヘッダー固定表示を切替"
            className={`flex items-center space-x-1 px-2 py-1 rounded text-[11px] border transition ${
              sheetData.lockHeader
                ? 'bg-amber-500 text-white border-amber-600 font-semibold'
                : 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>ヘッダー固定</span>
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <button
            onClick={addRow}
            className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-700"
          >
            + 行追加
          </button>
          <button
            onClick={addColumn}
            className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-700"
          >
            + 列追加
          </button>
          <button
            onClick={exportCSV}
            title="CSVファイルとしてエクスポート"
            className="p-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
          </button>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-auto bg-slate-50 p-2">
          <table className="border-collapse bg-white border border-slate-300 text-xs w-full shadow-xs">
            {/* Column Headers A, B, C, D... */}
            <thead>
              <tr className="bg-slate-200 text-slate-700 sticky top-0 z-10">
                <th className="w-10 border border-slate-300 py-1 text-center font-mono text-[10px] bg-slate-300">#</th>
                {sheetData.headers.map((h, colIndex) => (
                  <th
                    key={colIndex}
                    className="border border-slate-300 px-3 py-1 font-mono text-center min-w-[120px] text-slate-800"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sheetData.rows.map((row, rIndex) => {
                const isHeaderRow = sheetData.hasHeaderRow && rIndex === 0;
                return (
                  <tr
                    key={rIndex}
                    className={`${
                      isHeaderRow
                        ? 'bg-slate-100 font-bold border-b-2 border-slate-400'
                        : rIndex % 2 === 0
                        ? 'bg-white'
                        : 'bg-slate-50/50'
                    } ${sheetData.lockHeader && isHeaderRow ? 'sticky top-6 z-10 shadow-xs' : ''}`}
                  >
                    {/* Row Index Number */}
                    <td className="border border-slate-300 text-center font-mono text-[10px] text-slate-500 bg-slate-100 select-none">
                      {rIndex + 1}
                    </td>

                    {/* Cells */}
                    {row.map((cell, cIndex) => {
                      const isSelected = selectedCell.row === rIndex && selectedCell.col === cIndex;
                      return (
                        <td
                          key={cIndex}
                          id={`sheet-cell-${rIndex}-${cIndex}`}
                          onClick={() => handleCellClick(rIndex, cIndex)}
                          className={`border border-slate-300 px-2 py-1 relative cursor-cell ${
                            isSelected
                              ? 'outline-2 outline-blue-600 bg-blue-50/40 z-2'
                              : 'hover:bg-slate-100/60'
                          } ${isHeaderRow ? 'font-semibold text-slate-900' : 'text-slate-800'}`}
                        >
                          <input
                            type="text"
                            value={cell.value}
                            onChange={(e) => updateCellValue(rIndex, cIndex, e.target.value)}
                            className="w-full bg-transparent border-none focus:outline-none text-xs"
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Callout Box (matching Screenshot 2 tutorial box) */}
        {showHelpCallout && (
          <div className="w-72 bg-amber-50 border-l border-amber-300 p-4 text-xs text-amber-950 flex flex-col justify-between shrink-0 shadow-inner">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between font-bold text-amber-900 border-b border-amber-200 pb-1">
                <span>スプレッドシート機能のご案内</span>
                <button onClick={() => setShowHelpCallout(false)} className="text-amber-600 hover:text-amber-900">✕</button>
              </div>

              <p className="leading-relaxed">
                ツールバー上部の<strong>「ヘッダー行」</strong>や<strong>「ヘッダー固定」</strong>をワンクリックで切り替えできます。
              </p>

              <div className="bg-amber-100/70 p-2 rounded text-[11px] leading-snug">
                <strong>「ヘッダー行」</strong>が有効な場合、昇順・降順ソート時に1行目が見出し行として自動保護されます。
              </div>

              <div className="bg-amber-100/70 p-2 rounded text-[11px] leading-snug">
                <strong>「ヘッダー固定」</strong>が有効な場合、長大な表データをスクロールしてもヘッダーが常に最上部に固定されます。
              </div>
            </div>

            <div className="text-[10px] text-amber-700 pt-2 border-t border-amber-200">
              ヒント: 各セルをクリックして直接編集や数式入力が可能です。
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
