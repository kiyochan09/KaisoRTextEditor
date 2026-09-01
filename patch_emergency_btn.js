import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const emergencyBtn = `{/* EMERGENCY RESTORE BUTTON */}
      <button
        onClick={handleRestoreNotebooks}
        className="fixed top-4 right-4 z-[9999] bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-full shadow-2xl font-bold flex items-center space-x-2 border-4 border-white animate-pulse"
      >
        <span className="text-xl">🛟</span>
        <span>緊急：迷子データの復元</span>
      </button>
      
      {/* 2. Top Horizontal Tab Bar`;

content = content.replace('{/* 2. Top Horizontal Tab Bar', emergencyBtn);

fs.writeFileSync('src/App.tsx', content);

