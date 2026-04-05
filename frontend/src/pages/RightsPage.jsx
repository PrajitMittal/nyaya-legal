import { useState } from 'react';
import axios from 'axios';

const SITUATIONS = [
  { key: 'arrest', label: 'When Arrested', icon: '\uD83D\uDD12', color: 'red' },
  { key: 'fir', label: 'Filing an FIR', icon: '\uD83D\uDCDD', color: 'blue' },
  { key: 'bail', label: 'Regarding Bail', icon: '\u2696\uFE0F', color: 'green' },
  { key: 'search', label: 'During Search', icon: '\uD83D\uDD0D', color: 'purple' },
];

export default function RightsPage() {
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadRights = async (situation) => {
    setSelected(situation);
    setLoading(true);
    try {
      const res = await axios.get(`/api/tools/rights/${situation}`);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-purple-800 to-purple-500 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">Know Your Rights</h1>
        <p className="text-purple-100 max-w-2xl">
          Your constitutional and legal rights in common situations. Know them BEFORE you need them.
          Based on the Indian Constitution, CrPC, and Supreme Court judgments.
        </p>
      </div>

      {/* Situation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {SITUATIONS.map(s => (
          <button
            key={s.key}
            onClick={() => loadRights(s.key)}
            className={`p-5 rounded-xl border-2 text-center transition hover:shadow-md ${
              selected === s.key
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 bg-white hover:border-purple-300'
            }`}
          >
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="font-semibold text-sm">{s.label}</div>
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-8 text-gray-500">Loading...</div>}

      {data && !loading && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{data.title}</h2>

          {data.rights?.map((r, i) => (
            <div key={i} className="bg-white border rounded-xl p-5 hover:border-purple-300 transition">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{r.right}</h3>
                  <p className="text-sm text-gray-600 mb-2">{r.detail}</p>
                  {r.what_to_do && (
                    <div className="bg-green-50 rounded-lg p-3 mt-2">
                      <p className="text-xs font-medium text-green-800 mb-0.5">What to say/do:</p>
                      <p className="text-sm text-green-700">{r.what_to_do}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {data.emergency_contacts && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 mt-6">
              <h3 className="font-semibold text-red-800 mb-3">Emergency Helplines</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(data.emergency_contacts).map(([key, val]) => (
                  <div key={key} className="bg-white rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-red-700">{val}</div>
                    <div className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!selected && !loading && (
        <div className="text-center py-12 text-gray-500">
          Select a situation above to see your legal rights.
        </div>
      )}
    </div>
  );
}
