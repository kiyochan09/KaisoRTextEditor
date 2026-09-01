import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const importRegex = /const \[isRestoreModalOpen, setIsRestoreModalOpen\] = useState<boolean>\(false\);/;
content = content.replace(importRegex, 'const [isRestoreModalOpen, setIsRestoreModalOpen] = useState<boolean>(false);\n  const [hasUsedEmergencyRestore, setHasUsedEmergencyRestore] = useState<boolean>(false);');

const oldLogic = `  const handleRestoreNotebooks = () => {
    const existingNbIds = new Set(notebooks.map(nb => nb.id));`;
const newLogic = `  const handleRestoreNotebooks = () => {
    setHasUsedEmergencyRestore(true);
    const existingNbIds = new Set(notebooks.map(nb => nb.id));`;
content = content.replace(oldLogic, newLogic);

const oldBtn = `{/* EMERGENCY RESTORE BUTTON */}
      <button
        onClick={handleRestoreNotebooks}
        className="fixed top-4 right-4 z-[9999] bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-full shadow-2xl font-bold flex items-center space-x-2 border-4 border-white animate-pulse"
      >
        <span className="text-xl">🛟</span>
        <span>緊急：迷子データの復元</span>
      </button>`;

const newBtn = `{/* EMERGENCY RESTORE BUTTON */}
      {!hasUsedEmergencyRestore && (
        <button
          onClick={handleRestoreNotebooks}
          className="fixed top-4 right-4 z-[9999] bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-full shadow-2xl font-bold flex items-center space-x-2 border-4 border-white animate-pulse"
        >
          <span className="text-xl">🛟</span>
          <span>緊急：迷子データの復元</span>
        </button>
      )}`;
content = content.replace(oldBtn, newBtn);

fs.writeFileSync('src/App.tsx', content);
