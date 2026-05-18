'use client';
import { Story } from '@/types/manga';

interface Props {
  story: Story;
  onGenerateCharacters: () => void;
  loading: boolean;
}

export function StoryPreview({ story, onGenerateCharacters, loading }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">ストーリー</h2>

      <Section title="あらすじ">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{story.synopsis}</p>
      </Section>

      <Section title="起承転結">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{story.structure}</p>
      </Section>

      <Section title="各話構成">
        <ol className="list-decimal list-inside space-y-2">
          {story.episodes.map((ep, i) => (
            <li key={i} className="text-sm">{ep}</li>
          ))}
        </ol>
      </Section>

      <Section title="クライマックス">
        <p className="text-sm leading-relaxed">{story.climax}</p>
      </Section>

      <Section title="ラスト・オチ">
        <p className="text-sm leading-relaxed">{story.ending}</p>
      </Section>

      <Section title="読者の感情導線">
        <p className="text-sm leading-relaxed">{story.emotionalFlow}</p>
      </Section>

      <button
        onClick={onGenerateCharacters}
        disabled={loading}
        className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold rounded-xl text-base transition-colors"
      >
        {loading ? '🔄 生成中...' : '👤 キャラクターを生成する'}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">{title}</h3>
      <div className="text-gray-800 dark:text-gray-200">{children}</div>
    </div>
  );
}
