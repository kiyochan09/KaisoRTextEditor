import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const tlbOld = `            onDeleteNotebook={handleDeleteNotebook}
            onRenameNotebook={handleRenameNotebook}
            onRestoreNotebooks={handleRestoreNotebooks}`;
const tlbNew = `            onDeleteNotebook={handleDeleteNotebook}
            onRestoreNotebooks={handleRestoreNotebooks}`;
content = content.replace(tlbOld, tlbNew);

const nbBarOld = `        onDeleteNotebook={handleDeleteNotebook}
            onRestoreNotebooks={handleRestoreNotebooks}
      />`;
const nbBarNew = `        onDeleteNotebook={handleDeleteNotebook}
        onRestoreNotebooks={handleRestoreNotebooks}
        onRenameNotebook={handleRenameNotebook}
      />`;
content = content.replace(nbBarOld, nbBarNew);

fs.writeFileSync('src/App.tsx', content);

