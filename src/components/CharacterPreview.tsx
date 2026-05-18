'use client';
import { Character } from '@/types/manga';

interface Props {
  characters: Character[];
  onGeneratePages: () => void;
  loading: boolean;
}

export function CharacterPreview({ characters, onGeneratePages, loading }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">キャラクター設定</h2>

      {characters.map((char, i) => (
        <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
          <h3 className="font-bold text-blue-600 dark:text-blue-400 text-base">
            {i === 0 ? '👑 主人公' : `👤 サブキャラ ${i}`} — {char.name}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <CharRow label="年齢" value={char.age} />
            <CharRow label="性別" value={char.gender} />
          </div>
          <CharRow label="性格" value={char.personality} />
          <CharRow label="外見" value={char.appearance} />
          <CharRow label="服装" value={char.clothing} />
          <CharRow label="口調" value={char.speech} />
          <CharRow label="悩み" value={char.troubles} />
          <CharRow label="目的" value={char.goal} />
          <CharRow label="成長ポイント" value={char.growth} />
        </div>
      ))}

      <button
        onClick={onGeneratePages}
        disabled={loading}
        className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold rounded-xl text-base transition-colors"
      >
        {loading ? '🔄 生成中...' : '📄 ページ構成を生成する'}
      </button>
    </div>
  );
}

function CharRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="font-semibold text-gray-600 dark:text-gray-400 mr-1">{label}:</span>
      <span className="text-gray-800 dark:text-gray-200">{value}</span>
    </div>
  );
}
