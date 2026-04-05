import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SectionMapperPage() {
  const [mode, setMode] = useState('ipc'); // 'ipc' = IPC→BNS, 'bns' = BNS→IPC
  const [sectionInput, setSectionInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reference table state
  const [allSections, setAllSections] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBailable, setFilterBailable] = useState('all');
  const [filterCognizable, setFilterCognizable] = useState('all');

  useEffect(() => {
    fetchAllSections();
  }, []);

  const fetchAllSections = async () => {
    setTableLoading(true);
    setTableError('');
    try {
      const res = await axios.get('/api/tools/sections');
      setAllSections(res.data);
    } catch (err) {
      setTableError(err.response?.data?.error || 'Failed to load sections reference table');
    } finally {
      setTableLoading(false);
    }
  };

  const handleMap = async (e) => {
    e.preventDefault();
    if (!sectionInput.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const param = mode === 'ipc' ? `ipc=${sectionInput.trim()}` : `bns=${sectionInput.trim()}`;
      const res = await axios.get(`/api/tools/section-mapper?${param}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Section mapping failed. Please check the section number.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSections = allSections.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      String(s.ipc_section || '').toLowerCase().includes(q) ||
      String(s.bns_section || '').toLowerCase().includes(q) ||
      String(s.offense || s.offense_name || '').toLowerCase().includes(q) ||
      String(s.punishment || '').toLowerCase().includes(q);

    const matchesBailable =
      filterBailable === 'all' ||
      (filterBailable === 'yes' && s.bailable) ||
      (filterBailable === 'no' && !s.bailable);

    const matchesCognizable =
      filterCognizable === 'all' ||
      (filterCognizable === 'yes' && s.cognizable) ||
      (filterCognizable === 'no' && !s.cognizable);

    return matchesSearch && matchesBailable && matchesCognizable;
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-cyan-500 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">IPC &#8596; BNS Section Mapper</h1>
        <p className="text-teal-100 max-w-3xl">
          Navigate the transition from the Indian Penal Code (IPC) to the Bharatiya Nyaya Sanhita (BNS).
          Instantly map sections between the old and new criminal law frameworks that came into effect on 1 July 2024.
        </p>
      </div>

      {/* Mapper Card */}
      <div className="bg-white border rounded-xl p-6 mb-8">
        {/* Mode Toggle */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setMode('ipc'); setResult(null); setError(''); setSectionInput(''); }}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                mode === 'ipc'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              IPC &rarr; BNS
            </button>
            <button
              onClick={() => { setMode('bns'); setResult(null); setError(''); setSectionInput(''); }}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                mode === 'bns'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              BNS &rarr; IPC
            </button>
          </div>
        </div>

        {/* Input + Button */}
        <form onSubmit={handleMap} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={sectionInput}
              onChange={(e) => setSectionInput(e.target.value)}
              placeholder={mode === 'ipc' ? 'Enter IPC section (e.g. 302)' : 'Enter BNS section (e.g. 103)'}
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !sectionInput.trim()}
            className="bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 transition whitespace-nowrap"
          >
            {loading ? 'Mapping...' : 'Map Section'}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mt-4 text-sm">{error}</div>
        )}

        {/* Result Card */}
        {result && (
          <div className="mt-6 bg-gray-50 border rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className="bg-white border rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">IPC Section</div>
                <div className="text-2xl font-bold text-teal-700">{result.ipc_section ?? 'N/A'}</div>
              </div>
              <div className="bg-white border rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">BNS Section</div>
                <div className="text-2xl font-bold text-cyan-700">{result.bns_section ?? 'N/A'}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Offense:</span>
                <span className="text-sm text-gray-800">{result.offense || result.offense_name || 'N/A'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Punishment:</span>
                <span className="text-sm px-2 py-0.5 rounded-full bg-red-100 text-red-700">{result.punishment || 'N/A'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  result.bailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {result.bailable ? 'Bailable' : 'Non-Bailable'}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  result.cognizable ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {result.cognizable ? 'Cognizable' : 'Non-Cognizable'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Reference Table */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Complete IPC-BNS Reference Table</h2>
        <p className="text-sm text-gray-500 mb-5">Browse or search all mapped sections between IPC and BNS</p>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by section number, offense name, or punishment..."
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <select
            value={filterBailable}
            onChange={(e) => setFilterBailable(e.target.value)}
            className="border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="all">All (Bailable)</option>
            <option value="yes">Bailable</option>
            <option value="no">Non-Bailable</option>
          </select>
          <select
            value={filterCognizable}
            onChange={(e) => setFilterCognizable(e.target.value)}
            className="border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="all">All (Cognizable)</option>
            <option value="yes">Cognizable</option>
            <option value="no">Non-Cognizable</option>
          </select>
        </div>

        {tableLoading && (
          <div className="text-center py-12 text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent mb-3"></div>
            <p>Loading sections...</p>
          </div>
        )}

        {tableError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{tableError}</div>
        )}

        {!tableLoading && !tableError && (
          <>
            <div className="text-xs text-gray-400 mb-2">
              Showing {filteredSections.length} of {allSections.length} sections
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">IPC Section</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">BNS Section</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Offense</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Punishment</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Bailable</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Cognizable</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSections.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        No sections match your search criteria
                      </td>
                    </tr>
                  ) : (
                    filteredSections.map((s, i) => (
                      <tr key={i} className={`border-b last:border-b-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-teal-50 transition`}>
                        <td className="px-4 py-3 font-mono font-bold text-teal-700">{s.ipc_section ?? '-'}</td>
                        <td className="px-4 py-3 font-mono font-bold text-cyan-700">{s.bns_section ?? '-'}</td>
                        <td className="px-4 py-3 text-gray-800">{s.offense || s.offense_name || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{s.punishment || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                            s.bailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {s.bailable ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                            s.cognizable ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {s.cognizable ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-500 mt-6">
        <p className="font-medium mb-1">Disclaimer</p>
        <p>
          This mapper is for reference purposes only and does not constitute legal advice.
          The IPC to BNS mapping is based on the Bharatiya Nyaya Sanhita, 2023 (Act No. 45 of 2023).
          Some sections may not have a direct one-to-one mapping. Always consult the original statute text
          and a qualified legal professional for authoritative interpretation.
        </p>
      </div>
    </div>
  );
}
