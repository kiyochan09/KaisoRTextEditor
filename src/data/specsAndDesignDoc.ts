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
    summary: '2層階層型ナレッジマネージャーの背景、目的、システム要件および利用シナリオ',
    markdownContent: `# 階層型リッチテキストエディタ Webシステム 要件定義書

## 1.1 システムの目的と概要
本システムは、膨大なドキュメント、表計算データ、プログラミングコード、Webクリップ、個人メモを**2層階層構造（階層1: タブフォルダ階層 ＋ 階層2: ノートツリー構造）**で直感的に整理・編集・検索できる高機能パーソナルナレッジマネージャー（PKM: Personal Knowledge Management）です。
ローカルファーストな高速動作、安全なMarkdown ZIPバックアップ/復元、およびPython/Flask バックエンドとの完全互換性を兼ね備えています。

### ■ 主な対象ユーザーと想定ユースケース
- **研究者・ライター・学者**: 多分野にまたがる文献・論文・著書の章立て階層執筆と脚注・資料クリッピング
- **エンジニア・開発者**: プロジェクトごとの仕様書、ソースコードスニペット、API定義、技術ブックマークの整理
- **ビジネスパーソン**: 業務別タブ管理、表計算（スプレッドシート）、議事録、セキュリティ保護メモの集約
- **個人ユーザー**: レシピ集、フィットネス記録、旅行計画、日々のアイデアスクラッチ

---

## 1.2 機能要件一覧 (Functional Requirements)

| No. | 機能カテゴリ | 機能名 | 仕様概要 | 優先度 |
| :--- | :--- | :--- | :--- | :---: |
| **FR-01** | 階層1（タブ管理） | **タブフォルダ多層階層 & スマートタブバー** | タブの集合体をフォルダ・サブフォルダで階層化整理。階層1で選択したタブのみを上部タブバーに開く制御、タブの閉じる（非表示）/削除機能 | 高 |
| **FR-02** | 階層2（ツリー） | **ノート・フォルダ無限階層ツリー構造** | 選択中タブ内のフォルダ（isFolder）およびノートをツリー形式で階層化。D&D高精度移動（直前/直後/中）、カラーバッジ設定、全展開/全折畳 | 高 |
| **FR-03** | エディタ | **RichView (リッチテキストエディタ)** | 見出し、文字/段落スタイルギャラリー（Word互換）、自動連番脚注（Wikipediaスタイル）、横書き/縦書きテキストボックス、表、画像、ルーラー | 高 |
| **FR-04** | エディタ | **Spreadsheet (表計算エディタ)** | グリッド形式でのセル編集、見出し行固定（Lock Header）、列ソート、簡易計算（SUM等）、CSV入出力 | 高 |
| **FR-05** | エディタ | **Source Code (コードエディタ)** | 言語選択（Python, JS, SQL, HTML/CSS等）、行番号表示、シンタックスハイライト、ワンクリックコピー、実行シミュレーション | 中 |
| **FR-06** | エディタ | **Web Bookmark (ブックマークエディタ)** | サムネイル画像プレビュー、ページタイトル、訪問日時、メモ、元URLハイパーリンク管理 | 中 |
| **FR-07** | セキュリティ | **Encrypted (暗号化保護ノート)** | パスワードによる個別ノートの暗号化・施錠/解錠機能。機密情報やAPIキーの安全な保護 | 中 |
| **FR-08** | リソース | **タグ管理 & 複合タグ検索** | ノートへの複数タグ付与、タグ一覧ツリー（件数バッジ表示）、タグによるツリー絞り込み | 高 |
| **FR-09** | リソース | **全ノード全文検索 (Search)** | データベース内のタイトル・本文・表計算セル・タグを横断したインクリメンタル高速検索とハイライト | 高 |
| **FR-10** | リソース | **履歴 & スクラッチパッド** | 最近閲覧・編集したノートの履歴トラッキング、独立した自動保存クイックスクラッチメモ | 中 |
| **FR-11** | データ保全 | **Markdown ZIP入出力 & 迷子データ復旧** | 階層1・階層2の多層構造を保持したMarkdown ZIP出力・完全復元、所属タブを失った孤立ノートの自動スキャン救済、複数DB一括削除 | 高 |

---

## 1.3 非機能要件 (Non-Functional Requirements)

1. **パフォーマンス (Performance)**:
   - 10,000ファイル規模のZIPデータ復元および階層展開を数秒以内で完了
   - タブ切り替え・ノート選択レイテンシ 50ms 未満
2. **ユーザビリティ (Usability)**:
   - デスクトップアプリケーション（RightNote）準拠の操作性（ショートカットキー、D&D、コンテキストメニュー）
   - 全入力内容のブラウザローカルストレージ（IndexedDB）への自動保存
3. **データ保全性 & 相互運用性 (Interoperability & Data Safety)**:
   - 人間可読なMarkdown形式（\`_content.md\` 含む）でのフォルダ階層ZIPエクスポートにより、ObsidianやVS Code等への完全なポータビリティを保証
   - 誤操作・不整合を防ぐ「迷子データの復元」および安全な削除確認フロー
`,
  },
  {
    id: 'basic-arch',
    title: '2. システム構成 & アーキテクチャ設計書 (System Architecture)',
    category: 'basic_design',
    summary: '2層階層構造フロントエンドレイアウト、状態管理、Flaskバックエンド構成',
    markdownContent: `# システム構成 & アーキテクチャ基本設計書

## 2.1 システム全体構成図
本システムは、クライアントサイド（React + TypeScript + Tailwind CSS）においてローカルファーストに完結する高速なSPAとして動作し、同時にバックエンド（Python / Flask + SQLite / PostgreSQL）との双方向データ同期が可能なアーキテクチャを採用しています。

\`\`\`
+-----------------------------------------------------------------------------------------------+
|                            Web Browser (Client Layer: http://localhost:3001)                 |
|  +-----------------------------------------------------------------------------------------+  |
|  |  Top Menu Bar (File, Edit, View, Format, Insert, Tools, Help) & DB Selector Switcher    |  |
|  +-----------------------------------------------------------------------------------------+  |
|  |  Notebook Tab Bar (Dynamic Open Tabs: [Tab 1 ✕] [Tab 2 ✕] [+ 新規タブ])                 |  |
|  +--------------------+--------------------+-------------------------------+---------------+  |
|  | 階層1: TabListPanel | 階層2: TreeSidebar | Center: Multi-Note Editor     | Right: Resource|  |
|  | - Tab Folders      | - Folder Nodes     | - RichView (か力漢 スタイル)   | - Search (全文)|  |
|  |   └ Sub-folders    |   └ Sub-folders    | - Spreadsheet (Formulas/Grid) | - Tags (タグ)  |  |
|  |     📄 Tabs        |     📄 Notes       | - Source Code Editor          | - History (歴) |  |
|  | - Folder Drag/Drop | - Tree D&D Reorder | - Web Bookmark Cards          | - Scratchpad   |  |
|  | - Add Folder/Sub   | - Color Badges     | - Encrypted Note Shield       |                |  |
|  +--------------------+--------------------+-------------------------------+---------------+  |
|  |  Bottom Status Bar (Active Tags, Note Counter, Storage Location, Auto-saved Status)     |  |
|  +-----------------------------------------------------------------------------------------+  |
|  |  Modals: DatabaseManagerModal (ZIP Export/Import, Batch Delete, Lost Data Restore)       |  |
+--+-----------------------------------------------------------------------------------------+--+
                                         | (HTTPS / REST API / JSON)
                                         v
+-----------------------------------------------------------------------------------------------+
|                        Flask Backend Application (Python 3.11+)                               |
|  ├── /api/tab-folders : 階層1 タブフォルダ CRUD・階層移動                                     |
|  ├── /api/notebooks   : タブ（ノートブック）CRUD                                              |
|  ├── /api/nodes       : 階層2 ノード・フォルダ CRUD・D&D並び替え                              |
|  ├── /api/restore     : 迷子ノート（孤立データ）スキャン & 復元                              |
|  └── /api/zip-backup  : 多層Markdown ZIPエクスポート & インポート                             |
+-----------------------------------------------------------------------------------------------+
\`\`\`

---

## 2.2 2層階層構造のUI設計仕様

1. **階層1（画面最左：TabListPanel）**:
   - タブの集合体を「親フォルダ」「サブフォルダ」として多層階層化。
   - 階層1でタブをクリックした際、**選択したタブのみが上部タブバーに追加・表示**されます（同じフォルダ内の他タブが一斉展開されるのを防止）。
2. **階層2（画面左中央：TreeSidebar）**:
   - 選択中のタブ（ノートブック）内部の、フォルダおよびノートの多層ツリー構造。
   - フォルダ自身も本文（\`_content.md\`）を保持可能。
3. **上部タブバー（NotebookTabBar）**:
   - 開いているタブのみを水平表示。
   - タブ個別閉じるボタン（✕）、右クリックメニュー（このタブを閉じる、右側を閉じる、他を閉じる）による直感的なタブバー整理。
4. **中央エディタ & 右側リソースパネル**:
   - 5大ノート種別エディタ、およびタグ・全文検索・履歴・スクラッチパッド。
`,
  },
  {
    id: 'db-schema',
    title: '3. データベース物理設計書 (Database Schema & ERD)',
    category: 'db_design',
    summary: '階層1・階層2を包含するテーブル定義、リレーションシップ、インデックス設計',
    markdownContent: `# データベース物理設計書 (Database Physical Design)

## 3.1 ERダイアグラム (Entity Relationship Diagram)

\`\`\`
+-----------------------+
|      tab_folders      | (階層1: タブフォルダ階層)
+-----------------------+
| PK id (VARCHAR 36)    |
|    name (VARCHAR 100) |
| FK parent_id (NULL)   |----+ (自己参照: サブフォルダ階層)
|    color (VARCHAR 20) |    |
+-----------------------+    |
           | 1:N             |
           v                 |
+-----------------------+    |
|       notebooks       | <--+ (所属フォルダ)
+-----------------------+
| PK id (VARCHAR 36)    |
| FK folder_id (NULL)   |
|    name (VARCHAR 100) |
|    color (VARCHAR 20) |
|    is_hidden (BOOL)   |
|    sort_order (INT)   |
+-----------------------+
           | 1:N
           v
+-----------------------+ (階層2: フォルダ・ノートツリー)
|         nodes         |
+-----------------------+
| PK id (VARCHAR 36)    |
| FK notebook_id        |
| FK parent_id (NULL)   |----+ (自己参照: サブフォルダ・子ノート階層)
|    title (VARCHAR 255)|    |
|    is_folder (BOOL)   |    |
|    children_ids (JSON)|    |
|    note_type (VARCHAR)|    |
|    color_badge (STR)  |    |
|    is_encrypted (BOOL)|    |
+-----------------------+
           | 1:1
           v
+-----------------------+
|     note_contents     |
+-----------------------+
| PK node_id (VARCHAR)  |
|    rich_html (TEXT)   |
|    spreadsheet (JSON) |
|    code_body (TEXT)   |
|    bookmarks (JSON)   |
+-----------------------+
\`\`\`

---

## 3.2 テーブル詳細定義書

### 1. \`tab_folders\` (階層1: タブフォルダ)
| カラム名 | データ型 | NULL | 説明 |
| :--- | :--- | :---: | :--- |
| **id** | VARCHAR(36) | NO | フォルダID (PK) |
| **name** | VARCHAR(100) | NO | フォルダ名称 (例: 「生活・ヘルス」, 「国際」) |
| **parent_id** | VARCHAR(36) | YES | 親フォルダID (FK: \`tab_folders.id\`, NULL=ルート) |
| **color** | VARCHAR(20) | NO | フォルダアイコン色 (例: '#3b82f6') |

### 2. \`notebooks\` (タブ / ノートブック)
| カラム名 | データ型 | NULL | 説明 |
| :--- | :--- | :---: | :--- |
| **id** | VARCHAR(36) | NO | ノートブックID (PK) |
| **folder_id** | VARCHAR(36) | YES | 所属フォルダID (FK: \`tab_folders.id\`, NULL=未分類) |
| **name** | VARCHAR(100) | NO | タブ名称 |
| **color** | VARCHAR(20) | NO | タブ背景色 (例: '#e0f2fe') |
| **is_hidden** | BOOLEAN | NO | タブバー非表示フラグ (デフォルト FALSE) |
| **sort_order** | INTEGER | NO | 並び順 |

### 3. \`nodes\` (階層2: フォルダ & ノートツリー)
| カラム名 | データ型 | NULL | 説明 |
| :--- | :--- | :---: | :--- |
| **id** | VARCHAR(36) | NO | ノードID (PK) |
| **notebook_id** | VARCHAR(36) | NO | 所属タブ (FK: \`notebooks.id\`) |
| **parent_id** | VARCHAR(36) | YES | 親ノードID (FK: \`nodes.id\`, NULL=ルート) |
| **title** | VARCHAR(255) | NO | ノート/フォルダタイトル |
| **is_folder** | BOOLEAN | NO | フォルダフラグ (TRUE=琥珀色フォルダ) |
| **children_ids**| JSON | NO | 子ノードID配列 (\`["id1", "id2"]\`) |
| **note_type** | VARCHAR(30) | NO | 種別 (\`rich\`, \`spreadsheet\`, \`code\`, \`bookmark\`, \`encrypted\`) |
| **color_badge** | VARCHAR(20) | YES | カラーラベルバッジ |
| **is_encrypted**| BOOLEAN | NO | 暗号化フラグ |
`,
  },
  {
    id: 'api-spec',
    title: '4. REST API & バックアップ仕様書 (API & Backup Specification)',
    category: 'api_spec',
    summary: 'FlaskバックエンドAPIおよびMarkdown ZIP構造メタデータ仕様',
    markdownContent: `# REST API & バックアップ仕様書

## 4.1 バックアップZIPファイル構造仕様 (\`Data_Backup_MD_v2\`)

エクスポートされるZIPアーカイブは、OSのファイルシステムで直接閲覧・編集できる標準ディレクトリ構造を採用しています：

\`\`\`text
Data_Backup_MD_YYYYMMDD.zip
├── .kaiso_tab_meta.json                  # タブフォルダ階層メタデータ
└── [データベース名]/                     # (例: DEMO, 環境, 国際)
    └── [階層1: タブフォルダ名]/           # (例: アジア, 欧米)
        └── [サブフォルダ名]/             # (階層化されている場合)
            └── [タブ (ノートブック) 名]/  # (例: 「私には敵はいない」の思想)
                ├── [階層2: フォルダ名]/   # (例: 第一章 劉暁波の軌跡)
                │   ├── _content.md       # (フォルダ自身の説明・本文)
                │   └── [ノート名].md     # (末端ノート本文)
                └── [ルートノート名].md
\`\`\`

- **\`_content.md\`**: フォルダノードにテキスト内容が設定されている場合、そのフォルダ直下に保存され、インポート時にフォルダの本文として自動統合されます。
- **\`.kaiso_tab_meta.json\`**: タブフォルダの階層構造（親子関係、色、並び順）を格納し、100%の再現性を担保します。

---

## 4.2 主要REST APIエンドポイント

### 1. タブフォルダAPI (階層1)
- \`GET  /api/tab-folders\` : 階層1の全フォルダ取得
- \`POST /api/tab-folders\` : フォルダの作成・階層移動

### 2. ノートブックAPI
- \`GET  /api/notebooks\` : 全タブ取得
- \`POST /api/notebooks\` : 新規タブ追加

### 3. ツリーノードAPI (階層2)
- \`GET  /api/notebooks/{id}/nodes\` : 特定タブ配下の全ノード・フォルダ取得
- \`PATCH /api/nodes/{id}/move\` : ノードのD&D移動・並び替え

### 4. 迷子データ検出 & 復旧API
- \`GET  /api/restore/orphans\` : 所属タブのない孤立ノード検出
- \`POST /api/restore/recover\` : 孤立ノードの指定フォルダへの再統合
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
│   │   ├── tab_folder.py    # TabFolderモデル (階層1)
│   │   ├── notebook.py      # Notebookモデル
│   │   ├── node.py          # Node (階層2ツリー) & NoteContentモデル
│   │   └── tag.py           # Tag & NodeTagリレーション
│   ├── routes/              # Flask Blueprints (REST API)
│   │   ├── tab_folders_bp.py# 階層1フォルダAPI
│   │   ├── notebooks_bp.py  # ノートブック管理API
│   │   ├── nodes_bp.py      # 階層2ノード & エディタAPI
│   │   ├── restore_bp.py    # 迷子データ復旧API
│   │   ├── backup_bp.py     # ZIPエクスポート/インポートAPI
│   │   ├── tags_bp.py       # タグAPI
│   │   └── search_bp.py     # 全文検索API
│   └── services/            # ビジネスロジック層
│       ├── tree_service.py  # 階層ツリー構築・移動・CTEクエリ
│       ├── zip_service.py   # Markdown ZIPパーサー
│       └── crypto_service.py# 暗号化ノート処理 (Fernet / AES)
├── requirements.txt         # 依存パッケージ定義
├── app.py                   # 開発サーバー起動エントリーポイント
└── README.md                # 導入・起動手順書
\`\`\`

## 5.2 クイックスタート手順 (Quick Start)

\`\`\`bash
# 1. 仮想環境の作成と有効化
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# 2. 依存パッケージのインストール
pip install -r requirements.txt

# 3. サーバーの起動 (ポート 5000)
python app.py
\`\`\`
`,
  },
];
