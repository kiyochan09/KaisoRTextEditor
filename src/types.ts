export type NoteType = 'rich' | 'spreadsheet' | 'code' | 'bookmark' | 'encrypted';

export interface TextFormatState {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikeThrough?: boolean;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: string;
  textAlign?: string;
}

export interface TagItem {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  count: number;
  parentId?: string;
}

export interface SpreadsheetCell {
  value: string;
  formula?: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    align?: 'left' | 'center' | 'right';
    bg?: string;
    color?: string;
  };
}

export interface SpreadsheetData {
  headers: string[]; // e.g. ["A", "B", "C", "D", "E"]
  rows: SpreadsheetCell[][];
  hasHeaderRow: boolean;
  lockHeader: boolean;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  visitedOn?: string;
  notes: string;
  thumbnailUrl?: string;
  favicon?: string;
}

export interface SentenceBookmark {
  id: string; // unique ID (e.g. 'sbm-1693140000000')
  nodeId: string; // Note ID
  notebookId?: string; // Notebook ID
  noteTitle: string; // Title of the parent note
  text: string; // The bookmarked sentence / text excerpt
  anchorId?: string; // HTML element ID in rich text (e.g. 'sbm-anchor-...')
  createdAt: string; // ISO date string
  color?: string; // Color code for accent/highlight
  comment?: string; // Optional user memo or tag
}

export type StyleCategory = 'character' | 'paragraph';

export interface TextStylePreset {
  id: string;
  name: string;
  category: StyleCategory;
  symbolPrefix?: string; // e.g. '↵' for paragraph styles
  // Character formatting
  fontFamily?: string;
  fontSize?: string; // e.g. '14px', '22px', '1.5em'
  fontWeight?: string; // 'bold', 'normal', '700', '600'
  fontStyle?: 'normal' | 'italic';
  textColor?: string;
  textDecoration?: string; // 'none', 'underline', 'line-through'
  underlineColor?: string;
  underlineStyle?: 'solid' | 'double' | 'dotted' | 'dashed' | 'wavy';
  backgroundColor?: string; // highlight or marker
  // Paragraph formatting
  headingLevel?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'blockquote' | 'pre';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: string; // e.g. '1.1', '1.4', '1.8', '2.2'
  letterSpacing?: string; // e.g. '0.05em'
  textIndent?: string; // e.g. '1em' (字下げ)
  marginTop?: string;
  marginBottom?: string;
  borderLeft?: string;
  paddingLeft?: string;
  isBuiltin?: boolean;
  isHidden?: boolean;
}

export interface TreeNode {
  id: string;
  notebookId: string;
  parentId: string | null;
  title: string;
  type: NoteType;
  icon?: string;
  colorBadge?: string; // e.g. 'orange', 'purple', 'yellow', 'green', 'cyan', 'pink', 'red'
  tags: string[]; // tag names
  created: string;
  updated: string;
  isFolder?: boolean;
  isEncrypted?: boolean;
  password?: string;
  isLocked?: boolean;
  isBookmarked?: boolean; // Star/Bookmark favorite flag
  bookmarkedAt?: string; // ISO date string or timestamp
  sentenceBookmarks?: SentenceBookmark[]; // Sentence-level bookmarks inside this note
  content: {
    richHtml?: string;
    spreadsheet?: SpreadsheetData;
    code?: {
      language: string;
      code: string;
    };
    bookmarks?: BookmarkItem[];
    plainText?: string;
  };
  children?: string[]; // IDs of child nodes
}

export interface TabFolder {
  id: string;
  name: string;
  parentId: string | null; // For hierarchical nesting of tab folders
  color?: string;
  icon?: string;
}

export interface Notebook {
  id: string;
  name: string;
  color: string;
  bgClass: string;
  borderClass: string;
  description?: string;
  nodeIds: string[]; // root node IDs
  folderId?: string | null; // TabFolder ID (null if root or unfiled)
}

export interface HistoryEntry {
  nodeId: string;
  notebookId: string;
  title: string;
  visitedAt: string;
  type: NoteType;
}

export interface SearchResult {
  nodeId: string;
  notebookId: string;
  notebookName: string;
  title: string;
  type: NoteType;
  matchType: 'title' | 'content' | 'tag' | 'spreadsheet';
  snippet: string;
}

export interface DatabaseProfile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
  storageLocation?: string;
  storageType?: 'browser_storage' | 'local_folder' | 'custom_file';
  storagePath?: string;
  tabFolders?: TabFolder[];
  notebooks: Notebook[];
  nodes: Record<string, TreeNode>;
  tags: TagItem[];
  sentenceBookmarks?: SentenceBookmark[];
  figureCaptions?: FigureCaption[];
  activeNotebookId?: string;
  activeNodeId?: string;
}

export interface FigureCaption {
  id: string; // unique ID
  nodeId: string; // The note this caption belongs to
  anchorId: string; // HTML element ID of the figure/table
  label: string; // e.g. "図1", "表2"
  title: string; // The user inputted caption title
  createdAt: string; // ISO date string
}

export type ResourcePanelTab = '検索' | 'タグ' | 'ブックマーク' | '履歴' | 'メモ' | '図表';

export type BodyWrapMode = 'full' | 'characters' | 'pixels' | 'none';

export interface SystemSettings {
  fontFamily: string;
  fontSize: string;
  bodyWrapMode: BodyWrapMode;
  bodyWrapValue: number;
  lineHeight: string;
  contentAlignment?: 'left' | 'center';
  pagePadding?: 'compact' | 'normal' | 'spacious';
  showRuler?: boolean;
}

