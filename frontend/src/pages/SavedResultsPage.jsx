import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listSavedResults, deleteSavedResult } from '../api';

const TOOL_LABELS = {
  bail_calculator: 'Bail Calculator',
  fir_assistant: 'FIR Assistant',
  case_explainer: 'Case Explainer',
  document_explainer: 'Document Explainer',
  document_drafter: 'Document Drafter',
  section_mapper: 'IPC/BNS Mapper',
  search: 'Case Search',
};

export default function SavedResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const res = await listSavedResults();
      setResults(res.data);
    } catch (err) {
      setError('Failed to load saved results');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSavedResult(id);
      setResults((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError('Failed to delete');
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Saved Results</h1>
      <p className="text-gray-500 mb-6">Your saved tool results and analyses</p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      {results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No saved results yet</p>
          <Link to="/" className="text-primary-600 font-medium hover:underline">Use a tool to get started</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((r) => (
            <div key={r.id} className="bg-white border rounded-xl p-5 flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                  {TOOL_LABELS[r.tool_name] || r.tool_name}
                </span>
                <h3 className="font-semibold text-gray-900 mt-1">{r.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                className="text-gray-400 hover:text-red-500 transition p-1"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
