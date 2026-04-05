import { useState } from 'react';
import { saveResult } from '../api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Reusable button to save any tool result to the user's saved results.
 * Shows login prompt if not authenticated.
 */
export default function SaveResultButton({ toolName, title, resultData, className = '' }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!user) {
      setError('Sign in to save results');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveResult({
        tool_name: toolName,
        title: title,
        result_data: resultData,
      });
      setSaved(true);
    } catch (err) {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-300 rounded-lg text-sm font-medium text-green-700 ${className}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Saved
      </button>
    );
  }

  return (
    <div className={className}>
      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {saving ? 'Saving...' : 'Save Result'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
