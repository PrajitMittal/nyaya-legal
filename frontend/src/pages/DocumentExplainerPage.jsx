import { useState } from 'react';
import axios from 'axios';
import TranslateToggle from '../components/TranslateToggle';
import PDFUploadButton from '../components/PDFUploadButton';

const sampleTexts = [
  {
    label: 'Sample Bail Order',
    text: 'ORDER: Having heard the learned counsel for the applicant and the learned APP for the State, and having perused the case diary, this Court is of the opinion that the applicant has made out a case for bail. The applicant is directed to be released on bail on furnishing personal bond of Rs. 50,000/- with one surety of like amount to the satisfaction of the Trial Court. The applicant shall not leave the jurisdiction of the Court without prior permission. The applicant shall mark attendance at the police station every Sunday. Next date: 15.06.2026.',
  },
  {
    label: 'Sample Chargesheet',
    text: 'CHARGESHEET filed under Sections 420, 406, 468, 471 IPC against accused Ramesh Kumar. Investigation reveals that the accused cheated the complainant of Rs. 15,00,000 by executing forged documents. 12 witnesses examined. 45 documents relied upon. Accused is on bail since 12.03.2025.',
  },
];

export default function DocumentExplainerPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [translatedExplanation, setTranslatedExplanation] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setTranslatedExplanation(null);
    try {
      const res = await axios.post('/api/tools/explain-document', { text });
      if (res.data.error) {
        setError(String(res.data.error));
      } else {
        setResult(res.data);
      }
    } catch (err) {
      setError('Failed to analyze document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-700 to-pink-500 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">Document Explainer</h1>
        <p className="text-rose-100 max-w-2xl">
          Paste any court order, FIR, or legal document and get a plain language explanation
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste your legal document
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="Paste any court order, FIR, chargesheet, judgment, or legal notice here..."
          className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 mb-3"
        />

        {/* PDF Upload */}
        <div className="mb-3">
          <PDFUploadButton onTextExtracted={(t) => setText(t)} label="Upload Court Order / Legal Document (PDF)" />
        </div>

        {/* Quick examples */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs text-gray-400">Try:</span>
          {sampleTexts.map((sample, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setText(sample.text)}
              className="text-xs px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full hover:bg-rose-100 transition"
            >
              {sample.label}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="w-full bg-rose-600 text-white py-3 rounded-lg font-semibold hover:bg-rose-700 disabled:opacity-50 transition"
        >
          {loading ? 'Analyzing Document...' : 'Explain This Document'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Document Type */}
          {(result.document_type || result.document_type_detected) && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-rose-600 uppercase tracking-wide mb-1">
                Document Type Detected
              </h2>
              <p className="text-xl font-bold text-gray-900">{String(result.document_type || result.document_type_detected || '')}</p>
            </div>
          )}

          {/* Plain Language Explanation */}
          {(result.plain_language || result.plain_language_explanation) && (
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-300 rounded-xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <h2 className="text-lg font-bold text-gray-900">Plain Language Explanation</h2>
                <TranslateToggle
                  text={result.plain_language || result.plain_language_explanation}
                  onTranslated={setTranslatedExplanation}
                />
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {String(translatedExplanation || result.plain_language || result.plain_language_explanation || '')}
              </p>
            </div>
          )}

          {/* Key Takeaways */}
          {result.key_takeaways && result.key_takeaways.length > 0 && (
            <div className="bg-white border rounded-xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Key Takeaways</h2>
              <ul className="space-y-2">
                {result.key_takeaways.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-500 mt-1 flex-shrink-0">&#9679;</span>
                    <span className="text-gray-700">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What This Means For You */}
          {result.what_it_means && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">What This Means For You</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {typeof result.what_it_means === 'string' ? result.what_it_means : JSON.stringify(result.what_it_means)}
              </p>
            </div>
          )}

          {/* Conditions */}
          {(result.conditions || result.conditions_to_follow)?.length > 0 && (
            <div className="bg-white border rounded-xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Conditions to Follow</h2>
              <ul className="space-y-2">
                {(result.conditions || result.conditions_to_follow).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1 flex-shrink-0">&#9888;</span>
                    <span className="text-gray-700">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Deadlines */}
          {result.deadlines && result.deadlines.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Deadlines / Important Dates</h2>
              <ul className="space-y-2">
                {result.deadlines.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500 mt-1 flex-shrink-0">&#128197;</span>
                    <span className="text-gray-700">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          {result.next_steps && result.next_steps.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Next Steps</h2>
              <ol className="space-y-2">
                {result.next_steps.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-gray-700">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
