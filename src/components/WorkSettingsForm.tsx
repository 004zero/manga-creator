'use client';
import { WorkSettings, GENRES, ART_STYLES, ATMOSPHERES } from '@/types/manga';

interface Props {
  settings: WorkSettings;
  onChange: (settings: WorkSettings) => void;
  onGenerate: () => void;
  loading: boolean;
}

const field = (
  label: string,
  children: React.ReactNode,
  hint?: string
) => (
  <div className="mb-4">
    <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">
      {label}
    </label>
    {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{hint}</p>}
    {children}
  </div>
);

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

const selectClass =
  'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

export function WorkSettingsForm({ settings, onChange, onGenerate, loading }: Props) {
  const set = (key: keyof WorkSettings, value: string | number) =>
    onChange({ ...settings, [key]: value });

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">作品設定</h2>

      {field('漫画タイトル', (
        <input
          className={inputClass}
          placeholder="例：ゼロから始まる転職ライフ"
          value={settings.title}
          onChange={(e) => set('title', e.target.value)}
        />
      ))}

      {field('ジャンル', (
        <select className={selectClass} value={settings.genre} onChange={(e) => set('genre', e.target.value)}>
          <option value="">選択してください</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      ))}

      {field('ターゲット読者', (
        <input
          className={inputClass}
          placeholder="例：20〜30代の転職を考えているサラリーマン"
          value={settings.targetReader}
          onChange={(e) => set('targetReader', e.target.value)}
        />
      ))}

      {field('総ページ数', (
        <input
          type="number"
          className={inputClass}
          min={4}
          max={50}
          value={settings.pageCount}
          onChange={(e) => set('pageCount', parseInt(e.target.value) || 8)}
        />
      ), 'AI生成は最大10ページまで対応')}

      {field('絵柄', (
        <select className={selectClass} value={settings.artStyle} onChange={(e) => set('artStyle', e.target.value)}>
          <option value="">選択してください</option>
          {ART_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ))}

      {field('雰囲気', (
        <select className={selectClass} value={settings.atmosphere} onChange={(e) => set('atmosphere', e.target.value)}>
          <option value="">選択してください</option>
          {ATMOSPHERES.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      ))}

      {field('主人公設定', (
        <textarea
          className={inputClass}
          rows={3}
          placeholder="例：28歳・男性・中堅IT企業に勤める営業マン。仕事に疲れ転職を考えているが、踏み出せずにいる。"
          value={settings.protagonist}
          onChange={(e) => set('protagonist', e.target.value)}
        />
      ))}

      {field('敵・ライバル設定', (
        <textarea
          className={inputClass}
          rows={2}
          placeholder="例：同期のエース社員。なんでもうまくいくように見えるが…（ない場合は空白でもOK）"
          value={settings.antagonist}
          onChange={(e) => set('antagonist', e.target.value)}
        />
      ))}

      {field('舞台設定', (
        <textarea
          className={inputClass}
          rows={2}
          placeholder="例：現代の東京。オフィス・コンビニ・自宅が主な舞台。"
          value={settings.setting}
          onChange={(e) => set('setting', e.target.value)}
        />
      ))}

      {field('伝えたいテーマ', (
        <textarea
          className={inputClass}
          rows={2}
          placeholder="例：自分らしく生きることの大切さ。一歩踏み出す勇気。"
          value={settings.theme}
          onChange={(e) => set('theme', e.target.value)}
        />
      ))}

      <button
        onClick={onGenerate}
        disabled={loading || !settings.title || !settings.genre}
        className="w-full mt-4 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-xl text-base transition-colors"
      >
        {loading ? '🔄 生成中...' : '✨ ストーリーを生成する'}
      </button>
    </div>
  );
}
