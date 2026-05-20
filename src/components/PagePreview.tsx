'use client';
import { useState } from 'react';
import { Page } from '@/types/manga';
import { PanelImage } from '@/components/PanelImage';

interface Props {
  pages: Page[];
  artStyle: string;
  onExport: () => void;
  onGeneratePrompts?: () => void;
  promptsLoading?: boolean;
  hasPrompts?: boolean;
  onPanelImageGenerated: (pageIdx: number, panelIdx: number, url: string) => void;
}

export function PagePreview({ pages, artStyle, onExport, onGeneratePrompts, promptsLoading, hasPrompts, onPanelImageGenerated }: Props) {
  const [selectedPage, setSelectedPage] = useState(0);
  const [showPrompts, setShowPrompts] = useState(false);
  const [showImages, setShowImages] = useState(false);

  const page = pages[selectedPage];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">ページ構成</h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowImages(!showImages); setShowPrompts(false); }}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${showImages ? 'bg-purple-600 text-white' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'}`}
          >
            🖼️ 画像生成
          </button>
          <button
            onClick={() => { setShowPrompts(!showPrompts); setShowImages(false); }}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${showPrompts ? 'bg-orange-500 text-white' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'}`}
          >
            🎨 プロンプト
          </button>
        </div>
      </div>

      {/* ページ選択タブ */}
      <div className="flex flex-wrap gap-2">
        {pages.map((p, i) => (
          <button
            key={i}
            onClick={() => setSelectedPage(i)}
            className={`px-3 py-1 rounded-full text-sm font-bold transition-colors ${
              selectedPage === i
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            P{p.page}
            {p.panels.some(panel => panel.generatedImageUrl) && ' 🖼️'}
          </button>
        ))}
      </div>

      {page && (
        <div className="space-y-3">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
              ページ {page.page} — {page.purpose}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              コマ数: {page.panelCount}コマ
            </p>
          </div>

          {page.panels.map((panel, panelIdx) => (
            <div key={panel.panel} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300">
                コマ {panel.panel}
              </h4>

              {showImages ? (
                <>
                  <PanelView panel={panel} />
                  <PanelImage
                    panel={panel}
                    artStyle={artStyle}
                    onImageGenerated={(url) => onPanelImageGenerated(selectedPage, panelIdx, url)}
                  />
                </>
              ) : showPrompts ? (
                <PromptView panel={panel} />
              ) : (
                <PanelView panel={panel} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* コマ割り一覧テーブル */}
      <div className="mt-6">
        <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-2">コマ割り一覧表</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                {['P', 'コマ', '内容', 'セリフ', 'ナレーション', '作画指示'].map((h) => (
                  <th key={h} className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.flatMap((p) =>
                p.panels.map((panel) => (
                  <tr key={`${p.page}-${panel.panel}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{p.page}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{panel.panel}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 max-w-[120px]">{panel.scene}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 max-w-[100px]">{panel.dialogue}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 max-w-[100px]">{panel.narration}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 max-w-[120px]">{panel.drawingInstruction}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {onGeneratePrompts && (
        <button
          onClick={onGeneratePrompts}
          disabled={promptsLoading}
          className="w-full py-3 px-6 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold rounded-xl text-base transition-colors"
        >
          {promptsLoading ? '🔄 プロンプト生成中...' : hasPrompts ? '🎨 プロンプト再生成' : '🎨 画像生成AIプロンプトを作る'}
        </button>
      )}
      <button
        onClick={onExport}
        className="w-full py-3 px-6 bg-gray-800 hover:bg-gray-900 dark:bg-gray-200 dark:hover:bg-white dark:text-gray-900 text-white font-bold rounded-xl text-base transition-colors"
      >
        📤 エクスポート
      </button>
    </div>
  );
}

function PanelView({ panel }: { panel: Page['panels'][0] }) {
  return (
    <div className="grid grid-cols-1 gap-1 text-sm">
      <Row label="シーン" value={panel.scene} />
      {panel.dialogue && <Row label="セリフ" value={`「${panel.dialogue}」`} highlight />}
      {panel.narration && <Row label="ナレーション" value={panel.narration} />}
      <Row label="表情" value={panel.expression} />
      <Row label="アングル" value={panel.cameraAngle} />
      <Row label="背景" value={panel.background} />
      <Row label="作画指示" value={panel.drawingInstruction} />
    </div>
  );
}

function PromptView({ panel }: { panel: Page['panels'][0] }) {
  const copy = (text: string) => navigator.clipboard.writeText(text);
  return (
    <div className="space-y-2 text-sm">
      <PromptRow label="日本語プロンプト" value={panel.imagePromptJa} onCopy={copy} />
      <PromptRow label="英語プロンプト" value={panel.imagePromptEn} onCopy={copy} />
      <PromptRow label="キャラクター固定" value={panel.characterPrompt} onCopy={copy} />
      <PromptRow label="背景" value={panel.backgroundPrompt} onCopy={copy} />
      <PromptRow label="ネガティブ" value={panel.negativePrompt} onCopy={copy} />
      <div className="text-xs text-gray-500">画像比率: {panel.imageRatio}</div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <span className="font-semibold text-gray-500 dark:text-gray-400 text-xs">{label}: </span>
      <span className={highlight ? 'font-bold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}>
        {value}
      </span>
    </div>
  );
}

function PromptRow({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string) => void }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{label}</span>
        <button onClick={() => onCopy(value)} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400">
          コピー
        </button>
      </div>
      <p className="text-xs text-gray-700 dark:text-gray-300 break-all">{value}</p>
    </div>
  );
}
