import { useState } from 'react';
import axios from 'axios';
import TranslateToggle from '../components/TranslateToggle';

const DOCUMENT_TYPES = [
  {
    id: 'default_bail',
    label: 'Default Bail Application',
    subtitle: 'Section 167(2)',
    icon: '⚖️',
    color: 'from-blue-500 to-blue-700',
    category: 'bail',
  },
  {
    id: 'anticipatory_bail',
    label: 'Anticipatory Bail Application',
    subtitle: 'Section 438',
    icon: '🛡️',
    color: 'from-indigo-500 to-indigo-700',
    category: 'bail',
  },
  {
    id: 'regular_bail',
    label: 'Regular Bail Application',
    subtitle: 'Section 439',
    icon: '📋',
    color: 'from-purple-500 to-purple-700',
    category: 'bail',
  },
  {
    id: '436a_release',
    label: '436A Release Application',
    subtitle: 'Half sentence served',
    icon: '🔓',
    color: 'from-teal-500 to-teal-700',
    category: 'bail',
  },
  {
    id: 'complaint_magistrate',
    label: 'Complaint to Magistrate',
    subtitle: 'Section 156(3)',
    icon: '🏛️',
    color: 'from-amber-500 to-amber-700',
    category: 'complaint',
  },
  {
    id: 'complaint_sp',
    label: 'Complaint to SP',
    subtitle: 'Superintendent of Police',
    icon: '📨',
    color: 'from-orange-500 to-orange-700',
    category: 'complaint',
  },
  {
    id: 'nhrc_complaint',
    label: 'NHRC Complaint',
    subtitle: 'National Human Rights Commission',
    icon: '🕊️',
    color: 'from-rose-500 to-rose-700',
    category: 'complaint',
  },
  {
    id: 'quashing_petition',
    label: 'Quashing Petition',
    subtitle: 'Section 482',
    icon: '🔨',
    color: 'from-slate-500 to-slate-700',
    category: 'bail',
  },
];

const isBailType = (docType) =>
  ['default_bail', 'anticipatory_bail', 'regular_bail', '436a_release'].includes(docType);

const isComplaintType = (docType) =>
  ['complaint_magistrate', 'complaint_sp', 'nhrc_complaint'].includes(docType);

