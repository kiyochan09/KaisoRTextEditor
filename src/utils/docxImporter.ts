import JSZip from 'jszip';
import mammoth from 'mammoth';
import { TreeNode, Notebook } from '../types';
import { createFootnoteHtml, parseAndRenumberHtml } from './footnoteUtils';
import { logInfo, logSuccess, logWarn, logError } from './errorLog';

export interface DocxImportPreviewNode {
  tempId: string;
  title: string;
  level: 1 | 2 | 3;
  isFolder: boolean;
  htmlContent: string;
  plainTextPreview: string;
  characterCount: number;
  paragraphCount: number;
  footnoteCount: number;
  imageCount: number;
  children: DocxImportPreviewNode[];
}

export interface DocxImportPreviewResult {
  fileName: string;
  tabName: string;
  totalNotes: number;
  totalFolders: number;
  totalCharacters: number;
  totalFootnotes: number;
  totalImages: number;
  rootNodes: DocxImportPreviewNode[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function unescapeXml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Detect if a text line strongly matches Japanese / English heading patterns
 */
export function detectHeadingLevelFromText(text: string): 1 | 2 | 3 | null {
  // Strip out any footnote markers or bracketed references like [1], [?], [※], [注1] before testing patterns
  const cleaned = text
    .replace(/\[[\d\?※\*A-Za-z\s]+\]/g, '')
    .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g, '')
    .trim();
  const trimmed = cleaned.trim();
  if (!trimmed || trimmed.length > 90) return null;

  // Level 1 patterns: 第X章, 第X部, 第X編, Chapter X, Part X, 1. , １．, 【...】, ■ ...
  if (
    /^第[0-9０-９一二三四五六七八九十百]+[章部編]/.test(trimmed) ||
    /^(?:chapter|part)\s+[0-9０-９ivx]+/i.test(trimmed) ||
    /^[0-9０-９]+[\.．\s]\s*[^\n。．]{2,50}$/.test(trimmed) ||
    /^【[^】]{2,40}】$/.test(trimmed) ||
    /^[■◆★]\s*[^\n。．]{2,45}$/.test(trimmed)
  ) {
    return 1;
  }

  // Level 2 patterns: 第X節, 第X款, Section X, 1.1, １．１, （１）, (1), ● ...
  if (
    /^第[0-9０-９一二三四五六七八九十百]+[節款]/.test(trimmed) ||
    /^section\s+[0-9０-９ivx]+/i.test(trimmed) ||
    /^[0-9０-９]+[\.．-][0-9０-９]+[\.．\s]\s*[^\n。．]{2,50}$/.test(trimmed) ||
    /^[（\(][0-9０-９一二三四五六七八九十]+[）\)]\s*[^\n。．]{2,50}$/.test(trimmed) ||
    /^[●▲▼▶◆]\s*[^\n。．]{2,45}$/.test(trimmed)
  ) {
    return 2;
  }

  // Level 3 patterns: 第X項, 1.1.1, １．１．１, ①, ②
  if (
    /^第[0-9０-９一二三四五六七八九十百]+項/.test(trimmed) ||
    /^[0-9０-９]+[\.．][0-9０-９]+[\.．][0-9０-９]+[\.．\s]\s*[^\n。．]{2,50}$/.test(trimmed) ||
    /^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]\s*[^\n。．]{2,50}$/.test(trimmed)
  ) {
    return 3;
  }

  return null;
}

/**
 * Extract all media images from DOCX zip container into Base64 Map
 */
