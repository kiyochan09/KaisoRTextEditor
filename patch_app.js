import fs from 'fs';

let content = fs.readFileSync('./src/App.tsx', 'utf8');

const newFunc = `  const handleDeleteStyle = (styleId: string) => {
    setCharacterStyles((prev) => prev.filter((s) => s.id !== styleId));
    setParagraphStyles((prev) => prev.filter((s) => s.id !== styleId));
  };

  const handleToggleHideStyle = (styleId: string) => {
    setCharacterStyles((prev) => prev.map(s => s.id === styleId ? { ...s, isHidden: !s.isHidden } : s));
    setParagraphStyles((prev) => prev.map(s => s.id === styleId ? { ...s, isHidden: !s.isHidden } : s));
  };`;

content = content.replace(
  `  const handleDeleteStyle = (styleId: string) => {
    setCharacterStyles((prev) => prev.filter((s) => s.id !== styleId));
    setParagraphStyles((prev) => prev.filter((s) => s.id !== styleId));
  };`,
  newFunc
);

content = content.replace(
  'onDeleteStyle={handleDeleteStyle}',
  'onDeleteStyle={handleDeleteStyle}\n              onToggleHideStyle={handleToggleHideStyle}'
);

fs.writeFileSync('./src/App.tsx', content);
