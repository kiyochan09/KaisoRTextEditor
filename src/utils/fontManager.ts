/**
 * Font Manager Utility
 * Supports querying local PC installed fonts via the Local Font Access API (window.queryLocalFonts),
 * fallback OS font detection, font size conversion (px, pt, HTML fontSize 1..7),
 * and real-time caret/selection typography detection.
 */

export interface SystemFontInfo {
  family: string;
  name: string;
  category?: 'sans' | 'serif' | 'mono' | 'display' | 'other';
  isLocalPC?: boolean;
}

// Built-in Japanese & Western OS Standard Fonts
export const COMMON_OS_FONTS: SystemFontInfo[] = [
  // Windows & Mac Japanese Gothic (Sans-serif)
  { family: 'Meiryo', name: 'メイリオ (Meiryo)', category: 'sans' },
  { family: 'BIZ UDPGothic', name: 'BIZ UDPゴシック (UD Gothic)', category: 'sans' },
  { family: 'BIZ UDGothic', name: 'BIZ UDゴシック (等幅)', category: 'mono' },
  { family: 'Yu Gothic', name: '游ゴシック (Yu Gothic)', category: 'sans' },
  { family: 'MS Gothic', name: 'MS ゴシック (MS Gothic)', category: 'mono' },
  { family: 'MS PGothic', name: 'MS Pゴシック (MS PGothic)', category: 'sans' },
  { family: 'MS UI Gothic', name: 'MS UI Gothic', category: 'sans' },
  { family: 'Hiragino Sans', name: 'ヒラギノ角ゴ (Hiragino Sans)', category: 'sans' },
  { family: 'Hiragino Kaku Gothic ProN', name: 'ヒラギノ角ゴ ProN', category: 'sans' },
  { family: 'Noto Sans JP', name: 'Noto Sans JP', category: 'sans' },
  { family: 'Source Han Sans', name: '源ノ角ゴシック (Source Han Sans)', category: 'sans' },
  { family: 'HGP創英角ﾎﾟｯﾌﾟ体', name: 'HGP創英角ポップ体', category: 'display' },
  { family: 'HG丸ｺﾞｼｯｸM-PRO', name: 'HG丸ゴシックM-PRO', category: 'sans' },

  // Japanese Mincho (Serif)
  { family: 'Yu Mincho', name: '游明朝 (Yu Mincho)', category: 'serif' },
  { family: 'MS Mincho', name: 'MS 明朝 (MS Mincho)', category: 'serif' },
  { family: 'MS PMincho', name: 'MS P明朝 (MS PMincho)', category: 'serif' },
  { family: 'BIZ UDPMincho', name: 'BIZ UDP明朝', category: 'serif' },
  { family: 'BIZ UDMincho', name: 'BIZ UD明朝 (等幅)', category: 'serif' },
  { family: 'Hiragino Mincho ProN', name: 'ヒラギノ明朝 ProN', category: 'serif' },
  { family: 'Noto Serif JP', name: 'Noto Serif JP', category: 'serif' },
  { family: 'HGP行書体', name: 'HGP行書体', category: 'serif' },
  { family: 'HG正楷書体-PRO', name: 'HG正楷書体-PRO', category: 'serif' },

  // Western Sans-serif
  { family: 'Segoe UI', name: 'Segoe UI', category: 'sans' },
  { family: 'Aptos', name: 'Aptos (新Office標準)', category: 'sans' },
  { family: 'Arial', name: 'Arial', category: 'sans' },
  { family: 'Calibri', name: 'Calibri', category: 'sans' },
  { family: 'Verdana', name: 'Verdana', category: 'sans' },
  { family: 'Tahoma', name: 'Tahoma', category: 'sans' },
  { family: 'Trebuchet MS', name: 'Trebuchet MS', category: 'sans' },
  { family: 'Helvetica Neue', name: 'Helvetica Neue', category: 'sans' },
  { family: 'San Francisco', name: 'San Francisco (-apple-system)', category: 'sans' },

  // Western Serif
  { family: 'Georgia', name: 'Georgia', category: 'serif' },
  { family: 'Times New Roman', name: 'Times New Roman', category: 'serif' },
  { family: 'Garamond', name: 'Garamond', category: 'serif' },
  { family: 'Palatino Linotype', name: 'Palatino Linotype', category: 'serif' },
  { family: 'Cambria', name: 'Cambria', category: 'serif' },

  // Monospace / Code
  { family: 'Consolas', name: 'Consolas (等幅)', category: 'mono' },
  { family: 'Cascadia Code', name: 'Cascadia Code', category: 'mono' },
  { family: 'Courier New', name: 'Courier New', category: 'mono' },
  { family: 'Monaco', name: 'Monaco', category: 'mono' },
  { family: 'Menlo', name: 'Menlo', category: 'mono' },
];

