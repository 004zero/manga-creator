'use client';
import { MangaProject } from '@/types/manga';

interface Props {
  project: MangaProject;
  onClose: () => void;
}

function toMarkdown(project: MangaProject): string {
  const { settings, story, characters, pages } = project;
  let md = `# ${settings.title}\n\n`;
  md += `**ジャンル:** ${settings.genre} | **絵柄:** ${settings.artStyle} | **雰囲気:** ${settings.atmosphere}\n\n`;

  if (story) {
    md += `## あらすじ\n${story.synopsis}\n\n`;
    md += `## 起承転結\n${story.structure}\n\n`;
    md += `## 各話構成\n${story.episodes.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\n`;
    md += `## クライマックス\n${story.climax}\n\n`;
    md += `## ラスト\n${story.ending}\n\n`;
  }

  if (characters?.length) {
    md += `## キャラクター設定\n`;
    characters.forEach((c) => {
      md += `\n### ${c.name}（${c.age}歳・${c.gender}）\n`;
      md += `- 性格: ${c.personality}\n- 外見: ${c.appearance}\n- 服装: ${c.clothing}\n`;
      md += `- 口調: ${c.speech}\n- 悩み: ${c.troubles}\n- 目的: ${c.goal}\n- 成長: ${c.growth}\n`;
    });
    md += '\n';
  }

  if (pages?.length) {
    md += `## ページ構成\n`;
    pages.forEach((p) => {
      md += `\n### ページ${p.page}：${p.purpose}\n`;
      p.panels.forEach((panel) => {
        md += `\n**コマ${panel.panel}**\n`;
        md += `- シーン: ${panel.scene}\n`;
        if (panel.dialogue) md += `- セリフ: 「${panel.dialogue}」\n`;
        if (panel.narration) md += `- ナレーション: ${panel.narration}\n`;
        md += `- 表情: ${panel.expression} / アングル: ${panel.cameraAngle}\n`;
        md += `- 作画指示: ${panel.drawingInstruction}\n`;
        md += `- プロンプト(EN): ${panel.imagePromptEn}\n`;
      });
    });
  }

  return md;
}

