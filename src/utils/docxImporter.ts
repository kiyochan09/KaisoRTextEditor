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
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 80) return null;

  // Level 1 patterns: 第X章, 第X部, 第X編, Chapter X, Part X, 1. , １．, 【...】, ■ ...
  if (
    /^第[0-9０-９一二三四五六七八九十百]+[章部編]/.test(trimmed) ||
    /^(?:chapter|part)\s+[0-9０-９ivx]+/i.test(trimmed) ||
    /^[0-9０-９]+[\.．\s]\s*[^\n。．]{2,45}$/.test(trimmed) ||
    /^【[^】]{2,35}】$/.test(trimmed) ||
    /^[■◆★]\s*[^\n。．]{2,40}$/.test(trimmed)
  ) {
    return 1;
  }

  // Level 2 patterns: 第X節, 第X款, Section X, 1.1, １．１, （１）, (1), ● ...
  if (
    /^第[0-9０-９一二三四五六七八九十百]+[節款]/.test(trimmed) ||
    /^section\s+[0-9０-９ivx]+/i.test(trimmed) ||
    /^[0-9０-９]+[\.．-][0-9０-９]+[\.．\s]\s*[^\n。．]{2,45}$/.test(trimmed) ||
    /^[（\(][0-9０-９一二三四五六七八九十]+[）\)]\s*[^\n。．]{2,45}$/.test(trimmed) ||
    /^[●▲▼▶◆]\s*[^\n。．]{2,40}$/.test(trimmed)
  ) {
    return 2;
  }

  // Level 3 patterns: 第X項, 1.1.1, １．１．１, ①, ②
  if (
    /^第[0-9０-９一二三四五六七八九十百]+項/.test(trimmed) ||
    /^[0-9０-９]+[\.．][0-9０-９]+[\.．][0-9０-９]+[\.．\s]\s*[^\n。．]{2,45}$/.test(trimmed) ||
    /^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]\s*[^\n。．]{2,45}$/.test(trimmed)
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
 * Parse Word OpenXML directly using browser's native DOMParser (XML DOM)
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

  // Read footnotes and endnotes
  const footnoteMap = new Map<string, string>();
  const parseNotesFile = async (path: string, prefix: string) => {
    const file = zip.file(path);
    if (!file || file.dir) return;
    try {
      const content = await file.async('string');
      const noteDoc = parser.parseFromString(content, 'text/xml');
      const noteElements = Array.from(noteDoc.querySelectorAll('footnote, endnote, w\\:footnote, w\\:endnote'));
      noteElements.forEach((el) => {
        const id = el.getAttribute('w:id') || el.getAttribute('id') || '';
        if (!id || parseInt(id, 10) <= 0) return;
        const text = el.textContent?.trim() || '';
        if (text) {
          footnoteMap.set(id, text);
          footnoteMap.set(`${prefix}-${id}`, text);
        }
      });
    } catch {
      // ignore
    }
  };
  await parseNotesFile('word/footnotes.xml', 'footnote');
  await parseNotesFile('word/endnotes.xml', 'endnote');

  // Read style definitions
  const headingStyles = new Map<string, number>();
  const stylesFile = zip.file('word/styles.xml');
  if (stylesFile) {
    try {
      const stylesContent = await stylesFile.async('string');
      const stylesDoc = parser.parseFromString(stylesContent, 'text/xml');
      const styleEls = Array.from(stylesDoc.querySelectorAll('style, w\\:style'));
      styleEls.forEach((st) => {
        const styleId = st.getAttribute('w:styleId') || st.getAttribute('styleId') || '';
        const nameEl = st.querySelector('name, w\\:name');
        const nameVal = nameEl?.getAttribute('w:val') || '';
        const outlineEl = st.querySelector('outlineLvl, w\\:outlineLvl');
        const outlineVal = outlineEl?.getAttribute('w:val');
        
        let lvl = outlineVal ? parseInt(outlineVal, 10) + 1 : 0;
        if (!lvl) {
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
      });
    } catch {
      // ignore
    }
  }

  // Add standard defaults
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

  // Process Paragraph Element
  const parseParagraphElement = (pEl: Element): { html: string; isHeading: boolean; level: number; text: string } => {
    const pStyleEl = pEl.querySelector('pStyle, w\\:pStyle');
    const styleVal = pStyleEl?.getAttribute('w:val') || pStyleEl?.getAttribute('val') || '';
    
    let headingLvl = headingStyles.get(styleVal) || 0;
    const outlineEl = pEl.querySelector('outlineLvl, w\\:outlineLvl');
    if (outlineEl) {
      const val = parseInt(outlineEl.getAttribute('w:val') || '0', 10);
      if (val >= 0 && val <= 5) headingLvl = val + 1;
    }

    let pInnerHtml = '';
    let pPlainText = '';

    // Walk through child nodes of paragraph (runs, hyperlinks, drawings, textboxes)
    const childNodes = Array.from(pEl.childNodes);
    childNodes.forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as Element;
      const localName = el.localName || el.nodeName.replace(/^w:/, '');

      if (localName === 'r') {
        const isBold = !!el.querySelector('b, w\\:b');
        const isItalic = !!el.querySelector('i, w\\:i');
        const isUnderline = !!el.querySelector('u, w\\:u');
        const isStrike = !!el.querySelector('strike, w\\:strike');

        // Footnote ref
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

        // Text nodes
        const tEls = Array.from(el.querySelectorAll('t, w\\:t'));
        let runText = tEls.map((t) => t.textContent || '').join('');
        pPlainText += runText;

        let formatted = escapeHtml(runText);
        if (isBold) formatted = `<strong>${formatted}</strong>`;
        if (isItalic) formatted = `<em>${formatted}</em>`;
        if (isUnderline) formatted = `<u>${formatted}</u>`;
        if (isStrike) formatted = `<s>${formatted}</s>`;

        pInnerHtml += formatted + imgHtml + fnHtml;
      } else if (localName === 'hyperlink') {
        const rId = el.getAttribute('r:id') || el.getAttribute('id') || '';
        const rel = relsMap.get(rId);
        const href = rel ? rel.target : '#';
        const linkText = el.textContent || '';
        pPlainText += linkText;
        pInnerHtml += `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${escapeHtml(linkText)}</a>`;
      } else if (localName === 'drawing' || localName === 'pict') {
        const blip = el.querySelector('blip, a\\:blip');
        const imgData = el.querySelector('imagedata, v\\:imagedata');
        const rId = blip?.getAttribute('r:embed') || blip?.getAttribute('embed') || imgData?.getAttribute('r:id') || imgData?.getAttribute('id') || '';
        if (rId) {
          const uri = resolveImageUri(rId);
          if (uri) {
            pInnerHtml += `<div class="my-3 block"><img src="${uri}" alt="画像" class="max-w-full h-auto rounded-lg border border-slate-200 shadow-xs" loading="lazy" /></div>`;
          }
        }
      }
    });

    const trimmed = pPlainText.trim();
    if (!headingLvl && trimmed) {
      const detected = detectHeadingLevelFromText(trimmed);
      if (detected) headingLvl = detected;
    }

    if (headingLvl >= 1 && headingLvl <= 6 && trimmed) {
      return {
        html: `<h${headingLvl}>${pInnerHtml || escapeHtml(trimmed)}</h${headingLvl}>`,
        isHeading: true,
        level: headingLvl,
        text: trimmed,
      };
    }

    if (!pInnerHtml.trim() && !pPlainText.trim()) {
      return { html: '<p></p>', isHeading: false, level: 0, text: '' };
    }

    return {
      html: `<p>${pInnerHtml}</p>`,
      isHeading: false,
      level: 0,
      text: pPlainText,
    };
  };

  // Process Table Element
  const parseTableElement = (tblEl: Element): string => {
    let tblHtml = '<table class="border-collapse border border-slate-300 my-3 w-full text-xs">';
    const rows = Array.from(tblEl.querySelectorAll('tr, w\\:tr'));
    rows.forEach((tr) => {
      tblHtml += '<tr>';
      const cells = Array.from(tr.querySelectorAll('tc, w\\:tc'));
      cells.forEach((tc) => {
        const paragraphs = Array.from(tc.querySelectorAll('p, w\\:p'));
        let cellContent = '';
        paragraphs.forEach((p) => {
          const res = parseParagraphElement(p);
          if (res.html && res.html !== '<p></p>') {
            cellContent += (cellContent ? '<br/>' : '') + res.html.replace(/<\/?p>/g, '');
          }
        });
        tblHtml += `<td class="border border-slate-300 p-2 align-top">${cellContent || '&nbsp;'}</td>`;
      });
      tblHtml += '</tr>';
    });
    tblHtml += '</table>';
    return tblHtml;
  };

  // Traverse all body child elements
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
        // Structured document tags
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
    logInfo('docx-import', `ZIPアーカイブ展開完了: 画像メディア ${mediaMap.size} 件, リレーション ${relsMap.size} 件`);
  } catch (zipErr: any) {
    logWarn('docx-import', 'JSZip展開通知 (標準XML走査へフォールバックします)', zipErr?.message);
  }

  // --- Engine 1: Mammoth.js ---
  try {
    const mammothOptions = {
      styleMap: [
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

    // Mammoth supports arrayBuffer
    const mammothRes = await mammoth.convertToHtml(
      { arrayBuffer: rawBuffer } as any,
      mammothOptions
    );
    if (mammothRes && mammothRes.value && mammothRes.value.trim().length > 0) {
      rawHtml = mammothRes.value;
      logSuccess('docx-import', `Mammoth.js で HTML 変換成功 (長さ: ${rawHtml.length} 文字)`);
    }
  } catch (mErr: any) {
    logWarn('docx-import', 'Mammoth解析例外。XML DOMパーサーへ移行します', mErr?.message);
  }

  // --- Engine 2: XML DOM Parser via JSZip ---
  if (!rawHtml.trim() && zip) {
    try {
      logInfo('docx-import', 'XML DOM (OpenXML直接解析) エンジンを実行します...');
      const xmlDomRes = await parseWithXmlDom(zip, mediaMap, relsMap);
      if (xmlDomRes.rawHtml.trim()) {
        rawHtml = xmlDomRes.rawHtml;
        footnoteMap = xmlDomRes.footnoteMap;
        logSuccess('docx-import', `XML DOM 解析成功: HTML生成完了 (脚注: ${footnoteMap.size} 件)`);
      }
    } catch (xmlErr: any) {
      logWarn('docx-import', 'XML DOMエンジン通知:', xmlErr?.message);
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
  logSuccess('docx-import', `階層構造の構築完了: ノート ${result.totalNotes}件, フォルダ ${result.totalFolders}件, 文字数 ${result.totalCharacters}字, 画像 ${result.totalImages}点`);
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

  const noteItems = Array.from(
    container.querySelectorAll<HTMLLIElement>(
      'li[id^="footnote-"], li[id^="endnote-"], li[id*="note-"]'
    )
  );

  noteItems.forEach((li) => {
    const noteId = li.getAttribute('id') || '';
    const clone = li.cloneNode(true) as HTMLElement;
    const backLinks = Array.from(
      clone.querySelectorAll('a[href^="#footnote-ref-"], a[href^="#endnote-ref-"], a[href*="ref"]')
    );
    backLinks.forEach((a) => a.remove());

    const noteText = clone.textContent?.trim() || '';
    if (noteId && noteText) {
      footnoteMap.set(noteId, noteText);
      const numMatch = noteId.match(/\d+/);
      if (numMatch) {
        footnoteMap.set(numMatch[0], noteText);
        footnoteMap.set(`footnote-${numMatch[0]}`, noteText);
        footnoteMap.set(`endnote-${numMatch[0]}`, noteText);
      }
    }
  });

  // Replace footnote / endnote references with app's footnote component
  const noteRefs = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href^="#footnote-"], a[href^="#endnote-"], a[id^="footnote-ref-"], a[id^="endnote-ref-"], sup a[href*="note"]'
    )
  );

  noteRefs.forEach((ref) => {
    const href = ref.getAttribute('href') || '';
    const targetId = href.replace(/^#/, '');
    const numMatch = targetId.match(/\d+/) || ref.textContent?.match(/\d+/);
    const key = targetId || (numMatch ? numMatch[0] : '');

    const noteText =
      footnoteMap.get(key) ||
      footnoteMap.get(targetId) ||
      ref.getAttribute('title') ||
      ref.textContent?.trim() ||
      '注釈';

    const fnId = `fn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const footnoteHtml = createFootnoteHtml(noteText, fnId);

    const tempSpan = document.createElement('span');
    tempSpan.innerHTML = footnoteHtml;

    if (ref.parentElement && ref.parentElement.tagName.toLowerCase() === 'sup') {
      ref.parentElement.replaceWith(tempSpan.firstElementChild || tempSpan);
    } else {
      ref.replaceWith(tempSpan.firstElementChild || tempSpan);
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
      const pText = p.textContent?.trim() || '';
      if (!pText) return;

      const detectedLevel = detectHeadingLevelFromText(pText);
      if (detectedLevel) {
        const headingTag = document.createElement(`h${detectedLevel}`);
        headingTag.textContent = pText;
        headingTag.setAttribute('data-detected-heading', 'true');
        p.replaceWith(headingTag);
      } else {
        const strongEl = p.querySelector('strong, b');
        if (
          strongEl &&
          strongEl.textContent?.trim() === pText &&
          pText.length >= 2 &&
          pText.length <= 45 &&
          !/[。．\.\!\?]$/.test(pText)
        ) {
          const headingTag = document.createElement('h2');
          headingTag.textContent = pText;
          headingTag.setAttribute('data-detected-heading', 'true');
          p.replaceWith(headingTag);
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

  Array.from(container.children).forEach((child) => {
    const el = child as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    if (tagName === 'h1') {
      if (currentSection) {
        sections.push(currentSection);
      } else if (introSection && introSection.elements.length > 0) {
        sections.push(introSection);
      }
      currentSection = {
        level: 1,
        title: el.textContent?.trim() || '見出し 1',
        elements: [],
      };
    } else if (tagName === 'h2') {
      if (currentSection) {
        sections.push(currentSection);
      } else if (introSection && introSection.elements.length > 0) {
        sections.push(introSection);
      }
      currentSection = {
        level: 2,
        title: el.textContent?.trim() || '見出し 2',
        elements: [],
      };
    } else if (tagName === 'h3') {
      if (currentSection) {
        sections.push(currentSection);
      } else if (introSection && introSection.elements.length > 0) {
        sections.push(introSection);
      }
      currentSection = {
        level: 3,
        title: el.textContent?.trim() || '見出し 3',
        elements: [],
      };
    } else if (tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
      if (currentSection) {
        currentSection.elements.push(el);
      } else {
        if (!introSection) {
          introSection = {
            level: 1,
            title: el.textContent?.trim() || `${tabName} (概要)`,
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
          const text = el.textContent?.trim() || '';
          const title =
            text.length > 0 && text.length <= 40 && !/[。．\.\!\?]$/.test(text)
              ? text
              : `${tabName} (概要)`;

          introSection = {
            level: 1,
            title,
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
