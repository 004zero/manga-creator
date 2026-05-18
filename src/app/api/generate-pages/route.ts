import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { WorkSettings, Story, Character, Page } from '@/types/manga';

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key') || process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) return NextResponse.json({ error: 'APIキーが設定されていません' }, { status: 401 });
  const client = new Anthropic({ apiKey });
  const {
    settings,
    story,
    characters,
  }: { settings: WorkSettings; story: Story; characters: Character[] } = await req.json();

  const pageCount = Math.min(settings.pageCount, 10);
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

${pageCount}ページ分を以下のJSON形式で出力してください。他の文字は一切含めないでください:

[
  {
    "page": 1,
    "purpose": "このページの役割・目的",
    "panelCount": 4,
    "panels": [
      {
        "panel": 1,
        "scene": "シーンの状況説明",
        "dialogue": "セリフ（ない場合は空文字）",
        "narration": "ナレーション・モノローグ（ない場合は空文字）",
        "expression": "キャラクターの表情",
        "cameraAngle": "カメラアングル（例：正面・俯瞰・煽り・寄り・引き）",
        "background": "背景の説明",
        "drawingInstruction": "作画師への指示",
        "imagePromptJa": "画像生成AI用日本語プロンプト",
        "imagePromptEn": "画像生成AI用英語プロンプト",
        "characterPrompt": "キャラクター固定用プロンプト",
        "backgroundPrompt": "背景プロンプト",
        "negativePrompt": "ネガティブプロンプト",
        "imageRatio": "画像比率（例：1:1・4:3・16:9・2:3）"
      }
    ]
  }
]`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('JSON not found in response');

    const pages: Page[] = JSON.parse(jsonMatch[0]);
    return NextResponse.json(pages);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'ページ構成生成に失敗しました' }, { status: 500 });
  }
}
