import { useState } from 'react';
import axios from 'axios';
import TranslateToggle from '../components/TranslateToggle';

export default function FIRAssistantPage() {
  const [incident, setIncident] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [translatedDraft, setTranslatedDraft] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!incident.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/tools/fir-assistant', { incident });
      setResult(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const quickScenarios = [
    'My shop was burgled last night, someone broke in and stole goods worth 5 lakhs',
    'My husband and in-laws are demanding 10 lakhs dowry and beating me daily',
    'Someone cheated me of 20 lakhs in a fake real estate scheme',
    'I was attacked with a knife by my neighbor over a land dispute',
    'My phone was snatched while I was walking on the road',
    'Someone is threatening to kill me over a business dispute',
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-amber-700 to-amber-500 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">FIR Filing Assistant</h1>
        <p className="text-amber-100 max-w-2xl">
          Describe what happened. We'll tell you which IPC sections apply, whether police MUST register
          an FIR, your legal rights, and what to do if police refuse. No API needed.
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Describe the incident</label>
        <textarea
          value={incident}
          onChange={e => setIncident(e.target.value)}
          rows={4}
          placeholder="Tell us what happened in your own words... e.g. 'My shop was burgled last night, electronics worth 5 lakhs stolen'"
          className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-3"
        />
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs text-gray-400">Try:</span>
          {quickScenarios.map((s, i) => (
            <button key={i} type="button" onClick={() => setIncident(s)}
              className="text-xs px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full hover:bg-amber-100 transition">
              {s.slice(0, 40)}...
            </button>
          ))}
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 transition">
          {loading ? 'Analyzing...' : 'Analyze Incident'}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Cognizable Banner */}
          <div className={`rounded-xl p-6 ${result.fir_mandatory
            ? 'bg-green-50 border-2 border-green-300' : 'bg-amber-50 border border-amber-300'}`}>
            <h2 className="text-xl font-bold mb-1">
              {result.fir_mandatory
                ? 'Police MUST Register Your FIR'
                : 'This May Be a Non-Cognizable Offense'}
            </h2>
            <p className="text-gray-700 text-sm">
              {result.fir_mandatory
                ? 'This is a cognizable offense. Under Lalita Kumari v. State of UP (2014), the police are LEGALLY BOUND to register an FIR. Refusal is a punishable offense.'
                : 'For non-cognizable offenses, police register an NCR instead of FIR. You may need a Magistrate\'s direction.'}
            </p>
          </div>

          {/* Suggested Sections */}
          {result.suggested_sections?.length > 0 && (
            <div className="bg-white border rounded-xl p-5">
              <h3 className="font-semibold text-lg mb-3">Applicable IPC Sections</h3>
              <div className="space-y-2">
                {result.suggested_sections.map((s, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 bg-gray-50 rounded-lg p-3">
                    <span className="font-mono font-bold text-primary-700">Sec {s.section}</span>
                    <span className="text-sm text-gray-700">{s.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">{s.punishment}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.cognizable ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {s.cognizable ? 'Cognizable' : 'Non-Cognizable'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.bailable ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      {s.bailable ? 'Bailable' : 'Non-Bailable'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Your Rights */}
          {result.your_rights?.length > 0 && (
            <div className="bg-white border rounded-xl p-5">
              <h3 className="font-semibold text-lg mb-3">Your Legal Rights</h3>
              <div className="space-y-3">
                {result.your_rights.map((r, i) => (
                  <div key={i} className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-1">{r.right}</h4>
                    <p className="text-sm text-gray-700">{r.explanation}</p>
                    <p className="text-xs text-primary-600 mt-1">{r.legal_basis}</p>
                    {r.what_to_do && <p className="text-xs text-gray-500 mt-1 italic">{r.what_to_do}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important Precedent */}
          {result.important_precedent && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
              <h3 className="font-semibold text-purple-800 mb-1">{result.important_precedent.case}</h3>
              <p className="text-xs text-purple-600 mb-2">{result.important_precedent.court}</p>
              <p className="text-sm text-gray-700">{result.important_precedent.ruling}</p>
            </div>
          )}

          {/* If Police Refuse */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold text-lg mb-3 text-red-700">If Police Refuse to File FIR</h3>
            <div className="space-y-3">
              {result.if_police_refuse?.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{step.action}</h4>
                    <p className="text-sm text-gray-600 mt-0.5">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Draft Complaint */}
          {result.draft_complaint && (
            <div className="bg-white border rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">Draft FIR Complaint</h3>
                <button onClick={() => setShowDraft(!showDraft)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  {showDraft ? 'Hide' : 'Show'} Draft
                </button>
              </div>
              {showDraft && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="mb-2">
                    <TranslateToggle text={result.draft_complaint} onTranslated={setTranslatedDraft} />
                  </div>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                    {translatedDraft || result.draft_complaint}
                  </pre>
                  <button
                    onClick={() => navigator.clipboard.writeText(translatedDraft || result.draft_complaint)}
                    className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition">
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
