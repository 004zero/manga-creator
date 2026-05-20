'use client';
import { useState } from 'react';
import { Panel } from '@/types/manga';

interface Props {
  panel: Panel;
  artStyle: string;
  onImageGenerated: (url: string) => void;
}

function buildPrompt(panel: Panel, artStyle: string): string {
  const base = panel.imagePromptEn || panel.scene;
  const styleTag = artStyle.includes('少女') ? 'shoujo manga style' :
    artStyle.includes('少年') ? 'shounen manga style' :
    artStyle.includes('リアル') ? 'realistic manga illustration' :
    artStyle.includes('デフォルメ') ? 'chibi manga style, cute' :
    artStyle.includes('ウェブトゥーン') ? 'webtoon style, full color' :
    'manga style, black and white illustration';
  return `${base}, ${styleTag}, high quality, detailed lineart`;
}

function ratioToDimensions(ratio: string): { w: number; h: number } {
  const map: Record<string, { w: number; h: number }> = {
    '1:1': { w: 512, h: 512 },
    '4:3': { w: 640, h: 480 },
    '3:4': { w: 480, h: 640 },
    '16:9': { w: 768, h: 432 },
    '9:16': { w: 432, h: 768 },
    '2:3': { w: 512, h: 768 },
    '3:2': { w: 768, h: 512 },
  };
  return map[ratio] || { w: 512, h: 768 };
}

export function PanelImage({ panel, artStyle, onImageGenerated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = () => {
    setLoading(true);
    setError('');
    const prompt = buildPrompt(panel, artStyle);
    const { w, h } = ratioToDimensions(panel.imageRatio || '2:3');
    const seed = Math.floor(Math.random() * 999999);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&model=flux&seed=${seed}`;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      onImageGenerated(url);
      setLoading(false);
    };
    img.onerror = () => {
      setError('生成に失敗しました。再度お試しください。');
      setLoading(false);
    };
    img.src = url;
  };

  if (panel.generatedImageUrl) {
    return (
      <div className="mt-3 space-y-2">
        <img
          src={panel.generatedImageUrl}
          alt={`コマ${panel.panel}の生成画像`}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 object-cover"
        />
        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-1.5 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          {loading ? '⏳ 再生成中...' : '🔄 別の絵で再生成'}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {error && <p className="text-xs text-red-500 mb-1">{error}</p>}
      {loading ? (
        <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-xl flex flex-col items-center justify-center gap-2">
          <div className="text-2xl animate-pulse">🎨</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">AIが画像を生成中...</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">10〜30秒かかります</p>
        </div>
      ) : (
        <button
          onClick={generate}
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          🖼️ このコマの画像を生成
        </button>
      )}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">
        無料・APIキー不要（Pollinations AI）
      </p>
    </div>
  );
}
