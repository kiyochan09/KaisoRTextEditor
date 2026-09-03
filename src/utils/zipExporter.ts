import JSZip from 'jszip';
import { DatabaseProfile, TreeNode, TabFolder } from '../types';
import { parseAndRenumberHtml } from './footnoteUtils';

/**
 * Losslessly exports database profiles to a ZIP archive containing
 * Markdown + HTML files with YAML Front-Matter, tags, footnotes,
 * textboxes, comments, bookmarks, and hierarchical folder structure.
 */
export async function exportDataOnlyZip(databases: DatabaseProfile[]): Promise<void> {
  const zip = new JSZip();
  
  // OSでファイル名として使用できない禁則文字を置換する関数
  const sanitize = (name: string) => (name || 'Untitled').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
  
  // フォルダ構造を再帰的に巡回してZIPに追加する関数
  const processNodes = (
    folder: JSZip,
    nodes: Record<string, TreeNode>,
    notebookId: string,
    parentId: string | null,
    db: DatabaseProfile
  ) => {
    const children = (Object.values(nodes || {}) as TreeNode[]).filter(
      (n) => n.notebookId === notebookId && n.parentId === parentId
    );
    
    children.forEach((node) => {
      const nodeName = sanitize(node.title) || 'Untitled';
      
      if (node.isFolder) {
        const subFolder = folder.folder(nodeName);
        if (subFolder) processNodes(subFolder, nodes, notebookId, node.id, db);
      } else {
        let content = '';
        
        if (node.type === 'rich' && node.content?.richHtml) {
          const { cleanHtml, footnotes } = parseAndRenumberHtml(node.content.richHtml);
          const nodeBookmarks = (db.sentenceBookmarks || []).filter((bm) => bm.nodeId === node.id);
          
          const frontMatterObj = {
            id: node.id,
            title: node.title,
            type: node.type,
            tags: node.tags || [],
            bookmarks: nodeBookmarks.map((bm) => ({
              id: bm.id,
              text: bm.text,
              color: bm.color,
              comment: bm.comment,
              createdAt: bm.createdAt,
            })),
            created: node.created,
            updated: node.updated,
          };

          let mdText = cleanHtml;

          if (footnotes.length > 0) {
            const fnDefs = footnotes.map((fn) => `[^${fn.number}]: ${fn.text}`).join('\n');
            mdText = `${mdText.trim()}\n\n---\n### 脚注・注釈\n${fnDefs}`;
          }

          content = `---\n${JSON.stringify(frontMatterObj, null, 2)}\n---\n\n${mdText.trim()}`;
        } else if (node.type === 'code' && node.content?.code) {
          content = `\`\`\`${node.content.code.language || ''}\n${node.content.code.code}\n\`\`\``;
        } else if ((node.type as any) === 'plainText' && node.content?.plainText) {
          content = node.content.plainText;
        } else {
          content = JSON.stringify(node.content || {}, null, 2);
        }
        
        folder.file(`${nodeName}.md`, content.trim());
      }
    });
  };

  const getTabFolderPath = (tabFolderId: string | null | undefined, tabFolders: TabFolder[]): string[] => {
    if (!tabFolderId) return [];
    const path: string[] = [];
    let currId: string | null = tabFolderId;
    const visited = new Set<string>();

    while (currId && !visited.has(currId)) {
      visited.add(currId);
      const f = tabFolders.find((item) => item.id === currId);
      if (!f) break;
      path.unshift(sanitize(f.name) || 'Folder');
      currId = f.parentId || null;
    }
    return path;
  };

  databases.forEach((db) => {
    const dbFolder = zip.folder(sanitize(db.name) || 'Database');
    if (!dbFolder) return;

    const tabFolders = db.tabFolders || [];

    tabFolders.forEach((tf) => {
      const tfPath = getTabFolderPath(tf.id, tabFolders);
      if (tfPath.length > 0) {
        let current = dbFolder;
        tfPath.forEach((part) => {
          current = current.folder(part) || current;
        });
      }
    });

    (db.notebooks || []).forEach((nb) => {
      const tfPath = getTabFolderPath(nb.folderId, tabFolders);
      let targetFolder = dbFolder;
      tfPath.forEach((part) => {
        targetFolder = targetFolder.folder(part) || targetFolder;
      });

      const nbFolder = targetFolder.folder(sanitize(nb.name) || 'Notebook');
      if (nbFolder) {
        processNodes(nbFolder, db.nodes || {}, nb.id, null, db);
      }
    });

    const meta = {
      databaseName: db.name,
      tabFolders: tabFolders,
      notebooks: (db.notebooks || []).map((nb) => ({
        id: nb.id,
        name: nb.name,
        folderId: nb.folderId || null,
        color: nb.color,
        bgClass: nb.bgClass,
        borderClass: nb.borderClass,
        description: nb.description,
      })),
      tags: db.tags || [],
      sentenceBookmarks: db.sentenceBookmarks || [],
      figureCaptions: db.figureCaptions || [],
    };
    dbFolder.file('.kaiso_tab_meta.json', JSON.stringify(meta, null, 2));
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `KaisoR_DataOnly_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