function toCsv(project: MangaProject): string {
  const rows: string[][] = [
    ['ページ', 'コマ', 'シーン', 'セリフ', 'ナレーション', '表情', 'アングル', '背景', '作画指示', 'プロンプト(JA)', 'プロンプト(EN)', 'ネガティブプロンプト', '画像比率'],
  ];
  project.pages?.forEach((p) => {
    p.panels.forEach((panel) => {
      rows.push([
        String(p.page),
        String(panel.panel),
        panel.scene,
        panel.dialogue,
        panel.narration,
        panel.expression,
        panel.cameraAngle,
        panel.background,
        panel.drawingInstruction,
        panel.imagePromptJa,
        panel.imagePromptEn,
        panel.negativePrompt,
        panel.imageRatio,
      ]);
    });
  });
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

function toPdfHtml(project: MangaProject): string {
  const { settings, story, characters, pages } = project;

  const section = (title: string, content: string) =>
    `<div class="section"><h2>${title}</h2>${content}</div>`;

  const kv = (label: string, value: string) =>
    value ? `<div class="kv"><span class="label">${label}</span><span class="value">${value}</span></div>` : '';

  let html = `<!DOCTYPE html><html lang="ja"><head>
<meta charset="UTF-8">
<title>${settings.title} — 漫画設定書</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.7; }
  h1 { font-size: 22pt; text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 8px; margin-bottom: 4px; }
  .meta { text-align: center; color: #666; font-size: 9pt; margin-bottom: 20px; }
  h2 { font-size: 13pt; background: #2563eb; color: white; padding: 4px 10px; border-radius: 4px; margin: 16px 0 8px; }
  h3 { font-size: 11pt; border-left: 4px solid #2563eb; padding-left: 8px; margin: 12px 0 6px; color: #1e40af; }
  h4 { font-size: 10pt; background: #f1f5f9; padding: 3px 8px; border-radius: 3px; margin: 8px 0 4px; }
  .section { margin-bottom: 12px; }
  .kv { display: flex; gap: 8px; margin: 3px 0; font-size: 9.5pt; }
  .label { font-weight: bold; color: #374151; min-width: 80px; flex-shrink: 0; }
  .value { color: #1f2937; }
  p { margin: 4px 0; }
  .char-card { border: 1px solid #d1d5db; border-radius: 6px; padding: 10px; margin: 8px 0; page-break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-top: 8px; }
  th { background: #1e40af; color: white; padding: 4px 6px; text-align: left; }
  td { border: 1px solid #d1d5db; padding: 4px 6px; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .panel-block { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; margin: 6px 0; page-break-inside: avoid; }
  .panel-num { font-weight: bold; color: #2563eb; font-size: 10pt; margin-bottom: 4px; }
  .dialogue { background: #fef9c3; border-left: 3px solid #f59e0b; padding: 3px 6px; margin: 4px 0; font-size: 9.5pt; }
  .narration { background: #f0fdf4; border-left: 3px solid #22c55e; padding: 3px 6px; margin: 4px 0; font-size: 9.5pt; }
  .prompt-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px; padding: 6px 8px; margin: 6px 0; font-size: 8.5pt; }
  .prompt-label { font-weight: bold; color: #0369a1; display: block; margin-bottom: 2px; }
  .page-break { page-break-before: always; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style></head><body>`;

  html += `<h1>${settings.title}</h1>
<div class="meta">${settings.genre} | ${settings.artStyle} | ${settings.atmosphere} | ${settings.pageCount}ページ</div>`;

  // 作品設定
  html += section('作品設定', `
    ${kv('ターゲット', settings.targetReader)}
    ${kv('主人公', settings.protagonist)}
    ${kv('敵・ライバル', settings.antagonist)}
    ${kv('舞台', settings.setting)}
    ${kv('テーマ', settings.theme)}
  `);

  // ストーリー
  if (story) {
    html += section('ストーリー', `
      <h3>あらすじ</h3><p>${story.synopsis}</p>
      <h3>起承転結</h3><p>${story.structure}</p>
      <h3>各話構成</h3><ol style="padding-left:18px">${story.episodes.map(e => `<li>${e}</li>`).join('')}</ol>
      <h3>クライマックス</h3><p>${story.climax}</p>
      <h3>ラスト</h3><p>${story.ending}</p>
      <h3>読者の感情導線</h3><p>${story.emotionalFlow}</p>
    `);
  }

  // キャラクター
  if (characters?.length) {
    const charHtml = characters.map((c, i) => `
      <div class="char-card">
        <h3>${i === 0 ? '主人公' : 'サブキャラクター'}: ${c.name}（${c.age}歳・${c.gender}）</h3>
        ${kv('性格', c.personality)}
        ${kv('外見', c.appearance)}
        ${kv('服装', c.clothing)}
        ${kv('口調', c.speech)}
        ${kv('悩み', c.troubles)}
        ${kv('目的', c.goal)}
        ${kv('成長', c.growth)}
      </div>
    `).join('');
    html += section('キャラクター設定', charHtml);
  }

  // ページ構成
  if (pages?.length) {
    html += `<div class="page-break"></div>`;
    html += `<h2>ページ構成・コマ割り</h2>`;

    pages.forEach((p) => {
      html += `<h3>ページ ${p.page}　${p.purpose}（${p.panelCount}コマ）</h3>`;
      p.panels.forEach((panel) => {
        html += `<div class="panel-block">
          <div class="panel-num">コマ ${panel.panel}</div>
          ${kv('シーン', panel.scene)}
          ${panel.dialogue ? `<div class="dialogue">セリフ：「${panel.dialogue}」</div>` : ''}
          ${panel.narration ? `<div class="narration">ナレーション：${panel.narration}</div>` : ''}
          ${kv('表情', panel.expression)}
          ${kv('アングル', panel.cameraAngle)}
          ${kv('背景', panel.background)}
          ${kv('作画指示', panel.drawingInstruction)}
        </div>`;
      });
    });

    // プロンプト一覧
    html += `<div class="page-break"></div><h2>画像生成AIプロンプト一覧</h2>`;
    pages.forEach((p) => {
      p.panels.forEach((panel) => {
        html += `<div class="panel-block">
          <div class="panel-num">P${p.page} コマ${panel.panel} — ${panel.scene.substring(0, 30)}</div>
          <div class="prompt-box"><span class="prompt-label">英語プロンプト</span>${panel.imagePromptEn}</div>
          <div class="prompt-box"><span class="prompt-label">日本語プロンプト</span>${panel.imagePromptJa}</div>
          <div class="prompt-box"><span class="prompt-label">ネガティブ</span>${panel.negativePrompt}</div>
          ${kv('画像比率', panel.imageRatio)}
        </div>`;
      });
    });
  }

  html += '</body></html>';
  return html;
}

function exportPdf(project: MangaProject) {
  const html = toPdfHtml(project);
  const win = window.open('', '_blank');
  if (!win) { alert('ポップアップをブロックしないでください'); return; }
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
    }, 500);
  };
}

export function ExportModal({ project, onClose }: Props) {
  const download = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const slug = project.settings.title || 'manga';

  const exports = [
    {
      label: 'PDF（印刷・保存）',
      icon: '📄',
      action: () => exportPdf(project),
      desc: 'ブラウザの印刷ダイアログからPDF保存できます',
      highlight: true,
    },
    {
      label: 'Markdown (.md)',
      icon: '📝',
      action: () => download(toMarkdown(project), `${slug}.md`, 'text/markdown'),
      desc: 'Obsidian・Notionなどで使えます',
    },
    {
      label: 'CSV (.csv)',
      icon: '📊',
      action: () => download(toCsv(project), `${slug}.csv`, 'text/csv'),
      desc: 'Excelで開けます',
    },
    {
      label: 'JSON (.json)',
      icon: '🔧',
      action: () => download(JSON.stringify(project, null, 2), `${slug}.json`, 'application/json'),
      desc: '開発者・システム連携用',
    },
    {
      label: 'プロンプト一覧コピー',
      icon: '🎨',
      action: () => {
        const prompts = project.pages
          ?.flatMap((p) =>
            p.panels.map(
              (panel) =>
                `【P${p.page}コマ${panel.panel}】\nEN: ${panel.imagePromptEn}\nNegative: ${panel.negativePrompt}\n比率: ${panel.imageRatio}`
            )
          )
          .join('\n\n');
        navigator.clipboard.writeText(prompts || '');
        alert('コピーしました');
      },
      desc: 'Midjourney・NovelAI等に貼り付け',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">エクスポート</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 text-2xl">×</button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">「{project.settings.title}」を出力する形式を選んでください</p>

        <div className="space-y-2">
          {exports.map((ex) => (
            <button
              key={ex.label}
              onClick={ex.action}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                ex.highlight
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-2xl">{ex.icon}</span>
              <div>
                <div className={`font-bold text-sm ${ex.highlight ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                  {ex.label}
                </div>
                <div className={`text-xs ${ex.highlight ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {ex.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
