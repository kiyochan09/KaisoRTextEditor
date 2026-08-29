export interface FlaskSourceFile {
  path: string;
  language: string;
  description: string;
  content: string;
}

export const STANDALONE_FLASK_APP_CODE = `"""
Hierarchical Rich Note App - Complete Standalone Flask + SQLite Backend
========================================================================
単一ファイル完結型のFlaskバックエンドサーバーです。
追加のフォルダやモジュール分割なしで、このファイル1つで即座に動作します。

【必要ライブラリ】
  pip install flask flask-cors

【起動コマンド】
  python app.py

起動後、http://localhost:5000 でAPIサーバーが待機します。
フロントエンド(React)と完全互換のREST APIを提供します。
"""

import os
import json
import sqlite3
import uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# CORS対応: フロントエンド(http://localhost:3000 等)からのアクセスを全許可
CORS(app, resources={r"/api/*": {"origins": "*"}})

DATABASE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'notes.db')

def get_db():
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """データベーステーブルの初期化とWALモードの有効化"""
    conn = get_db()
    cur = conn.cursor()
    # 高速読み書きのためのWALモード
    cur.execute("PRAGMA journal_mode=WAL;")
    
    # 1. 最上位タブ・フォルダ管理テーブル
    cur.execute('''
        CREATE TABLE IF NOT EXISTS tab_folders (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT DEFAULT '#3b82f6',
            icon TEXT DEFAULT 'folder',
            notebook_ids TEXT DEFAULT '[]',
            created_at TEXT
        );
    ''')

    # 2. ノートブック管理テーブル
    cur.execute('''
        CREATE TABLE IF NOT EXISTS notebooks (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            icon TEXT,
            color TEXT DEFAULT '#3b82f6',
            folder_id TEXT,
            root_node_ids TEXT DEFAULT '[]',
            created_at TEXT,
            updated_at TEXT
        );
    ''')

    # 3. 階層ツリーノード管理テーブル
    cur.execute('''
        CREATE TABLE IF NOT EXISTS nodes (
            id TEXT PRIMARY KEY,
            notebook_id TEXT NOT NULL,
            title TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'rich-text',
            parent_id TEXT,
            children_ids TEXT DEFAULT '[]',
            tags TEXT DEFAULT '[]',
            is_folder INTEGER DEFAULT 0,
            is_expanded INTEGER DEFAULT 1,
            is_bookmarked INTEGER DEFAULT 0,
            is_encrypted INTEGER DEFAULT 0,
            color_badge TEXT,
            icon TEXT,
            custom_styles TEXT,
            created_at TEXT,
            updated_at TEXT
        );
    ''')

    # 4. ノート本文コンテンツテーブル (リッチテキスト/表計算/コード/暗号文)
    cur.execute('''
        CREATE TABLE IF NOT EXISTS note_contents (
            node_id TEXT PRIMARY KEY,
            content TEXT,
            spreadsheet_data TEXT,
            code_language TEXT,
            FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
        );
    ''')

    # 5. 文章単位ブックマークテーブル
    cur.execute('''
        CREATE TABLE IF NOT EXISTS sentence_bookmarks (
            id TEXT PRIMARY KEY,
            anchor_id TEXT,
            text TEXT NOT NULL,
            note_id TEXT NOT NULL,
            note_title TEXT,
            color TEXT DEFAULT '#f59e0b',
            comment TEXT,
            tags TEXT DEFAULT '[]',
            created_at TEXT
        );
    ''')

    # 6. 図表キャプションテーブル (図番号・表番号・タイトル管理)
    cur.execute('''
        CREATE TABLE IF NOT EXISTS figure_captions (
            id TEXT PRIMARY KEY,
            anchor_id TEXT,
            note_id TEXT NOT NULL,
            note_title TEXT,
            type TEXT NOT NULL DEFAULT 'figure', -- figure, table, chart, diagram
            number_label TEXT NOT NULL,          -- 例: 図1, 表1
            title TEXT NOT NULL,                 -- タイトル
            description TEXT,                    -- 補足説明
            color TEXT DEFAULT '#10b981',        -- バッジ色
            created_at TEXT
        );
    ''')

    # 7. タグマスタテーブル
    cur.execute('''
        CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            color TEXT DEFAULT '#3b82f6',
            count INTEGER DEFAULT 0
        );
    ''')

    conn.commit()

    # 初期シードデータ投入 (ノートブックが0件の場合のみ)
    cur.execute("SELECT COUNT(*) FROM notebooks")
    if cur.fetchone()[0] == 0:
        seed_sample_data(conn)

    conn.close()

def seed_sample_data(conn):
    """初期デモデータの登録"""
    cur = conn.cursor()
    now = datetime.now().isoformat()

    # タブフォルダ
    cur.execute("INSERT INTO tab_folders (id, name, color, icon, notebook_ids, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                ('tab-1', 'クッキングレシピ', '#3b82f6', 'book', json.dumps(['recipes']), now))
    cur.execute("INSERT INTO tab_folders (id, name, color, icon, notebook_ids, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                ('tab-2', 'システム開発設計', '#10b981', 'code', json.dumps(['system-dev']), now))

    # ノートブック
    cur.execute("INSERT INTO notebooks (id, name, description, icon, color, folder_id, root_node_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ('recipes', 'プロ直伝レシピ集', '本格料理と調理技法', 'utensils', '#f59e0b', 'tab-1', json.dumps(['rec-veg', 'rec-meat']), now, now))
    cur.execute("INSERT INTO notebooks (id, name, description, icon, color, folder_id, root_node_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ('system-dev', 'システム設計・Flask仕様', 'アーキテクチャ設計とソースコード', 'cpu', '#10b981', 'tab-2', json.dumps(['sys-doc', 'sys-code']), now, now))

    # ノードとコンテンツ
    cur.execute("INSERT INTO nodes (id, notebook_id, title, type, parent_id, children_ids, tags, is_bookmarked, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ('rec-veg', 'recipes', '野菜料理・前菜', 'rich-text', None, json.dumps(['rec-veg-ratatouille']), json.dumps(['基本技法', '夏野菜']), 1, now, now))
    cur.execute("INSERT INTO note_contents (node_id, content) VALUES (?, ?)",
                ('rec-veg', '<h2>🥗 野菜料理と前菜の基本</h2><p>素材ごとの加熱時間と塩分コントロールを徹底します。</p>'))

    cur.execute("INSERT INTO nodes (id, notebook_id, title, type, parent_id, children_ids, tags, is_bookmarked, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ('rec-veg-ratatouille', 'recipes', 'プロ直伝 濃厚ラタトゥイユ', 'rich-text', 'rec-veg', '[]', json.dumps(['シェフ特選']), 1, now, now))
    
    ratatouille_html = '''<h2>🥘 プロ直伝 濃厚ラタトゥイユ</h2>
<p>野菜それぞれの水分と旨味を凝縮させる本格仕立てです。</p>
<div id="cap-anchor-ratatouille-table" class="figure-caption-block my-2.5 p-2 rounded-lg border bg-slate-50 flex items-center gap-2.5" style="border-left: 4px solid #3b82f6;" data-caption-id="cap-1">
  <span class="px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-2xs shrink-0" style="background-color: #3b82f6;">表1</span>
  <div class="min-w-0 flex-1">
    <div class="text-xs font-semibold text-slate-800">ラタトゥイユの食材一覧と下処理メモ</div>
  </div>
</div>
<table style="width:100%; border-collapse: collapse; margin: 10px 0;">
  <tr style="background:#f1f5f9;"><th>食材</th><th>分量</th><th>下処理</th></tr>
  <tr><td>ナス</td><td>2本</td><td>1.5cm角切り・塩アク抜き</td></tr>
  <tr><td>ズッキーニ</td><td>1本</td><td>1.5cm角切り</td></tr>
  <tr><td>完熟トマト缶</td><td>1缶</td><td>手で細かく潰す</td></tr>
</table>'''
    cur.execute("INSERT INTO note_contents (node_id, content) VALUES (?, ?)", ('rec-veg-ratatouille', ratatouille_html))

    # キャプション初期データ
    cur.execute("INSERT INTO figure_captions (id, anchor_id, note_id, note_title, type, number_label, title, description, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ('cap-1', 'cap-anchor-ratatouille-table', 'rec-veg-ratatouille', 'プロ直伝 濃厚ラタトゥイユ', 'table', '表1', 'ラタトゥイユの食材一覧と下処理メモ', '4人分の食材分量と下ごしらえ基準', '#3b82f6', now))

    # タグ初期データ
    for t_name, t_col in [('シェフ特選', '#ef4444'), ('基本技法', '#64748b'), ('システム仕様', '#3b82f6')]:
        cur.execute("INSERT OR IGNORE INTO tags (id, name, color, count) VALUES (?, ?, ?, ?)", (str(uuid.uuid4()), t_name, t_col, 1))

    conn.commit()

# =========================================================================
# API エンドポイント (RESTful API)
# =========================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "Flask Hierarchical Note API", "db": "SQLite3 WAL"})

# --- 1. タブフォルダ API ---
@app.route('/api/tab-folders', methods=['GET'])
def get_tab_folders():
    conn = get_db()
    rows = conn.execute("SELECT * FROM tab_folders ORDER BY created_at ASC").fetchall()
    conn.close()
    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "name": r["name"],
            "color": r["color"],
            "icon": r["icon"],
            "notebookIds": json.loads(r["notebook_ids"] or "[]"),
            "createdAt": r["created_at"]
        })
    return jsonify(result)

# --- 2. ノートブック API ---
@app.route('/api/notebooks', methods=['GET'])
def get_notebooks():
    conn = get_db()
    rows = conn.execute("SELECT * FROM notebooks ORDER BY created_at ASC").fetchall()
    conn.close()
    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "name": r["name"],
            "description": r["description"],
            "icon": r["icon"],
            "color": r["color"],
            "folderId": r["folder_id"],
            "rootNodeIds": json.loads(r["root_node_ids"] or "[]"),
            "createdAt": r["created_at"],
            "updatedAt": r["updated_at"]
        })
    return jsonify(result)

# --- 3. ノード・ノート詳細 API ---
@app.route('/api/nodes', methods=['GET'])
def get_all_nodes():
    conn = get_db()
    nodes = conn.execute("SELECT n.*, c.content, c.spreadsheet_data, c.code_language FROM nodes n LEFT JOIN note_contents c ON n.id = c.node_id").fetchall()
    conn.close()
    
    result = {}
    for n in nodes:
        result[n["id"]] = {
            "id": n["id"],
            "notebookId": n["notebook_id"],
            "title": n["title"],
            "type": n["type"],
            "content": n["content"] or "",
            "parentId": n["parent_id"],
            "childrenIds": json.loads(n["children_ids"] or "[]"),
            "tags": json.loads(n["tags"] or "[]"),
            "isFolder": bool(n["is_folder"]),
            "isExpanded": bool(n["is_expanded"]),
            "isBookmarked": bool(n["is_bookmarked"]),
            "colorBadge": n["color_badge"],
            "icon": n["icon"],
            "customStyles": n["custom_styles"],
            "createdAt": n["created_at"],
            "updatedAt": n["updated_at"]
        }
    return jsonify(result)

@app.route('/api/nodes/<node_id>', methods=['GET'])
def get_single_node(node_id):
    conn = get_db()
    n = conn.execute("SELECT n.*, c.content FROM nodes n LEFT JOIN note_contents c ON n.id = c.node_id WHERE n.id = ?", (node_id,)).fetchone()
    conn.close()
    if not n:
        return jsonify({"error": "Node not found"}), 404
    
    return jsonify({
        "id": n["id"],
        "notebookId": n["notebook_id"],
        "title": n["title"],
        "type": n["type"],
        "content": n["content"] or "",
        "parentId": n["parent_id"],
        "childrenIds": json.loads(n["children_ids"] or "[]"),
        "tags": json.loads(n["tags"] or "[]"),
        "isBookmarked": bool(n["is_bookmarked"])
    })

@app.route('/api/nodes/<node_id>', methods=['PUT'])
def update_node(node_id):
    data = request.get_json() or {}
    conn = get_db()
    cur = conn.cursor()
    
    now = datetime.now().isoformat()
    cur.execute("""
        UPDATE nodes 
        SET title = COALESCE(?, title),
            tags = COALESCE(?, tags),
            is_bookmarked = COALESCE(?, is_bookmarked),
            custom_styles = COALESCE(?, custom_styles),
            updated_at = ?
        WHERE id = ?
    """, (
        data.get("title"),
        json.dumps(data.get("tags")) if "tags" in data else None,
        1 if data.get("isBookmarked") else 0 if "isBookmarked" in data else None,
        data.get("customStyles"),
        now,
        node_id
    ))

    if "content" in data:
        cur.execute("""
            INSERT INTO note_contents (node_id, content) VALUES (?, ?)
            ON CONFLICT(node_id) DO UPDATE SET content = excluded.content
        """, (node_id, data["content"]))

    conn.commit()
    conn.close()
    return jsonify({"status": "success", "updatedAt": now})

# --- 4. 図表キャプション API ---
@app.route('/api/figure-captions', methods=['GET'])
def get_figure_captions():
    conn = get_db()
    rows = conn.execute("SELECT * FROM figure_captions ORDER BY created_at ASC").fetchall()
    conn.close()
    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "anchorId": r["anchor_id"],
            "noteId": r["note_id"],
            "noteTitle": r["note_title"],
            "type": r["type"],
            "numberLabel": r["number_label"],
            "title": r["title"],
            "description": r["description"],
            "color": r["color"],
            "createdAt": r["created_at"]
        })
    return jsonify(result)

@app.route('/api/figure-captions', methods=['POST'])
def create_figure_caption():
    data = request.get_json() or {}
    conn = get_db()
    cur = conn.cursor()
    
    cap_id = data.get("id") or f"cap-{int(datetime.now().timestamp()*1000)}"
    now = datetime.now().isoformat()
    
    cur.execute("""
        INSERT INTO figure_captions (id, anchor_id, note_id, note_title, type, number_label, title, description, color, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        cap_id,
        data.get("anchorId"),
        data.get("noteId"),
        data.get("noteTitle"),
        data.get("type", "figure"),
        data.get("numberLabel", "図1"),
        data.get("title", ""),
        data.get("description", ""),
        data.get("color", "#10b981"),
        now
    ))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "id": cap_id}), 201

# --- 5. 全文検索 API ---
@app.route('/api/search', methods=['GET'])
def search_notes():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    conn = get_db()
    rows = conn.execute("""
        SELECT n.id, n.title, n.notebook_id, n.type, c.content 
        FROM nodes n 
        LEFT JOIN note_contents c ON n.id = c.node_id 
        WHERE n.title LIKE ? OR c.content LIKE ?
        LIMIT 50
    """, (f"%{query}%", f"%{query}%")).fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "nodeId": r["id"],
            "notebookId": r["notebook_id"],
            "title": r["title"],
            "type": r["type"],
            "snippet": (r["content"] or "")[:150]
        })
    return jsonify(results)

if __name__ == '__main__':
    print("=========================================================")
    print("🚀 Hierarchical Rich Note App - Flask Server Starting")
    print(f"📁 Database Location: {DATABASE_FILE}")
    print("🌐 Endpoint: http://localhost:5000")
    print("=========================================================")
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
`;

