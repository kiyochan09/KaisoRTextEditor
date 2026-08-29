import { TextFormatState } from '../types';

/**
 * Capture the text formatting at current cursor position or selection
 */
export function captureCurrentFormat(): TextFormatState | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  let targetNode = selection.anchorNode;
  if (!targetNode) return null;

  const targetEl = targetNode.nodeType === Node.ELEMENT_NODE
    ? (targetNode as HTMLElement)
    : targetNode.parentElement;

  if (!targetEl) return null;

  const computed = window.getComputedStyle(targetEl);

  // Check document command states where available
  const isBold = document.queryCommandState('bold') ||
    computed.fontWeight === 'bold' ||
    parseInt(computed.fontWeight || '400', 10) >= 600;

  const isItalic = document.queryCommandState('italic') ||
    computed.fontStyle === 'italic';

  const isUnderline = document.queryCommandState('underline') ||
    computed.textDecorationLine.includes('underline');

  const isStrike = document.queryCommandState('strikeThrough') ||
    computed.textDecorationLine.includes('line-through');

  const color = document.queryCommandValue('foreColor') || computed.color;
  const rawBg = document.queryCommandValue('hiliteColor') ||
    document.queryCommandValue('backColor') ||
    computed.backgroundColor;
  const backgroundColor = (rawBg && rawBg !== 'rgba(0, 0, 0, 0)' && rawBg !== 'transparent') ? rawBg : undefined;

  const fontFamily = document.queryCommandValue('fontName') || computed.fontFamily;
  const fontSize = document.queryCommandValue('fontSize') || computed.fontSize;
  const textAlign = computed.textAlign;

  return {
    bold: isBold,
    italic: isItalic,
    underline: isUnderline,
    strikeThrough: isStrike,
    color,
    backgroundColor,
    fontFamily,
    fontSize,
    textAlign,
  };
}

/**
 * Apply a captured format state to the currently selected text in the document
 */
export function applyFormatToCurrentSelection(format: TextFormatState): boolean {
  try {
    // 1. Font styling
    if (format.bold !== undefined) {
      const currentBold = document.queryCommandState('bold');
      if (format.bold !== currentBold) {
        document.execCommand('bold', false);
      }
    }

    if (format.italic !== undefined) {
      const currentItalic = document.queryCommandState('italic');
      if (format.italic !== currentItalic) {
        document.execCommand('italic', false);
      }
    }

    if (format.underline !== undefined) {
      const currentUnderline = document.queryCommandState('underline');
      if (format.underline !== currentUnderline) {
        document.execCommand('underline', false);
      }
    }

    if (format.strikeThrough !== undefined) {
      const currentStrike = document.queryCommandState('strikeThrough');
      if (format.strikeThrough !== currentStrike) {
        document.execCommand('strikeThrough', false);
      }
    }

    // 2. Text & Background Colors
    if (format.color && format.color !== 'rgba(0, 0, 0, 0)') {
      document.execCommand('foreColor', false, format.color);
    }

    if (format.backgroundColor && format.backgroundColor !== 'rgba(0, 0, 0, 0)' && format.backgroundColor !== 'transparent') {
      document.execCommand('hiliteColor', false, format.backgroundColor);
    }

    // 3. Font Family & Size
    if (format.fontFamily) {
      applyExactFontFamily(format.fontFamily);
    }

    if (format.fontSize) {
      applyExactFontSize(format.fontSize);
    }

    // 4. Alignment
    if (format.textAlign) {
      if (format.textAlign === 'center') document.execCommand('justifyCenter', false);
      else if (format.textAlign === 'right') document.execCommand('justifyRight', false);
      else if (format.textAlign === 'left') document.execCommand('justifyLeft', false);
      else if (format.textAlign === 'justify') document.execCommand('justifyFull', false);
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Apply exact font family to current selection
 */
export function applyExactFontFamily(fontFamily: string, container?: HTMLElement | null): boolean {
  if (!fontFamily) return false;
  const cleanFont = fontFamily.replace(/['"]/g, '').split(',')[0].trim();
  try {
    document.execCommand('fontName', false, cleanFont);
    return true;
  } catch {
    return false;
  }
}

/**
 * Apply exact font size (pt, px, or 1..7 scale) to selection
 */
export function applyExactFontSize(fontSize: string, container?: HTMLElement | null): boolean {
  if (!fontSize) return false;
  try {
    const isPt = fontSize.toLowerCase().includes('pt');
    const isPx = fontSize.toLowerCase().includes('px');
    const num = parseFloat(fontSize);
    const resolvedSize = isPt || isPx ? fontSize : (!isNaN(num) && num > 7 ? `${num}px` : fontSize);

    // If it's a numeric 1..7 command
    if (/^[1-7]$/.test(fontSize)) {
      document.execCommand('fontSize', false, fontSize);
      return true;
    }

    // Set standard size or apply via temporary font size 7 replacement with inline style
    document.execCommand('fontSize', false, '7');
    const root = container || document;
    const fontTags = root.querySelectorAll('font[size="7"]');
    if (fontTags.length > 0) {
      fontTags.forEach((el) => {
        const span = document.createElement('span');
        span.style.fontSize = resolvedSize;
        span.innerHTML = el.innerHTML;
        el.parentNode?.replaceChild(span, el);
      });
      return true;
    }

    // Fallback: wrap selection range directly if font tags were not created
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = resolvedSize;
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
      return true;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Remove all character formatting from the current selection
 */
export function clearCurrentFormat(): void {
  document.execCommand('removeFormat', false);
  document.execCommand('foreColor', false, '#0f172a');
  document.execCommand('hiliteColor', false, 'transparent');
}

/**
 * Provide a readable summary of the active copied format
 */
export function formatStateToDescription(format: TextFormatState): string {
  const parts: string[] = [];
  if (format.bold) parts.push('太字');
  if (format.italic) parts.push('斜体');
  if (format.underline) parts.push('下線');
  if (format.strikeThrough) parts.push('取消線');
  if (format.color) parts.push('文字色');
  if (format.backgroundColor) parts.push('マーカー色');
  if (format.fontFamily) parts.push(format.fontFamily.replace(/['"]/g, '').split(',')[0]);

  return parts.length > 0 ? parts.join(', ') : '通常テキスト';
}
