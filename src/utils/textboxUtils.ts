/**
 * Utilities for Creating, Formatting, and Pasting Word-compatible Text Boxes
 */

export interface TextboxPreset {
  id: string;
  label: string;
  orientation: 'horizontal' | 'vertical';
  borderStyle: 'solid' | 'dashed' | 'none' | 'double';
  bgColor: string;
  borderColor: string;
  description: string;
}

export const TEXTBOX_PRESETS: TextboxPreset[] = [
  {
    id: 'horizontal-standard',
    label: '横書きテキストボックス (標準)',
    orientation: 'horizontal',
    borderStyle: 'solid',
    bgColor: '#ffffff',
    borderColor: '#64748b',
    description: '標準的な横書き枠線付きテキストボックス',
  },
  {
    id: 'vertical-standard',
    label: '縦書きテキストボックス (標準)',
    orientation: 'vertical',
    borderStyle: 'solid',
    bgColor: '#ffffff',
    borderColor: '#64748b',
    description: '日本語縦書き組版対応のテキストボックス',
  },
  {
    id: 'horizontal-callout',
    label: '横書き (ハイライト背景)',
    orientation: 'horizontal',
    borderStyle: 'solid',
    bgColor: '#f8fafc',
    borderColor: '#3b82f6',
    description: '青枠と薄い背景色の横書きテキストボックス',
  },
  {
    id: 'vertical-callout',
    label: '縦書き (和風・薄茶枠)',
    orientation: 'vertical',
    borderStyle: 'solid',
    bgColor: '#fdfbf7',
    borderColor: '#b45309',
    description: '和風・明朝体に適した縦書きテキストボックス',
  },
  {
    id: 'horizontal-dashed',
    label: '横書き (破線枠)',
    orientation: 'horizontal',
    borderStyle: 'dashed',
    bgColor: '#ffffff',
    borderColor: '#94a3b8',
    description: '切り取り線風の破線テキストボックス',
  },
  {
    id: 'vertical-dashed',
    label: '縦書き (破線枠)',
    orientation: 'vertical',
    borderStyle: 'dashed',
    bgColor: '#ffffff',
    borderColor: '#94a3b8',
    description: '縦書きの破線テキストボックス',
  },
];

/**
 * Generate clean HTML for a Text Box element to be inserted into ContentEditable
 */
