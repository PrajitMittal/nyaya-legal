import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { listFIRs } from '../api';

export default function HomePage() {
  const [stats, setStats] = useState({ total: 0, recent: [] });

  useEffect(() => {
    listFIRs().then((res) => {
      setStats({ total: res.data.length, recent: res.data.slice(0, 3) });
    }).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-4xl font-bold mb-3">Indian Legal Case Analyzer</h1>
        <p className="text-primary-100 text-lg mb-6 max-w-2xl">
          Upload FIRs, find similar past cases from Indian courts, and get AI-powered legal analysis
          including investigation steps, conviction rates, bail assessment, and strategy recommendations.
        </p>
        <div className="flex gap-4">
          <Link to="/upload" className="bg-white text-primary-800 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition">
            Upload FIR
          </Link>
          <Link to="/search" className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition">
            Search Cases
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-3xl font-bold text-primary-700">{stats.total}</div>
          <div className="text-gray-500 mt-1">FIRs in Archive</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-3xl font-bold text-legal-700">5+</div>
          <div className="text-gray-500 mt-1">IPC Sections Covered</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-3xl font-bold text-amber-600">AI</div>
          <div className="text-gray-500 mt-1">Powered Analysis</div>
        </div>
      </div>

      {/* Features */}
      <h2 className="text-2xl font-bold mb-4">How It Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { step: '1', title: 'Upload FIR', desc: 'Upload a PDF or manually enter FIR details including IPC sections and incident description.' },
          { step: '2', title: 'Find Similar Cases', desc: 'System searches Indian Kanoon and court databases to find similar past cases and precedents.' },
          { step: '3', title: 'Get AI Analysis', desc: 'Claude AI analyzes the case providing conviction rates, bail likelihood, investigation steps, and legal strategies.' },
        ].map((f) => (
          <div key={f.step} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-lg mb-3">
              {f.step}
            </div>
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-gray-600 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Recent Cases */}
      {stats.recent.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mb-4">Recent FIRs</h2>
          <div className="space-y-3">
            {stats.recent.map((fir) => (
              <Link
                key={fir.id}
                to={`/case/${fir.id}`}
                className="block bg-white rounded-lg shadow-sm border p-4 hover:border-primary-300 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold">FIR #{fir.fir_number || 'N/A'}</span>
                    <span className="ml-3 text-sm text-gray-500">{fir.police_station}, {fir.district}</span>
                  </div>
                  <span className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full font-medium">
                    {fir.offense_category || 'Uncategorized'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{fir.description}</p>
                <div className="text-xs text-gray-400 mt-2">IPC Sections: {fir.ipc_sections || 'N/A'}</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