async function extractAllMediaFromZip(zip: JSZip): Promise<Map<string, string>> {
  const mediaMap = new Map<string, string>();
  for (const filename of Object.keys(zip.files)) {
    const fileObj = zip.files[filename];
    if (!fileObj || fileObj.dir) continue;

    const lowerName = filename.toLowerCase();
    if (
      lowerName.includes('media/') ||
      /\.(png|jpe?g|gif|webp|svg|bmp|ico|tiff?|avif|emf|wmf)$/i.test(lowerName)
    ) {
      const ext = lowerName.split('.').pop() || 'png';
      let mime = 'image/png';
      if (ext === 'jpg' || ext === 'jpeg' || ext === 'jpe' || ext === 'jfif') mime = 'image/jpeg';
      else if (ext === 'gif') mime = 'image/gif';
      else if (ext === 'webp') mime = 'image/webp';
      else if (ext === 'svg') mime = 'image/svg+xml';
      else if (ext === 'bmp') mime = 'image/bmp';
      else if (ext === 'ico') mime = 'image/x-icon';
      else if (ext === 'tif' || ext === 'tiff') mime = 'image/tiff';
      else if (ext === 'avif') mime = 'image/avif';
      else if (ext === 'emf' || ext === 'wmf') mime = 'image/png';

      try {
        const b64 = await fileObj.async('base64');
        if (b64) {
          const dataUri = `data:${mime};base64,${b64}`;
          mediaMap.set(filename, dataUri);
          mediaMap.set(filename.replace(/^word\//, ''), dataUri);
          const baseName = filename.split('/').pop();
          if (baseName) {
            mediaMap.set(baseName, dataUri);
            mediaMap.set(decodeURIComponent(baseName), dataUri);
          }
        }
      } catch {
        // ignore
      }
    }
  }
  return mediaMap;
}

/**
 * Parse OpenXML relationships from all .rels files in zip
 */
async function parseRelationships(zip: JSZip): Promise<Map<string, { target: string; type: string }>> {
  const relsMap = new Map<string, { target: string; type: string }>();
  const relFiles = Object.keys(zip.files).filter((f) => f.endsWith('.rels'));
  
  for (const relPath of relFiles) {
    const file = zip.file(relPath);
    if (!file || file.dir) continue;
    try {
      const relsXml = await file.async('string');
      const relTagRegex = /<Relationship\b([^>]*)\/?>/gi;
      let rm;
      while ((rm = relTagRegex.exec(relsXml)) !== null) {
        const attrs = rm[1];
        const id = attrs.match(/\bId=["']([^"']+)["']/i)?.[1];
        const target = attrs.match(/\bTarget=["']([^"']+)["']/i)?.[1];
        const type = attrs.match(/\bType=["']([^"']+)["']/i)?.[1];
        if (id && target) {
          relsMap.set(id, { target, type: type || '' });
        }
      }
    } catch {
      // ignore
    }
  }
  return relsMap;
}

/**
 * Extract all footnotes and endnotes from DOCX ZIP archive
 */
export async function extractFootnotesFromZip(zip: JSZip): Promise<Map<string, string>> {
  const footnoteMap = new Map<string, string>();
  const parser = new DOMParser();

  const parseNotesXml = async (xmlPath: string, prefix: 'footnote' | 'endnote') => {
    const file = zip.file(xmlPath);
    if (!file || file.dir) return;
    try {
      const content = await file.async('string');
      const doc = parser.parseFromString(content, 'text/xml');
      
      const tagQuery = prefix === 'footnote' ? 'footnote, w\\:footnote' : 'endnote, w\\:endnote';
      let noteElements = Array.from(doc.querySelectorAll(tagQuery));
      if (noteElements.length === 0) {
        noteElements = Array.from(doc.getElementsByTagNameNS('*', prefix));
      }
      if (noteElements.length === 0) {
        noteElements = Array.from(doc.getElementsByTagName(prefix === 'footnote' ? 'w:footnote' : 'w:endnote'));
      }

      noteElements.forEach((el) => {
        const id = el.getAttribute('w:id') || el.getAttribute('id') || '';
        if (!id || parseInt(id, 10) <= 0) return; // skip separators (-1, 0)

        let tEls = Array.from(el.querySelectorAll('t, w\\:t'));
        if (tEls.length === 0) {
          tEls = Array.from(el.getElementsByTagNameNS('*', 't'));
        }
        if (tEls.length === 0) {
          tEls = Array.from(el.getElementsByTagName('w:t'));
        }

        const text = tEls.length > 0 
          ? tEls.map((t) => t.textContent || '').join('').trim()
          : el.textContent?.trim() || '';

        if (text) {
          footnoteMap.set(id, text);
          footnoteMap.set(`${prefix}-${id}`, text);
          footnoteMap.set(`footnote-${id}`, text);
          footnoteMap.set(`endnote-${id}`, text);
          footnoteMap.set(`_ftn${id}`, text);
          footnoteMap.set(`_edn${id}`, text);
          const numMatch = id.match(/\d+/);
          if (numMatch) {
            footnoteMap.set(numMatch[0], text);
            footnoteMap.set(`footnote-${numMatch[0]}`, text);
            footnoteMap.set(`endnote-${numMatch[0]}`, text);
          }
        }
      });
    } catch (e: any) {
      logWarn('docx-import', `${xmlPath} 解析エラー:`, e?.message);
    }
  };

  await parseNotesXml('word/footnotes.xml', 'footnote');
  await parseNotesXml('word/endnotes.xml', 'endnote');
  return footnoteMap;
}

/**
 * Extract all comments from DOCX ZIP archive (word/comments.xml)
 */
export async function extractCommentsFromZip(zip: JSZip): Promise<Map<string, { author: string; text: string; date?: string }>> {
  const commentMap = new Map<string, { author: string; text: string; date?: string }>();
  const file = zip.file('word/comments.xml');
  if (!file) return commentMap;

  try {
    const content = await file.async('string');
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');
    let commentElements = Array.from(doc.querySelectorAll('comment, w\\:comment'));
    if (commentElements.length === 0) {
      commentElements = Array.from(doc.getElementsByTagNameNS('*', 'comment'));
    }

    commentElements.forEach((el) => {
      const id = el.getAttribute('w:id') || el.getAttribute('id') || '';
      if (!id) return;
      const author = el.getAttribute('w:author') || el.getAttribute('author') || '作成者';
      const date = el.getAttribute('w:date') || el.getAttribute('date') || '';
      let tEls = Array.from(el.querySelectorAll('t, w\\:t'));
      if (tEls.length === 0) {
        tEls = Array.from(el.getElementsByTagNameNS('*', 't'));
      }
      const text = tEls.map((t) => t.textContent || '').join('').trim();
      if (text) {
        commentMap.set(id, { author, text, date });
      }
    });
  } catch {
    // ignore
  }
  return commentMap;
}

/**
 * Word Run (Inline) Formatting Definition
 */
interface DocxRunFormat {
  textColor?: string;
  backgroundColor?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  underlineStyle?: 'solid' | 'double' | 'wavy' | 'dotted' | 'dashed';
  underlineColor?: string;
  isStrike?: boolean;
  isSuper?: boolean;
  isSub?: boolean;
  fontFamily?: string;
  fontSize?: string;
}

/**
 * Standard Word Highlight Colors to CSS Colors
 */
const WORD_HIGHLIGHT_COLOR_MAP: Record<string, string> = {
  yellow: '#fef08a',       // 明るい黄色
  green: '#bbf7d0',        // 明るい緑
  cyan: '#a5f3fc',         // 水色
  magenta: '#fbcfe8',      // 明るいピンク
  blue: '#bfdbfe',         // 明るい青
  red: '#fecaca',          // 明るい赤
  darkblue: '#1e40af',     // 濃い青
  darkcyan: '#0e7490',     // 濃い青緑
  darkgreen: '#15803d',    // 濃い緑
  darkmagenta: '#86198f',  // 濃い紫
  darkred: '#991b1b',      // 濃い赤
  darkyellow: '#a16207',   // 濃い黄（黄土色）
  darkgray: '#475569',     // 濃い灰色
  lightgray: '#e2e8f0',    // 薄い灰色
  black: '#000000',
  white: '#ffffff',
};

/**
 * Parse Word OpenXML Run Properties (<w:rPr>) into a unified DocxRunFormat object.
 * Supports character style inheritance, text colors, marker highlights, background shading,
 * underlines with custom styles and colors, bold, italic, strikethrough, and fonts.
 */
function parseRunProperties(
  rPrEl: Element | null,
  characterStyleMap?: Map<string, DocxRunFormat>
): DocxRunFormat {
  if (!rPrEl) return {};

  const format: DocxRunFormat = {};

  // 1. Check style reference (e.g. <w:rStyle w:val="LINE1"/> or w:val="Emphasis")
  const rStyleEl = rPrEl.querySelector('rStyle, w\\:rStyle');
  const rStyleVal = rStyleEl?.getAttribute('w:val') || rStyleEl?.getAttribute('val');
  if (rStyleVal && characterStyleMap) {
    const inherited = characterStyleMap.get(rStyleVal) || characterStyleMap.get(rStyleVal.toLowerCase());
    if (inherited) {
      Object.assign(format, inherited);
    }
  }

  // 2. Bold: <w:b/> or <w:b w:val="true|1"/>, false if w:val="0|false|none"
  const bEl = rPrEl.querySelector('b, w\\:b, bCs, w\\:bCs');
  if (bEl) {
    const val = (bEl.getAttribute('w:val') || bEl.getAttribute('val') || '').toLowerCase();
    format.isBold = val === '' || val === '1' || val === 'true';
  }

  // 3. Italic: <w:i/> or <w:i w:val="true|1"/>
  const iEl = rPrEl.querySelector('i, w\\:i, iCs, w\\:iCs');
  if (iEl) {
    const val = (iEl.getAttribute('w:val') || iEl.getAttribute('val') || '').toLowerCase();
    format.isItalic = val === '' || val === '1' || val === 'true';
  }

  // 4. Strikethrough: <w:strike/> or <w:dstrike/>
  const strikeEl = rPrEl.querySelector('strike, w\\:strike, dstrike, w\\:dstrike');
  if (strikeEl) {
    const val = (strikeEl.getAttribute('w:val') || strikeEl.getAttribute('val') || '').toLowerCase();
    format.isStrike = val === '' || val === '1' || val === 'true';
  }

  // 5. Underline: <w:u w:val="..." w:color="..."/>
  const uEl = rPrEl.querySelector('u, w\\:u');
  if (uEl) {
    const val = (uEl.getAttribute('w:val') || uEl.getAttribute('val') || 'single').toLowerCase();
    if (val && val !== 'none' && val !== '0' && val !== 'false') {
      format.isUnderline = true;
      if (val.includes('wave') || val.includes('wavy')) {
        format.underlineStyle = 'wavy';
      } else if (val.includes('double')) {
        format.underlineStyle = 'double';
      } else if (val.includes('dot')) {
        format.underlineStyle = 'dotted';
      } else if (val.includes('dash')) {
        format.underlineStyle = 'dashed';
      } else {
        format.underlineStyle = 'solid';
      }

      const uColor = uEl.getAttribute('w:color') || uEl.getAttribute('color');
      if (uColor && uColor.toLowerCase() !== 'auto') {
        format.underlineColor = uColor.startsWith('#') ? uColor : `#${uColor}`;
      }
    } else if (val === 'none' || val === '0' || val === 'false') {
      format.isUnderline = false;
    }
  }

  // 6. Text Color: <w:color w:val="..." w:themeColor="..."/>
  const colorEl = rPrEl.querySelector('color, w\\:color');
  if (colorEl) {
    const val = colorEl.getAttribute('w:val') || colorEl.getAttribute('val');
    if (val && val.toLowerCase() !== 'auto') {
      format.textColor = val.startsWith('#') ? val : `#${val}`;
    }
  }

  // 7. Highlight (Marker): <w:highlight w:val="..."/>
  const highlightEl = rPrEl.querySelector('highlight, w\\:highlight');
  if (highlightEl) {
    const val = (highlightEl.getAttribute('w:val') || highlightEl.getAttribute('val') || '').toLowerCase();
    if (val && val !== 'none') {
      format.backgroundColor = WORD_HIGHLIGHT_COLOR_MAP[val] || (val.startsWith('#') ? val : `#${val}`);
    }
  }

  // 8. Background Shading / Fill: <w:shd w:fill="..."/>
  const shdEl = rPrEl.querySelector('shd, w\\:shd');
  if (shdEl) {
    const fill = shdEl.getAttribute('w:fill') || shdEl.getAttribute('fill');
    if (fill && fill.toLowerCase() !== 'auto' && fill.toLowerCase() !== 'none') {
      format.backgroundColor = fill.startsWith('#') ? fill : `#${fill}`;
    }
  }

  // 9. Vertical Align (Superscript / Subscript): <w:vertAlign w:val="superscript|subscript"/>
  const vertEl = rPrEl.querySelector('vertAlign, w\\:vertAlign');
  if (vertEl) {
    const val = (vertEl.getAttribute('w:val') || vertEl.getAttribute('val') || '').toLowerCase();
    if (val === 'superscript') format.isSuper = true;
    else if (val === 'subscript') format.isSub = true;
  }

  // 10. Font Family: <w:rFonts w:ascii="..." w:eastAsia="..."/>
  const rFontsEl = rPrEl.querySelector('rFonts, w\\:rFonts');
  if (rFontsEl) {
    const font = rFontsEl.getAttribute('w:eastAsia') || rFontsEl.getAttribute('w:ascii') || rFontsEl.getAttribute('eastAsia') || rFontsEl.getAttribute('ascii');
    if (font && font.toLowerCase() !== 'auto') {
      format.fontFamily = font;
    }
  }

  // 11. Font Size: <w:sz w:val="..."/> (half points: 24 = 12pt)
  const szEl = rPrEl.querySelector('sz, w\\:sz');
  if (szEl) {
    const val = szEl.getAttribute('w:val') || szEl.getAttribute('val');
    if (val) {
      const halfPt = parseInt(val, 10);
      if (halfPt > 0) {
        format.fontSize = `${halfPt / 2}pt`;
      }
    }
  }

  return format;
}

/**
 * Apply DocxRunFormat styles to an escaped text snippet, generating standard HTML and inline styles
 */
function applyFormatToHtml(text: string, format: DocxRunFormat): string {
  if (!text) return '';
  let res = escapeHtml(text);

  // Build inline CSS styles
  const styles: string[] = [];
  if (format.textColor) {
    styles.push(`color: ${format.textColor};`);
  }
  if (format.backgroundColor) {
    styles.push(`background-color: ${format.backgroundColor};`);
  }
  if (format.isUnderline) {
    styles.push('text-decoration: underline;');
    if (format.underlineStyle && format.underlineStyle !== 'solid') {
      styles.push(`text-decoration-style: ${format.underlineStyle};`);
    }
    if (format.underlineColor) {
      styles.push(`text-decoration-color: ${format.underlineColor};`);
    }
  } else if (format.isStrike) {
    styles.push('text-decoration: line-through;');
  }
  if (format.fontFamily) {
    styles.push(`font-family: '${format.fontFamily}', sans-serif;`);
  }
  if (format.fontSize) {
    styles.push(`font-size: ${format.fontSize};`);
  }

  if (styles.length > 0) {
    res = `<span style="${styles.join(' ')}">${res}</span>`;
  }

  if (format.isBold) {
    res = `<strong>${res}</strong>`;
  }
  if (format.isItalic) {
    res = `<em>${res}</em>`;
  }
  if (format.isSuper) {
    res = `<sup>${res}</sup>`;
  }
  if (format.isSub) {
    res = `<sub>${res}</sub>`;
  }

  return res;
}

/**
 * High-Fidelity Word OpenXML Parser using browser's native DOMParser (XML DOM)
 * Accurately extracts:
 * - Font colors, background marker highlights, shading
 * - Underlines with line style (solid, wavy, double, dotted) and line colors
 * - Character styles and paragraph styles from word/styles.xml
 * - Heading structure (Levels 1 to 6)
 * - Footnotes and Endnotes
 * - Images and media
 * - Paragraph alignments (center, right, justify)
 * - Tables and cell formatting
 * - Comments, textboxes, bookmarks and anchor links
 */
async function parseWithXmlDom(
  zip: JSZip,
  mediaMap: Map<string, string>,
  relsMap: Map<string, { target: string; type: string }>
): Promise<{ rawHtml: string; footnoteMap: Map<string, string> }> {
  const docFile = zip.file('word/document.xml');
  if (!docFile) {
    throw new Error('word/document.xml not found');
  }

  const docXml = await docFile.async('string');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXml, 'text/xml');

  // Read footnotes, endnotes, and comments directly from zip
  const footnoteMap = await extractFootnotesFromZip(zip);
  const commentMap = await extractCommentsFromZip(zip);

  // Read style definitions from word/styles.xml
  const headingStyles = new Map<string, number>();
  const characterStyleMap = new Map<string, DocxRunFormat>();
  const paragraphStyleMap = new Map<string, { alignment?: string; runFormat?: DocxRunFormat }>();

  const stylesFile = zip.file('word/styles.xml');
  if (stylesFile) {
    try {
      const stylesContent = await stylesFile.async('string');
      const stylesDoc = parser.parseFromString(stylesContent, 'text/xml');
      const styleEls = Array.from(stylesDoc.querySelectorAll('style, w\\:style'));
      styleEls.forEach((st) => {
        const styleId = st.getAttribute('w:styleId') || st.getAttribute('styleId') || '';
        const styleType = st.getAttribute('w:type') || st.getAttribute('type') || '';
        const nameEl = st.querySelector('name, w\\:name');
        const nameVal = nameEl?.getAttribute('w:val') || '';
        const outlineEl = st.querySelector('outlineLvl, w\\:outlineLvl');
        const rPrEl = st.querySelector('rPr, w\\:rPr');
        const pPrEl = st.querySelector('pPr, w\\:pPr');
        
        // 1. Heading level detection
        let lvl = 0;
        if (outlineEl) {
          const val = parseInt(outlineEl.getAttribute('w:val') || outlineEl.getAttribute('val') || '-1', 10);
          if (val >= 0 && val < 6) lvl = val + 1;
        }
        if (!lvl && nameVal) {
          const lower = `${styleId} ${nameVal}`.toLowerCase();
          if (/heading\s*1|見出し\s*1|title|タイトル|^1$/i.test(lower)) lvl = 1;
          else if (/heading\s*2|見出し\s*2|subtitle|サブタイトル|^2$/i.test(lower)) lvl = 2;
          else if (/heading\s*3|見出し\s*3|^3$/i.test(lower)) lvl = 3;
          else if (/heading\s*4|見出し\s*4|^4$/i.test(lower)) lvl = 4;
          else if (/heading\s*5|見出し\s*5|^5$/i.test(lower)) lvl = 5;
          else if (/heading\s*6|見出し\s*6|^6$/i.test(lower)) lvl = 6;
        }
        if (lvl > 0 && lvl <= 6) {
          if (styleId) headingStyles.set(styleId, lvl);
          if (nameVal) headingStyles.set(nameVal, lvl);
        }

        // 2. Character styles (colors, markers, underlines, fonts)
        if (styleType === 'character' || rPrEl) {
          const fmt = parseRunProperties(rPrEl);
          if (styleId) characterStyleMap.set(styleId, fmt);
          if (nameVal) characterStyleMap.set(nameVal, fmt);
        }

        // 3. Paragraph styles (alignment, default text format)
        if (pPrEl || rPrEl) {
          const jcEl = pPrEl?.querySelector('jc, w\\:jc');
          const jcVal = (jcEl?.getAttribute('w:val') || jcEl?.getAttribute('val') || '').toLowerCase();
          let alignment: string | undefined = undefined;
          if (jcVal === 'center') alignment = 'center';
          else if (jcVal === 'right') alignment = 'right';
          else if (jcVal === 'both' || jcVal === 'distribute') alignment = 'justify';

          const pData = {
            alignment,
            runFormat: rPrEl ? parseRunProperties(rPrEl) : undefined,
          };
          if (styleId) paragraphStyleMap.set(styleId, pData);
          if (nameVal) paragraphStyleMap.set(nameVal, pData);
        }
      });
    } catch {
      // ignore styles parsing error
    }
  }

  // Add standard heading defaults
  const defaultMap: Record<string, number> = {
    '1': 1, 'Heading1': 1, 'heading 1': 1, '見出し1': 1, '見出し 1': 1, 'Title': 1, 'タイトル': 1,
    '2': 2, 'Heading2': 2, 'heading 2': 2, '見出し2': 2, '見出し 2': 2, 'Subtitle': 2, 'サブタイトル': 2,
    '3': 3, 'Heading3': 3, 'heading 3': 3, '見出し3': 3, '見出し 3': 3,
    '4': 4, 'Heading4': 4, 'heading 4': 4, '見出し4': 4, '見出し 4': 4,
  };
  Object.entries(defaultMap).forEach(([k, v]) => {
    if (!headingStyles.has(k)) headingStyles.set(k, v);
  });

  const htmlParts: string[] = [];

  // Helper to find image URI by rId or target path
  const resolveImageUri = (rIdOrTarget: string): string | null => {
    if (!rIdOrTarget) return null;
    const rel = relsMap.get(rIdOrTarget);
    const target = rel ? rel.target : rIdOrTarget;
    const cleanTarget = target.replace(/^\//, '').replace(/^(\.\.\/)+/, '');
    const decoded = decodeURIComponent(cleanTarget);
    const base = cleanTarget.split('/').pop() || '';

    return (
      mediaMap.get(rIdOrTarget) ||
      mediaMap.get(target) ||
      mediaMap.get(cleanTarget) ||
      mediaMap.get(`word/${cleanTarget}`) ||
      mediaMap.get(decoded) ||
      mediaMap.get(`word/${decoded}`) ||
      mediaMap.get(base) ||
      null
    );
  };

  // Process Paragraph Element with full style fidelity
  const parseParagraphElement = (pEl: Element): { html: string; isHeading: boolean; level: number; text: string } => {
    const pStyleEl = pEl.querySelector('pStyle, w\\:pStyle');
    const styleVal = pStyleEl?.getAttribute('w:val') || pStyleEl?.getAttribute('val') || '';
    
    let headingLvl = headingStyles.get(styleVal) || 0;
    const outlineEl = pEl.querySelector('outlineLvl, w\\:outlineLvl');
    if (outlineEl) {
      const val = parseInt(outlineEl.getAttribute('w:val') || outlineEl.getAttribute('val') || '-1', 10);
      if (val >= 0 && val < 6) headingLvl = val + 1;
    }

    // Paragraph alignment (from direct pPr or paragraph style)
    const pPrEl = pEl.querySelector('pPr, w\\:pPr');
    const jcEl = pPrEl?.querySelector('jc, w\\:jc');
    const directJc = (jcEl?.getAttribute('w:val') || jcEl?.getAttribute('val') || '').toLowerCase();
    let pAlign = '';
    if (directJc === 'center') pAlign = 'center';
    else if (directJc === 'right') pAlign = 'right';
    else if (directJc === 'both' || directJc === 'distribute') pAlign = 'justify';
    else if (styleVal && paragraphStyleMap.has(styleVal)) {
      pAlign = paragraphStyleMap.get(styleVal)?.alignment || '';
    }

    const pAlignStyle = pAlign ? ` style="text-align: ${pAlign};"` : '';

    let pInnerHtml = '';
    let pPlainText = '';

    // Check for Word bookmark at paragraph start
    const pBmStart = pEl.querySelector('bookmarkStart, w\\:bookmarkStart');
    if (pBmStart) {
      const bmName = pBmStart.getAttribute('w:name') || pBmStart.getAttribute('name') || '';
      if (bmName && !bmName.startsWith('_')) {
        pInnerHtml += `<span id="bm-${escapeHtml(bmName)}" class="docx-bookmark inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[11px] font-semibold" title="ブックマーク: ${escapeHtml(bmName)}">🔖</span>`;
      }
    }

    // Walk through child nodes of paragraph (runs, hyperlinks, drawings, textboxes)
    const childNodes = Array.from(pEl.childNodes);
    childNodes.forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as Element;
      const localName = el.localName || el.nodeName.replace(/^w:/, '');

      if (localName === 'r') {
        const rPrEl = el.querySelector('rPr, w\\:rPr');
        const format = parseRunProperties(rPrEl, characterStyleMap);

        // Footnote or Endnote reference
        const fnRef = el.querySelector('footnoteReference, w\\:footnoteReference, endnoteReference, w\\:endnoteReference');
        let fnHtml = '';
        if (fnRef) {
          const fnId = fnRef.getAttribute('w:id') || fnRef.getAttribute('id') || '';
          if (fnId && parseInt(fnId, 10) > 0) {
            const noteText = footnoteMap.get(fnId) || footnoteMap.get(`footnote-${fnId}`) || footnoteMap.get(`endnote-${fnId}`) || '注釈';
            const uid = `fn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            fnHtml = createFootnoteHtml(noteText, uid);
          }
        }

        // Word Comment reference
        let commentHtml = '';
        const commentRef = el.querySelector('commentReference, w\\:commentReference');
        if (commentRef) {
          const cid = commentRef.getAttribute('w:id') || commentRef.getAttribute('id') || '';
          if (cid && commentMap.has(cid)) {
            const cInfo = commentMap.get(cid)!;
            commentHtml = `<span class="docx-comment inline-flex items-center gap-1 px-1.5 py-0.5 my-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-xs font-medium cursor-help" title="【コメント】${escapeHtml(cInfo.author)}: ${escapeHtml(cInfo.text)}">💬 <span class="text-[10px] font-semibold">[コメント: ${escapeHtml(cInfo.text)}]</span></span>`;
          }
        }

        // Word Bookmark in run
        let bmHtml = '';
        const rBmStart = el.querySelector('bookmarkStart, w\\:bookmarkStart');
        if (rBmStart) {
          const bmName = rBmStart.getAttribute('w:name') || rBmStart.getAttribute('name') || '';
          if (bmName && !bmName.startsWith('_')) {
            bmHtml = `<span id="bm-${escapeHtml(bmName)}" class="docx-bookmark inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[11px] font-semibold" title="ブックマーク: ${escapeHtml(bmName)}">🔖</span>`;
          }
        }

        // Images inside run
        const blip = el.querySelector('blip, a\\:blip');
        const imgData = el.querySelector('imagedata, v\\:imagedata');
        let imgHtml = '';
        const rId = blip?.getAttribute('r:embed') || blip?.getAttribute('embed') || imgData?.getAttribute('r:id') || imgData?.getAttribute('id') || '';
        if (rId) {
          const uri = resolveImageUri(rId);
          if (uri) {
            imgHtml = `<div class="my-3 block"><img src="${uri}" alt="画像" class="max-w-full h-auto rounded-lg border border-slate-200 shadow-xs" loading="lazy" /></div>`;
          }
        }

        // Text nodes or breaks inside run
        let runFormattedHtml = '';
        const childElements = Array.from(el.children);
        let hasDirectChildText = false;

        childElements.forEach((childEl) => {
          const childName = childEl.localName || childEl.nodeName.replace(/^w:/, '');
          if (childName === 't') {
            hasDirectChildText = true;
            const tText = childEl.textContent || '';
            pPlainText += tText;
            runFormattedHtml += applyFormatToHtml(tText, format);
          } else if (childName === 'br' || childName === 'cr') {
            pPlainText += '\n';
            runFormattedHtml += '<br/>';
          } else if (childName === 'tab') {
            pPlainText += '\t';
            runFormattedHtml += '&emsp;';
          }
        });

        // Fallback for nested text nodes
        if (!hasDirectChildText) {
          const tEls = Array.from(el.querySelectorAll('t, w\\:t'));
          const runText = tEls.map((t) => t.textContent || '').join('');
          if (runText) {
            pPlainText += runText;
            runFormattedHtml = applyFormatToHtml(runText, format);
          }
        }

        pInnerHtml += runFormattedHtml + imgHtml + fnHtml + commentHtml + bmHtml;
      } else if (localName === 'hyperlink') {
        const rId = el.getAttribute('r:id') || el.getAttribute('id') || '';
        const anchor = el.getAttribute('w:anchor') || el.getAttribute('anchor') || '';
        const rel = relsMap.get(rId);
        let href = rel ? rel.target : (anchor ? `#bm-${anchor}` : '#');
        let linkInnerHtml = '';
        const innerRuns = Array.from(el.querySelectorAll('r, w\\:r'));

        if (innerRuns.length > 0) {
          innerRuns.forEach((rEl) => {
            const rPrEl = rEl.querySelector('rPr, w\\:rPr');
            const format = parseRunProperties(rPrEl, characterStyleMap);
            const tEls = Array.from(rEl.querySelectorAll('t, w\\:t'));
            const runText = tEls.map((t) => t.textContent || '').join('');
            pPlainText += runText;
            linkInnerHtml += applyFormatToHtml(runText, format);
          });
        } else {
          const linkText = el.textContent || '';
          pPlainText += linkText;
          linkInnerHtml = escapeHtml(linkText);
        }

        pInnerHtml += `<a href="${escapeHtml(href)}" target="${href.startsWith('http') ? '_blank' : '_self'}" rel="noopener noreferrer" class="text-blue-600 hover:underline font-medium">${linkInnerHtml}</a>`;
      } else if (localName === 'drawing' || localName === 'pict') {
        // Images in drawing/pict
        const blip = el.querySelector('blip, a\\:blip');
        const imgData = el.querySelector('imagedata, v\\:imagedata');
        const rId = blip?.getAttribute('r:embed') || blip?.getAttribute('embed') || imgData?.getAttribute('r:id') || imgData?.getAttribute('id') || '';
        if (rId) {
          const uri = resolveImageUri(rId);
          if (uri) {
            pInnerHtml += `<div class="my-3 block"><img src="${uri}" alt="画像" class="max-w-full h-auto rounded-lg border border-slate-200 shadow-xs" loading="lazy" /></div>`;
          }
        }

        // Textbox inside drawing / pict (Word TextBox)
        const txbxEl = el.querySelector('txbxContent, w\\:txbxContent');
        if (txbxEl) {
          const txbxParas = Array.from(txbxEl.querySelectorAll('p, w\\:p'));
          const txbxHtmlParts = txbxParas.map((tp) => {
            const trEls = Array.from(tp.querySelectorAll('r, w\\:r'));
            const tpText = trEls.map(tr => {
              const ttEls = Array.from(tr.querySelectorAll('t, w\\:t'));
              return ttEls.map(tt => tt.textContent || '').join('');
            }).join('').trim();
            return tpText ? `<p class="my-1">${escapeHtml(tpText)}</p>` : '';
          }).filter(Boolean);

          if (txbxHtmlParts.length > 0) {
            pInnerHtml += `<div class="callout-box my-3 p-3.5 rounded-lg border-2 border-blue-400 bg-blue-50/80 text-slate-800 text-sm shadow-xs"><div class="text-xs font-bold text-blue-700 mb-1.5 flex items-center gap-1.5">📋 テキストボックス</div>${txbxHtmlParts.join('')}</div>`;
          }
        }
      }
    });

    // Paragraph-level textbox check
    const pTxbxEl = pEl.querySelector('txbxContent, w\\:txbxContent');
    if (pTxbxEl && !pInnerHtml.includes('callout-box')) {
      const txbxParas = Array.from(pTxbxEl.querySelectorAll('p, w\\:p'));
      const txbxHtmlParts = txbxParas.map((tp) => {
        const trEls = Array.from(tp.querySelectorAll('r, w\\:r'));
        const tpText = trEls.map(tr => {
          const ttEls = Array.from(tr.querySelectorAll('t, w\\:t'));
          return ttEls.map(tt => tt.textContent || '').join('');
        }).join('').trim();
        return tpText ? `<p class="my-1">${escapeHtml(tpText)}</p>` : '';
      }).filter(Boolean);

      if (txbxHtmlParts.length > 0) {
        pInnerHtml += `<div class="callout-box my-3 p-3.5 rounded-lg border-2 border-blue-400 bg-blue-50/80 text-slate-800 text-sm shadow-xs"><div class="text-xs font-bold text-blue-700 mb-1.5 flex items-center gap-1.5">📋 テキストボックス</div>${txbxHtmlParts.join('')}</div>`;
      }
    }

    const trimmed = pPlainText.trim();
    if (!headingLvl && trimmed) {
      const detected = detectHeadingLevelFromText(trimmed);
      if (detected) headingLvl = detected;
    }

    if (headingLvl >= 1 && headingLvl <= 6 && trimmed) {
      return {
        html: `<h${headingLvl}${pAlignStyle}>${pInnerHtml || escapeHtml(trimmed)}</h${headingLvl}>`,
        isHeading: true,
        level: headingLvl,
        text: trimmed,
      };
    }

    if (!pInnerHtml.trim() && !pPlainText.trim()) {
      return { html: '<p></p>', isHeading: false, level: 0, text: '' };
    }

    return {
      html: `<p${pAlignStyle}>${pInnerHtml}</p>`,
      isHeading: false,
      level: 0,
      text: pPlainText,
    };
  };

  // Process Table Element with cell background and formatting
  const parseTableElement = (tblEl: Element): string => {
    let tblHtml = '<table class="border-collapse border border-slate-300 my-3 w-full text-xs">';
    const rows = Array.from(tblEl.querySelectorAll('tr, w\\:tr'));
    rows.forEach((tr) => {
      tblHtml += '<tr>';
      const cells = Array.from(tr.querySelectorAll('tc, w\\:tc'));
      cells.forEach((tc) => {
        // Cell background shading
        const tcShdEl = tc.querySelector('tcPr > shd, w\\:tcPr > w\\:shd');
        const tcFill = tcShdEl?.getAttribute('w:fill') || tcShdEl?.getAttribute('fill');
        let tcBgStyle = '';
        if (tcFill && tcFill.toLowerCase() !== 'auto' && tcFill.toLowerCase() !== 'none') {
          tcBgStyle = ` background-color: ${tcFill.startsWith('#') ? tcFill : `#${tcFill}`};`;
        }

        const paragraphs = Array.from(tc.querySelectorAll('p, w\\:p'));
        let cellContent = '';
        paragraphs.forEach((p) => {
          const res = parseParagraphElement(p);
          if (res.html && res.html !== '<p></p>') {
            cellContent += (cellContent ? '<br/>' : '') + res.html.replace(/<\/?p[^>]*>/g, '');
          }
        });
        tblHtml += `<td class="border border-slate-300 p-2 align-top" style="${tcBgStyle}">${cellContent || '&nbsp;'}</td>`;
      });
      tblHtml += '</tr>';
    });
    tblHtml += '</table>';
    return tblHtml;
  };

  // Traverse all body child elements in document order
  const bodyEl = xmlDoc.querySelector('body, w\\:body');
  if (bodyEl) {
    const children = Array.from(bodyEl.children);
    children.forEach((child) => {
      const localName = child.localName || child.nodeName.replace(/^w:/, '');
      if (localName === 'p') {
        const res = parseParagraphElement(child);
        if (res.html && res.html !== '<p></p>') htmlParts.push(res.html);
      } else if (localName === 'tbl') {
        htmlParts.push(parseTableElement(child));
      } else if (localName === 'sdt') {
        // Structured document tags (SDT)
        const innerP = Array.from(child.querySelectorAll('p, w\\:p'));
        innerP.forEach((p) => {
          const res = parseParagraphElement(p);
          if (res.html && res.html !== '<p></p>') htmlParts.push(res.html);
        });
      }
    });
  }

  return {
    rawHtml: htmlParts.join('\n'),
    footnoteMap,
  };
}

/**
 * Robust High-Accuracy DOCX Parser: Mammoth.js + XML DOM dual-engine
 */
export async function parseDocxFile(
  file: File | Blob | ArrayBuffer,
  fileName: string = 'imported_document.docx'
): Promise<DocxImportPreviewResult> {
  logInfo('docx-import', `DOCX解析を開始します: ${fileName}`);
  const rawBuffer = file instanceof Blob ? await file.arrayBuffer() : file;
  const tabName = fileName.replace(/\.[^/.]+$/, '') || 'インポート文書';

  let rawHtml = '';
  let footnoteMap = new Map<string, string>();

  // Extract all media items from ZIP first
  let zip: JSZip | null = null;
  let mediaMap = new Map<string, string>();
  let relsMap = new Map<string, { target: string; type: string }>();

  try {
    zip = await JSZip.loadAsync(rawBuffer.slice(0));
    mediaMap = await extractAllMediaFromZip(zip);
    relsMap = await parseRelationships(zip);
    footnoteMap = await extractFootnotesFromZip(zip);
    logInfo('docx-import', `ZIPアーカイブ展開完了: 画像メディア ${mediaMap.size} 件, リレーション ${relsMap.size} 件, 脚注 ${footnoteMap.size} 件`);
  } catch (zipErr: any) {
    logWarn('docx-import', 'JSZip展開通知 (標準XML走査へフォールバックします)', zipErr?.message);
  }

  // --- Engine 1: XML DOM Parser via JSZip (High-Fidelity: Preserves colors, markers, underlines, headings, footnotes) ---
  if (zip) {
    try {
      logInfo('docx-import', 'XML DOM (OpenXML直接高精度解析) エンジンを実行します...');
      const xmlDomRes = await parseWithXmlDom(zip, mediaMap, relsMap);
      if (xmlDomRes.rawHtml.trim()) {
        rawHtml = xmlDomRes.rawHtml;
        if (xmlDomRes.footnoteMap.size > 0) {
          xmlDomRes.footnoteMap.forEach((v, k) => footnoteMap.set(k, v));
        }
        logSuccess('docx-import', `XML DOM 高精度解析成功: HTML生成完了 (長さ: ${rawHtml.length} 文字, 脚注: ${footnoteMap.size} 件)`);
      }
    } catch (xmlErr: any) {
      logWarn('docx-import', 'XML DOMエンジン通知 (Mammoth.jsへフォールバックします):', xmlErr?.message);
    }
  }

  // --- Engine 2: Mammoth.js Fallback Engine ---
  if (!rawHtml.trim()) {
    try {
      logInfo('docx-import', 'Mammoth.js フォールバックエンジンを実行します...');
      const mammothOptions = {
        styleMap: [
          "u => u",
          "strike => s",
          "p[style-name = 'Heading 1'] => h1:fresh",
          "p[style-name = 'heading 1'] => h1:fresh",
          "p[style-name = '見出し 1'] => h1:fresh",
          "p[style-name = '見出し1'] => h1:fresh",
          "p[style-name = 'Title'] => h1:fresh",
          "p[style-name = 'タイトル'] => h1:fresh",
          "p[style-name = 'Heading 2'] => h2:fresh",
          "p[style-name = 'heading 2'] => h2:fresh",
          "p[style-name = '見出し 2'] => h2:fresh",
          "p[style-name = '見出し2'] => h2:fresh",
          "p[style-name = 'Subtitle'] => h2:fresh",
          "p[style-name = 'サブタイトル'] => h2:fresh",
          "p[style-name = 'Heading 3'] => h3:fresh",
          "p[style-name = 'heading 3'] => h3:fresh",
          "p[style-name = '見出し 3'] => h3:fresh",
          "p[style-name = '見出し3'] => h3:fresh",
          "p[style-name = 'Heading 4'] => h4:fresh",
          "p[style-name = 'heading 4'] => h4:fresh",
          "p[style-name = '見出し 4'] => h4:fresh",
          "p[style-name = '見出し4'] => h4:fresh",
          "p[style-name = 'Heading 5'] => h5:fresh",
          "p[style-name = 'heading 5'] => h5:fresh",
          "p[style-name = 'Heading 6'] => h6:fresh",
          "p[style-name = 'heading 6'] => h6:fresh",
        ],
        convertImage: mammoth.images.imgElement((element: any) => {
          return element.read('base64').then((imageBuffer: string) => {
            return {
              src: `data:${element.contentType || 'image/png'};base64,${imageBuffer}`,
            };
          });
        }),
      };

      // Mammoth input compatible with browser (arrayBuffer) and Node.js (buffer)
      const mammothInput: any = {};
      if (rawBuffer instanceof ArrayBuffer) {
        mammothInput.arrayBuffer = rawBuffer;
      } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(rawBuffer)) {
        const buf = rawBuffer as any;
        mammothInput.buffer = buf;
        mammothInput.arrayBuffer = buf.buffer.slice(
          buf.byteOffset,
          buf.byteOffset + buf.byteLength
        );
      } else {
        mammothInput.arrayBuffer = rawBuffer;
      }

      const mammothRes = await mammoth.convertToHtml(
        mammothInput,
        mammothOptions
      );
      if (mammothRes && mammothRes.value && mammothRes.value.trim().length > 0) {
        rawHtml = mammothRes.value;
        logSuccess('docx-import', `Mammoth.js で HTML 変換成功 (長さ: ${rawHtml.length} 文字)`);
      }
    } catch (mErr: any) {
      logWarn('docx-import', 'Mammoth解析例外:', mErr?.message);
    }
  }

  // --- Engine 3: Emergency Text Rescue ---
  if (!rawHtml.trim() && zip) {
    logInfo('docx-import', 'テキスト救出エンジン (Emergency Text Rescue) を実行します...');
    const allText: string[] = [];
    const docFiles = Object.keys(zip.files).filter((f) => f.startsWith('word/') && f.endsWith('.xml'));
    for (const path of docFiles) {
      if (path.includes('styles') || path.includes('settings') || path.includes('fontTable')) continue;
      const f = zip.file(path);
      if (!f) continue;
      try {
        const xml = await f.async('string');
        const matches = xml.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi) || [];
        const extracted = matches.map((m) => unescapeXml(m.replace(/<[^>]+>/g, ''))).join(' ').trim();
        if (extracted) {
          allText.push(`<p>${escapeHtml(extracted)}</p>`);
        }
      } catch {
        // ignore
      }
    }
    if (allText.length > 0) {
      rawHtml = allText.join('\n');
      logSuccess('docx-import', `テキスト救出完了 (${allText.length} 段落)`);
    }
  }

  const result = buildHierarchyFromHtml(rawHtml, fileName, tabName, footnoteMap);
  logSuccess('docx-import', `階層構造の構築完了: ノート ${result.totalNotes}件, フォルダ ${result.totalFolders}件, 文字数 ${result.totalCharacters}字, 画像 ${result.totalImages}点, 脚注 ${result.totalFootnotes}点`);
  return result;
}

