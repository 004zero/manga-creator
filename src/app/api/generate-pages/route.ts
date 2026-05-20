import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { WorkSettings, Story, Character, Page } from '@/types/manga';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key') || process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) return NextResponse.json({ error: 'APIキーが設定されていません' }, { status: 401 });
  const client = new Anthropic({ apiKey });
  const {
    settings,
    story,
    characters,
  }: { settings: WorkSettings; story: Story; characters: Character[] } = await req.json();

  const pageCount = Math.min(settings.pageCount, 6);
  const charSummary = characters
    .map((c) => `${c.name}（${c.age}歳・${c.personality}）`)
    .join('、');

  const prompt = `あなたは漫画のネーム作家です。以下の情報をもとに、${pageCount}ページ分のページ構成を生成してください。

【作品設定】
タイトル: ${settings.title}
ジャンル: ${settings.genre}
絵柄: ${settings.artStyle}
雰囲気: ${settings.atmosphere}

【あらすじ】
${story.synopsis}

【起承転結】
${story.structure}

【登場キャラクター】
${charSummary}

${pageCount}ページ分を以下のJSON形式のみで出力してください。説明文や\`\`\`は不要です:

[
  {
    "page": 1,
    "purpose": "このページの役割",
    "panelCount": 3,
    "panels": [
      {
        "panel": 1,
        "scene": "シーンの状況（50字以内）",
        "dialogue": "セリフ（ない場合は空文字）",
        "narration": "ナレーション（ない場合は空文字）",
        "expression": "表情",
        "cameraAngle": "アングル",
        "background": "背景（30字以内）",
        "drawingInstruction": "作画指示（50字以内）",
        "imagePromptJa": "",
        "imagePromptEn": "",
        "characterPrompt": "",
        "backgroundPrompt": "",
        "negativePrompt": "",
        "imageRatio": "2:3"
      }
    ]
  }
]`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error(`JSON配列が見つかりません: ${text.slice(0, 300)}`);

    const pages: Page[] = JSON.parse(jsonMatch[0]);
    return NextResponse.json(pages);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('generate-pages error:', msg);
    return NextResponse.json({ error: `ページ構成生成に失敗しました: ${msg}` }, { status: 500 });
  }
}
