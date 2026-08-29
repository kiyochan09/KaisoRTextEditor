import { Notebook, TreeNode, TagItem, TabFolder, SentenceBookmark } from '../types';

export const INITIAL_SENTENCE_BOOKMARKS: SentenceBookmark[] = [
  {
    id: 'sbm-sample-1',
    nodeId: 'rec-vegetable',
    notebookId: 'recipes',
    noteTitle: 'Chunky Vegetable Soup ⭐',
    text: 'Although this is a hearty soup, laden with vegetables, it has a delicate flavour.',
    anchorId: 'sbm-anchor-soup-flavour',
    createdAt: '2026-08-25T10:30:00.000Z',
    color: '#f59e0b',
    comment: 'スープの風味に関する重要な解説',
  },
  {
    id: 'sbm-sample-2',
    nodeId: 'mf-bookmarks',
    notebookId: 'more-features',
    noteTitle: '⭐ Bookmarks',
    text: 'Capture bookmarks with webpage thumbnails: Ctrl+Shift+F7!',
    anchorId: 'sbm-anchor-bm-key',
    createdAt: '2026-08-26T14:15:00.000Z',
    color: '#3b82f6',
    comment: 'ショートカットキーの備忘録',
  },
  {
    id: 'sbm-sample-3',
    nodeId: 'feat-sheet-contacts',
    notebookId: 'features',
    noteTitle: 'Sample 2: Contacts',
    text: 'Interactive spreadsheet table with dynamic formulas, column formatting, and instant CSV export.',
    anchorId: 'sbm-anchor-sheet-feat',
    createdAt: '2026-08-27T08:45:00.000Z',
    color: '#10b981',
    comment: 'スプレッドシート機能の要約',
  },
];

export const INITIAL_TAB_FOLDERS: TabFolder[] = [
  {
    id: 'tf-guides',
    name: '📘 ガイド・仕様書',
    parentId: null,
    color: '#3b82f6',
  },
  {
    id: 'tf-lifestyle',
    name: '🌱 ライフ・ヘルス',
    parentId: null,
    color: '#10b981',
  },
  {
    id: 'tf-dev',
    name: '💻 開発・機能検証',
    parentId: null,
    color: '#8b5cf6',
  },
  {
    id: 'tf-dev-advanced',
    name: '🛠️ 応用機能・ツール',
    parentId: 'tf-dev', // Subfolder inside 'tf-dev' to showcase hierarchy!
    color: '#ec4899',
  },
];

export const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: 'boot-camp',
    name: '📘 操作ガイド',
    color: '#e0f2fe',
    bgClass: 'bg-sky-100 text-sky-900 border-sky-300',
    borderClass: 'border-t-sky-500',
    description: '初めての方向けチュートリアル・各エディタの使い方・ショートカット一覧',
    nodeIds: ['bc-intro', 'bc-shortcuts', 'bc-types-guide'],
    folderId: 'tf-guides',
  },
  {
    id: 'recipes',
    name: 'Recipes (料理)',
    color: '#e0f2fe',
    bgClass: 'bg-sky-100 text-sky-900 border-sky-300',
    borderClass: 'border-t-sky-500',
    description: 'Favorite culinary recipes, soups, desserts, and cooking guides',
    nodeIds: ['rec-root'],
    folderId: 'tf-lifestyle',
  },
  {
    id: 'health',
    name: 'Health (健康)',
    color: '#dcfce7',
    bgClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    borderClass: 'border-t-emerald-500',
    description: 'Health logs, workout routines, and nutrition plans',
    nodeIds: ['health-diet', 'health-fitness'],
    folderId: 'tf-lifestyle',
  },
  {
    id: 'features',
    name: 'Features (基本機能)',
    color: '#fef3c7',
    bgClass: 'bg-amber-100 text-amber-900 border-amber-300',
    borderClass: 'border-t-amber-500',
    description: 'Note types, RichView, Spreadsheet, Code, and Attachments',
    nodeIds: ['feat-types', 'feat-view'],
    folderId: 'tf-dev',
  },
  {
    id: 'programming',
    name: 'Programming (コード)',
    color: '#e0e7ff',
    bgClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    borderClass: 'border-t-indigo-500',
    description: 'Python, Flask, React, SQL, and algorithm snippets',
    nodeIds: ['prog-flask', 'prog-sql'],
    folderId: 'tf-dev',
  },
  {
    id: 'more-features',
    name: 'More Features (高度機能)',
    color: '#fce7f3',
    bgClass: 'bg-pink-100 text-pink-900 border-pink-300',
    borderClass: 'border-t-pink-500',
    description: 'Tags, Bookmarks, Clipper, Attachments, and Security',
    nodeIds: ['mf-security', 'mf-clipper', 'mf-tags', 'mf-bookmarks', 'mf-attachments', 'mf-samples'],
    folderId: 'tf-dev-advanced',
  },
];

export const INITIAL_TAGS: TagItem[] = [
  { id: 'tag-blue', name: 'Blue', color: '#3b82f6', icon: '🔹', count: 0 },
  { id: 'tag-bookmark', name: 'Bookmark', color: '#6366f1', icon: '🔖', count: 1 },
  { id: 'tag-cool', name: 'Cool', color: '#06b6d4', icon: '❄️', count: 1, parentId: 'tag-feature' },
  { id: 'tag-favorite', name: 'Favorite Recipes', color: '#ef4444', icon: '❤️', count: 3 },
  { id: 'tag-feature', name: 'Feature', color: '#10b981', icon: '🟩', count: 12 },
  { id: 'tag-high-priority', name: 'High priority', color: '#f97316', icon: '❗', count: 0 },
  { id: 'tag-highest-priority', name: 'Highest priority', color: '#dc2626', icon: '‼️', count: 0 },
  { id: 'tag-howto', name: 'How to', color: '#8b5cf6', icon: '💡', count: 24 },
  { id: 'tag-idea', name: 'Idea', color: '#eab308', icon: '💡', count: 2 },
  { id: 'tag-indigo', name: 'Indigo', color: '#4f46e5', icon: '🟣', count: 0 },
  { id: 'tag-info', name: 'Information', color: '#0ea5e9', icon: 'ℹ️', count: 6 },
  { id: 'tag-intro', name: 'Introduction', color: '#14b8a6', icon: '📘', count: 6 },
  { id: 'tag-medium', name: 'Medium priority', color: '#84cc16', icon: '〰️', count: 0 },
  { id: 'tag-orange', name: 'Orange', color: '#f97316', icon: '🔶', count: 0 },
  { id: 'tag-red', name: 'Red', color: '#ef4444', icon: '🔴', count: 1 },
  { id: 'tag-reminder', name: 'Reminder', color: '#ec4899', icon: '⏰', count: 0 },
  { id: 'tag-search', name: 'Search', color: '#3b82f6', icon: '🔍', count: 1 },
  { id: 'tag-special', name: 'Special', color: '#f59e0b', icon: '⭐', count: 2 },
  { id: 'tag-soups', name: 'Soups', color: '#f59e0b', icon: '🍲', count: 1 },
  { id: 'tag-start', name: 'Start', color: '#10b981', icon: '⭐', count: 1 },
  { id: 'tag-tools', name: 'Tools', color: '#64748b', icon: '🛠️', count: 3, parentId: 'tag-feature' },
];

