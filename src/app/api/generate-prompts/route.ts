import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { Page, Character, WorkSettings } from '@/types/manga';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key') || process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) return NextResponse.json({ error: 'APIキーが設定されていません' }, { status: 401 });
  const client = new Anthropic({ apiKey });
  const {
    pages,
    characters,
    settings,
  }: { pages: Page[]; characters: Character[]; settings: WorkSettings } = await req.json();

  const mainChar = characters[0];
  const charDesc = mainChar
    ? `主人公: ${mainChar.name}、${mainChar.appearance}、${mainChar.clothing}`
    : '';

  const panelList = pages
    .flatMap((p) =>
      p.panels.map((panel) => ({
        page: p.page,
        panel: panel.panel,
        scene: panel.scene,
        expression: panel.expression,
        cameraAngle: panel.cameraAngle,
        background: panel.background,
      }))
    )
    .slice(0, 20);

  const prompt = `あなたは画像生成AIのプロンプト専門家です。以下のコマ情報をもとに各コマのプロンプトを生成してください。

【作品情報】
絵柄: ${settings.artStyle}
雰囲気: ${settings.atmosphere}
${charDesc}

【コマ一覧】
${JSON.stringify(panelList, null, 2)}

各コマについて以下のJSON配列で出力してください。説明文や\`\`\`は不要です:

[
  {
    "page": 1,
    "panel": 1,
    "imagePromptJa": "日本語プロンプト（画風・シーン・キャラ・雰囲気）",
    "imagePromptEn": "English prompt for image generation AI",
    "characterPrompt": "キャラクター固定用プロンプト（外見・服装の詳細）",
    "backgroundPrompt": "背景プロンプト",
    "negativePrompt": "worst quality, low quality, blurry, deformed",
    "imageRatio": "2:3"
  }
]`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error(`JSON配列が見つかりません: ${text.slice(0, 200)}`);

    const prompts: { page: number; panel: number; imagePromptJa: string; imagePromptEn: string; characterPrompt: string; backgroundPrompt: string; negativePrompt: string; imageRatio: string }[] = JSON.parse(jsonMatch[0]);
    return NextResponse.json(prompts);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('generate-prompts error:', msg);
    return NextResponse.json({ error: `プロンプト生成に失敗しました: ${msg}` }, { status: 500 });
  }
}
