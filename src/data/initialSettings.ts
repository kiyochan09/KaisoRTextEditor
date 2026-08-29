import { SystemSettings } from '../types';

export interface FontOption {
  id: string;
  name: string;
  family: string;
  category: 'sans' | 'serif' | 'mono';
  description: string;
}

export const FONT_FAMILY_PRESETS: FontOption[] = [
  {
    id: 'system',
    name: 'システム標準 (System Default)',
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Meiryo", sans-serif',
    category: 'sans',
    description: 'OS環境に応じた標準フォント（Segoe UI / San Francisco / Meiryo）',
  },
  {
    id: 'meiryo',
    name: 'メイリオ (Meiryo)',
    family: '"Meiryo", "メイリオ", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
    category: 'sans',
    description: 'Windowsで圧倒的な視認性を誇る明快なゴシック体',
  },
  {
    id: 'biz-ud-gothic',
    name: 'BIZ UDPゴシック (UD Gothic)',
    family: '"BIZ UDPGothic", "BIZ UDGothic", "Meiryo", sans-serif',
    category: 'sans',
    description: 'ユニバーサルデザイン設計で誤読を防ぎ長文でも疲れにくいフォント',
  },
  {
    id: 'yu-gothic',
    name: '游ゴシック (Yu Gothic)',
    family: '"Yu Gothic", "游ゴシック", "YuGothic", "Hiragino Sans", sans-serif',
    category: 'sans',
    description: '洗練された現代的な字形を持つ標準ゴシック体',
  },
  {
    id: 'ms-ui-gothic',
    name: 'MS UI Gothic',
    family: '"MS UI Gothic", "MS PGothic", sans-serif',
    category: 'sans',
    description: 'Windowsクラシック調・高密度でコンパクトな表示',
  },
  {
    id: 'yu-mincho',
    name: '游明朝 (Yu Mincho - 明朝体)',
    family: '"Yu Mincho", "游明朝", "YuMincho", "Hiragino Mincho ProN", "MS Mincho", serif',
    category: 'serif',
    description: '小説・論文・報告書に適した上品な日本語明朝体',
  },
  {
    id: 'ms-mincho',
    name: 'MS 明朝 (MS Mincho)',
    family: '"MS Mincho", "MS PMincho", "Hiragino Mincho ProN", serif',
    category: 'serif',
    description: '伝統的な公用文・官公庁規格の明朝体',
  },
  {
    id: 'verdana',
    name: 'Verdana (欧文おすすめ)',
    family: 'Verdana, Geneva, "Meiryo", sans-serif',
    category: 'sans',
    description: '画面表示用に開発された文字幅の広い読みやすい欧文フォント',
  },
  {
    id: 'segoe-ui',
    name: 'Segoe UI',
    family: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    category: 'sans',
    description: 'Microsoft Fluentデザイン標準のモダンなフォント',
  },
  {
    id: 'arial',
    name: 'Arial',
    family: 'Arial, Helvetica, sans-serif',
    category: 'sans',
    description: '世界標準のニュートラルなサンセリフ体',
  },
  {
    id: 'georgia',
    name: 'Georgia (欧文ローマン体)',
    family: 'Georgia, "Times New Roman", "Yu Mincho", serif',
    category: 'serif',
    description: '美しく格調高いセリフ体・出版物ライクな装丁',
  },
  {
    id: 'consolas',
    name: 'Consolas (プログラミング等幅)',
    family: 'Consolas, "Courier New", "BIZ UDGothic", monospace',
    category: 'mono',
    description: 'コード・マークダウン・表データ向けの明瞭な等幅フォント',
  },
];

export interface FontSizeOption {
  value: string;
  label: string;
  px: number;
  description: string;
}

export const FONT_SIZE_PRESETS: FontSizeOption[] = [
  { value: '9pt', label: '9pt (12px)', px: 12, description: '極小・一覧重視' },
  { value: '10pt', label: '10pt (13.3px)', px: 13.3, description: '小・コンパクト' },
  { value: '10.5pt', label: '10.5pt (14px)', px: 14, description: 'Word標準・日本語公用文' },
  { value: '11pt', label: '11pt (14.7px)', px: 14.7, description: '標準（推奨）' },
  { value: '12pt', label: '12pt (16px)', px: 16, description: 'Web標準・読みやすい' },
  { value: '13pt', label: '13pt (17.3px)', px: 17.3, description: 'やや大きめ' },
  { value: '14pt', label: '14pt (18.7px)', px: 18.7, description: '大きめ・見やすい' },
  { value: '16pt', label: '16pt (21.3px)', px: 21.3, description: '大文字・プレゼン向け' },
  { value: '18pt', label: '18pt (24px)', px: 24, description: '特大' },
];

export interface WrapOption {
  mode: SystemSettings['bodyWrapMode'];
  title: string;
  subtitle: string;
  defaultVal: number;
  presets: number[];
  unit: string;
}

export const WRAP_MODE_OPTIONS: WrapOption[] = [
  {
    mode: 'full',
    title: 'ウィンドウ幅に連動 (自動折り返し / 100%)',
    subtitle: 'エディタの画面サイズ・ウィンドウ幅いっぱいに自然に折り返します',
    defaultVal: 0,
    presets: [],
    unit: '',
  },
  {
    mode: 'characters',
    title: '指定文字数で折り返し (Characters)',
    subtitle: '原稿用紙やエディタ標準の文字数（40文字・80文字など）で固定折り返し',
    defaultVal: 80,
    presets: [35, 40, 50, 60, 80, 100, 120],
    unit: '文字',
  },
  {
    mode: 'pixels',
    title: '固定ピクセル幅で折り返し (Pixels)',
    subtitle: 'A4用紙やノート幅（700px・800px・1000pxなど）で固定中央揃え',
    defaultVal: 800,
    presets: [600, 700, 800, 900, 1000, 1200],
    unit: 'px',
  },
  {
    mode: 'none',
    title: '折り返さない (横スクロール / No Wrap)',
    subtitle: '改行コードまで1行で表示し、横スクロールバーで閲覧します',
    defaultVal: 0,
    presets: [],
    unit: '',
  },
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Meiryo", sans-serif',
  fontSize: '10.5pt',
  bodyWrapMode: 'full',
  bodyWrapValue: 80,
  lineHeight: '1.6',
  contentAlignment: 'center',
  pagePadding: 'normal',
};
