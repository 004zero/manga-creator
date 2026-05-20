import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { WorkSettings, Story } from '@/types/manga';

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key') || process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) return NextResponse.json({ error: 'APIキーが設定されていません' }, { status: 401 });
  const client = new Anthropic({ apiKey });
  const settings: WorkSettings = await req.json();

  const prompt = `あなたは漫画のストーリーライターです。以下の設定をもとに、漫画のストーリーを生成してください。

【作品設定】
タイトル: ${settings.title}
ジャンル: ${settings.genre}
ターゲット読者: ${settings.targetReader}
総ページ数: ${settings.pageCount}ページ
絵柄: ${settings.artStyle}
雰囲気: ${settings.atmosphere}
主人公: ${settings.protagonist}
敵・ライバル: ${settings.antagonist}
舞台: ${settings.setting}
テーマ: ${settings.theme}

以下のJSON形式で出力してください。他の文字は一切含めないでください:

{
  "synopsis": "あらすじ（200〜300字）",
  "structure": "起承転結の詳細説明（各100字程度）",
  "episodes": ["第1話のタイトルと内容", "第2話のタイトルと内容", "第3話のタイトルと内容"],
  "climax": "最大の見せ場・クライマックスの説明（150字）",
  "ending": "ラストのオチ・結末の説明（100字）",
  "emotionalFlow": "読者の感情導線の説明（各シーンで読者がどう感じるか、150字）"
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`JSONオブジェクトが見つかりません。レスポンス: ${text.slice(0, 200)}`);

    const story: Story = JSON.parse(jsonMatch[0]);
    return NextResponse.json(story);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('generate-story error:', msg);
    return NextResponse.json({ error: `ストーリー生成に失敗しました: ${msg}` }, { status: 500 });
  }
}
