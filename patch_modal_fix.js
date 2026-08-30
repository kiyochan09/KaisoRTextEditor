import fs from 'fs';
let content = fs.readFileSync('./src/components/CreateDatabaseModal.tsx', 'utf8');

// 1. Remove Option C
const optionCRegex = /\s*\{\/\*\s*Storage Option C: Custom File\s*\*\/\}[\s\S]*?<\/button>/;
content = content.replace(optionCRegex, '');

// 2. Revert grid-cols-3 to 2
content = content.replace('grid-cols-1 sm:grid-cols-3', 'grid-cols-1 sm:grid-cols-2');

// 3. Revert condition
content = content.replace(
    "{(storageType === 'local_folder' || storageType === 'custom_file') && (",
    "{storageType === 'local_folder' && ("
);

// 4. Revert label
content = content.replace(
    "保存先パスのプリセット / 指定:",
    "保存先フォルダのプリセット / 指定:"
);

// 5. Update useEffect logic
content = content.replace(
    "setCustomPath(`~/Documents/HierarchicalNotes/${sanitizedName}${storageType === 'custom_file' ? '.json' : '/'}`);",
    "setCustomPath(`~/Documents/HierarchicalNotes/${sanitizedName}/`);"
);
content = content.replace(
    "setCustomPath(`~/Desktop/HierarchicalNotes/${sanitizedName}${storageType === 'custom_file' ? '.json' : '/'}`);",
    "setCustomPath(`~/Desktop/HierarchicalNotes/${sanitizedName}/`);"
);
content = content.replace(
    "}, [dbName, selectedFolderPreset, storageType]);",
    "}, [dbName, selectedFolderPreset]);"
);

// 6. Update handlePickDirectory
const oldPick = `      } else {
        alert('お使いのブラウザ環境ではネイティブフォルダ選択ダイアログが制限されているため、下のテキストボックスからパスを直接ご指定いただけます。');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Directory picker cancelled or unsupported', err);
        alert('セキュリティ制限によりフォルダ選択ダイアログを表示できません。ブラウザ仕様のため、テキストボックスに直接パスを入力してください。');
      }`;
const newPick = `      } else {
        setError('お使いのブラウザはフォルダ選択機能に未対応です。PC版のChromeやEdge等をご利用ください。');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Directory picker cancelled or unsupported', err);
        setError('【プレビュー環境の制限】フォルダ選択画面を開くには、画面右上の「新しいタブで開く」ボタン（↗️）から別タブでアプリを開き直してください。');
      }`;
content = content.replace(oldPick, newPick);

fs.writeFileSync('./src/components/CreateDatabaseModal.tsx', content);
console.log("Patched successfully");