/**
 * Build 3-tier hierarchy and extract footnotes and statistics
 */
export function buildHierarchyFromHtml(
  rawHtml: string,
  fileName: string,
  tabName: string,
  externalFootnotes?: Map<string, string>
): DocxImportPreviewResult {
  if (!rawHtml.trim()) {
    const emptyNode: DocxImportPreviewNode = {
      tempId: `tmp-${Date.now()}-0`,
      title: tabName || '空の文書',
      level: 1,
      isFolder: false,
      htmlContent: '<p>文書内にテキストが見つかりませんでした。</p>',
      plainTextPreview: '文書内にテキストが見つかりませんでした。',
      characterCount: 0,
      paragraphCount: 0,
      footnoteCount: 0,
      imageCount: 0,
      children: [],
    };
    return {
      fileName,
      tabName,
      totalNotes: 1,
      totalFolders: 0,
      totalCharacters: 0,
      totalFootnotes: 0,
      totalImages: 0,
      rootNodes: [emptyNode],
    };
  }

  // Parse HTML DOM safely
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${rawHtml}</div>`, 'text/html');
  const container = (doc.body.firstElementChild as HTMLElement) || doc.body;

  // 1. Process Footnotes and Endnotes
  const footnoteMap = new Map<string, string>();
  if (externalFootnotes) {
    externalFootnotes.forEach((v, k) => footnoteMap.set(k, v));
  }

  // Scan footnote and endnote items rendered in HTML (e.g. Mammoth's <ol><li id="footnote-X">)
  const noteItemSelectors = [
    'li[id^="footnote-"]',
    'li[id^="endnote-"]',
    'li[id*="note-"]',
    'li[id^="_ftn"]',
    'li[id^="_edn"]',
    'p[id^="_ftn"]',
    'p[id^="_edn"]',
    'div[id^="_ftn"]',
    'div[id^="_edn"]',
  ].join(', ');
  const noteItems = Array.from(container.querySelectorAll<HTMLElement>(noteItemSelectors));

  noteItems.forEach((li) => {
    const noteId = li.getAttribute('id') || '';
    const clone = li.cloneNode(true) as HTMLElement;
    const backLinks = Array.from(
      clone.querySelectorAll('a[href^="#footnote-ref-"], a[href^="#endnote-ref-"], a[href*="ref"], a[href^="#_ftnref"], a[href^="#_ednref"]')
    );
    backLinks.forEach((a) => a.remove());

    const noteText = clone.textContent?.trim() || '';
    if (noteId && noteText) {
      if (!footnoteMap.has(noteId)) footnoteMap.set(noteId, noteText);
      const numMatch = noteId.match(/\d+/);
      if (numMatch) {
        if (!footnoteMap.has(numMatch[0])) footnoteMap.set(numMatch[0], noteText);
        if (!footnoteMap.has(`footnote-${numMatch[0]}`)) footnoteMap.set(`footnote-${numMatch[0]}`, noteText);
        if (!footnoteMap.has(`endnote-${numMatch[0]}`)) footnoteMap.set(`endnote-${numMatch[0]}`, noteText);
        if (!footnoteMap.has(`_ftn${numMatch[0]}`)) footnoteMap.set(`_ftn${numMatch[0]}`, noteText);
        if (!footnoteMap.has(`_edn${numMatch[0]}`)) footnoteMap.set(`_edn${numMatch[0]}`, noteText);
      }
    }
  });

  // Replace footnote / endnote references with app's footnote component
  const refSelectors = [
    'a[href^="#footnote-"]',
    'a[href^="#endnote-"]',
    'a[id^="footnote-ref-"]',
    'a[id^="endnote-ref-"]',
    'a[href^="#_ftn"]',
    'a[href^="#_edn"]',
    'a[id^="_ftnref"]',
    'a[id^="_ednref"]',
    'sup a[href*="note"]',
    'sup a[href*="ftn"]',
    'sup a[href*="edn"]',
  ].join(', ');
  const rawNoteRefs = Array.from(container.querySelectorAll<HTMLElement>(refSelectors));

  // Filter out back-links inside footnote definitions
  const noteRefs = rawNoteRefs.filter((ref) => {
    const insideDef = ref.closest(
      'li[id^="footnote-"], li[id^="endnote-"], li[id*="note-"], li[id^="_ftn"], li[id^="_edn"], p[id^="_ftn"], p[id^="_edn"], div[id^="_ftn"], div[id^="_edn"], section[role="doc-endnotes"], div.footnotes, ol.footnotes'
    );
    return !insideDef;
  });

  noteRefs.forEach((ref) => {
    const href = ref.getAttribute('href') || '';
    const idAttr = ref.getAttribute('id') || '';
    const targetId = href.replace(/^#/, '') || idAttr.replace(/-ref-?/, '-');
    const numMatch = targetId.match(/\d+/) || ref.textContent?.match(/\d+/);
    const key = targetId || (numMatch ? numMatch[0] : '');

    const noteText =
      footnoteMap.get(key) ||
      (numMatch ? footnoteMap.get(numMatch[0]) : undefined) ||
      (numMatch ? footnoteMap.get(`footnote-${numMatch[0]}`) : undefined) ||
      (numMatch ? footnoteMap.get(`endnote-${numMatch[0]}`) : undefined) ||
      (numMatch ? footnoteMap.get(`_ftn${numMatch[0]}`) : undefined) ||
      footnoteMap.get(targetId) ||
      ref.getAttribute('title') ||
      ref.textContent?.trim() ||
      '注釈';

    const fnId = `fn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const footnoteHtml = createFootnoteHtml(noteText, fnId);

    const tempSpan = document.createElement('span');
    tempSpan.innerHTML = footnoteHtml;
    const replacementEl = tempSpan.firstElementChild || tempSpan;

    const parent = ref.parentElement;
    if (parent && parent.tagName.toLowerCase() === 'sup') {
      const meaningfulChildren = Array.from(parent.childNodes).filter(
        (n) => n.nodeType === Node.ELEMENT_NODE || (n.textContent && n.textContent.trim().length > 0)
      );
      if (meaningfulChildren.length <= 1) {
        parent.replaceWith(replacementEl);
      } else {
        ref.replaceWith(replacementEl);
      }
    } else {
      ref.replaceWith(replacementEl);
    }
  });

  // Remove footnote lists at the bottom of the document
  noteItems.forEach((li) => {
    const parent = li.parentElement;
    if (parent && (parent.tagName === 'OL' || parent.tagName === 'UL')) {
      parent.remove();
    } else {
      li.remove();
    }
  });

  const endnoteSections = Array.from(
    container.querySelectorAll('section[role="doc-endnotes"], div.footnotes')
  );
  endnoteSections.forEach((el) => el.remove());

  // 2. Intelligent Heading Normalization (If headings are missing or sparse)
  const existingH1 = container.querySelectorAll('h1').length;
  const existingH2 = container.querySelectorAll('h2').length;
  const existingH3 = container.querySelectorAll('h3').length;
  const totalExistingHeadings = existingH1 + existingH2 + existingH3;

  if (totalExistingHeadings < 2) {
    const pElements = Array.from(container.querySelectorAll('p'));
    pElements.forEach((p) => {
      // Check heading pattern against text stripped of footnote references
      const pClone = p.cloneNode(true) as HTMLElement;
      const fnInP = Array.from(
        pClone.querySelectorAll('.footnote-ref, [data-fn-id], sup, a[href*="note"], a[id*="note"]')
      );
      fnInP.forEach((n) => n.remove());
      const cleanPText = (pClone.textContent || '').replace(/\[[\d\?※\*\s]+\]/g, '').trim();

      const pText = p.textContent?.trim() || '';
      if (!cleanPText && !pText) return;

      const detectedLevel = detectHeadingLevelFromText(cleanPText || pText);
      if (detectedLevel) {
        const headingTag = document.createElement(`h${detectedLevel}`);
        // CRITICAL: Preserve innerHTML so any footnote-ref or formatting is kept intact!
        headingTag.innerHTML = p.innerHTML;
        headingTag.setAttribute('data-detected-heading', 'true');
        p.replaceWith(headingTag);
      } else {
        const strongEl = p.querySelector('strong, b');
        if (
          strongEl &&
          cleanPText.length >= 2 &&
          cleanPText.length <= 50 &&
          !/[。．\.\!\?]$/.test(cleanPText)
        ) {
          const strongClone = strongEl.cloneNode(true) as HTMLElement;
          const fnInStrong = Array.from(
            strongClone.querySelectorAll('.footnote-ref, [data-fn-id], sup, a[href*="note"], a[id*="note"]')
          );
          fnInStrong.forEach((n) => n.remove());
          const strongText = (strongClone.textContent || '').replace(/\[[\d\?※\*\s]+\]/g, '').trim();
          if (strongText === cleanPText) {
            const headingTag = document.createElement('h2');
            headingTag.innerHTML = p.innerHTML;
            headingTag.setAttribute('data-detected-heading', 'true');
            p.replaceWith(headingTag);
          }
        }
      }
    });
  }

  // 3. Walk through child elements and build section hierarchy
  interface RawSection {
    level: number;
    title: string;
    elements: HTMLElement[];
  }

  const sections: RawSection[] = [];
  let introSection: RawSection | null = null;
  let currentSection: RawSection | null = null;

  // Helper to process headings (h1, h2, h3)
  const handleHeadingElement = (level: 1 | 2 | 3, headingEl: HTMLElement, defaultTitle: string) => {
    if (currentSection) {
      sections.push(currentSection);
    } else if (introSection && introSection.elements.length > 0) {
      sections.push(introSection);
    }

    // Extract clean title: clone and strip all footnote references and bracketed markers
    const cloneForTitle = headingEl.cloneNode(true) as HTMLElement;
    const fnInTitle = Array.from(
      cloneForTitle.querySelectorAll('.footnote-ref, [data-fn-id], sup, a[href*="note"], a[id*="note"]')
    );
    fnInTitle.forEach((f) => f.remove());
    const rawClean = (cloneForTitle.textContent || '')
      .replace(/\[[\d\?※\*\s]+\]/g, '') // remove brackets like [1], [?], [※]
      .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const title = rawClean || defaultTitle;

    currentSection = {
      level,
      title,
      elements: [],
    };

    // CRITICAL: If the heading contains footnotes, preserve it at the top of section elements!
    const hasFootnotes = headingEl.querySelectorAll('.footnote-ref, [data-fn-id]').length > 0;
    if (hasFootnotes) {
      const headingBlock = document.createElement(`h${Math.min(level, 3)}`);
      headingBlock.className = `docx-heading docx-h${level} font-bold text-slate-900 my-2`;
      headingBlock.innerHTML = headingEl.innerHTML;
      currentSection.elements.push(headingBlock);
    }
  };

  Array.from(container.children).forEach((child) => {
    const el = child as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    if (tagName === 'h1') {
      handleHeadingElement(1, el, '見出し 1');
    } else if (tagName === 'h2') {
      handleHeadingElement(2, el, '見出し 2');
    } else if (tagName === 'h3') {
      handleHeadingElement(3, el, '見出し 3');
    } else if (tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
      if (currentSection) {
        currentSection.elements.push(el);
      } else {
        if (!introSection) {
          const cloneForIntro = el.cloneNode(true) as HTMLElement;
          const fnInIntro = Array.from(
            cloneForIntro.querySelectorAll('.footnote-ref, [data-fn-id], sup, a[href*="note"], a[id*="note"]')
          );
          fnInIntro.forEach((f) => f.remove());
          const cleanIntro = (cloneForIntro.textContent || '').replace(/\[[\d\?※\*\s]+\]/g, '').trim();
          introSection = {
            level: 1,
            title: cleanIntro || `${tabName} (概要)`,
            elements: [],
          };
        }
        introSection.elements.push(el);
      }
    } else {
      if (currentSection) {
        currentSection.elements.push(el);
      } else {
        if (!introSection) {
          introSection = {
            level: 1,
            title: `${tabName} (概要)`,
            elements: [],
          };
        }
        introSection.elements.push(el);
      }
    }
  });

  // Push the final section
  if (currentSection) {
    sections.push(currentSection);
  } else if (introSection && sections.length === 0) {
    sections.push(introSection);
  }

  if (sections.length === 0) {
    sections.push({
      level: 1,
      title: tabName,
      elements: [],
    });
  }

  // 4. Assemble 3-Level Hierarchy
  const rootNodes: DocxImportPreviewNode[] = [];
  let currentLevel1: DocxImportPreviewNode | null = null;
  let currentLevel2: DocxImportPreviewNode | null = null;
  let nodeCounter = 0;

  const createNode = (
    title: string,
    level: 1 | 2 | 3,
    elements: HTMLElement[]
  ): DocxImportPreviewNode => {
    const rawSectionHtml = elements.map((e) => e.outerHTML).join('') || '<p></p>';
    const { cleanHtml, footnotes } = parseAndRenumberHtml(rawSectionHtml);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanHtml;
    const plainText = tempDiv.innerText || tempDiv.textContent || '';
    const imgCount = tempDiv.querySelectorAll('img').length;

    return {
      tempId: `docx-node-${Date.now()}-${++nodeCounter}`,
      title: title.trim() || `セクション ${nodeCounter}`,
      level,
      isFolder: false,
      htmlContent: cleanHtml,
      plainTextPreview: plainText.substring(0, 160).trim() || (imgCount > 0 ? `[画像 ${imgCount}件]` : '（本文なし）'),
      characterCount: plainText.length,
      paragraphCount: elements.length,
      footnoteCount: footnotes.length,
      imageCount: imgCount,
      children: [],
    };
  };

  sections.forEach((sec) => {
    if (sec.level === 1) {
      const node = createNode(sec.title, 1, sec.elements);
      rootNodes.push(node);
      currentLevel1 = node;
      currentLevel2 = null;
    } else if (sec.level === 2) {
      if (!currentLevel1) {
        currentLevel1 = createNode(tabName, 1, []);
        rootNodes.push(currentLevel1);
      }
      currentLevel1.isFolder = true;
      const node = createNode(sec.title, 2, sec.elements);
      currentLevel1.children.push(node);
      currentLevel2 = node;
    } else if (sec.level === 3) {
      if (!currentLevel1) {
        currentLevel1 = createNode(tabName, 1, []);
        rootNodes.push(currentLevel1);
      }
      if (!currentLevel2) {
        currentLevel2 = createNode(currentLevel1.title, 2, []);
        currentLevel1.isFolder = true;
        currentLevel1.children.push(currentLevel2);
      }
      currentLevel2.isFolder = true;
      const node = createNode(sec.title, 3, sec.elements);
      currentLevel2.children.push(node);
    }
  });

  // Calculate totals
  let totalNotes = 0;
  let totalFolders = 0;
  let totalCharacters = 0;
  let totalFootnotes = 0;
  let totalImages = 0;

  const countStats = (node: DocxImportPreviewNode) => {
    totalNotes++;
    if (node.children.length > 0) {
      node.isFolder = true;
      totalFolders++;
    }
    totalCharacters += node.characterCount;
    totalFootnotes += node.footnoteCount;
    totalImages += node.imageCount;
    node.children.forEach(countStats);
  };

  rootNodes.forEach(countStats);

  return {
    fileName,
    tabName,
    totalNotes,
    totalFolders,
    totalCharacters,
    totalFootnotes,
    totalImages,
    rootNodes,
  };
}

