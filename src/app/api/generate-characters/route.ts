import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { WorkSettings, Story, Character } from '@/types/manga';

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key') || process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) return NextResponse.json({ error: 'APIキーが設定されていません' }, { status: 401 });
  const client = new Anthropic({ apiKey });
  const { settings, story }: { settings: WorkSettings; story: Story } = await req.json();

  const prompt = `あなたは漫画のキャラクターデザイナーです。以下の設定とストーリーをもとに、キャラクター設定を生成してください。

【作品設定】
タイトル: ${settings.title}
ジャンル: ${settings.genre}
絵柄: ${settings.artStyle}
主人公: ${settings.protagonist}
敵・ライバル: ${settings.antagonist}
テーマ: ${settings.theme}

【あらすじ】
${story.synopsis}

主人公とサブキャラクター（2〜3人）について、以下のJSON形式で出力してください。他の文字は一切含めないでください:

[
  {
    "name": "キャラクター名",
    "age": "年齢",
    "gender": "性別",
    "personality": "性格の詳細",
    "appearance": "外見の詳細（髪型・体型・顔立ちなど）",
    "clothing": "服装・コーデの詳細",
    "speech": "口調・話し方の特徴と例",
    "troubles": "悩み・コンプレックス",
    "goal": "目的・夢",
    "growth": "物語を通じた成長ポイント"
  }
]`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error(`JSON配列が見つかりません。レスポンス: ${text.slice(0, 200)}`);

    const characters: Character[] = JSON.parse(jsonMatch[0]);
    return NextResponse.json(characters);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('generate-characters error:', msg);
    return NextResponse.json({ error: `キャラクター生成に失敗しました: ${msg}` }, { status: 500 });
  }
}