const LOCAL_STORAGE_KEY_PC_FONTS = 'marp_pc_loaded_fonts';
const LOCAL_STORAGE_KEY_CUSTOM_FONTS = 'marp_user_custom_fonts';

/**
 * Checks if the browser supports the Local Font Access API (window.queryLocalFonts)
 */
export function isLocalFontAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'queryLocalFonts' in window;
}

/**
 * Query and load all fonts installed on the user's PC using the Local Font Access API.
 * Returns array of unique font family names.
 */
export async function queryPCLoaclFonts(): Promise<SystemFontInfo[]> {
  const resultFonts: Map<string, SystemFontInfo> = new Map();

  // 1. Try Local Font Access API if supported
  if (isLocalFontAccessSupported()) {
    try {
      const localFonts = await (window as any).queryLocalFonts();
      for (const f of localFonts) {
        const family = f.family?.trim();
        if (family && !resultFonts.has(family)) {
          resultFonts.set(family, {
            family: family,
            name: family,
            isLocalPC: true,
            category: guessFontCategory(family),
          });
        }
      }
    } catch (err) {
      console.warn('Local Font Access API permission declined or error:', err);
    }
  }

  // If we got fonts from PC, save to localStorage
  if (resultFonts.size > 0) {
    const list = Array.from(resultFonts.values());
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PC_FONTS, JSON.stringify(list));
    } catch {
      // ignore
    }
    return list;
  }

  // 2. Fallback: Load previously cached PC fonts
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_PC_FONTS);
    if (cached) {
      const parsed: SystemFontInfo[] = JSON.parse(cached);
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }

  // 3. Fallback: Detect installed common OS fonts using document.fonts.check
  const detected = detectAvailableOSFonts();
  return detected;
}

/**
 * Detects which of the common OS fonts are available in this browser
 */
export function detectAvailableOSFonts(): SystemFontInfo[] {
  const available: SystemFontInfo[] = [];
  for (const font of COMMON_OS_FONTS) {
    available.push(font);
  }
  return available;
}

/**
 * Get all available fonts combining built-in, scanned PC fonts, and custom fonts
 */
export function getAllAvailableFonts(): SystemFontInfo[] {
  const fontMap = new Map<string, SystemFontInfo>();

  // Add default common OS fonts first
  COMMON_OS_FONTS.forEach((f) => {
    fontMap.set(f.family.toLowerCase(), f);
  });

  // Add scanned PC fonts
  try {
    const cachedPC = localStorage.getItem(LOCAL_STORAGE_KEY_PC_FONTS);
    if (cachedPC) {
      const pcFonts: SystemFontInfo[] = JSON.parse(cachedPC);
      pcFonts.forEach((f) => {
        const key = f.family.toLowerCase();
        if (!fontMap.has(key)) {
          fontMap.set(key, { ...f, isLocalPC: true });
        }
      });
    }
  } catch {
    // ignore
  }

  // Add user custom fonts
  try {
    const custom = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOM_FONTS);
    if (custom) {
      const customList: string[] = JSON.parse(custom);
      customList.forEach((fam) => {
        const key = fam.toLowerCase();
        if (!fontMap.has(key)) {
          fontMap.set(key, {
            family: fam,
            name: `${fam} (カスタム)`,
            category: guessFontCategory(fam),
          });
        }
      });
    }
  } catch {
    // ignore
  }

  return Array.from(fontMap.values());
}

/**
 * Save a custom font name
 */
