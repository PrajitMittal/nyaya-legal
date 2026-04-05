import { useState } from 'react';
import { searchKanoon } from '../api';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [ipcSections, setIpcSections] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query && !ipcSections) {
      setError('Enter a search query or IPC sections');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await searchKanoon(query || undefined, ipcSections || undefined);
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Search Indian Court Cases</h1>
      <p className="text-gray-500 mb-6">Search Indian Kanoon for judgments, orders, and case law.</p>

      <form onSubmit={handleSearch} className="bg-white border rounded-xl p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Query</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. murder circumstantial evidence conviction"
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IPC / BNS Sections (optional)</label>
            <input
              value={ipcSections}
              onChange={(e) => setIpcSections(e.target.value)}
              placeholder="e.g. 302, 201"
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition"
          >
            {loading ? 'Searching...' : 'Search Cases'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
      )}

      {results && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Results</h2>
            <span className="text-gray-500 text-sm">{results.count} case{results.count !== 1 ? 's' : ''} found</span>
          </div>
          {results.results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No cases found. Try different search terms.</div>
          ) : (
            <div className="space-y-3">
              {results.results.map((r, i) => (
                <div key={i} className="bg-white border rounded-xl p-5 hover:border-primary-300 transition">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-primary-700">{r.title}</h3>
                    {r.date && <span className="text-xs text-gray-400 whitespace-nowrap ml-3">{r.date}</span>}
                  </div>
                  {r.court && <p className="text-sm text-gray-500 mb-1">{r.court}</p>}
                  {r.headline && (
                    <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: r.headline }} />
                  )}
                  {r.citations && <p className="text-xs text-primary-600 mt-2">Citation: {r.citations}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