/**
 * Execute actual import: convert DocxImportPreviewResult into App State (Notebook + TreeNodes)
 */
export function convertPreviewToAppNodes(
  preview: DocxImportPreviewResult,
  notebookId: string
): {
  notebook: Notebook;
  nodesToInsert: Record<string, TreeNode>;
  rootNodeIds: string[];
} {
  const nodesToInsert: Record<string, TreeNode> = {};
  const rootNodeIds: string[] = [];
  const today = new Date().toISOString().split('T')[0];

  const processNode = (
    previewNode: DocxImportPreviewNode,
    parentId: string | null
  ): string => {
    const id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const childIds = previewNode.children.map((child) =>
      processNode(child, id)
    );

    const hasChildren = childIds.length > 0;

    const node: TreeNode = {
      id,
      notebookId,
      parentId,
      title: previewNode.title,
      type: 'rich',
      tags: [],
      created: today,
      updated: today,
      isFolder: hasChildren,
      content: {
        richHtml: previewNode.htmlContent || '<p></p>',
      },
      children: hasChildren ? childIds : undefined,
    };

    nodesToInsert[id] = node;
    return id;
  };

  preview.rootNodes.forEach((root) => {
    const id = processNode(root, null);
    rootNodeIds.push(id);
  });

  const notebook: Notebook = {
    id: notebookId,
    name: preview.tabName,
    color: '#e0f2fe',
    bgClass: 'bg-blue-500',
    borderClass: 'border-blue-500',
    description: `DOCXインポート (${preview.fileName})`,
    nodeIds: rootNodeIds,
    folderId: null,
  };

  return {
    notebook,
    nodesToInsert,
    rootNodeIds,
  };
}
