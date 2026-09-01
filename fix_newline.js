import fs from 'fs';
let content = fs.readFileSync('src/components/NotebookTabBar.tsx', 'utf8');
content = content.replace("本当にこのタブを削除しますか？\n（復元できなくなります）", "本当にこのタブを削除しますか？\\n（復元できなくなります）");
fs.writeFileSync('src/components/NotebookTabBar.tsx', content);
