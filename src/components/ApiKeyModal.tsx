'use client';
import { useState } from 'react';

interface Props {
  onSave: (key: string) => void;
}

export function ApiKeyModal({ onSave }: Props) {
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);

  const handleSave = () => {
    if (!key.trim().startsWith('sk-ant-')) {
      alert('APIキーは sk-ant- から始まる形式です。確認してください。');
      return;
    }
    localStorage.setItem('anthropic-api-key', key.trim());
    onSave(key.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <div className="text-center">
          <div className="text-4xl mb-2">🔑</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">APIキーを設定</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Anthropic Claude APIキーを入力してください。<br />
            キーはブラウザ内にのみ保存されます。
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
            Anthropic APIキー
          </label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
              placeholder="sk-ant-api03-..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 px-1"
            >
              {show ? '隠す' : '表示'}
            </button>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <p className="font-bold">APIキーの取得方法:</p>
          <p>1. console.anthropic.com にアクセス</p>
          <p>2. 「API Keys」→「Create Key」</p>
          <p>3. 生成されたキーをコピーして上に貼り付け</p>
        </div>

        <button
          onClick={handleSave}
          disabled={!key.trim()}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-xl transition-colors"
        >
          保存して始める
        </button>
      </div>
    </div>
  );
}
