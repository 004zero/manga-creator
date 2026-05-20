import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { WorkSettings, Story, Character, Page } from '@/types/manga';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key') || process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) return NextResponse.json({ error: 'APIキーが設定されていません' }, { status: 401 });
  const client = new Anthropic({ apiKey });

  const {
    pageNumber,
    totalPages,
    settings,
    story,
    characters,
    previousPages,
  }: {
    pageNumber: number;
    totalPages: number;
    settings: WorkSettings;
    story: Story;
    characters: Character[];
    previousPages: { page: number; purpose: string }[];
  } = await req.json();

  const charSummary = characters
    .map((c) => `${c.name}（${c.age}歳・${c.personality}）`)
    .join('、');

  const prevSummary = previousPages.length > 0
    ? `【前のページの内容】\n${previousPages.map(p => `P${p.page}: ${p.purpose}`).join('\n')}`
    : '';

  const prompt = `漫画のネーム作家として、ページ${pageNumber}（全${totalPages}ページ中）を生成してください。

【作品】${settings.title}（${settings.genre}・${settings.atmosphere}）
【あらすじ】${story.synopsis}
【キャラ】${charSummary}
${prevSummary}

ページ${pageNumber}の内容をJSON形式のみで出力してください（\`\`\`不要）:

{
  "page": ${pageNumber},
  "purpose": "このページの役割（20字以内）",
  "panelCount": 3,
  "panels": [
    {
      "panel": 1,
      "scene": "シーン説明（40字以内）",
      "dialogue": "セリフ（なければ空文字）",
      "narration": "ナレーション（なければ空文字）",
      "expression": "表情",
      "cameraAngle": "アングル",
      "background": "背景（20字以内）",
      "drawingInstruction": "作画指示（40字以内）",
      "imagePromptJa": "",
      "imagePromptEn": "",
      "characterPrompt": "",
      "backgroundPrompt": "",
      "negativePrompt": "",
      "imageRatio": "2:3"
    }
  ]
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`JSON not found: ${text.slice(0, 200)}`);

    const page: Page = JSON.parse(jsonMatch[0]);
    return NextResponse.json(page);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`generate-page ${pageNumber} error:`, msg);
    return NextResponse.json({ error: `P${pageNumber}生成失敗: ${msg}` }, { status: 500 });
  }
}
