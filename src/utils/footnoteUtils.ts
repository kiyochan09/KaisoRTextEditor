export interface FootnoteItem {
  id: string; // unique id e.g. 'fn-1700000000000-xyz'
  number: number; // 1, 2, 3...
  text: string;
  refCount?: number;
}

/**
 * Safely escape HTML attributes so quotes, special characters, and newlines don't break parsing
 */
export function escapeFootnoteAttr(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '&#10;');
}

/**
 * Scan DOM or HTML string to extract all footnotes in appearance order
 * and automatically renumber them [1], [2], [3]...
 */
export function renumberFootnotes(container: HTMLElement | null): FootnoteItem[] {
  if (!container) return [];

  const refs = container.querySelectorAll<HTMLElement>('.footnote-ref, [data-fn-id]');
  const items: FootnoteItem[] = [];
  const seenIds = new Set<string>();

  refs.forEach((ref, index) => {
    const fnId = ref.getAttribute('data-fn-id') || `fn-${Date.now()}-${index}`;
    ref.setAttribute('data-fn-id', fnId);
    ref.setAttribute('contenteditable', 'false');
    
    // Auto-assigned number based on order in document
    const num = index + 1;
    ref.setAttribute('data-fn-num', String(num));

    // Get footnote text with comprehensive fallbacks
    let text = 
      ref.getAttribute('data-fn-text') || 
      ref.getAttribute('data-text') || 
      ref.dataset?.fnText || 
      '';

    const anchor = ref.querySelector<HTMLAnchorElement>('a');
    if (!text && anchor) {
      const aTitle = anchor.getAttribute('title') || '';
      if (aTitle && !aTitle.match(/^注釈\s*\[\d+\]$/)) {
        text = aTitle;
      }
    }

    if (text) {
      ref.setAttribute('data-fn-text', text);
    }
    
    // Update inner anchor link and label
    let anchorEl = anchor;
    if (!anchorEl) {
      anchorEl = document.createElement('a');
      ref.appendChild(anchorEl);
    }

    anchorEl.href = `#cite_note-${fnId}`;
    anchorEl.id = `cite_ref-${fnId}`;
    anchorEl.className = 'footnote-anchor text-blue-600 font-bold hover:underline cursor-pointer px-0.5 select-none transition-colors';
    anchorEl.textContent = `[${num}]`;
    anchorEl.title = text || `注釈 [${num}]`;

    if (!seenIds.has(fnId)) {
      seenIds.add(fnId);
      items.push({
        id: fnId,
        number: num,
        text: text,
      });
    }
  });

  return items;
}

/**
 * Parse HTML string and renumber footnotes sequentially
 */
export function parseAndRenumberHtml(html: string): { cleanHtml: string; footnotes: FootnoteItem[] } {
  if (!html) return { cleanHtml: html, footnotes: [] };

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const container = doc.body.firstElementChild as HTMLElement;

  if (!container) return { cleanHtml: html, footnotes: [] };

  const footnotes = renumberFootnotes(container);
  return {
    cleanHtml: container.innerHTML,
    footnotes,
  };
}

/**
 * Generate a new unique footnote HTML element to insert at cursor
 */
export function createFootnoteHtml(text: string, id?: string): string {
  const fnId = id || `fn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanText = text.trim();
  const escapedText = escapeFootnoteAttr(cleanText);
  
  return `<sup class="footnote-ref select-none inline-block font-sans text-xs" data-fn-id="${fnId}" data-fn-text="${escapedText}" contenteditable="false"><a href="#cite_note-${fnId}" id="cite_ref-${fnId}" class="footnote-anchor text-blue-600 font-bold hover:underline cursor-pointer px-0.5 select-none" title="${escapedText}">[?]</a></sup>&nbsp;`;
}

