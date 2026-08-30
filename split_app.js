import fs from 'fs';

let content = fs.readFileSync('./src/App.tsx', 'utf8');

// We want to rename `export default function App() {` to `function MainApp({ initialDatabases, initialActiveDatabaseId }: { initialDatabases: DatabaseProfile[], initialActiveDatabaseId: string }) {`
// And we want to replace `useState<DatabaseProfile[]>(() => { ... })` with `useState<DatabaseProfile[]>(initialDatabases)`
// And `useState<string>(() => { ... })` with `useState<string>(initialActiveDatabaseId)`
// Then add `export default function App() { ... }` at the end of the file.

content = content.replace(
  'export default function App() {',
  'function MainApp({ initialDatabases, initialActiveDatabaseId }: { initialDatabases: DatabaseProfile[], initialActiveDatabaseId: string }) {'
);

const dbStateRegex = /const \[databases, setDatabases\] = useState<DatabaseProfile\[\]>\(\(\) => \{[\s\S]*?return \[INITIAL_DEMO_DB\];\n  \}\);/;
content = content.replace(
  dbStateRegex,
  'const [databases, setDatabases] = useState<DatabaseProfile[]>(initialDatabases);'
);

const activeDbStateRegex = /const \[activeDatabaseId, setActiveDatabaseId\] = useState<string>\(\(\) => \{[\s\S]*?return savedId \|\| databases\[0\]\?\.id \|\| 'demo';\n  \}\);/;
content = content.replace(
  activeDbStateRegex,
  'const [activeDatabaseId, setActiveDatabaseId] = useState<string>(initialActiveDatabaseId);'
);

// Add imports for localforage
if (!content.includes('import localforage')) {
  content = content.replace("import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';", "import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';\nimport localforage from 'localforage';");
}

// Add the App wrapper at the bottom
const wrapperCode = `
export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [initialDatabases, setInitialDatabases] = useState<DatabaseProfile[]>([]);
  const [initialActiveDatabaseId, setInitialActiveDatabaseId] = useState<string>('');

  useEffect(() => {
    async function loadDb() {
      try {
        let dbs = [INITIAL_DEMO_DB];
        let activeId = 'demo';

        // 1. Try localforage (IndexedDB)
        const savedDbs = await localforage.getItem<DatabaseProfile[]>('hierarchical_databases');
        if (savedDbs && Array.isArray(savedDbs) && savedDbs.length > 0) {
          dbs = savedDbs;
          activeId = (await localforage.getItem<string>('hierarchical_active_db_id')) || dbs[0].id;
        } else {
          // 2. Fallback to localStorage
          const legacySaved = localStorage.getItem('hierarchical_databases');
          if (legacySaved) {
            try {
              const parsed = JSON.parse(legacySaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                dbs = parsed;
                activeId = localStorage.getItem('hierarchical_active_db_id') || dbs[0].id;
                // Migrate to localforage
                await localforage.setItem('hierarchical_databases', dbs);
                await localforage.setItem('hierarchical_active_db_id', activeId);
              }
            } catch(e) {}
          } else {
            // 3. Fallback to legacy single db
            const legacyNotebooks = localStorage.getItem('hierarchical_notebooks');
            const legacyNodes = localStorage.getItem('hierarchical_nodes');
            const legacyTags = localStorage.getItem('hierarchical_tags');
            
            if (legacyNotebooks && legacyNodes) {
              try {
                const nbs = JSON.parse(legacyNotebooks);
                const nds = JSON.parse(legacyNodes);
                const tgs = legacyTags ? JSON.parse(legacyTags) : INITIAL_TAGS;
                dbs = [{
                  id: 'demo',
                  name: 'DEMO（移行データ）',
                  createdAt: '2026-08-24',
                  updatedAt: new Date().toISOString().split('T')[0],
                  isDemo: true,
                  tabFolders: INITIAL_TAB_FOLDERS,
                  notebooks: nbs,
                  nodes: nds,
                  tags: tgs,
                  sentenceBookmarks: INITIAL_SENTENCE_BOOKMARKS,
                  figureCaptions: [],
                  activeNotebookId: nbs[0]?.id || 'recipes',
                  activeNodeId: Object.keys(nds)[0] || 'rec-vegetable',
                }];
                activeId = 'demo';
                await localforage.setItem('hierarchical_databases', dbs);
                await localforage.setItem('hierarchical_active_db_id', activeId);
              } catch(e) {}
            }
          }
        }
        
        setInitialDatabases(dbs);
        setInitialActiveDatabaseId(activeId);
        setIsDbReady(true);
      } catch (e) {
        console.error("Database load error:", e);
        setInitialDatabases([INITIAL_DEMO_DB]);
        setInitialActiveDatabaseId('demo');
        setIsDbReady(true);
      }
    }
    loadDb();
  }, []);

  if (!isDbReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 flex-col space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="font-semibold text-sm">データベースを読み込み中...</p>
      </div>
    );
  }

  return <MainApp initialDatabases={initialDatabases} initialActiveDatabaseId={initialActiveDatabaseId} />;
}
`;

content = content + wrapperCode;

// Replace all localStorage.setItem('hierarchical_databases' with localforage.setItem(
content = content.replaceAll(
  "localStorage.setItem('hierarchical_databases', JSON.stringify(next));",
  "localforage.setItem('hierarchical_databases', next);"
);

content = content.replaceAll(
  "localStorage.setItem('hierarchical_active_db_id', activeDatabaseId);",
  "localforage.setItem('hierarchical_active_db_id', activeDatabaseId);"
);

// We need to also replace localforage in setDatabases logic if it was async? No, setItem returns a promise, we don't need to await it here since it's fire-and-forget.

fs.writeFileSync('./src/App.tsx', content);
console.log("App.tsx transformed successfully.");
