import { useState } from 'react';
import axios from 'axios';

export default function CaseExplainerPage() {
  const [caseInput, setCaseInput] = useState('');
  const [inputType, setInputType] = useState('case_number');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quickExamples = [
    'DLST01-001234-2024',
    'HC-2024-CR-5678',
    'MHCM01-003456-2023',
    'SC-2024-SLP-12345',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caseInput.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const body = inputType === 'cnr_number'
        ? { cnr_number: caseInput.trim() }
        : { case_number: caseInput.trim() };
      const res = await axios.post('/api/tools/case-explainer', body);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch case details. Please check the case number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickExample = (example) => {
    setCaseInput(example);
    setInputType('cnr_number');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-blue-500 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">Case Explainer</h1>
        <p className="text-indigo-100 max-w-2xl">
          Understand your case in plain language. Enter a CNR number or case number to get a
          clear explanation of where your case stands, what has happened, and what comes next.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search by</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={inputType === 'case_number'}
                onChange={() => setInputType('case_number')}
                className="text-indigo-600"
              />
              <span className="text-sm">Case Number</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={inputType === 'cnr_number'}
                onChange={() => setInputType('cnr_number')}
                className="text-indigo-600"
              />
              <span className="text-sm">CNR Number</span>
            </label>
          </div>
        </div>

        <div className="mb-3">
          <input
            value={caseInput}
            onChange={(e) => setCaseInput(e.target.value)}
            placeholder={inputType === 'cnr_number' ? 'e.g. DLST01-001234-2024' : 'e.g. CC/1234/2024'}
            required
            className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs text-gray-400">Quick examples:</span>
          {quickExamples.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickExample(ex)}
              className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full hover:bg-indigo-100 transition"
            >
              {ex}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {loading ? 'Fetching Case Details...' : 'Explain My Case'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Case Overview */}
          {result.case_info && (
            <div className="bg-white border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Case Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Case Number" value={result.case_info.case_number} />
                <InfoRow label="CNR Number" value={result.case_info.cnr_number} />
                <InfoRow label="Court" value={result.case_info.court} />
                <InfoRow label="Judge" value={result.case_info.judge} />
                <InfoRow label="Case Type" value={result.case_info.case_type} />
                <InfoRow label="Filing Date" value={result.case_info.filing_date} />
                <InfoRow label="Petitioner" value={result.case_info.petitioner} />
                <InfoRow label="Respondent" value={result.case_info.respondent} />
                <InfoRow label="Current Stage" value={result.case_info.current_stage} highlight />
                <InfoRow label="Next Hearing Date" value={result.case_info.next_date} highlight />
              </div>
              {result.case_info.sections && (
                <div className="mt-4 pt-4 border-t">
                  <span className="text-sm font-medium text-gray-500">Sections: </span>
                  <span className="text-sm text-gray-700">{result.case_info.sections}</span>
                </div>
              )}
            </div>
          )}

          {/* Plain Language Explanation */}
          {result.plain_language_explanation && (
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">&#128172;</span>
                <div>
                  <h2 className="text-lg font-semibold text-indigo-900 mb-2">In Plain Language</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {result.plain_language_explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stage Analysis */}
          {result.stage_analysis && (
            <div className="bg-white border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Current Stage Analysis</h2>
              <p className="text-gray-700 text-sm mb-3">{result.stage_analysis.current_stage_description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.stage_analysis.bottleneck && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <span className="text-xs font-medium text-amber-700 uppercase">Bottleneck</span>
                    <p className="text-sm text-gray-700 mt-1">{result.stage_analysis.bottleneck}</p>
                  </div>
                )}
                {result.stage_analysis.average_duration_for_stage && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <span className="text-xs font-medium text-blue-700 uppercase">Average Duration for This Stage</span>
                    <p className="text-sm text-gray-700 mt-1">{result.stage_analysis.average_duration_for_stage}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Visual Timeline */}
          {result.timeline && result.timeline.length > 0 && (
            <div className="bg-white border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Case Timeline</h2>
              <div className="relative">
                {result.timeline.map((stage, i) => {
                  const isCompleted = stage.status === 'completed';
                  const isCurrent = stage.status === 'current';
                  const isUpcoming = stage.status === 'upcoming';

                  return (
                    <div key={i} className="relative flex items-start gap-4 pb-8 last:pb-0">
                      {/* Vertical connector line */}
                      {i < result.timeline.length - 1 && (
                        <div
                          className={`absolute left-[15px] top-[30px] w-0.5 h-full ${
                            isCompleted ? 'bg-green-400' : isCurrent ? 'bg-indigo-300' : 'bg-gray-200'
                          }`}
                        />
                      )}
                      {/* Dot */}
                      <div className="relative z-10 flex-shrink-0">
                        <div
                          className={`w-[30px] h-[30px] rounded-full flex items-center justify-center border-2 ${
                            isCompleted
                              ? 'bg-green-500 border-green-600 text-white'
                              : isCurrent
                              ? 'bg-indigo-500 border-indigo-600 text-white ring-4 ring-indigo-100'
                              : 'bg-gray-100 border-gray-300 text-gray-400'
                          }`}
                        >
                          {isCompleted ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : isCurrent ? (
                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                          ) : (
                            <div className="w-2 h-2 bg-gray-300 rounded-full" />
                          )}
                        </div>
                      </div>
                      {/* Content */}
                      <div className={`flex-1 min-w-0 pb-1 ${isUpcoming ? 'opacity-50' : ''}`}>
                        <div className="flex items-center flex-wrap gap-2">
                          <h3
                            className={`font-semibold text-sm ${
                              isCompleted
                                ? 'text-green-700'
                                : isCurrent
                                ? 'text-indigo-700'
                                : 'text-gray-400'
                            }`}
                          >
                            {stage.stage}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isCompleted
                                ? 'bg-green-100 text-green-700'
                                : isCurrent
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Upcoming'}
                          </span>
                        </div>
                        {stage.date && (
                          <p className="text-xs text-gray-500 mt-0.5">{stage.date}</p>
                        )}
                        {stage.description && (
                          <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                        )}
                        {stage.duration && (
                          <p className="text-xs text-gray-400 mt-0.5">Duration: {stage.duration}</p>
                        )}
                        {stage.legal_basis && (
                          <p className="text-xs text-indigo-500 mt-0.5">Legal basis: {stage.legal_basis}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Estimated Time Remaining */}
          {result.estimated_time_remaining && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Estimated Time Remaining</h3>
                <p className="text-blue-700 text-lg font-bold">{result.estimated_time_remaining}</p>
              </div>
            </div>
          )}

          {/* Next Steps */}
          {result.next_steps && result.next_steps.length > 0 && (
            <div className="bg-white border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Next Steps</h2>
              <div className="space-y-2">
                {result.next_steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-500">
            <p className="font-medium mb-1">Disclaimer</p>
            <p>
              This tool provides a simplified explanation of your case status based on available records.
              It is NOT legal advice. Court proceedings may have additional nuances not captured here.
              Always consult a qualified lawyer for legal decisions and verify information from official court records.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  if (!value) return null;
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-indigo-50' : 'bg-gray-50'}`}>
      <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
      <p className={`text-sm font-medium mt-0.5 ${highlight ? 'text-indigo-700' : 'text-gray-800'}`}>{value}</p>
    </div>
  );
}