export const INITIAL_NODES: Record<string, TreeNode> = {
  // Recipes Notebook
  'rec-root': {
    id: 'rec-root',
    notebookId: 'recipes',
    parentId: null,
    title: 'Favorite Recipes',
    type: 'rich',
    colorBadge: undefined,
    tags: ['Favorite Recipes'],
    created: '2012-11-20',
    updated: '2012-11-26',
    isFolder: true,
    children: ['rec-starters', 'rec-pizza', 'rec-soups', 'rec-fish', 'rec-meat', 'rec-desserts'],
    content: {
      richHtml: `<h2>Favorite Culinary Collection</h2><p>Organize your treasured family recipes, ingredients, and step-by-step cooking procedures.</p>`,
    },
  },
  'rec-starters': {
    id: 'rec-starters',
    notebookId: 'recipes',
    parentId: 'rec-root',
    title: 'Starters',
    type: 'rich',
    colorBadge: '#fb923c', // orange
    tags: ['Favorite Recipes'],
    created: '2012-11-21',
    updated: '2012-11-22',
    isFolder: true,
    children: ['rec-artichoke', 'rec-asparagus', 'rec-avocado'],
    content: {
      richHtml: `<h3>Appetizers & Starters</h3><p>Light dishes served before the main course.</p>`,
    },
  },
  'rec-artichoke': {
    id: 'rec-artichoke',
    notebookId: 'recipes',
    parentId: 'rec-starters',
    title: 'Artichokes in Cheese Sauce',
    type: 'rich',
    tags: ['Favorite Recipes'],
    created: '2012-11-21',
    updated: '2012-11-21',
    content: {
      richHtml: `<h3>Artichokes in Cheese Sauce</h3><p>Tender steamed artichoke hearts served with a rich, velvety gruyère cheese sauce.</p>`,
    },
  },
  'rec-asparagus': {
    id: 'rec-asparagus',
    notebookId: 'recipes',
    parentId: 'rec-starters',
    title: 'Asparagus Loaf',
    type: 'rich',
    tags: ['Favorite Recipes'],
    created: '2012-11-22',
    updated: '2012-11-22',
    content: {
      richHtml: `<h3>Asparagus Loaf</h3><p>A delicate savory baked terrine featuring fresh green asparagus and ricotta.</p>`,
    },
  },
  'rec-avocado': {
    id: 'rec-avocado',
    notebookId: 'recipes',
    parentId: 'rec-starters',
    title: 'Avocado Dip',
    type: 'rich',
    tags: ['Favorite Recipes'],
    created: '2012-11-22',
    updated: '2012-11-22',
    content: {
      richHtml: `<h3>Avocado Dip (Guacamole style)</h3><p>Fresh crushed Hass avocado with lime, coriander, and sea salt.</p>`,
    },
  },
  'rec-pizza': {
    id: 'rec-pizza',
    notebookId: 'recipes',
    parentId: 'rec-root',
    title: 'Pizza and Pasta',
    type: 'rich',
    colorBadge: '#c084fc', // purple
    tags: ['Favorite Recipes'],
    created: '2012-11-23',
    updated: '2012-11-23',
    isFolder: true,
    children: ['rec-lasagne', 'rec-panpizza', 'rec-noodles'],
    content: {
      richHtml: `<h3>Pizza and Pasta Creations</h3>`,
    },
  },
  'rec-lasagne': {
    id: 'rec-lasagne',
    notebookId: 'recipes',
    parentId: 'rec-pizza',
    title: 'Easy Tuna Lasagne',
    type: 'rich',
    tags: ['Favorite Recipes'],
    created: '2012-11-23',
    updated: '2012-11-23',
    content: {
      richHtml: `<h3>Easy Tuna Lasagne</h3><p>Layered pasta sheets with sustainably caught tuna, tomato marinara, and béchamel sauce.</p>`,
    },
  },
  'rec-panpizza': {
    id: 'rec-panpizza',
    notebookId: 'recipes',
    parentId: 'rec-pizza',
    title: 'Pan Pizza',
    type: 'rich',
    tags: ['Favorite Recipes'],
    created: '2012-11-23',
    updated: '2012-11-23',
    content: {
      richHtml: `<h3>Crispy Cast-Iron Pan Pizza</h3><p>Golden crust with homemade San Marzano tomato sauce, buffalo mozzarella, and fresh basil.</p>`,
    },
  },
  'rec-noodles': {
    id: 'rec-noodles',
    notebookId: 'recipes',
    parentId: 'rec-pizza',
    title: 'Stir Fry Noodles',
    type: 'rich',
    tags: ['Favorite Recipes'],
    created: '2012-11-23',
    updated: '2012-11-23',
    content: {
      richHtml: `<h3>Wok Stir-Fry Noodles</h3><p>Egg noodles tossed with crunchy vegetables, sesame oil, and dark soy sauce.</p>`,
    },
  },
  'rec-soups': {
    id: 'rec-soups',
    notebookId: 'recipes',
    parentId: 'rec-root',
    title: 'Soups',
    type: 'rich',
    colorBadge: '#fde047', // yellow
    icon: '💡 ⭐',
    tags: ['Favorite Recipes', 'Soups'],
    created: '2012-11-24',
    updated: '2012-11-26',
    isFolder: true,
    children: ['rec-gazpacho', 'rec-marrow', 'rec-vegetable', 'rec-potatospinach'],
    content: {
      richHtml: `<h3>Nutritious & Comforting Soups</h3><p>Explore warm and chilled soup recipes for every season.</p>`,
    },
  },
  'rec-gazpacho': {
    id: 'rec-gazpacho',
    notebookId: 'recipes',
    parentId: 'rec-soups',
    title: 'Gazpacho',
    type: 'rich',
    tags: ['Favorite Recipes', 'Soups'],
    created: '2012-11-24',
    updated: '2012-11-24',
    content: {
      richHtml: `<h3>Chilled Andalusian Gazpacho</h3><p>Refreshing raw summer soup made of ripe tomatoes, cucumber, bell pepper, garlic, and extra virgin olive oil.</p>`,
    },
  },
  'rec-marrow': {
    id: 'rec-marrow',
    notebookId: 'recipes',
    parentId: 'rec-soups',
    title: 'Baby Marrow Soup ⭐',
    type: 'rich',
    tags: ['Favorite Recipes', 'Soups', 'Special'],
    created: '2012-11-25',
    updated: '2012-11-25',
    content: {
      richHtml: `<h3>Creamy Baby Marrow & Thyme Soup</h3><p>Silky zucchini soup blended with fresh herbs and a swirl of cream.</p>`,
    },
  },
  'rec-vegetable': {
    id: 'rec-vegetable',
    notebookId: 'recipes',
    parentId: 'rec-soups',
    title: 'Chunky Vegetable Soup ⭐',
    type: 'rich',
    colorBadge: '#ef4444',
    isBookmarked: true,
    bookmarkedAt: '2026-08-20',
    tags: ['Favorite Recipes', 'Red', 'Soups'],
    created: '2012-11-26',
    updated: '2012-11-26',
    content: {
      richHtml: `
        <h1 class="text-2xl font-bold text-slate-900 mb-2">Chunky vegetable soup</h1>
        <div class="text-sm font-medium text-blue-600 mb-4 flex items-center space-x-3">
          <a href="#" class="underline hover:text-blue-800">Review it</a>
          <span>|</span>
          <a href="#" class="underline hover:text-blue-800">Read (2)</a>
          <span>|</span>
          <span class="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-xs">Easy</span>
        </div>

        <div class="my-4 relative rounded-lg overflow-hidden border border-slate-200 shadow-sm max-w-md">
          <img src="https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80" alt="Chunky Vegetable Soup" class="w-full h-56 object-cover" />
          <div class="absolute top-3 right-3 bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-lg text-xs max-w-xs shadow-md">
            <strong class="block font-semibold mb-1">"Folder Tree" feature</strong>
            Get a bird's eye-view of and easily navigate large trees across notebooks...
          </div>
        </div>

        <p class="text-slate-800 leading-relaxed mb-3">
          Although this is a hearty soup, laden with vegetables, it has a delicate flavour. Home-made stock is best<sup class="footnote-ref select-none" data-fn-id="fn-stock" data-fn-text="自家製ブイヨンの作り方: セロリ、玉ねぎ、人参、ローリエを弱火で45分煮出した黄金色のスープベース。"><a href="#cite_note-fn-stock" id="cite_ref-fn-stock" class="footnote-anchor text-blue-600 font-bold hover:underline cursor-pointer px-0.5 select-none">[1]</a></sup>, but you can use a good-quality bought stock (chilled or from a cube or powder); if using a cube or powder, do not add additional salt at the beginning of cooking as you may find these products provide 
          <a href="#" class="text-blue-600 font-medium hover:underline">...See more</a>
        </p>

        <div class="bg-slate-50 border-l-4 border-amber-400 p-3 rounded-r text-sm text-slate-700 mt-4">
          <strong>Ingredients Highlight:</strong>
          <ul class="list-disc pl-5 mt-1 space-y-0.5">
            <li>2 large carrots, diced into 1cm chunks</li>
            <li>2 stalks celery, sliced</li>
            <li>1 medium leek, washed and sliced</li>
            <li>2 potatoes (russet or yukon gold<sup class="footnote-ref select-none" data-fn-id="fn-potato" data-fn-text="煮崩れしにくくスープのコクを高めるデンプン質の品種推奨。"><a href="#cite_note-fn-potato" id="cite_ref-fn-potato" class="footnote-anchor text-blue-600 font-bold hover:underline cursor-pointer px-0.5 select-none">[2]</a></sup>), peeled and cubed</li>
            <li>1 cup sweet corn kernels</li>
            <li>1.2L organic vegetable stock</li>
            <li>Fresh rosemary and thyme sprigs<sup class="footnote-ref select-none" data-fn-id="fn-herbs" data-fn-text="ハーブガイド: https://example.com/herbs-culinary-guide (フレンチ伝統技法)"><a href="#cite_note-fn-herbs" id="cite_ref-fn-herbs" class="footnote-anchor text-blue-600 font-bold hover:underline cursor-pointer px-0.5 select-none">[3]</a></sup></li>
          </ul>
        </div>
      `,
    },
  },
  'rec-potatospinach': {
    id: 'rec-potatospinach',
    notebookId: 'recipes',
    parentId: 'rec-soups',
    title: 'Potato, Spinach and Mushroom Soup',
    type: 'rich',
    tags: ['Favorite Recipes', 'Soups'],
    created: '2012-11-26',
    updated: '2012-11-26',
    content: {
      richHtml: `<h3>Potato, Spinach and Mushroom Soup</h3><p>Earthy cremini mushrooms paired with baby spinach and velvety potato broth.</p>`,
    },
  },
  'rec-fish': {
    id: 'rec-fish',
    notebookId: 'recipes',
    parentId: 'rec-root',
    title: 'Fish meals',
    type: 'rich',
    colorBadge: '#86efac', // green
    tags: ['Favorite Recipes'],
    created: '2012-11-27',
    updated: '2012-11-27',
    isFolder: true,
    children: ['rec-fishpie', 'rec-fishballs', 'rec-fishmayo'],
    content: {
      richHtml: `<h3>Fresh Seafood & Fish Recipes</h3>`,
    },
  },
  'rec-fishpie': {
    id: 'rec-fishpie',
    notebookId: 'recipes',
    parentId: 'rec-fish',
    title: 'Creamy Fish Pie',
    type: 'rich',
    tags: ['Favorite Recipes'],
    created: '2012-11-27',
    updated: '2012-11-27',
    content: {
      richHtml: `<h3>Traditional British Creamy Fish Pie</h3><p>Salmon, smoked haddock, and prawns in a creamy dill sauce topped with mashed potato.</p>`,
    },
  },
  'rec-fishballs': {
    id: 'rec-fishballs',
    notebookId: 'recipes',
    parentId: 'rec-fish',
    title: 'Dilled Fish Balls',
    type: 'rich',
    tags: ['Favorite Recipes'],
    created: '2012-11-27',
    updated: '2012-11-27',
    content: {
      richHtml: `<h3>Scandinavian Dilled Fish Quenelles</h3>`,
    },
  },
  'rec-fishmayo': {
    id: 'rec-fishmayo',
    notebookId: 'recipes',
    parentId: 'rec-fish',
    title: 'Fish and Mayonnaise',
    type: 'rich',
    tags: ['Favorite Recipes'],
    created: '2012-11-27',
    updated: '2012-11-27',
    content: {
      richHtml: `<h3>Cold Poached Salmon with Lemon Mayonnaise</h3>`,
    },
  },
  'rec-meat': {
    id: 'rec-meat',
    notebookId: 'recipes',
    parentId: 'rec-root',
    title: 'Meat meals',
    type: 'rich',
    colorBadge: '#67e8f9', // cyan
    tags: ['Favorite Recipes'],
    created: '2012-11-28',
    updated: '2012-11-28',
    isFolder: true,
    children: [],
    content: {
      richHtml: `<h3>Hearty Meat & Poultry Dishes</h3><p>Beef bourguignon, roast chicken, and lamb shanks.</p>`,
    },
  },
  'rec-desserts': {
    id: 'rec-desserts',
    notebookId: 'recipes',
    parentId: 'rec-root',
    title: 'Desserts',
    type: 'rich',
    colorBadge: '#f472b6', // pink
    tags: ['Favorite Recipes'],
    created: '2012-11-28',
    updated: '2012-11-28',
    isFolder: true,
    children: [],
    content: {
      richHtml: `<h3>Sweet Pastries, Tarts, and Cakes</h3>`,
    },
  },

  // Features Notebook
  'feat-types': {
    id: 'feat-types',
    notebookId: 'features',
    parentId: null,
    title: 'Note types',
    type: 'rich',
    isFolder: true,
    tags: ['Feature', 'Introduction'],
    created: '2010-12-25',
    updated: '2010-12-27',
    children: ['feat-richview', 'feat-spreadsheet', 'feat-code', 'feat-attachments', 'feat-webpage'],
    content: {
      richHtml: `<h2>Multiple Note Types in One App</h2><p>Hierarchical organization supports rich text documents, interactive spreadsheets, source code syntax editors, web bookmarks, and file attachments.</p>`,
    },
  },
  'feat-richview': {
    id: 'feat-richview',
    notebookId: 'features',
    parentId: 'feat-types',
    title: '🔴 The RichView note type',
    type: 'rich',
    tags: ['Feature', 'How to'],
    created: '2010-12-26',
    updated: '2010-12-26',
    isFolder: true,
    children: ['feat-rv-styles', 'feat-rv-para', 'feat-rv-palettes', 'feat-rv-links'],
    content: {
      richHtml: `<h3>The RichView WYSIWYG Note Type</h3><p>Full rich text editing with font families, sizes, bold, italic, underline, custom text & background colors, table insertion, images, and embedded hyperlinks.</p>`,
    },
  },
  'feat-rv-styles': {
    id: 'feat-rv-styles',
    notebookId: 'features',
    parentId: 'feat-richview',
    title: 'Predefined text styles',
    type: 'rich',
    tags: ['Feature'],
    created: '2010-12-26',
    updated: '2010-12-26',
    content: {
      richHtml: `<p>Configure quick-access styles for Headings, Body, Code Spans, and Quote callouts.</p>`,
    },
  },
  'feat-rv-para': {
    id: 'feat-rv-para',
    notebookId: 'features',
    parentId: 'feat-richview',
    title: 'Predefined paragraph styles',
    type: 'rich',
    tags: ['Feature'],
    created: '2010-12-26',
    updated: '2010-12-26',
    content: {
      richHtml: `<p>Set up paragraph margins, indents, line-heights, and bullet/numbered formatting.</p>`,
    },
  },
  'feat-rv-palettes': {
    id: 'feat-rv-palettes',
    notebookId: 'features',
    parentId: 'feat-richview',
    title: 'Color palettes',
    type: 'rich',
    tags: ['Feature'],
    created: '2010-12-26',
    updated: '2010-12-26',
    content: {
      richHtml: `<p>Choose from harmonic color palettes for high readability notes.</p>`,
    },
  },
  'feat-rv-links': {
    id: 'feat-rv-links',
    notebookId: 'features',
    parentId: 'feat-richview',
    title: 'How do I create a link to another note?',
    type: 'rich',
    tags: ['Feature', 'How to'],
    created: '2010-12-26',
    updated: '2010-12-26',
    content: {
      richHtml: `<p>Use <code>[[Note Title]]</code> syntax or the Link tool in the editor toolbar to interlink pages across the tree hierarchy.</p>`,
    },
  },
  'feat-spreadsheet': {
    id: 'feat-spreadsheet',
    notebookId: 'features',
    parentId: 'feat-types',
    title: '🟠 The Spreadsheet note type',
    type: 'spreadsheet',
    tags: ['Feature', 'Tools'],
    created: '2010-12-27',
    updated: '2010-12-27',
    isFolder: true,
    children: ['feat-sheet-accounts', 'feat-sheet-contacts'],
    content: {
      spreadsheet: {
        hasHeaderRow: true,
        lockHeader: true,
        headers: ['A', 'B', 'C', 'D', 'E'],
        rows: [
          [
            { value: 'Item', style: { bold: true } },
            { value: 'Category', style: { bold: true } },
            { value: 'Cost', style: { bold: true } },
            { value: 'Qty', style: { bold: true } },
            { value: 'Total', style: { bold: true } },
          ],
          [{ value: 'Server Cloud Host' }, { value: 'Infrastructure' }, { value: '120' }, { value: '1' }, { value: '120' }],
          [{ value: 'Database Storage' }, { value: 'Infrastructure' }, { value: '45' }, { value: '2' }, { value: '90' }],
          [{ value: 'Domain & SSL' }, { value: 'Security' }, { value: '25' }, { value: '1' }, { value: '25' }],
          [{ value: 'Backup Redundancy' }, { value: 'Operations' }, { value: '35' }, { value: '1' }, { value: '35' }],
        ],
      },
    },
  },
  'feat-sheet-accounts': {
    id: 'feat-sheet-accounts',
    notebookId: 'features',
    parentId: 'feat-spreadsheet',
    title: 'Sample 1: Accounts 2007',
    type: 'spreadsheet',
    tags: ['Feature', 'Tools'],
    created: '2010-12-27',
    updated: '2010-12-27',
    content: {
      spreadsheet: {
        hasHeaderRow: true,
        lockHeader: true,
        headers: ['A', 'B', 'C', 'D', 'E'],
        rows: [
          [
            { value: 'Quarter', style: { bold: true } },
            { value: 'Revenue ($)', style: { bold: true } },
            { value: 'Expenses ($)', style: { bold: true } },
            { value: 'Net Profit ($)', style: { bold: true } },
            { value: 'Growth', style: { bold: true } },
          ],
          [{ value: 'Q1' }, { value: '45000' }, { value: '28000' }, { value: '17000' }, { value: '+12%' }],
          [{ value: 'Q2' }, { value: '52000' }, { value: '31000' }, { value: '21000' }, { value: '+15%' }],
          [{ value: 'Q3' }, { value: '61000' }, { value: '34000' }, { value: '27000' }, { value: '+17%' }],
          [{ value: 'Q4' }, { value: '78000' }, { value: '40000' }, { value: '38000' }, { value: '+28%' }],
        ],
      },
    },
  },
  'feat-sheet-contacts': {
    id: 'feat-sheet-contacts',
    notebookId: 'features',
    parentId: 'feat-spreadsheet',
    title: 'Sample 2: Contacts',
    type: 'spreadsheet',
    tags: ['Feature', 'Cool', 'Tools'],
    created: '2010-12-27',
    updated: '2010-12-27',
    content: {
      spreadsheet: {
        hasHeaderRow: true,
        lockHeader: true,
        headers: ['A', 'B', 'C', 'D', 'E'],
        rows: [
          [
            { value: 'First Name', style: { bold: true } },
            { value: 'Last Name', style: { bold: true } },
            { value: 'Home Number', style: { bold: true } },
            { value: 'Cell Number', style: { bold: true } },
            { value: 'Status', style: { bold: true } },
          ],
          [{ value: 'George' }, { value: 'Bailey' }, { value: '011-485-1234' }, { value: '0820000900' }, { value: 'Active' }],
          [{ value: 'Gillian' }, { value: 'Barne' }, { value: '011-485-0129' }, { value: '0820000007' }, { value: 'Active' }],
          [{ value: 'Dennis' }, { value: 'Bentley' }, { value: '011-485-0200' }, { value: '0820000089' }, { value: 'Pending' }],
          [{ value: 'Donald' }, { value: 'Beuwick' }, { value: '011-485-0165' }, { value: '0820000043' }, { value: 'Active' }],
          [{ value: 'Daniel' }, { value: 'Bilde' }, { value: '011-485-0134' }, { value: '0820000012' }, { value: 'Active' }],
          [{ value: 'John' }, { value: 'Bush' }, { value: '011-485-0123' }, { value: '0820000001' }, { value: 'Inactive' }],
          [{ value: 'Joel' }, { value: 'Cerebro' }, { value: '011-485-0164' }, { value: '0820000042' }, { value: 'Active' }],
          [{ value: 'Mary' }, { value: 'Clark' }, { value: '011-485-0136' }, { value: '0820000014' }, { value: 'Active' }],
          [{ value: 'Jason' }, { value: 'Coleman' }, { value: '011-485-0167' }, { value: '0820000045' }, { value: 'Active' }],
          [{ value: 'Hilary' }, { value: 'Davis' }, { value: '011-485-0124' }, { value: '0820000002' }, { value: 'Active' }],
          [{ value: 'Nancy' }, { value: 'Druin' }, { value: '011-485-0132' }, { value: '0820000010' }, { value: 'Pending' }],
          [{ value: 'Tom' }, { value: 'Ford' }, { value: '011-485-0151' }, { value: '0820000029' }, { value: 'Active' }],
          [{ value: 'Bruce' }, { value: 'Fordyce' }, { value: '011-485-0140' }, { value: '0820000018' }, { value: 'Active' }],
          [{ value: 'Richard' }, { value: 'Getz' }, { value: '011-485-0155' }, { value: '0820000033' }, { value: 'Active' }],
          [{ value: 'Tracy' }, { value: 'Gordon' }, { value: '011-485-0128' }, { value: '0820000006' }, { value: 'Active' }],
          [{ value: 'Edwin' }, { value: 'Gore' }, { value: '011-485-0144' }, { value: '0820000022' }, { value: 'Inactive' }],
          [{ value: 'Ruth' }, { value: 'Green' }, { value: '011-485-0149' }, { value: '0820000027' }, { value: 'Active' }],
          [{ value: 'Eric' }, { value: 'Green' }, { value: '011-485-0150' }, { value: '0820000028' }, { value: 'Active' }],
          [{ value: 'Tim' }, { value: 'Hardings' }, { value: '011-485-0143' }, { value: '0820000021' }, { value: 'Active' }],
          [{ value: 'Terry' }, { value: 'Hill' }, { value: '011-485-0152' }, { value: '0820000030' }, { value: 'Active' }],
          [{ value: 'Sam' }, { value: 'Hughes' }, { value: '011-485-0145' }, { value: '0820000023' }, { value: 'Active' }],
          [{ value: 'Debra' }, { value: 'Hughes' }, { value: '011-485-0146' }, { value: '0820000024' }, { value: 'Active' }],
          [{ value: 'Neville' }, { value: 'Hyde' }, { value: '011-485-0139' }, { value: '0820000017' }, { value: 'Pending' }],
          [{ value: 'Colin' }, { value: 'Jenks' }, { value: '011-485-0147' }, { value: '0820000025' }, { value: 'Active' }],
          [{ value: 'Michael' }, { value: 'Keating' }, { value: '011-485-0160' }, { value: '0820000038' }, { value: 'Active' }],
        ],
      },
    },
  },
  'feat-code': {
    id: 'feat-code',
    notebookId: 'features',
    parentId: 'feat-types',
    title: '🟡 The Source Code note type',
    type: 'code',
    tags: ['Feature', 'Tools'],
    created: '2010-12-28',
    updated: '2010-12-28',
    isFolder: true,
    children: ['feat-code-csharp', 'feat-code-python', 'feat-code-xml'],
    content: {
      code: {
        language: 'python',
        code: `# Flask Hierarchical Tree & Node API Server
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hierarchical_notes.db'
db = SQLAlchemy(app)

class Node(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    parent_id = db.Column(db.String(36), db.ForeignKey('node.id'), nullable=True)
    note_type = db.Column(db.String(32), default='rich')
    content_html = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

@app.route('/api/nodes', methods=['GET'])
def list_nodes():
    nodes = Node.query.all()
    return jsonify([{'id': n.id, 'title': n.title, 'type': n.note_type} for n in nodes])

if __name__ == '__main__':
    app.run(debug=True, port=5000)
`,
      },
    },
  },
  'feat-code-csharp': {
    id: 'feat-code-csharp',
    notebookId: 'features',
    parentId: 'feat-code',
    title: 'Sample 1: C#',
    type: 'code',
    tags: ['Feature'],
    created: '2010-12-28',
    updated: '2010-12-28',
    content: {
      code: {
        language: 'csharp',
        code: `using System;
using System.Collections.Generic;

public class HierarchicalNode<T>
{
    public string Id { get; set; }
    public string Title { get; set; }
    public T Value { get; set; }
    public List<HierarchicalNode<T>> Children { get; } = new List<HierarchicalNode<T>>();
}
`,
      },
    },
  },
  'feat-code-python': {
    id: 'feat-code-python',
    notebookId: 'features',
    parentId: 'feat-code',
    title: 'Sample 2: Python / Flask',
    type: 'code',
    tags: ['Feature'],
    created: '2010-12-28',
    updated: '2010-12-28',
    content: {
      code: {
        language: 'python',
        code: `def build_tree_hierarchy(nodes_list, parent_id=None):
    tree = []
    for node in nodes_list:
        if node.get('parent_id') == parent_id:
            children = build_tree_hierarchy(nodes_list, node.get('id'))
            node_copy = dict(node)
            if children:
                node_copy['children'] = children
            tree.append(node_copy)
    return tree
`,
      },
    },
  },
  'feat-code-xml': {
    id: 'feat-code-xml',
    notebookId: 'features',
    parentId: 'feat-code',
    title: 'Sample 3: XML Schema',
    type: 'code',
    tags: ['Feature'],
    created: '2010-12-28',
    updated: '2010-12-28',
    content: {
      code: {
        language: 'xml',
        code: `<?xml version="1.0" encoding="utf-8"?>
<Notebook id="nb-01" name="Features">
  <Node id="node-01" type="RichView" title="Introduction">
    <Content><![CDATA[<p>Welcome to Hierarchical Notes</p>]]></Content>
    <Tags><Tag>Feature</Tag><Tag>How to</Tag></Tags>
  </Node>
</Notebook>
`,
      },
    },
  },
  'feat-attachments': {
    id: 'feat-attachments',
    notebookId: 'features',
    parentId: 'feat-types',
    title: '🟢 Attachments or Links',
    type: 'rich',
    tags: ['Feature', 'Tools'],
    created: '2010-12-29',
    updated: '2010-12-29',
    content: {
      richHtml: `<h3>File Attachments & Deep Linking</h3><p>Attach local files, documents, PDF specifications, images, and external web URLs directly to any hierarchical tree node.</p>`,
    },
  },
  'feat-webpage': {
    id: 'feat-webpage',
    notebookId: 'features',
    parentId: 'feat-types',
    title: '🔵 Webpage note type',
    type: 'bookmark',
    tags: ['Feature', 'Bookmark'],
    created: '2010-12-29',
    updated: '2010-12-29',
    content: {
      bookmarks: [
        {
          id: 'bm-flask',
          title: 'Flask - Python Web Framework Documentation',
          url: 'https://flask.palletsprojects.com/',
          visitedOn: '2026-08-25 10:15 AM',
          notes: 'Official Flask documentation covering blueprints, application factory, request contexts, and WSGI deployment.',
          thumbnailUrl: 'https://flask.palletsprojects.com/en/stable/_images/flask-horizontal.png',
        },
      ],
    },
  },
  'feat-view': {
    id: 'feat-view',
    notebookId: 'features',
    parentId: null,
    title: 'The Resource Panel',
    type: 'rich',
    isFolder: true,
    tags: ['Feature', 'Tools'],
    created: '2010-12-29',
    updated: '2010-12-29',
    children: [],
    content: {
      richHtml: `<h3>Resource Panel: Search, Tags, History, Scratch</h3><p>Manage keywords, drilldown with auto-suggest tag search, view navigation history, and keep instant scratch notes.</p>`,
    },
  },

  // More Features Notebook
  'mf-security': {
    id: 'mf-security',
    notebookId: 'more-features',
    parentId: null,
    title: '🔒 Protecting private information',
    type: 'encrypted',
    isLocked: true,
    isEncrypted: true,
    password: 'password123',
    tags: ['Special'],
    created: '2010-12-28',
    updated: '2010-12-28',
    content: {
      plainText: `Sensitive credentials, API keys, and personal journal notes are securely encrypted. Only accessible after unlocking with the master passphrase.`,
    },
  },
  'mf-clipper': {
    id: 'mf-clipper',
    notebookId: 'more-features',
    parentId: null,
    title: '📁 Clipper',
    type: 'rich',
    isFolder: true,
    tags: ['Feature', 'Tools'],
    created: '2010-12-28',
    updated: '2010-12-28',
    children: ['mf-clip-iso', 'mf-clip-forum', 'mf-clip-ado'],
    content: {
      richHtml: `<h3>Web Clipper & Snippets</h3><p>Capture web articles, code snippets, and forum posts directly into your notebooks.</p>`,
    },
  },
  'mf-clip-iso': {
    id: 'mf-clip-iso',
    notebookId: 'more-features',
    parentId: 'mf-clipper',
    title: 'Sample: ISO/IEC 8859-1 - Wikipedia',
    type: 'rich',
    tags: ['Information'],
    created: '2010-12-28',
    updated: '2010-12-28',
    content: {
      richHtml: `<h3>ISO/IEC 8859-1 Standard</h3><p>ISO/IEC 8859-1:1998, Information technology — 8-bit single-byte coded graphic character sets — Part 1: Latin alphabet No. 1, is part of the ISO/IEC 8859 series of ASCII-based standard character encodings.</p>`,
    },
  },
  'mf-clip-forum': {
    id: 'mf-clip-forum',
    notebookId: 'more-features',
    parentId: 'mf-clipper',
    title: 'Sample: Soft Gems forum :: View topic',
    type: 'rich',
    tags: ['Information'],
    created: '2010-12-28',
    updated: '2010-12-28',
    content: {
      richHtml: `<h3>Discussion on Virtual Treeview Performance</h3><p>Tips for handling over 100,000 nodes with smooth 60fps scrolling and instant search indexing.</p>`,
    },
  },
  'mf-clip-ado': {
    id: 'mf-clip-ado',
    notebookId: 'more-features',
    parentId: 'mf-clipper',
    title: 'Sample: Using ADO.NET for beginner',
    type: 'rich',
    tags: ['Information'],
    created: '2010-12-28',
    updated: '2010-12-28',
    content: {
      richHtml: `<h3>Database Connection Best Practices</h3><p>Connection pooling, parameterized queries, and transactional integrity.</p>`,
    },
  },
  'mf-tags': {
    id: 'mf-tags',
    notebookId: 'more-features',
    parentId: null,
    title: '🏷️ Tags',
    type: 'rich',
    isFolder: true,
    tags: ['Feature', 'How to', 'Search'],
    created: '2010-12-28',
    updated: '2010-12-28',
    children: ['mf-tag-add', 'mf-tag-view', 'mf-tag-search', 'mf-tag-assign'],
    content: {
      richHtml: `<h3>Flexible Tagging Engine</h3><p>Categorize notes across different branches of the tree with single or multiple tags.</p>`,
    },
  },
  'mf-tag-add': {
    id: 'mf-tag-add',
    notebookId: 'more-features',
    parentId: 'mf-tags',
    title: 'How do I add a tag to a note?',
    type: 'rich',
    tags: ['How to', 'Feature'],
    created: '2010-12-28',
    updated: '2010-12-28',
    content: {
      richHtml: `<p>Click on the <strong>Tags bar</strong> at the bottom of the editor or open the Resource Panel (F9) and click on the desired tag checkbox to assign it.</p>`,
    },
  },
  'mf-tag-view': {
    id: 'mf-tag-view',
    notebookId: 'more-features',
    parentId: 'mf-tags',
    title: 'How do I see the tags that have been assigned?',
    type: 'rich',
    tags: ['How to', 'Feature'],
    created: '2010-12-28',
    updated: '2010-12-28',
    content: {
      richHtml: `<p>Assigned tags are displayed clearly in the bottom status tag bar with star ratings and color badges.</p>`,
    },
  },
  'mf-tag-search': {
    id: 'mf-tag-search',
    notebookId: 'more-features',
    parentId: 'mf-tags',
    title: 'How do I search for a tag?',
    type: 'rich',
    tags: ['Feature', 'How to', 'Search'],
    created: '2010-12-28',
    updated: '2010-12-28',
    content: {
      richHtml: `
        <h1 class="text-xl font-bold text-slate-900 mb-2">How do I search for a tag?</h1>
        <p class="text-slate-800 leading-relaxed mb-4">
          The <strong>Tag search</strong> is unique (and powerful) in that as you search for one tag, at the same time you are shown a list of other tags that are found together with the first one. By clicking on one of these other tags (in the tag search tree, shown in the resource panel), you can find notes matching the first tag plus the second tag... and so on:
        </p>

        <p class="text-slate-800 leading-relaxed mb-3">
          Go to the <strong>Tags</strong> page of the Resource Panel (F9).<br/>
          Type in a tag in the edit box on the top right half part of the panel. As you type, a drop down list shows existing tags with the same letters (that you have typed so far...). To select a tag from this list, using the mouse: click on the tag in the drop down list, or using the keyboard: press the down arrow to select the item from the list - then press Enter. Otherwise finish typing in the tag and then press Enter:
        </p>

        <div class="p-3 bg-slate-100 border border-slate-300 rounded-lg max-w-sm my-3 shadow-inner">
          <div class="text-xs font-semibold text-slate-600 mb-2">Tag Auto-Complete Filter:</div>
          <div class="flex items-center space-x-2 bg-white border border-blue-400 p-1.5 rounded">
            <span class="text-xs font-mono font-bold text-blue-600">In</span>
            <span class="text-xs text-slate-400">|</span>
          </div>
          <div class="mt-1.5 bg-white border border-slate-200 rounded shadow-sm text-xs divide-y divide-slate-100">
            <div class="p-1.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between font-medium text-slate-800">
              <span>Indigo</span>
              <span class="text-slate-400 text-[10px]">(0)</span>
            </div>
            <div class="p-1.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between font-medium text-slate-800">
              <span>Information</span>
              <span class="text-slate-400 text-[10px]">(6)</span>
            </div>
            <div class="p-1.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between font-medium text-slate-800">
              <span>Reminder</span>
              <span class="text-slate-400 text-[10px]">(0)</span>
            </div>
            <div class="p-1.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between font-medium text-slate-800">
              <span>Warning</span>
              <span class="text-slate-400 text-[10px]">(1)</span>
            </div>
          </div>
        </div>
      `,
    },
  },
  'mf-tag-assign': {
    id: 'mf-tag-assign',
    notebookId: 'more-features',
    parentId: 'mf-tags',
    title: 'How do I assign an image to a tag?',
    type: 'rich',
    tags: ['How to'],
    created: '2010-12-28',
    updated: '2010-12-28',
    content: {
      richHtml: `<p>In the Tag Properties dialog, you can select custom icons and color swatches for any tag.</p>`,
    },
  },
  'mf-bookmarks': {
    id: 'mf-bookmarks',
    notebookId: 'more-features',
    parentId: null,
    title: '⭐ Bookmarks',
    type: 'bookmark',
    isBookmarked: true,
    bookmarkedAt: '2026-08-21',
    tags: ['Special', 'Bookmark'],
    created: '2012-01-04',
    updated: '2012-01-04',
    content: {
      richHtml: `
        <div class="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-lg text-xs max-w-sm mb-4 shadow-sm">
          <strong>Capture bookmarks with webpage thumbnails: Ctrl+Shift+F7!</strong>
        </div>
        <p class="text-slate-800 mb-4 text-sm">When you are browsing a webpage, you can click on the global bookmark capture to import a bookmark of the current webpage into the active notebook:</p>
      `,
      bookmarks: [
        {
          id: 'bm-bauerapps',
          title: 'BauerApps - Home of Compare Advance and RightNote',
          url: 'http://www.bauerapps.com/',
          visitedOn: '4 January 2012 5:29 PM',
          notes: 'Official development portal for tree-based note organization tools.',
          thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'bm-wiki',
          title: 'Wikipedia, the free encyclopedia',
          url: 'http://www.wikipedia.org/',
          visitedOn: '4 January 2012 5:31 PM',
          notes: 'Multilingual free online encyclopedia written and maintained by a community of volunteers.',
          thumbnailUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=400&q=80',
        },
      ],
    },
  },
  'mf-attachments': {
    id: 'mf-attachments',
    notebookId: 'more-features',
    parentId: null,
    title: '📎 Attachments and Links to ext...',
    type: 'rich',
    isFolder: true,
    tags: ['Tools'],
    created: '2011-01-10',
    updated: '2011-01-10',
    children: ['mf-att-calc', 'mf-att-notepad'],
    content: {
      richHtml: `<h3>External Applications & Documents</h3><p>Manage shortcuts and launches to desktop utilities.</p>`,
    },
  },
  'mf-att-calc': {
    id: 'mf-att-calc',
    notebookId: 'more-features',
    parentId: 'mf-attachments',
    title: 'calc.exe',
    type: 'rich',
    tags: ['Tools'],
    created: '2011-01-10',
    updated: '2011-01-10',
    content: {
      richHtml: `<p>Shortcut link to system calculation utility.</p>`,
    },
  },
  'mf-att-notepad': {
    id: 'mf-att-notepad',
    notebookId: 'more-features',
    parentId: 'mf-attachments',
    title: 'NOTEPAD.EXE',
    type: 'rich',
    tags: ['Tools'],
    created: '2011-01-10',
    updated: '2011-01-10',
    content: {
      richHtml: `<p>Shortcut link to basic plain text scratchpad.</p>`,
    },
  },
  'mf-samples': {
    id: 'mf-samples',
    notebookId: 'more-features',
    parentId: null,
    title: '📝 Samples',
    type: 'rich',
    isFolder: true,
    tags: ['Feature'],
    created: '2011-01-12',
    updated: '2011-01-12',
    children: ['mf-sample-contact', 'mf-sample-week', 'mf-sample-todo'],
    content: {
      richHtml: `<h3>Template Samples</h3><p>Ready-to-use structural blueprints for personal organization.</p>`,
    },
  },
  'mf-sample-contact': {
    id: 'mf-sample-contact',
    notebookId: 'more-features',
    parentId: 'mf-samples',
    title: 'Sample contact template',
    type: 'rich',
    tags: ['Feature'],
    created: '2011-01-12',
    updated: '2011-01-12',
    content: {
      richHtml: `<h3>Contact Profile</h3><p><strong>Name:</strong> Jane Doe<br/><strong>Email:</strong> jane@example.com<br/><strong>Phone:</strong> +1 (555) 019-2831</p>`,
    },
  },
  'mf-sample-week': {
    id: 'mf-sample-week',
    notebookId: 'more-features',
    parentId: 'mf-samples',
    title: 'Sample week template',
    type: 'rich',
    tags: ['Feature'],
    created: '2011-01-12',
    updated: '2011-01-12',
    content: {
      richHtml: `<h3>Weekly Agenda</h3><ul><li><strong>Monday:</strong> Sprint Planning & Tree DB Design</li><li><strong>Tuesday:</strong> WYSIWYG & Spreadsheet Engine integration</li><li><strong>Wednesday:</strong> Tag autocomplete & search ranking</li></ul>`,
    },
  },
  'mf-sample-todo': {
    id: 'mf-sample-todo',
    notebookId: 'more-features',
    parentId: 'mf-samples',
    title: '🚩 To do list',
    type: 'rich',
    tags: ['Feature', 'High priority'],
    created: '2011-01-12',
    updated: '2011-01-12',
    content: {
      richHtml: `<h3>Action Items</h3><ul><li>[x] Complete Flask REST API blueprint</li><li>[x] Implement hierarchical SQL schema with parent_id & path indexes</li><li>[ ] Add client-side CSV and Markdown exporter</li></ul>`,
    },
  },

  // Boot Camp Notebook (操作ガイド)
  'bc-intro': {
    id: 'bc-intro',
    notebookId: 'boot-camp',
    parentId: null,
    title: '📖 初めての使い方ガイド・基本操作',
    type: 'rich',
    isBookmarked: true,
    bookmarkedAt: '2026-08-22',
    tags: ['Introduction', 'Start', 'How to'],
    created: '2025-01-01',
    updated: '2025-01-15',
    content: {
      richHtml: `
        <h2 class="text-xl font-bold text-slate-900 mb-3">階層型リッチノートマネージャーへようこそ</h2>
        <p class="text-slate-800 leading-relaxed mb-4">
          本アプリは、<strong>Windowsの定番階層型メモソフト「RightNote」</strong>の軽快な操作感をWebブラウザ上に完全再現した高機能情報管理ツールです。
        </p>

        <div class="p-3.5 bg-blue-50 border border-blue-300 rounded-lg text-xs text-blue-950 mb-4 shadow-sm">
          <strong class="text-blue-900 block mb-1 text-sm font-bold">💡 画面上部「📖 操作マニュアル」ボタンについて</strong>
          画面右上の青い「📖 操作マニュアル」ボタン、またはメニュー「ヘルプ(H) → 操作マニュアル」をクリックすると、いつでも全機能の詳しい解説書を開くことができます。
        </div>

        <h3 class="text-base font-bold text-slate-800 mt-4 mb-2">📌 基本の3ステップ</h3>
        <ol class="list-decimal pl-5 space-y-2 text-xs text-slate-700">
          <li><strong>左ツリーでノートを整理</strong>: 「+ 新規ノート」や「+ 新規フォルダ」で親子階層を自由に作成できます。</li>
          <li><strong>5種のエディタを使い分け</strong>: リッチテキスト（ワープロ）、スプレッドシート（表計算）、ソースコード、Webブックマーク、暗号化メモを切り替えて入力できます。</li>
          <li><strong>F9キーでリソースパネルを活用</strong>: 全文検索、タグ分類、閲覧履歴、自動保存メモ帳（スクラッチパッド）を即座に呼び出せます。</li>
        </ol>
      `,
    },
  },
  'bc-shortcuts': {
    id: 'bc-shortcuts',
    notebookId: 'boot-camp',
    parentId: null,
    title: '⚡ キーボードショートカット一覧',
    type: 'rich',
    tags: ['Tools', 'How to'],
    created: '2025-01-01',
    updated: '2025-01-15',
    content: {
      richHtml: `
        <h2 class="text-xl font-bold text-slate-900 mb-3">主要キーボードショートカット早見表</h2>
        <div class="overflow-x-auto border border-slate-300 rounded-lg my-3 shadow-sm">
          <table class="w-full text-xs text-left bg-white divide-y divide-slate-200">
            <thead class="bg-slate-100 font-semibold text-slate-800">
              <tr>
                <th class="px-3 py-2 border-r border-slate-200">ショートカット</th>
                <th class="px-3 py-2 border-r border-slate-200">機能</th>
                <th class="px-3 py-2">説明</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr class="hover:bg-slate-50"><td class="px-3 py-2 font-mono font-bold text-blue-700 border-r border-slate-200">Ctrl + S</td><td class="px-3 py-2 font-semibold border-r border-slate-200">保存</td><td class="px-3 py-2">現在のノート内容を保存</td></tr>
              <tr class="hover:bg-slate-50"><td class="px-3 py-2 font-mono font-bold text-blue-700 border-r border-slate-200">Ctrl + N</td><td class="px-3 py-2 font-semibold border-r border-slate-200">新規ノート</td><td class="px-3 py-2">ルート階層に新規ノートを作成</td></tr>
              <tr class="hover:bg-slate-50"><td class="px-3 py-2 font-mono font-bold text-blue-700 border-r border-slate-200">Ctrl + Shift + N</td><td class="px-3 py-2 font-semibold border-r border-slate-200">新規子ノート</td><td class="px-3 py-2">選択中ノートの配下にサブノートを作成</td></tr>
              <tr class="hover:bg-slate-50"><td class="px-3 py-2 font-mono font-bold text-blue-700 border-r border-slate-200">F9</td><td class="px-3 py-2 font-semibold border-r border-slate-200">右パネル切替</td><td class="px-3 py-2">検索・タグ・履歴・メモパネルを開閉</td></tr>
              <tr class="hover:bg-slate-50"><td class="px-3 py-2 font-mono font-bold text-blue-700 border-r border-slate-200">Ctrl + F</td><td class="px-3 py-2 font-semibold border-r border-slate-200">全文検索</td><td class="px-3 py-2">全ノートブックを対象にしたインクリメンタル検索</td></tr>
              <tr class="hover:bg-slate-50"><td class="px-3 py-2 font-mono font-bold text-blue-700 border-r border-slate-200">Ctrl + B / I / U</td><td class="px-3 py-2 font-semibold border-r border-slate-200">文字装飾</td><td class="px-3 py-2">太字 / 斜体 / 下線の適用</td></tr>
              <tr class="hover:bg-slate-50"><td class="px-3 py-2 font-mono font-bold text-blue-700 border-r border-slate-200">Ctrl + 1 / 2</td><td class="px-3 py-2 font-semibold border-r border-slate-200">見出し設定</td><td class="px-3 py-2">大見出し(H1) / 中見出し(H2)</td></tr>
            </tbody>
          </table>
        </div>
      `,
    },
  },
  'bc-types-guide': {
    id: 'bc-types-guide',
    notebookId: 'boot-camp',
    parentId: null,
    title: '📊 5つのノート種別の使い分け',
    type: 'rich',
    tags: ['Feature', 'How to'],
    created: '2025-01-01',
    updated: '2025-01-15',
    content: {
      richHtml: `
        <h2 class="text-xl font-bold text-slate-900 mb-2">5つのエディタ形式と活用シーン</h2>
        <p class="text-slate-800 leading-relaxed mb-4">
          エディタ上部の「種別 (Type)」ドロップダウンから、目的に応じて最適なノートタイプを選択できます。
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
          <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-xs">
            <strong class="text-red-900 font-bold block mb-1">🔴 1. リッチテキスト</strong>
            文書作成、アイデアメモ、表や画像の挿入、マーカーハイライト、ルーラー機能。
          </div>
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
            <strong class="text-amber-900 font-bold block mb-1">🟠 2. スプレッドシート</strong>
            簡易データベース、表計算、ヘッダー固定、列ソート(A→Z)、CSVエクスポート。
          </div>
          <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
            <strong class="text-emerald-900 font-bold block mb-1">🟡 3. ソースコード</strong>
            Python, JavaScript, SQLなどのシンタックスハイライト、行番号、実行シミュレーション。
          </div>
          <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <strong class="text-blue-900 font-bold block mb-1">🔵 4. Webブックマーク</strong>
            WebサイトのURL、サムネイル画像、訪問日時、メモのカード一覧管理。
          </div>
        </div>
        <div class="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs">
          <strong class="text-purple-900 font-bold block mb-1">🔒 5. 暗号化ノート</strong>
          パスワード（初期デモ: <code>password123</code>）による機密情報の保護と自動再暗号化。
        </div>
      `,
    },
  },

  // Health Notebook
  'health-diet': {
    id: 'health-diet',
    notebookId: 'health',
    parentId: null,
    title: 'Mediterranean Nutrition Plan',
    type: 'rich',
    tags: ['Special'],
    created: '2026-01-10',
    updated: '2026-01-10',
    content: {
      richHtml: `<h3>Nutritional Guidelines</h3><p>Focus on whole grains, fresh leafy vegetables, olive oil, and wild fish.</p>`,
    },
  },
  'health-fitness': {
    id: 'health-fitness',
    notebookId: 'health',
    parentId: null,
    title: 'Weekly Workout Tracker',
    type: 'spreadsheet',
    tags: ['Tools'],
    created: '2026-01-12',
    updated: '2026-01-12',
    content: {
      spreadsheet: {
        hasHeaderRow: true,
        lockHeader: true,
        headers: ['A', 'B', 'C', 'D', 'E'],
        rows: [
          [
            { value: 'Day', style: { bold: true } },
            { value: 'Activity', style: { bold: true } },
            { value: 'Duration (min)', style: { bold: true } },
            { value: 'Calories', style: { bold: true } },
            { value: 'Heart Rate Avg', style: { bold: true } },
          ],
          [{ value: 'Mon' }, { value: 'Interval Running' }, { value: '45' }, { value: '420' }, { value: '148' }],
          [{ value: 'Wed' }, { value: 'Strength Training' }, { value: '60' }, { value: '380' }, { value: '132' }],
          [{ value: 'Fri' }, { value: 'Lap Swimming' }, { value: '50' }, { value: '460' }, { value: '140' }],
          [{ value: 'Sun' }, { value: 'Trail Hiking' }, { value: '90' }, { value: '550' }, { value: '125' }],
        ],
      },
    },
  },

  // Programming Notebook
  'prog-flask': {
    id: 'prog-flask',
    notebookId: 'programming',
    parentId: null,
    title: 'Flask App Architecture & Tree API',
    type: 'code',
    tags: ['Feature', 'Tools'],
    created: '2026-08-25',
    updated: '2026-08-25',
    content: {
      code: {
        language: 'python',
        code: `"""
Flask Hierarchical Rich Note System - Core Blueprint
"""
from flask import Blueprint, request, jsonify
from datetime import datetime

notes_bp = Blueprint('notes', __name__, url_prefix='/api')

@notes_bp.route('/notebooks', methods=['GET'])
def get_notebooks():
    return jsonify({"status": "success", "data": []})
`,
      },
    },
  },
  'prog-sql': {
    id: 'prog-sql',
    notebookId: 'programming',
    parentId: null,
    title: 'SQL Schema & Recursive CTEs',
    type: 'code',
    tags: ['Tools'],
    created: '2026-08-25',
    updated: '2026-08-25',
    content: {
      code: {
        language: 'sql',
        code: `-- Recursive query to fetch full subtree of a note
WITH RECURSIVE NoteHierarchy AS (
    SELECT id, parent_id, title, note_type, 0 AS depth, CAST(id AS CHAR(1000)) AS path
    FROM nodes
    WHERE id = :root_id
    
    UNION ALL
    
    SELECT n.id, n.parent_id, n.title, n.note_type, nh.depth + 1, CONCAT(nh.path, '/', n.id)
    FROM nodes n
    JOIN NoteHierarchy nh ON n.parent_id = nh.id
)
SELECT * FROM NoteHierarchy ORDER BY depth, title;
`,
      },
    },
  },
};
