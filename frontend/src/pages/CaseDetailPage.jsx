import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFIR, triggerAnalysis, getAnalysis, deleteFIR } from '../api';
import AnalysisCard from '../components/AnalysisCard';

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fir, setFir] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const firRes = await getFIR(id);
      setFir(firRes.data);
      // Try to load existing analysis
      try {
        const analysisRes = await getAnalysis(id);
        setAnalysis(analysisRes.data);
      } catch {
        // No analysis yet
      }
    } catch {
      setError('FIR not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const res = await triggerAnalysis(id);
      setAnalysis(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this FIR? This cannot be undone.')) return;
    await deleteFIR(id);
    navigate('/cases');
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (error && !fir) return <div className="text-center py-12 text-red-500">{error}</div>;
  if (!fir) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">FIR #{fir.fir_number || 'N/A'}</h1>
          <p className="text-gray-500 mt-1">
            {fir.police_station} &middot; {fir.district}, {fir.state}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
            Delete
          </button>
        </div>
      </div>

      {/* FIR Details */}
      <div className="bg-white border rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">FIR Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <Detail label="FIR Number" value={fir.fir_number} />
          <Detail label="Date Filed" value={fir.date_filed} />
          <Detail label="Police Station" value={fir.police_station} />
          <Detail label="District" value={fir.district} />
          <Detail label="State" value={fir.state} />
          <Detail label="Offense Category" value={fir.offense_category} />
          <Detail label="Complainant" value={fir.complainant_name} />
          <Detail label="Accused" value={fir.accused_name} />
          <Detail label="IPC Sections" value={fir.ipc_sections} />
          <Detail label="Source" value={fir.source === 'upload' ? 'PDF Upload' : 'Manual Entry'} />
        </div>
        {fir.description && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</label>
            <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap">{fir.description}</p>
          </div>
        )}
      </div>

      {/* Analysis Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">AI Analysis</h2>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </>
            ) : analysis ? (
              'Re-analyze'
            ) : (
              'Analyze Case'
            )}
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

        {analyzing && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <svg className="animate-spin w-8 h-8 text-primary-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-primary-700 font-medium">Analyzing FIR with AI...</p>
            <p className="text-primary-600 text-sm mt-1">Searching similar cases and generating legal analysis. This may take 15-30 seconds.</p>
          </div>
        )}

        {analysis && !analyzing && <AnalysisCard analysis={analysis} />}

        {!analysis && !analyzing && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-500">Click "Analyze Case" to get AI-powered legal analysis including similar cases, conviction rates, bail assessment, and strategy recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</label>
      <p className="text-gray-800 text-sm mt-0.5">{value || 'N/A'}</p>
    </div>
  );
}
