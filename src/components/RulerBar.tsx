import React from 'react';

export const RulerBar: React.FC = () => {
  const marks = Array.from({ length: 16 }, (_, i) => i + 1);

  return (
    <div id="desktop-ruler-bar" className="h-6 bg-slate-100 border-b border-slate-300 flex items-center px-4 select-none relative overflow-hidden">
      {/* Left Margin Slider */}
      <div className="absolute left-2 top-1 text-slate-500 cursor-ew-resize">
        <span className="text-[10px] font-mono leading-none">⧖</span>
      </div>

      {/* Ruler Ticks */}
      <div className="flex-1 flex items-center justify-between text-[9px] font-mono text-slate-500 px-3">
        {marks.map((m) => (
          <div key={m} className="flex items-center space-x-2">
            <span className="text-[10px]">{m}</span>
            <span className="h-2 w-px bg-slate-300 inline-block" />
            <span className="h-1 w-px bg-slate-200 inline-block" />
            <span className="h-2 w-px bg-slate-300 inline-block" />
          </div>
        ))}
      </div>

      {/* Right Margin Slider */}
      <div className="absolute right-3 top-1 text-slate-500 cursor-ew-resize">
        <span className="text-[10px] font-mono leading-none">⧗</span>
      </div>
    </div>
  );
};