export function addCustomFont(fontFamily: string): void {
  const clean = fontFamily.trim();
  if (!clean) return;
  try {
    const custom = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOM_FONTS);
    const list: string[] = custom ? JSON.parse(custom) : [];
    if (!list.includes(clean)) {
      list.push(clean);
      localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOM_FONTS, JSON.stringify(list));
    }
  } catch {
    // ignore
  }
}

function guessFontCategory(name: string): 'sans' | 'serif' | 'mono' | 'display' | 'other' {
  const lower = name.toLowerCase();
  if (lower.includes('mono') || lower.includes('consolas') || lower.includes('code') || lower.includes('gothic') && lower.includes('等幅')) return 'mono';
  if (lower.includes('mincho') || lower.includes('明朝') || lower.includes('serif') || lower.includes('times') || lower.includes('georgia') || lower.includes('garamond') || lower.includes('楷書') || lower.includes('行書')) return 'serif';
  if (lower.includes('pop') || lower.includes('ポップ') || lower.includes('display')) return 'display';
  return 'sans';
}

/**
 * Helper to normalize and match font family names cleanly
 */
export function getFriendlyFontName(rawFamily: string): string {
  if (!rawFamily) return 'システム標準';
  
  const cleaned = rawFamily.replace(/['"]/g, '').split(',')[0].trim();
  const found = COMMON_OS_FONTS.find(
    (f) => f.family.toLowerCase() === cleaned.toLowerCase() || f.name.toLowerCase().includes(cleaned.toLowerCase())
  );
  if (found) return found.name;
  return cleaned;
}

/**
 * Standard mapping for font sizes
 */
export interface CaretTypography {
  fontFamily: string;
  friendlyFontName: string;
  fontSizePx: number;
  fontSizePt: string;
  rawFontSize: string;
  fontWeight: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  color: string;
}

/**
 * Convert pixel font size to approximate point (pt) string
 */
export function pxToPt(px: number): string {
  // Standard CSS 1pt = 1.333px (96dpi / 72pt)
  const pt = Math.round((px * 72) / 96 * 10) / 10;
  return `${pt}pt`;
}

/**
 * Convert point (pt) string to pixel number
 */
export function ptToPx(ptStr: string): number {
  const num = parseFloat(ptStr);
  if (isNaN(num)) return 14;
  return Math.round((num * 96) / 72 * 10) / 10;
}

/**
 * Extract active caret typography directly from current selection / computed DOM style
 */
export function detectCaretTypography(defaultFont = 'Meiryo', defaultSize = '10.5pt'): CaretTypography {
  const sel = typeof window !== 'undefined' ? window.getSelection() : null;
  let targetEl: HTMLElement | null = null;

  if (sel && sel.rangeCount > 0) {
    const node = sel.anchorNode;
    if (node) {
      targetEl = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
    }
  }

  if (!targetEl) {
    const px = ptToPx(defaultSize);
    return {
      fontFamily: defaultFont,
      friendlyFontName: getFriendlyFontName(defaultFont),
      fontSizePx: px,
      fontSizePt: defaultSize,
      rawFontSize: `${px}px`,
      fontWeight: 'normal',
      isBold: false,
      isItalic: false,
      isUnderline: false,
      color: '#0f172a',
    };
  }

  const computed = window.getComputedStyle(targetEl);
  const rawFamily = computed.fontFamily || defaultFont;
  const cleanFamily = rawFamily.replace(/['"]/g, '').split(',')[0].trim();
  
  const rawFontSize = computed.fontSize || '14px';
  const pxVal = parseFloat(rawFontSize) || 14;
  const ptStr = pxToPt(pxVal);

  const fontWeight = computed.fontWeight || '400';
  const isBold = fontWeight === 'bold' || parseInt(fontWeight, 10) >= 600 || document.queryCommandState('bold');
  const isItalic = computed.fontStyle === 'italic' || document.queryCommandState('italic');
  const isUnderline = computed.textDecorationLine.includes('underline') || document.queryCommandState('underline');
  const color = computed.color || '#0f172a';

  return {
    fontFamily: cleanFamily,
    friendlyFontName: getFriendlyFontName(cleanFamily),
    fontSizePx: Math.round(pxVal * 10) / 10,
    fontSizePt: ptStr,
    rawFontSize: rawFontSize,
    fontWeight,
    isBold,
    isItalic,
    isUnderline,
    color,
  };
}