export function createTextboxHtml(options: {
  orientation: 'horizontal' | 'vertical';
  borderStyle?: 'solid' | 'dashed' | 'none' | 'double';
  borderColor?: string;
  bgColor?: string;
  initialText?: string;
}): string {
  const orientation = options.orientation || 'horizontal';
  const borderStyle = options.borderStyle || 'solid';
  const borderColor = options.borderColor || '#64748b';
  const bgColor = options.bgColor || '#ffffff';
  const initialText = options.initialText || (orientation === 'vertical' ? '縦書きテキストを入力...' : '横書きテキストを入力...');
  const id = `tb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  if (orientation === 'vertical') {
    return `<div id="${id}" class="rich-textbox rich-textbox-vertical" contenteditable="true" data-textbox="true" data-orientation="vertical" style="display: inline-block; vertical-align: top; writing-mode: vertical-rl; -webkit-writing-mode: vertical-rl; text-orientation: upright; min-width: 100px; height: 230px; max-height: 480px; margin: 8px 12px 8px 0; padding: 12px 10px; border: 1.5px ${borderStyle} ${borderColor}; border-radius: 4px; background-color: ${bgColor}; box-shadow: 0 1px 3px rgba(0,0,0,0.08); box-sizing: border-box; resize: both; overflow: auto; line-height: 1.8; letter-spacing: 0.05em; font-family: 'Yu Mincho', 'Hiragino Mincho ProN', 'MS Mincho', serif; word-break: break-word;"><p style="margin: 0; color: #1e293b;">${initialText}</p></div>&nbsp;`;
  }

  return `<div id="${id}" class="rich-textbox rich-textbox-horizontal" contenteditable="true" data-textbox="true" data-orientation="horizontal" style="display: inline-block; vertical-align: top; writing-mode: horizontal-tb; width: 280px; min-height: 80px; max-width: 100%; margin: 8px 12px 8px 0; padding: 10px 12px; border: 1.5px ${borderStyle} ${borderColor}; border-radius: 4px; background-color: ${bgColor}; box-shadow: 0 1px 3px rgba(0,0,0,0.08); box-sizing: border-box; resize: both; overflow: auto; line-height: 1.6; word-break: break-word;"><p style="margin: 0; color: #1e293b;">${initialText}</p></div>&nbsp;`;
}

/**
 * Clean up MS Word junk from HTML while keeping text, formatting, and structures intact
 */
export function cleanWordMarkup(html: string): string {
  let cleaned = html;

  // Remove XML declarations and namespaces
  cleaned = cleaned.replace(/<\?xml[^>]*>/gi, '');
  cleaned = cleaned.replace(/<o:p[^>]*>.*?<\/o:p>/gi, '');
  cleaned = cleaned.replace(/<o:p[^>]*\/>/gi, '');
  cleaned = cleaned.replace(/<\/?(w|m|o|v):[^>]*>/gi, '');

  // Remove conditional comments
  cleaned = cleaned.replace(/<!\[if !vml\]>[\s\S]*?<!\[endif\]>/gi, '');
  cleaned = cleaned.replace(/<!--\[if gte vml 1\]>[\s\S]*?<!\[endif\]>/gi, '');
  cleaned = cleaned.replace(/<!--\[if [^\]]+\]>[\s\S]*?<!\[endif\]>/gi, '');

  return cleaned;
}

/**
 * Detect and convert Word Textboxes (VML v:textbox, shapes, mso-element:frame, etc.) into modern editable HTML text boxes
 */
export function processWordPastedHtml(rawHtml: string): { containsWordTextbox: boolean; html: string } {
  if (!rawHtml) return { containsWordTextbox: false, html: rawHtml };

  let containsWordTextbox = false;

  // 1. Check for Word VML textbox pattern in comments or raw text
  // Word clipboard frequently contains:
  // <!--[if gte vml 1]><v:shape ...><v:textbox style="mso-next-textbox:...;[writing-mode:tb-rl;]"><div>...</div></v:textbox></v:shape><![endif]-->
  const vmlRegex = /(?:<!--\[if gte vml 1\]>|<v:shape)([\s\S]*?)(?:<!\[endif\]>|<\/v:shape>)/gi;
  
  let processedHtml = rawHtml.replace(vmlRegex, (match) => {
    if (match.toLowerCase().includes('textbox') || match.toLowerCase().includes('v:textbox') || match.toLowerCase().includes('shape')) {
      containsWordTextbox = true;
      const isVertical = /writing-mode\s*:\s*(?:tb-rl|vertical-rl)/i.test(match) ||
                         /layout-grid-mode\s*:\s*char/i.test(match) ||
                         /mso-text-orientation/i.test(match);

      // Extract inner content from textbox
      const innerMatch = match.match(/<div[^>]*>([\s\S]*?)<\/div>/i) || match.match(/<v:textbox[^>]*>([\s\S]*?)<\/v:textbox>/i);
      const innerHtml = innerMatch ? innerMatch[1] : 'Word テキストボックス';

      // Clean up extracted inner HTML
      const cleanedInner = cleanWordMarkup(innerHtml).trim();

      return createTextboxHtml({
        orientation: isVertical ? 'vertical' : 'horizontal',
        initialText: cleanedInner || 'Word テキストボックス',
      });
    }
    return match;
  });

  // 2. Parse DOM with DOMParser to handle DOM-level Word frames & text boxes
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(processedHtml, 'text/html');

    // Find Word frames (mso-element:frame or mso-element:textbox or .WordSection or tables styled as textboxes)
    const allDivs = doc.querySelectorAll('div, table, span, [style*="mso-element"], [style*="border"]');
    
    allDivs.forEach((el) => {
      const styleAttr = el.getAttribute('style') || '';
      const isMsoFrame = /mso-element\s*:\s*(?:frame|textbox|shape)/i.test(styleAttr);
      const isWordBox = /mso-border-/i.test(styleAttr) && /position\s*:\s*absolute/i.test(styleAttr);
      const isMsoTxbx = el.tagName.toLowerCase().includes('textbox') || el.classList.contains('MsoNormalTable');

      if (isMsoFrame || isWordBox || isMsoTxbx) {
        containsWordTextbox = true;
        const isVertical = /writing-mode\s*:\s*(?:tb-rl|vertical-rl)/i.test(styleAttr) ||
                           /layout-grid-mode\s*:\s*char/i.test(styleAttr);

        const innerContent = el.innerHTML;
        const cleanedInner = cleanWordMarkup(innerContent).trim();

        // Create replacement node
        const tbWrapper = doc.createElement('div');
        tbWrapper.className = `rich-textbox ${isVertical ? 'rich-textbox-vertical' : 'rich-textbox-horizontal'}`;
        tbWrapper.setAttribute('contenteditable', 'true');
        tbWrapper.setAttribute('data-textbox', 'true');
        tbWrapper.setAttribute('data-orientation', isVertical ? 'vertical' : 'horizontal');
        
        if (isVertical) {
          tbWrapper.style.cssText = "display: inline-block; vertical-align: top; writing-mode: vertical-rl; -webkit-writing-mode: vertical-rl; text-orientation: upright; min-width: 100px; height: 230px; margin: 8px 12px 8px 0; padding: 12px 10px; border: 1.5px solid #64748b; border-radius: 4px; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.08); box-sizing: border-box; resize: both; overflow: auto; line-height: 1.8; font-family: 'Yu Mincho', 'MS Mincho', serif; word-break: break-word;";
        } else {
          tbWrapper.style.cssText = "display: inline-block; vertical-align: top; writing-mode: horizontal-tb; width: 280px; min-height: 80px; max-width: 100%; margin: 8px 12px 8px 0; padding: 10px 12px; border: 1.5px solid #64748b; border-radius: 4px; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.08); box-sizing: border-box; resize: both; overflow: auto; line-height: 1.6; word-break: break-word;";
        }

        tbWrapper.innerHTML = cleanedInner || '<p>Word テキストボックス</p>';
        el.replaceWith(tbWrapper);
      }
    });

    // Clean any remaining Word artifacts from the doc body
    const bodyHtml = doc.body.innerHTML;
    return {
      containsWordTextbox,
      html: cleanWordMarkup(bodyHtml),
    };
  } catch {
    return {
      containsWordTextbox,
      html: cleanWordMarkup(processedHtml),
    };
  }
}