export default function DocumentDrafterPage() {
  const [selectedType, setSelectedType] = useState('');
  const [form, setForm] = useState({
    accused_name: '',
    fir_number: '',
    police_station: '',
    sections: '',
    court_name: '',
    arrest_date: '',
    incident_description: '',
  });
  const [partyRole, setPartyRole] = useState('petitioner');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [translatedDoc, setTranslatedDoc] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedType) {
      setError('Please select a document type first.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    setCopied(false);
    try {
      const payload = {
        document_type: selectedType,
        accused_name: form.accused_name,
        fir_number: form.fir_number,
        police_station: form.police_station,
        sections: form.sections,
        court_name: form.court_name,
        party_role: partyRole,
      };
      if (isBailType(selectedType)) {
        payload.arrest_date = form.arrest_date;
      }
      if (isComplaintType(selectedType)) {
        payload.incident_description = form.incident_description;
      }
      const res = await axios.post('/api/tools/draft-document', payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.document || result?.content) {
      navigator.clipboard.writeText(translatedDoc || result.document || result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedDocType = DOCUMENT_TYPES.find((d) => d.id === selectedType);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-500 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">Legal Document Drafter</h1>
        <p className="text-slate-200 max-w-2xl">
          Generate court-ready legal documents including bail applications, complaints,
          quashing petitions, and more. Select a document type, fill in the details, and
          get a professionally formatted draft in seconds.
        </p>
      </div>

      {/* Step 1: Document Type Selection */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Step 1: Select Document Type
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Choose the type of legal document you want to generate.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DOCUMENT_TYPES.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => {
                setSelectedType(doc.id);
                setError('');
                setResult(null);
              }}
              className={`relative rounded-xl p-4 text-left transition-all duration-200 border-2 ${
                selectedType === doc.id
                  ? 'border-slate-600 ring-2 ring-slate-400 shadow-lg scale-[1.02]'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${doc.color} flex items-center justify-center text-xl mb-3`}
              >
                {doc.icon}
              </div>
              <div className="font-medium text-gray-900 text-sm leading-tight">
                {doc.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">{doc.subtitle}</div>
              {selectedType === doc.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-slate-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Form Fields */}
      {selectedType && (
        <form onSubmit={handleGenerate} className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Step 2: Fill in Details
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Provide the required information for your{' '}
            <span className="font-medium text-gray-700">{selectedDocType?.label}</span>.
          </p>

          {/* Party Role Toggle */}
          <div className="mb-5 p-3 bg-gray-50 rounded-lg border">
            <label className="block text-sm font-medium text-gray-700 mb-2">I am the</label>
            <div className="flex gap-3">
              {[
                { id: 'petitioner', label: 'Petitioner / Complainant', desc: 'Filing or pursuing the case' },
                { id: 'respondent', label: 'Respondent / Accused', desc: 'Defending against charges' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setPartyRole(r.id)}
                  className={`flex-1 rounded-lg p-3 text-left border-2 transition-all ${
                    partyRole === r.id
                      ? 'border-slate-600 bg-slate-50 ring-1 ring-slate-300'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-800">{r.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Common Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {partyRole === 'respondent' ? 'Accused / Applicant Name' : 'Complainant / Petitioner Name'}
              </label>
              <input
                name="accused_name"
                value={form.accused_name}
                onChange={handleChange}
                required
                placeholder="Full legal name"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FIR Number
              </label>
              <input
                name="fir_number"
                value={form.fir_number}
                onChange={handleChange}
                required
                placeholder="e.g. 123/2026"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Police Station
              </label>
              <input
                name="police_station"
                value={form.police_station}
                onChange={handleChange}
                required
                placeholder="e.g. Saket Police Station"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sections Charged
              </label>
              <input
                name="sections"
                value={form.sections}
                onChange={handleChange}
                required
                placeholder="Comma-separated, e.g. 420, 406, 34"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none"
              />
            </div>

            <div className={isBailType(selectedType) ? '' : 'md:col-span-2'}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Court Name
              </label>
              <input
                name="court_name"
                value={form.court_name}
                onChange={handleChange}
                required
                placeholder="e.g. Sessions Court, Saket, New Delhi"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none"
              />
            </div>

            {/* Bail-specific: Arrest Date */}
            {isBailType(selectedType) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Arrest
                </label>
                <input
                  type="date"
                  name="arrest_date"
                  value={form.arrest_date}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none"
                />
              </div>
            )}

            {/* Complaint-specific: Incident Description */}
            {isComplaintType(selectedType) && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Incident Description
                </label>
                <textarea
                  name="incident_description"
                  value={form.incident_description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Describe the incident in detail including dates, locations, and persons involved..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none resize-vertical"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-gradient-to-r from-slate-700 to-slate-600 text-white py-3 rounded-lg font-semibold hover:from-slate-800 hover:to-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Generating Document...
              </span>
            ) : (
              'Generate Document'
            )}
          </button>
        </form>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white border rounded-xl p-6 mb-6 print:shadow-none print:border-none">
          {/* Result Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{result.title}</h2>
              <p className="text-sm text-gray-500 capitalize">
                {result.document_type?.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="flex gap-2 print:hidden">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print
              </button>
            </div>
          </div>

          {/* Translation Toggle */}
          <div className="mb-3">
            <TranslateToggle
              text={result.document || result.content}
              onTranslated={setTranslatedDoc}
            />
          </div>

          {/* Document Content */}
          <div className="bg-gray-50 border rounded-lg p-6 mb-4 overflow-auto max-h-[600px]">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
              {translatedDoc || result.document || result.content}
            </pre>
          </div>

          {/* Precedents Cited */}
          {result.precedents_cited && result.precedents_cited.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Precedents Cited</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {result.precedents_cited.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-2">
              <svg
                className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">Disclaimer</p>
                <p className="text-sm text-amber-700 mt-1">
                  {result.disclaimer ||
                    'This is a template. Review by a qualified lawyer is mandatory before filing in any court or authority.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
