export interface WorkSettings {
  title: string;
  genre: string;
  targetReader: string;
  pageCount: number;
  artStyle: string;
  atmosphere: string;
  protagonist: string;
  antagonist: string;
  setting: string;
  theme: string;
}

export interface Character {
  name: string;
  age: string;
  gender: string;
  personality: string;
  appearance: string;
  clothing: string;
  speech: string;
  troubles: string;
  goal: string;
  growth: string;
}

export interface Panel {
  panel: number;
  scene: string;
  dialogue: string;
  narration: string;
  expression: string;
  cameraAngle: string;
  background: string;
  drawingInstruction: string;
  imagePromptJa: string;
  imagePromptEn: string;
  characterPrompt: string;
  backgroundPrompt: string;
  negativePrompt: string;
  imageRatio: string;
  generatedImageUrl?: string;
}

export interface Page {
  page: number;
  purpose: string;
  panelCount: number;
  panels: Panel[];
}

export interface Story {
  synopsis: string;
  structure: string;
  episodes: string[];
  climax: string;
  ending: string;
  emotionalFlow: string;
}

export interface MangaProject {
  id: string;
  createdAt: string;
  updatedAt: string;
  settings: WorkSettings;
  story?: Story;
  characters?: Character[];
  pages?: Page[];
}

export const GENRES = [
  '少年漫画', '少女漫画', '青年漫画', '女性漫画',
  'ファンタジー', 'SF', '恋愛', 'ホラー', 'ギャグ', 'スポーツ',
  'ミステリー', '歴史', '日常系', 'アクション', 'ドラマ',
  'ビジネス', '教育・啓発', 'SNS漫画', '広告漫画',
];

export const ART_STYLES = [
  '少年誌風', '少女漫画風', 'リアル系', 'デフォルメ・ゆるキャラ',
  '劇画タッチ', 'シンプル線画', 'アメコミ風', '4コマ漫画風',
  'ウェブトゥーン風', 'モノクロ',
];

export const ATMOSPHERES = [
  '明るく元気', '感動的', 'シリアス', 'ほのぼの', 'ダーク',
  'コミカル', '緊張感', 'ロマンチック', '不思議・幻想的', '爽快',
];
