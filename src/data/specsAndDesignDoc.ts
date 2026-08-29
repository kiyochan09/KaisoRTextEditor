export interface SpecSection {
  id: string;
  title: string;
  category: 'requirements' | 'basic_design' | 'detailed_design' | 'db_design' | 'api_spec' | 'flask_guide';
  summary: string;
  markdownContent: string;
}

export const SPECS_AND_DESIGN_DOCS: SpecSection[] = [
  {
    id: 'req-overview',
    title: '1. システム概要・要件定義書 (Requirements Specification)',
    category: 'requirements',
    summary: '階層型リッチノートエディタの背景、目的、システム要件および利用シナリオ',
    markdownContent: `# 階層型リッチテキストエディタ Webシステム 要件定義書

## 1.1 システムの目的と概要
本システムは、膨大なドキュメント、表計算データ、プログラミングコード、Webクリップ、個人メモを**ツリー構造（階層型アウトライナー）**で直感的に整理・編集・検索できる高機能パーソナルナレッジマネージャー（PKM: Personal Knowledge Management）です。
Python/Flask バックエンドおよび最新のフロントエンド技術スタックを統合し、軽量・高速かつ堅牢なデータ永続化を提供します。

### ■ 主な対象ユーザーと想定ユースケース
- **エンジニア・開発者**: プロジェクトごとの仕様メモ、ソースコードスニペット、API定義、技術ブックマークの整理
- **研究者・ライター**: 章立て階層構造による論文・書籍・記事の執筆と文献クリッピング
- **ビジネスパーソン**: 顧客コンタクト一覧（表計算）、議事録、タスク管理、セキュリティ保護メモの集約
- **個人ユーザー**: レシピ集、フィットネス記録、旅行計画、日々のアイデアスクラッチ

---

## 1.2 機能要件一覧 (Functional Requirements)

| No. | 機能カテゴリ | 機能名 | 仕様概要 | 優先度 |
| :--- | :--- | :--- | :--- | :---: |
| **FR-01** | ワークスペース | **マルチノートブック・タブ管理** | 複数の独立したノートブック（例: Recipes, Features, Programming等）をタブで切り替え、タブ色設定や並び替えが可能 | 高 |
| **FR-02** | アウトライナー | **無限階層ツリー構造** | ノート・フォルダをツリー形式で階層化。ドラッグ＆ドロップ移動、インデント/アウトデント、展開/折りたたみ、ノードアイコン/カラーバッジ設定 | 高 |
| **FR-03** | エディタ | **RichView (リッチテキストエディタ)** | 見出し、フォントサイズ/色、太字/斜体/下線、蛍光マーカー、配置、箇条書き/番号付き/チェックリスト、画像埋め込み、コールアウト枠、ルーラー定規表示 | 高 |
| **FR-04** | エディタ | **Spreadsheet (表計算エディタ)** | グリッド形式（行・列）でのセル編集、見出し行固定（Lock Header）、見出し行フラグ（Has Header Row）、列ソート、簡易計算（SUM等）、CSV入出力 | 高 |
| **FR-05** | エディタ | **Source Code (コードエディタ)** | 言語選択（Python, JS, C#, SQL, HTML/CSS等）、行番号表示、シンタックスハイライト、ワンクリックコピー | 中 |
| **FR-06** | エディタ | **Web Bookmark (ブックマークエディタ)** | サムネイル画像プレビュー、ページタイトル、訪問日時、メモ、元URLハイパーリンク管理 | 中 |
| **FR-07** | セキュリティ | **Encrypted (暗号化保護ノート)** | パスワードによる個別ノートの暗号化・施錠/解錠機能。機密情報やAPIキーの安全な保護 | 中 |
| **FR-08** | リソース | **タグ管理 & 複合タグ検索** | ノートへの複数タグ付与、タグ一覧ツリー（件数バッジ表示）、タグ入力時の前方一致オートコンプリート、タグ掛け合わせ絞り込み | 高 |
| **FR-09** | リソース | **全ノード全文検索 (Search)** | タイトル・リッチテキスト本文・表計算セル・タグを横断したインクリメンタル高速検索とハイライト | 高 |
| **FR-10** | リソース | **履歴 & スクラッチパッド** | 最近閲覧・編集したノートの履歴トラッキング、独立したクイックスクラッチメモ | 中 |
| **FR-11** | データ連携 | **インポート / エクスポート** | ノートのJSON/Markdown/HTMLエクスポート、ツリー全体のバックアップ・リストア | 高 |

---

## 1.3 非機能要件 (Non-Functional Requirements)

1. **パフォーマンス (Performance)**:
   - 10,000ノード以上のツリーでも初期描画 1.0秒以内、ツリー開閉 60fps スムーズ動作
   - ノート切り替え時の描画レイテンシ 100ms 未満
2. **ユーザビリティ (Usability)**:
   - デスクトップアプリケーションと同等の操作感（ショートカットキー Ctrl+N, Ctrl+S, F9 などに対応）
   - 操作中の入力内容をローカルおよびサーバーへ自動保存（オートセーブ）
3. **データ保全性 & セキュリティ (Data Integrity & Security)**:
   - SQLite / PostgreSQL によるトランザクション保証
   - 暗号化ノートは AES-256-GCM または PBKDF2 + Fernet による暗号化
   - XSS対策（サニタイズ処理）および CSRF 保護
4. **拡張性 & 保守性 (Extensibility & Maintainability)**:
   - Flask Blueprints によるモジュール分割設計
   - RESTful API 設計により、将来のモバイルアプリやデスクトップElectron連携にも容易に対応可能
`,
  },
  {
    id: 'basic-arch',
    title: '2. システム構成 & アーキテクチャ設計書 (System Architecture)',
    category: 'basic_design',
    summary: 'Flaskバックエンド構成、フロントエンド構成、通信シーケンスおよび画面遷移設計',
    markdownContent: `# システム構成 & アーキテクチャ基本設計書

## 2.1 システム全体構成図
本システムは、軽量で拡張性に優れた **Python / Flask** をコアバックエンドとし、リレーショナルデータベース（SQLite / PostgreSQL）およびモダンなSPAフロントエンド（React / TypeScript または Jinja2 + Alpine.js / HTMX）を組み合わせたモダン・クライアント・サーバー構成を採用します。

\`\`\`
+-----------------------------------------------------------------------------------+
|                            Web Browser (Client Layer)                             |
|  +-----------------------------------------------------------------------------+  |
|  |  Top Menu Bar (File, Edit, View, Page, Tree, Format, Insert, Tools, Help)   |  |
|  +-----------------------------------------------------------------------------+  |
|  |  Notebook Tabs (Recipes, Features, More Features, Programming, Boot Camp)   |  |
|  +--------------------------+------------------------------+-------------------+  |
|  | Left: Folders & Tree     | Center: Multi-Note Editor    | Right: Resources  |  |
|  | - Bird's Eye Folders     | - RichView (WYSIWYG Toolbar) | - Tag Tree/Count  |  |
|  | - Hierarchical Outliner  | - Spreadsheet (Formulas/Grid)| - Full-Text Search|  |
|  | - Badges & Note Icons    | - Source Code Editor         | - History Trail   |  |
|  | - Drag & Drop Reorder    | - Web Bookmark Cards         | - Scratchpad Memo |  |
|  +--------------------------+------------------------------+-------------------+  |
|  |  Bottom Status Bar (Active Tags, Node Index Counter, Created/Modified Info) |  |
+--+-----------------------------------------------------------------------------+--+
                                        | (HTTPS / REST API / JSON)
                                        v
+-----------------------------------------------------------------------------------+
|                        Flask Backend Application (Python 3.11+)                   |
|  +-----------------------------------------------------------------------------+  |
|  |  Application Factory (create_app) & WSGI Middleware (Gunicorn / uWSGI)       |  |
|  +-----------------------------------------------------------------------------+  |
|  |  Blueprints Router:                                                         |  |
|  |  ├── /api/notebooks  : ワークスペース・タブ CRUD                            |  |
|  |  ├── /api/nodes      : 階層ツリーノード・コンテンツ CRUD・移動・並び替え    |  |
|  |  ├── /api/tags       : タグ管理・関連付け・オートコンプリート                |  |
|  |  ├── /api/search     : 全文検索・タグ複合フィルタリング                      |  |
|  |  ├── /api/security   : ノート暗号化・復号・パスワード検証                   |  |
|  |  └── /api/export     : Markdown / JSON / CSV バックアップ・エクスポート     |  |
|  +-----------------------------------------------------------------------------+  |
|  |  Service Layer: TreeHierarchyService, NoteContentService, EncryptionService |  |
|  +-----------------------------------------------------------------------------+  |
|  |  Data Access: SQLAlchemy 2.0 ORM / Alembic Migrations                       |  |
+--+-----------------------------------------------------------------------------+--+
                                        | (SQL Query / Connection Pool)
                                        v
+-----------------------------------------------------------------------------------+
|                         Database Layer (SQLite / PostgreSQL)                      |
|  - notebooks  - nodes (parent_id, position, path)  - note_contents                |
|  - tags       - node_tags                          - attachments                  |
+-----------------------------------------------------------------------------------+
\`\`\`

---

## 2.2 画面領域構成とレイアウト仕様
画面はユーザーが提供した画像（RightNote形式）に基づき、5つの主要エリアで構成されます。

1. **Top Menu Bar & Toolbars (上部メニュー・クイックバー)**:
   - 標準メニュー: \`File\`, \`Edit\`, \`View\`, \`Page\`, \`Tree\`, \`Format\`, \`Paragraph\`, \`Insert\`, \`Table\`, \`Tools\`, \`Help\`
   - ワンクリックアイコン: 新規ノート、新規フォルダ、保存、検索、印刷、仕様書ビューア
2. **Notebook Tab Bar (ノートブック切り替えタブ)**:
   - ワークスペースをカラフルなタブ（例: Recipes[青], Features[黄], More Features[桃]）で分割
3. **Left Split Sidebar (フォルダ鳥瞰ビュー & ノート階層ツリー)**:
   - フォルダ概要パネル（Bird's eye view）＋ 展開/折りたたみ可能なアイコン付きツリー
4. **Center Multi-Type Note Editor (中央メインエディタ)**:
   - ノート種別に応じたUI切り替え（リッチテキスト / 表計算グリッド / コード / ブックマーク / 暗号化施錠）
   - 上部にフォント・スタイル・配置・ルーラー（定規）、下部にタグバッジ
5. **Right Resource Panel (右側リソースパネル)**:
   - 4大タブ: \`Search\` (検索), \`Tags\` (タグツリー), \`History\` (閲覧履歴), \`Scratch\` (スクラッチパッド)

---

## 2.3 主要処理シーケンス

### ■ ノートツリーのノード移動（Drag & Drop）
\`\`\`
Client (UI)                       Flask (/api/nodes/move)             Database (SQL)
     |                                      |                               |
     |-- 1. PATCH /api/nodes/{id}/move ---->|                               |
     |   { new_parent_id, position }        |-- 2. トランザクション開始 --->|
     |                                      |-- 3. 循環参照チェック (CTE) ->|
     |                                      |-- 4. parent_id & 順序更新 --->|
     |                                      |-- 5. path 階層パス再計算 ---->|
     |                                      |-- 6. コミット --------------->|
     |<-- 7. 200 OK (更新後ツリー構造) -----|                               |
\`\`\`

### ■ タグ前方一致オートコンプリート & 複合タグ絞り込み
\`\`\`
Client (UI)                       Flask (/api/tags/autocomplete)      Database (SQL)
     |                                      |                               |
     |-- 1. GET /api/tags/suggest?q=In ---->|                               |
     |                                      |-- 2. SELECT WHERE name LIKE ->|
     |                                      |      'In%' GROUP BY tag ------|
     |<-- 3. [Indigo(0), Info(6), etc.] ----|                               |
\`\`\`
`,
  },
  {
    id: 'db-schema',
    title: '3. データベース物理設計書 (Database Schema & ERD)',
    category: 'db_design',
    summary: 'テーブル定義、リレーションシップ、インデックス設計、再帰CTEクエリ最適化',
    markdownContent: `# データベース物理設計書 (Database Physical Design)

## 3.1 ERダイアグラム (Entity Relationship Diagram)

\`\`\`
+-----------------------+          1:N         +-------------------------------+
|       notebooks       |--------------------->|             nodes             |
+-----------------------+                      +-------------------------------+
| PK id (VARCHAR 36)    |                      | PK id (VARCHAR 36)            |
|    name (VARCHAR 100) |                      | FK notebook_id (VARCHAR 36)   |
|    color (VARCHAR 20) |                      | FK parent_id (VARCHAR 36, NULL|
|    sort_order (INT)   |                      |    title (VARCHAR 255)        |
|    created_at (DATETIME|                     |    note_type (VARCHAR 30)     |
+-----------------------+                      |    icon (VARCHAR 50)          |
                                               |    color_badge (VARCHAR 20)   |
                                               |    is_folder (BOOLEAN)        |
                                               |    is_encrypted (BOOLEAN)     |
                                               |    sort_order (INT)           |
                                               |    path (VARCHAR 1000)        |
                                               |    created_at (DATETIME)      |
                                               |    updated_at (DATETIME)      |
                                               +-------------------------------+
                                                               | 1:1
                                                               v
+-----------------------+         M:N          +-------------------------------+
|         tags          |<====================>|         note_contents         |
+-----------------------+  (via node_tags)     +-------------------------------+
| PK id (VARCHAR 36)    |                      | PK node_id (VARCHAR 36)       |
|    name (VARCHAR 100) |                      |    rich_html (LONGTEXT)       |
|    color (VARCHAR 20) |                      |    spreadsheet_json (JSON)    |
|    icon (VARCHAR 50)  |                      |    code_language (VARCHAR 50) |
| FK parent_id (NULL)   |                      |    code_body (LONGTEXT)       |
+-----------------------+                      |    bookmarks_json (JSON)      |
                                               |    encrypted_payload (TEXT)   |
                                               |    password_hash (VARCHAR 255)|
                                               |    plain_text_cache (LONGTEXT)|
                                               +-------------------------------+
\`\`\`

---

## 3.2 テーブル詳細定義書

### 1. \`notebooks\` (ノートブック・タブ管理)
| カラム名 | データ型 | NULL | デフォルト | 説明 |
| :--- | :--- | :---: | :---: | :--- |
| **id** | VARCHAR(36) | NO | UUIDv4 | ノートブックID (主キー) |
| **name** | VARCHAR(100) | NO | - | ノートブック名称 (例: Recipes, Features) |
| **color** | VARCHAR(20) | NO | '#e0f2fe' | タブ表示カラー (HEX) |
| **sort_order** | INTEGER | NO | 0 | タブの表示順序 |
| **description**| VARCHAR(255) | YES | NULL | ノートブックの説明文 |
| **created_at** | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| **updated_at** | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |

### 2. \`nodes\` (ツリー階層ノード)
| カラム名 | データ型 | NULL | デフォルト | 説明 |
| :--- | :--- | :---: | :---: | :--- |
| **id** | VARCHAR(36) | NO | UUIDv4 | ノードID (主キー) |
| **notebook_id**| VARCHAR(36) | NO | - | 所属ノートブック (FK: \`notebooks.id\`) |
| **parent_id** | VARCHAR(36) | YES | NULL | 親ノードID (FK: \`nodes.id\`, NULL=ルート) |
| **title** | VARCHAR(255) | NO | 'Untitled Note' | ノートタイトル |
| **note_type** | VARCHAR(30) | NO | 'rich' | 種別 (\`rich\`, \`spreadsheet\`, \`code\`, \`bookmark\`, \`encrypted\`) |
| **icon** | VARCHAR(50) | YES | NULL | カスタム表示アイコン |
| **color_badge**| VARCHAR(20) | YES | NULL | カラーラベルバッジ (例: '#fb923c') |
| **is_folder** | BOOLEAN | NO | FALSE | フォルダ扱いフラグ |
| **is_encrypted**| BOOLEAN | NO | FALSE | 暗号化施錠フラグ |
| **sort_order** | INTEGER | NO | 0 | 同一階層内での並び順 |
| **path** | VARCHAR(1000)| YES | NULL | 高速階層探索用パス (例: '/root_id/parent_id/this_id') |
| **created_at** | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| **updated_at** | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |

**インデックス設計**:
- \`idx_nodes_notebook_parent\`: \`(notebook_id, parent_id, sort_order)\` (ツリー展開クエリの最速化)
- \`idx_nodes_path\`: \`(path)\` (子孫ノード一括取得の最適化)

### 3. \`note_contents\` (ノード詳細コンテンツ)
| カラム名 | データ型 | NULL | 説明 |
| :--- | :--- | :---: | :--- |
| **node_id** | VARCHAR(36) | NO | 対象ノードID (PK / FK: \`nodes.id\` ON DELETE CASCADE) |
| **rich_html** | LONGTEXT | YES | リッチテキストHTML本文 |
| **spreadsheet_json** | JSON / TEXT | YES | 表計算データ (ヘッダー、セル値、数式、設定) |
| **code_language** | VARCHAR(50) | YES | プログラミング言語 (python, js, csharp, sql等) |
| **code_body** | LONGTEXT | YES | ソースコード本文 |
| **bookmarks_json** | JSON / TEXT | YES | ブックマークカード配列 (タイトル, URL, サムネイル, 日時) |
| **encrypted_payload** | LONGTEXT | YES | 暗号化済みバイナリ/Base64文字列 |
| **password_salt** | VARCHAR(64) | YES | 暗号化復号用ソルト |
| **password_hash** | VARCHAR(255)| YES | パスワード検証ハッシュ (PBKDF2-SHA256) |
| **plain_text_cache** | LONGTEXT | YES | 全文検索用プレーンテキスト抽出インデックスキャッシュ |

### 4. \`tags\` & \`node_tags\` (タグマスタ & 中間テーブル)
| テーブル | カラム | データ型 | 説明 |
| :--- | :--- | :--- | :--- |
| **tags** | **id** | VARCHAR(36) PK | タグID |
| | **name** | VARCHAR(100) UNIQUE | タグ名 (例: "Favorite Recipes", "Soups") |
| | **color** | VARCHAR(20) | 表示カラー |
| | **icon** | VARCHAR(50) | アイコン絵文字・シンボル |
| | **parent_id** | VARCHAR(36) NULL | 親タグID (階層タグ対応) |
| **node_tags** | **node_id** | VARCHAR(36) PK, FK | \`nodes.id\` |
| | **tag_id** | VARCHAR(36) PK, FK | \`tags.id\` |

---

## 3.3 再帰CTE（階層問い合わせ）SQLクエリ設計
ツリー全体を1クエリで効率的に取得するための再帰クエリ設計:

\`\`\`sql
-- 特定の親ノード配下の全サブツリーを深さ付きで一括取得
WITH RECURSIVE SubtreeCTE AS (
    -- 基本ノード（アンカー）
    SELECT 
        n.id, n.notebook_id, n.parent_id, n.title, n.note_type, 
        n.icon, n.color_badge, n.is_folder, n.is_encrypted, n.sort_order,
        0 AS depth,
        CAST(n.id AS TEXT) AS hierarchy_path
    FROM nodes n
    WHERE n.id = :target_node_id

    UNION ALL

    -- 再帰部分（子ノードを結合）
    SELECT 
        child.id, child.notebook_id, child.parent_id, child.title, child.note_type,
        child.icon, child.color_badge, child.is_folder, child.is_encrypted, child.sort_order,
        parent.depth + 1,
        parent.hierarchy_path || '/' || child.id
    FROM nodes child
    JOIN SubtreeCTE parent ON child.parent_id = parent.id
)
SELECT * FROM SubtreeCTE ORDER BY depth, sort_order;
\`\`\`
`,
  },
  {
    id: 'api-spec',
    title: '4. REST API 仕様書 (Endpoint Specification)',
    category: 'api_spec',
    summary: 'Flaskバックエンドが提供する全エンドポイントのURL、メソッド、リクエスト/レスポンス仕様',
    markdownContent: `# REST API エンドポイント詳細仕様書

全エンドポイントは JSON 形式でリクエスト/レスポンスを送受信します。
ベースURL: \`/api\`

## 4.1 ノートブック (Notebooks API)

### 1. ノートブック一覧取得
- **URL**: \`GET /api/notebooks\`
- **Response (200 OK)**:
\`\`\`json
{
  "status": "success",
  "data": [
    {
      "id": "recipes",
      "name": "Recipes",
      "color": "#e0f2fe",
      "sort_order": 0,
      "description": "Favorite culinary recipes",
      "root_node_ids": ["rec-root"]
    }
  ]
}
\`\`\`

### 2. ノートブック作成
- **URL**: \`POST /api/notebooks\`
- **Request Body**:
\`\`\`json
{
  "name": "Project Alpha",
  "color": "#fef3c7",
  "description": "Development specs and tasks"
}
\`\`\`

---

## 4.2 ノード & コンテンツ (Nodes & Content API)

### 1. ノートブック配下の全ツリーノード取得
- **URL**: \`GET /api/notebooks/{notebook_id}/tree\`
- **Response (200 OK)**:
\`\`\`json
{
  "status": "success",
  "data": [
    {
      "id": "rec-soups",
      "notebook_id": "recipes",
      "parent_id": "rec-root",
      "title": "Soups",
      "type": "rich",
      "icon": "💡 ⭐",
      "color_badge": "#fde047",
      "is_folder": true,
      "is_encrypted": false,
      "tags": ["Favorite Recipes", "Soups"],
      "created": "2012-11-24",
      "updated": "2012-11-26",
      "children": ["rec-gazpacho", "rec-vegetable"]
    }
  ]
}
\`\`\`

### 2. 単一ノード詳細 & コンテンツ取得
- **URL**: \`GET /api/nodes/{node_id}\`
- **Response (200 OK)**:
\`\`\`json
{
  "status": "success",
  "data": {
    "id": "feat-sheet-contacts",
    "title": "Sample 2: Contacts",
    "type": "spreadsheet",
    "tags": ["Feature", "Tools"],
    "content": {
      "spreadsheet": {
        "hasHeaderRow": true,
        "lockHeader": true,
        "headers": ["A", "B", "C", "D", "E"],
        "rows": [
          [{"value": "First Name", "style": {"bold": true}}, {"value": "Last Name", "style": {"bold": true}}]
        ]
      }
    }
  }
}
\`\`\`

### 3. ノードコンテンツ更新（オートセーブ）
- **URL**: \`PUT /api/nodes/{node_id}/content\`
- **Request Body**:
\`\`\`json
{
  "title": "Updated Title",
  "content": {
    "rich_html": "<p>Updated body content...</p>"
  },
  "tags": ["Feature", "How to"]
}
\`\`\`

### 4. ノードの移動（D&D / 並び替え）
- **URL**: \`PATCH /api/nodes/{node_id}/move\`
- **Request Body**:
\`\`\`json
{
  "target_parent_id": "rec-soups",
  "target_position": 2
}
\`\`\`

---

## 4.3 タグ & 検索 API (Tags & Search API)

### 1. 全タグ一覧と使用件数取得
- **URL**: \`GET /api/tags\`
- **Response (200 OK)**:
\`\`\`json
{
  "status": "success",
  "data": [
    { "id": "tag-favorite", "name": "Favorite Recipes", "color": "#ef4444", "icon": "❤️", "count": 3 },
    { "id": "tag-feature", "name": "Feature", "color": "#10b981", "icon": "🟩", "count": 12 }
  ]
}
\`\`\`

### 2. タグ前方一致オートコンプリートサジェスト
- **URL**: \`GET /api/tags/suggest?query=In\`
- **Response (200 OK)**:
\`\`\`json
{
  "status": "success",
  "data": [
    { "name": "Indigo", "count": 0 },
    { "name": "Information", "count": 6 },
    { "name": "Introduction", "count": 6 }
  ]
}
\`\`\`

### 3. 全文横断検索
- **URL**: \`GET /api/search?q=Vegetable&type=all\`
- **Response (200 OK)**:
\`\`\`json
{
  "status": "success",
  "query": "Vegetable",
  "count": 1,
  "results": [
    {
      "node_id": "rec-vegetable",
      "notebook_id": "recipes",
      "notebook_name": "Recipes",
      "title": "Chunky Vegetable Soup ⭐",
      "type": "rich",
      "match_type": "title",
      "snippet": "Although this is a hearty soup, laden with vegetables, it has a delicate flavour..."
    }
  ]
}
\`\`\`
`,
  },
  {
    id: 'flask-impl-guide',
    title: '5. Flask 実装ガイド & プロジェクト構造設計',
    category: 'flask_guide',
    summary: 'Flaskでのベストプラクティス構成、Blueprints、SQLAlchemyモデル、および起動方法',
    markdownContent: `# Flask アプリケーション実装ガイド

## 5.1 推奨ディレクトリ構成 (Application Blueprint Architecture)

\`\`\`
hierarchical-note-app/
├── app/
│   ├── __init__.py          # Application Factory (create_app)
│   ├── config.py            # 設定クラス (Development, Production, Testing)
│   ├── models/              # SQLAlchemy 2.0 ORM データモデル
│   │   ├── __init__.py
│   │   ├── notebook.py      # Notebookモデル
│   │   ├── node.py          # Node (ツリー) & NoteContentモデル
│   │   └── tag.py           # Tag & NodeTagリレーション
│   ├── routes/              # Flask Blueprints (REST API)
│   │   ├── __init__.py
│   │   ├── notebooks_bp.py  # ノートブック管理API
│   │   ├── nodes_bp.py      # ツリーノード & エディタAPI
│   │   ├── tags_bp.py       # タグ・オートコンプリートAPI
│   │   └── search_bp.py     # 全文検索API
│   ├── services/            # ビジネスロジック層
│   │   ├── tree_service.py  # 階層ツリー構築・移動・CTEクエリ
│   │   ├── search_service.py# 全文検索インデックス
│   │   └── crypto_service.py# 暗号化ノート処理 (Fernet / AES)
│   ├── static/              # フロントエンド静的アセット (JS / CSS / Icons)
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       ├── app.js
│   │       ├── treeview.js
│   │       └── editor.js
│   └── templates/           # Jinja2 テンプレート
│       └── index.html       # メインアプリケーション画面
├── migrations/              # Alembic マイグレーションスクリプト
├── tests/                   # pytest ユニットテスト
├── requirements.txt         # 依存パッケージ定義
├── app.py                   # 開発サーバー起動エントリーポイント
└── README.md                # 導入・起動手順書
\`\`\`

---

## 5.2 依存パッケージ一覧 (\`requirements.txt\`)
\`\`\`txt
flask>=3.0.0
flask-cors>=4.0.0
flask-sqlalchemy>=3.1.0
flask-migrate>=4.0.5
cryptography>=42.0.0
marshmallow>=3.20.0
pydantic>=2.5.0
python-dotenv>=1.0.0
gunicorn>=21.2.0
\`\`\`

---

## 5.3 クイックスタート手順 (Quick Start)

\`\`\`bash
# 1. 仮想環境の作成と有効化
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# 2. 依存パッケージのインストール
pip install -r requirements.txt

# 3. データベースの初期化と初期シードデータの投入
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"

# 4. 開発サーバーの起動 (ポート 5000)
python app.py
\`\`\`
`,
  },
];
