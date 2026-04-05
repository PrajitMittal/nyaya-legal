import { useState } from 'react';
import axios from 'axios';

const MODES = [
  { id: 'hindi', label: 'Hindi', icon: 'हि' },
  { id: 'legal_english', label: 'Legal English', icon: '§' },
  { id: 'plain_english', label: 'Simple English', icon: 'Aa' },
];

export default function TranslateToggle({ text, onTranslated }) {
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState(null);

  if (!text) return null;

  const handleTranslate = async (mode) => {
    if (activeMode === mode) {
      setActiveMode(null);
      onTranslated(null);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/tools/translate', { text, target_language: mode });
      setActiveMode(mode);
      onTranslated(res.data.translated_text || res.data.translated || text);
    } catch (err) {
      console.error('Translation failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-gray-400 mr-1">Translate:</span>
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          disabled={loading}
          onClick={() => handleTranslate(m.id)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
            activeMode === m.id
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-700'
          } ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
        >
          <span className="font-bold">{m.icon}</span>
          {m.label}
        </button>
      ))}
      {activeMode && (
        <button
          type="button"
          onClick={() => { setActiveMode(null); onTranslated(null); }}
          className="text-xs text-gray-400 hover:text-gray-600 underline ml-1 cursor-pointer"
        >
          Show original
        </button>
      )}
    </div>
  );
}
