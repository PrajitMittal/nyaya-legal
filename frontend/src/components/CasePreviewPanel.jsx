import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Slide-over panel that explains a legal precedent/case when clicked.
 * Shows case summary, what was decided, and why it matters.
 */
export default function CasePreviewPanel({ caseName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!caseName) return;
    setLoading(true);
    setError('');
    axios.post('/api/tools/case-explainer', { case_number: caseName })
      .then(res => {
        if (res.data.error) setError(res.data.error);
        else setData(res.data);
      })
      .catch(() => setError('Could not load case details'))
      .finally(() => setLoading(false));
  }, [caseName]);

  if (!caseName) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Case Reference</p>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5 leading-tight">{caseName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Case Info */}
              {data.case_info && (
                <div className="space-y-3">
                  {data.case_info.court && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase">Court</p>
                      <p className="text-sm font-medium text-gray-800">{data.case_info.court}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {data.case_info.filing_date && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 uppercase">Date</p>
                        <p className="text-sm font-medium text-gray-800">{data.case_info.filing_date}</p>
                      </div>
                    )}
                    {data.case_info.sections && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 uppercase">Sections</p>
                        <p className="text-sm font-medium text-gray-800">{data.case_info.sections}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Plain Language Explanation */}
              {data.plain_language_explanation && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-indigo-800 mb-2">What happened in this case</h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {data.plain_language_explanation}
                  </p>
                </div>
              )}

              {/* Next Steps / Key Takeaways */}
              {data.next_steps && data.next_steps.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Key Takeaways</h3>
                  <ul className="space-y-2">
                    {data.next_steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                          {i + 1}
                        </span>
                        {typeof step === 'string' ? step : step.step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Search on Indian Kanoon */}
              <div className="border-t pt-4">
                <a
                  href={`https://indiankanoon.org/search/?formInput=${encodeURIComponent(caseName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Read full judgment on Indian Kanoon
                </a>
              </div>

              {/* AI Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                This is an AI-generated summary for reference. Always verify with the official judgment.
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
