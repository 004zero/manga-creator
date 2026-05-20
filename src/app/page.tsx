'use client';
import { useState, useEffect } from 'react';
import { MangaProject, WorkSettings, Story, Character, Page } from '@/types/manga';
import { WorkSettingsForm } from '@/components/WorkSettingsForm';
import { StoryPreview } from '@/components/StoryPreview';
import { CharacterPreview } from '@/components/CharacterPreview';
import { PagePreview } from '@/components/PagePreview';
import { ExportModal } from '@/components/ExportModal';
import { ApiKeyModal } from '@/components/ApiKeyModal';

const DEFAULT_SETTINGS: WorkSettings = {
  title: '',
  genre: '',
  targetReader: '',
  pageCount: 8,
  artStyle: '',
  atmosphere: '',
  protagonist: '',
  antagonist: '',
  setting: '',
  theme: '',
};

const STORAGE_KEY = 'manga-creator-projects';

function newProject(): MangaProject {
  return {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: { ...DEFAULT_SETTINGS },
  };
}

type Step = 'settings' | 'story' | 'characters' | 'pages';

export default function Home() {
  const [projects, setProjects] = useState<MangaProject[]>([]);
  const [current, setCurrent] = useState<MangaProject | null>(null);
  const [step, setStep] = useState<Step>('settings');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [pageProgress, setPageProgress] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setProjects(JSON.parse(saved));
    const dm = localStorage.getItem('dark-mode');
    if (dm === 'true') setDarkMode(true);
    const key = localStorage.getItem('anthropic-api-key');
    setApiKey(key);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('dark-mode', String(darkMode));
  }, [darkMode]);

  const saveProject = (project: MangaProject) => {
    const updated = { ...project, updatedAt: new Date().toISOString() };
    setProjects((prev) => {
      const next = prev.some((p) => p.id === updated.id)
        ? prev.map((p) => (p.id === updated.id ? updated : p))
        : [updated, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setCurrent(updated);
    return updated;
  };

  const handleNewProject = () => {
    setCurrent(newProject());
    setStep('settings');
    setShowProjects(false);
    setError('');
  };

  const handleLoadProject = (p: MangaProject) => {
    setCurrent(p);
    if (p.pages) setStep('pages');
    else if (p.characters) setStep('characters');
    else if (p.story) setStep('story');
    else setStep('settings');
    setShowProjects(false);
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (current?.id === id) {
      setCurrent(null);
      setStep('settings');
    }
  };

  const apiHeaders = () => ({
    'Content-Type': 'application/json',
    ...(apiKey ? { 'x-api-key': apiKey } : {}),
  });

  const handleGenerateStory = async () => {
    if (!current) return;
    if (!apiKey) { setShowApiKey(true); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify(current.settings),
      });
      if (!res.ok) throw new Error(await res.text());
      const story: Story = await res.json();
      const updated = saveProject({ ...current, story });
      setCurrent(updated);
      setStep('story');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCharacters = async () => {
    if (!current?.story) return;
    if (!apiKey) { setShowApiKey(true); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-characters', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ settings: current.settings, story: current.story }),
      });
      if (!res.ok) throw new Error(await res.text());
      const characters: Character[] = await res.json();
      const updated = saveProject({ ...current, characters });
      setCurrent(updated);
      setStep('characters');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePages = async () => {
    if (!current?.story || !current?.characters) return;
    if (!apiKey) { setShowApiKey(true); return; }
    setLoading(true);
    setError('');
    const totalPages = Math.min(current.settings.pageCount, 6);
    const pages: Page[] = [];
    try {
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setPageProgress(`ページ ${pageNum} / ${totalPages} を生成中...`);
        const res = await fetch('/api/generate-page', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({
            pageNumber: pageNum,
            totalPages,
            settings: current.settings,
            story: current.story,
            characters: current.characters,
            previousPages: pages.map((p) => ({ page: p.page, purpose: p.purpose })),
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const page: Page = await res.json();
        pages.push(page);
      }
      const updated = saveProject({ ...current, pages });
      setCurrent(updated);
      setStep('pages');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
      setPageProgress('');
    }
  };

  const handleGeneratePrompts = async () => {
    if (!current?.pages || !current?.characters) return;
    if (!apiKey) { setShowApiKey(true); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-prompts', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          pages: current.pages,
          characters: current.characters,
          settings: current.settings,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const promptData: { page: number; panel: number; imagePromptJa: string; imagePromptEn: string; characterPrompt: string; backgroundPrompt: string; negativePrompt: string; imageRatio: string }[] = await res.json();
      const updatedPages = current.pages.map((p) => ({
        ...p,
        panels: p.panels.map((panel) => {
          const found = promptData.find((d) => d.page === p.page && d.panel === panel.panel);
          return found ? { ...panel, ...found } : panel;
        }),
      }));
      const updated = saveProject({ ...current, pages: updatedPages });
      setCurrent(updated);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const steps: { key: Step; label: string; available: boolean }[] = [
    { key: 'settings', label: '①作品設定', available: true },
    { key: 'story', label: '②ストーリー', available: !!current?.story },
    { key: 'characters', label: '③キャラクター', available: !!current?.characters },
    { key: 'pages', label: '④ページ構成', available: !!current?.pages },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors">
      {/* ヘッダー */}
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">漫画クリエイター</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProjects(!showProjects)}
              className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              作品一覧 ({projects.length})
            </button>
            <button
              onClick={handleNewProject}
              className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
            >
              + 新規作品
            </button>
            <button
              onClick={() => setShowApiKey(true)}
              className={`text-sm px-3 py-1.5 rounded-lg font-bold transition-colors ${
                apiKey
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 animate-pulse'
              }`}
              title="APIキー設定"
            >
              {apiKey ? '🔑 APIキー設定済み' : '🔑 APIキー未設定'}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-lg p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="ダーク/ライト切替"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* 作品一覧パネル */}
      {showProjects && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-lg">
            <h2 className="font-bold text-gray-900 dark:text-white mb-3">保存済み作品</h2>
            {projects.length === 0 ? (
              <p className="text-sm text-gray-500">まだ作品がありません。「+ 新規作品」から始めてください。</p>
            ) : (
              <div className="space-y-2">
                {projects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <button
                      className="text-left flex-1"
                      onClick={() => handleLoadProject(p)}
                    >
                      <div className="font-bold text-sm text-gray-900 dark:text-white">
                        {p.settings.title || '（タイトル未設定）'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {p.settings.genre} | {new Date(p.updatedAt).toLocaleDateString('ja-JP')}
                        {p.pages ? ' | ページ構成あり' : p.characters ? ' | キャラあり' : p.story ? ' | ストーリーあり' : ''}
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`「${p.settings.title || '作品'}」を削除しますか？`))
                          handleDeleteProject(p.id);
                      }}
                      className="ml-2 text-red-400 hover:text-red-600 text-sm px-2"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      {!current ? (
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-6">📖</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            漫画クリエイターへようこそ
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            アイデアを入力するだけで、ストーリー・キャラクター・ページ構成・作画プロンプトをAIが生成します。
          </p>
          <button
            onClick={handleNewProject}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg transition-colors"
          >
            ✨ 新規漫画を作る
          </button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-4">
          {current.settings.title && (
            <div className="mb-4 text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{current.settings.title}</h2>
            </div>
          )}

          {/* ステップナビ */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {steps.map((s) => (
              <button
                key={s.key}
                onClick={() => s.available && setStep(s.key)}
                disabled={!s.available}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  step === s.key
                    ? 'bg-blue-600 text-white'
                    : s.available
                    ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl text-sm text-red-700 dark:text-red-400">
              エラー: {error}
            </div>
          )}

          {/* プログレス表示 */}
          {pageProgress && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-xl text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <span className="animate-spin">⏳</span> {pageProgress}
            </div>
          )}

          {/* コンテンツ：左右2カラム */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 左：入力フォーム */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
              <WorkSettingsForm
                settings={current.settings}
                onChange={(settings) => setCurrent({ ...current, settings })}
                onGenerate={handleGenerateStory}
                loading={loading}
              />
            </div>

            {/* 右：生成結果 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
              {!current.story && (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <div className="text-5xl mb-4">✨</div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      左のフォームに作品情報を入力して<br />「ストーリーを生成する」を押してください
                    </p>
                  </div>
                </div>
              )}

              {current.story && (step === 'story' || step === 'settings') && (
                <StoryPreview
                  story={current.story}
                  onGenerateCharacters={handleGenerateCharacters}
                  loading={loading}
                />
              )}

              {current.characters && step === 'characters' && (
                <CharacterPreview
                  characters={current.characters}
                  onGeneratePages={handleGeneratePages}
                  loading={loading}
                />
              )}

              {current.pages && step === 'pages' && (
                <PagePreview
                  pages={current.pages}
                  artStyle={current.settings.artStyle}
                  onExport={() => setShowExport(true)}
                  onGeneratePrompts={handleGeneratePrompts}
                  promptsLoading={loading}
                  hasPrompts={current.pages.some((p) => p.panels.some((panel) => !!panel.imagePromptEn))}
                  onPanelImageGenerated={(pageIdx, panelIdx, url) => {
                    if (!current.pages) return;
                    const newPages = current.pages.map((p, pi) =>
                      pi !== pageIdx ? p : {
                        ...p,
                        panels: p.panels.map((panel, pni) =>
                          pni !== panelIdx ? panel : { ...panel, generatedImageUrl: url }
                        ),
                      }
                    );
                    const updated = saveProject({ ...current, pages: newPages });
                    setCurrent(updated);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {showExport && current && (
        <ExportModal project={current} onClose={() => setShowExport(false)} />
      )}

      {(showApiKey || !apiKey) && (
        <ApiKeyModal
          onSave={(key) => {
            setApiKey(key);
            setShowApiKey(false);
          }}
        />
      )}
    </div>
  );
}