export const FLASK_PROJECT_FILES: FlaskSourceFile[] = [
  {
    path: 'app.py',
    language: 'python',
    description: '【スタンドアロン版】単一ファイルで即座に実行できるFlask+SQLiteサーバー',
    content: STANDALONE_FLASK_APP_CODE,
  },
  {
    path: 'requirements.txt',
    language: 'plaintext',
    description: 'Python依存関係パッケージ一覧 (pip install -r requirements.txt)',
    content: `Flask==3.0.3
Flask-Cors==4.0.1
Flask-SQLAlchemy==3.1.1
Flask-Migrate==4.0.7
SQLAlchemy==2.0.30
cryptography==42.0.8
python-dotenv==1.0.1
gunicorn==22.0.0
`,
  },
  {
    path: 'app/config.py',
    language: 'python',
    description: 'モジュール構成版: Flask設定クラス (環境変数・DB接続・暗号化キー)',
    content: `import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'hierarchical-rich-notes-secret-key-2026')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.join(BASE_DIR, "notes.db")}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_AS_ASCII = False
    MAX_CONTENT_LENGTH = 32 * 1024 * 1024  # 32 MB max upload
`,
  },
  {
    path: 'app/models.py',
    language: 'python',
    description: 'モジュール構成版: SQLAlchemy ORMデータモデル定義 (TabFolder, Notebook, Node, Caption, Bookmark)',
    content: `import uuid
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()

def generate_uuid():
    return str(uuid.uuid4())

class TabFolder(db.Model):
    __tablename__ = 'tab_folders'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    color = db.Column(db.String(20), default='#3b82f6')
    icon = db.Column(db.String(50), default='folder')
    notebook_ids = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Notebook(db.Model):
    __tablename__ = 'notebooks'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    icon = db.Column(db.String(50), nullable=True)
    color = db.Column(db.String(20), default='#3b82f6')
    folder_id = db.Column(db.String(36), db.ForeignKey('tab_folders.id', ondelete='SET NULL'), nullable=True)
    root_node_ids = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Node(db.Model):
    __tablename__ = 'nodes'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    notebook_id = db.Column(db.String(36), db.ForeignKey('notebooks.id', ondelete='CASCADE'), nullable=False, index=True)
    parent_id = db.Column(db.String(36), db.ForeignKey('nodes.id', ondelete='CASCADE'), nullable=True, index=True)
    title = db.Column(db.String(255), nullable=False, default='新規ノート')
    note_type = db.Column(db.String(30), nullable=False, default='rich-text')
    children_ids = db.Column(db.JSON, default=list)
    tags = db.Column(db.JSON, default=list)
    is_folder = db.Column(db.Boolean, default=False)
    is_bookmarked = db.Column(db.Boolean, default=False)
    custom_styles = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    content = db.relationship('NoteContent', backref='node', uselist=False, cascade='all, delete-orphan')

class NoteContent(db.Model):
    __tablename__ = 'note_contents'
    node_id = db.Column(db.String(36), db.ForeignKey('nodes.id', ondelete='CASCADE'), primary_key=True)
    content = db.Column(db.Text, nullable=True)
    spreadsheet_data = db.Column(db.JSON, nullable=True)
    code_language = db.Column(db.String(50), nullable=True)

class FigureCaption(db.Model):
    __tablename__ = 'figure_captions'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    anchor_id = db.Column(db.String(100), nullable=True)
    note_id = db.Column(db.String(36), db.ForeignKey('nodes.id', ondelete='CASCADE'), nullable=False)
    note_title = db.Column(db.String(255), nullable=True)
    type = db.Column(db.String(20), default='figure') # figure, table, chart, diagram
    number_label = db.Column(db.String(50), nullable=False) # 図1, 表1
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    color = db.Column(db.String(20), default='#10b981')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SentenceBookmark(db.Model):
    __tablename__ = 'sentence_bookmarks'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    anchor_id = db.Column(db.String(100), nullable=True)
    text = db.Column(db.Text, nullable=False)
    note_id = db.Column(db.String(36), db.ForeignKey('nodes.id', ondelete='CASCADE'), nullable=False)
    note_title = db.Column(db.String(255), nullable=True)
    color = db.Column(db.String(20), default='#f59e0b')
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
`,
  },
  {
    path: 'app/routes/figure_captions.py',
    language: 'python',
    description: 'モジュール構成版: 図表キャプション（図番号・表番号・タイトル）CRUD API',
    content: `from flask import Blueprint, request, jsonify
from app.models import db, FigureCaption

figure_captions_bp = Blueprint('figure_captions', __name__)

@figure_captions_bp.route('/', methods=['GET'])
def get_all_captions():
    captions = FigureCaption.query.order_by(FigureCaption.created_at.asc()).all()
    return jsonify([{
        'id': c.id,
        'anchorId': c.anchor_id,
        'noteId': c.note_id,
        'noteTitle': c.note_title,
        'type': c.type,
        'numberLabel': c.number_label,
        'title': c.title,
        'description': c.description,
        'color': c.color,
        'createdAt': c.created_at.isoformat() if c.created_at else None
    } for c in captions])

@figure_captions_bp.route('/', methods=['POST'])
def create_caption():
    data = request.get_json() or {}
    caption = FigureCaption(
        id=data.get('id'),
        anchor_id=data.get('anchorId'),
        note_id=data.get('noteId'),
        note_title=data.get('noteTitle'),
        type=data.get('type', 'figure'),
        number_label=data.get('numberLabel', '図1'),
        title=data.get('title', ''),
        description=data.get('description', ''),
        color=data.get('color', '#10b981')
    )
    db.session.add(caption)
    db.session.commit()
    return jsonify({'status': 'success', 'id': caption.id}), 201
`,
  },
  {
    path: 'README.md',
    language: 'markdown',
    description: 'Flaskバックエンドの導入・実行マニュアル',
    content: `# Hierarchical Rich Note App - Flask Backend

Python Flask 3.0 と SQLite (WAL高速モード) を使用した階層型リッチノート用バックエンドです。

## 🚀 クイックスタート (一番簡単な方法)

本ディレクトリの \`app.py\` は単一ファイルで全機能が完結するスタンドアロン仕様になっています。

\`\`\`bash
# 1. 依存ライブラリのインストール
pip install flask flask-cors

# 2. サーバー起動
python app.py
\`\`\`

起動すると \`http://localhost:5000\` でAPIが待機し、自動的に \`notes.db\` が初期化されてデモデータが投入されます。
`,
  },
];
