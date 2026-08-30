import fs from 'fs';

let content = fs.readFileSync('./src/App.tsx', 'utf8');

const exportAllCode = `
  const handleExportAllDatabases = () => {
    const backupData = {
      version: '1.0',
      type: 'hierarchical_notes_full_backup',
      databases: databases
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`hierarchical_notes_FULL_BACKUP_\${Date.now()}.json\`;
    a.click();
  };

  const handleImportAllDatabases = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.type === 'hierarchical_notes_full_backup' && Array.isArray(data.databases)) {
          if (confirm('既存のすべてのデータベースが上書き（または結合）されます。続行しますか？\\n※「キャンセル」で既存のデータは保持されますが、今回は完全に上書きする形で移行します。')) {
            setDatabases(data.databases);
            localforage.setItem('hierarchical_databases', data.databases);
            const fallbackId = data.databases[0]?.id || 'demo';
            setActiveDatabaseId(fallbackId);
            localforage.setItem('hierarchical_active_db_id', fallbackId);
            
            // Re-sync states for the active DB
            const fallbackDb = data.databases[0];
            if (fallbackDb) {
              setNotebooks(fallbackDb.notebooks || []);
              setNodes(fallbackDb.nodes || {});
              setTags(fallbackDb.tags || []);
              setSentenceBookmarks(fallbackDb.sentenceBookmarks || []);
              setFigureCaptions(fallbackDb.figureCaptions || []);
              setActiveNotebookId(fallbackDb.activeNotebookId || '');
              setActiveNodeId(fallbackDb.activeNodeId || '');
            }
            
            alert('全環境のデータ移行（インポート）が完了しました。');
          }
        } else {
          alert('正しいフルバックアップファイルではありません。');
        }
      } catch (err) {
        console.error(err);
        alert('ファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
  };
`;

const lines = content.split('\n');
lines.splice(2485, 0, exportAllCode);
fs.writeFileSync('./src/App.tsx', lines.join('\n'));
