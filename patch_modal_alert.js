import fs from 'fs';
let content = fs.readFileSync('./src/components/CreateDatabaseModal.tsx', 'utf8');

const oldPick = `      } else {
        setError('お使いのブラウザはフォルダ選択機能に未対応です。PC版のChromeやEdge等をご利用ください。');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Directory picker cancelled or unsupported', err);
        setError('【プレビュー環境の制限】フォルダ選択画面を開くには、画面右上の「新しいタブで開く」ボタン（↗️）から別タブでアプリを開き直してください。');
      }`;
const newPick = `      } else {
        alert('お使いのブラウザはフォルダ選択機能に未対応です。PC版のChromeやEdge等をご利用ください。');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Directory picker cancelled or unsupported', err);
        alert('【プレビュー環境の制限】\\nブラウザのセキュリティ制限により、この画面のままではフォルダ選択ダイアログを開けません。\\n\\n画面右上の「新しいタブで開く」アイコン（↗️）から別タブでアプリを開き直していただくか、下のテキストボックスに直接パスを入力してください。');
      }`;
content = content.replace(oldPick, newPick);

fs.writeFileSync('./src/components/CreateDatabaseModal.tsx', content);
console.log("Patched successfully");
