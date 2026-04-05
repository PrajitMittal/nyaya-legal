import { useState } from 'react';
import axios from 'axios';
import PDFUploadButton from '../components/PDFUploadButton';

export default function BailCalculatorPage() {
  const [form, setForm] = useState({
    sections: '',
    arrest_date: '',
    chargesheet_filed: false,
    chargesheet_date: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = {
        sections: form.sections.split(',').map(s => s.trim()).filter(Boolean),
        arrest_date: form.arrest_date,
        chargesheet_filed: form.chargesheet_filed,
        chargesheet_date: form.chargesheet_filed ? form.chargesheet_date : null,
      };
      const res = await axios.post('/api/tools/bail-calculator', data);
      if (res.data.error) {
        setError(String(res.data.error));
      } else {
        setResult(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-green-700 to-green-500 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">Bail Eligibility Calculator</h1>
        <p className="text-green-100 max-w-2xl">
          Check if an undertrial qualifies for bail under Default Bail (167(2) CrPC),
          Section 436A (half sentence served), or bailable offense provisions. No API needed -- pure legal logic.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 mb-6 space-y-4">
        {/* PDF Upload */}
        <PDFUploadButton
          label="Upload FIR / Chargesheet PDF to auto-fill"
          onTextExtracted={(text) => {
            const secs = text.match(/(?:Section|Sec\.?)\s+(\d{1,4}[A-Z]?)/gi);
            if (secs) {
              const nums = secs.map(s => s.replace(/(?:Section|Sec\.?)\s+/i, '')).join(', ');
              setForm(prev => ({ ...prev, sections: nums }));
            }
            const dateMatch = text.match(/(?:arrest|arrested|custody)\s*(?:on|dated?)?\s*[:\-]?\s*(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})/i);
            if (dateMatch) {
              const parts = dateMatch[1].split(/[/\-\.]/);
              if (parts.length === 3) {
                const yr = parts[2].length === 2 ? '20' + parts[2] : parts[2];
                setForm(prev => ({ ...prev, arrest_date: `${yr}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}` }));
              }
            }
          }}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">IPC / BNS Sections Charged</label>
          <input
            value={form.sections}
            onChange={e => setForm({ ...form, sections: e.target.value })}
            placeholder="e.g. 302, 34 or 420, 406, 120B"
            required
            className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <p className="text-xs text-gray-400 mt-1">Comma-separated section numbers</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Arrest</label>
            <input
              type="date"
              value={form.arrest_date}
              onChange={e => setForm({ ...form, arrest_date: e.target.value })}
              required
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chargesheet Filed?</label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input type="radio" checked={!form.chargesheet_filed}
                  onChange={() => setForm({ ...form, chargesheet_filed: false })}
                  className="text-green-600" />
                <span>No</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={form.chargesheet_filed}
                  onChange={() => setForm({ ...form, chargesheet_filed: true })}
                  className="text-green-600" />
                <span>Yes</span>
              </label>
            </div>
          </div>
        </div>
        {form.chargesheet_filed && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chargesheet Date</label>
            <input
              type="date"
              value={form.chargesheet_date}
              onChange={e => setForm({ ...form, chargesheet_date: e.target.value })}
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        )}
        <button type="submit" disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition">
          {loading ? 'Calculating...' : 'Check Bail Eligibility'}
        </button>
      </form>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className={`rounded-xl p-6 ${result.summary?.immediate_action_required
            ? 'bg-red-50 border-2 border-red-300' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">{result.summary?.immediate_action_required ? '\u26A0\uFE0F' : '\u2139\uFE0F'}</span>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {result.summary?.immediate_action_required
                    ? 'IMMEDIATE ACTION REQUIRED'
                    : 'Monitor Deadlines'}
                </h2>
                <p className="text-gray-700 mt-1">{result.summary?.recommendation}</p>
                <p className="text-sm text-gray-500 mt-1">Strongest ground: {result.summary?.strongest_ground}</p>
              </div>
            </div>
          </div>

          {/* Key Facts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Days in Custody" value={result.days_in_custody} />
            <Stat label="Max Punishment" value={result.max_punishment_years >= 99 ? 'Life' : `${result.max_punishment_years} years`} />
            <Stat label="All Bailable?" value={result.all_offenses_bailable ? 'Yes' : 'No'} />
            <Stat label="CS Deadline" value={`${result.chargesheet_deadline_days} days`} />
          </div>

          {/* Sections Analysis */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold text-lg mb-3">Sections Charged</h3>
            <div className="space-y-2">
              {result.sections_analysis?.map((s, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <span className="font-mono font-bold text-primary-700">Sec {s.section}</span>
                  <span className="text-sm text-gray-700">{s.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">{s.punishment}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.bailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {s.bailable ? 'Bailable' : 'Non-Bailable'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Eligibility Results */}
          {result.eligibility?.map((e, i) => (
            <div key={i} className={`border rounded-xl p-5 ${
              e.eligible ? 'bg-green-50 border-green-300' :
              e.urgency === 'WATCH' || e.urgency === 'APPROACHING' ? 'bg-amber-50 border-amber-300' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg">{e.type}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  e.eligible ? 'bg-green-200 text-green-800' :
                  e.urgency === 'WATCH' ? 'bg-amber-200 text-amber-800' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {e.eligible ? 'ELIGIBLE' : e.urgency}
                </span>
              </div>
              <p className="text-gray-700 text-sm mb-3">{e.explanation}</p>
              {e.legal_basis && (
                <p className="text-xs text-primary-600 mb-2">
                  <span className="font-medium">Legal Basis:</span> {e.legal_basis}
                </p>
              )}
              <div className="bg-white bg-opacity-60 rounded-lg p-3 mt-2">
                <p className="text-sm font-medium text-gray-800">What to do:</p>
                <p className="text-sm text-gray-700 mt-1">{e.action}</p>
              </div>
              {e.precedent && (
                <p className="text-xs text-gray-500 mt-2 italic">{e.precedent}</p>
              )}
              {e.days_remaining !== undefined && (
                <div className="mt-2 px-3 py-2 bg-white bg-opacity-60 rounded-lg">
                  <span className="text-sm font-medium">Days remaining: </span>
                  <span className="text-lg font-bold text-amber-700">{e.days_remaining}</span>
                  {e.deadline_date && <span className="text-sm text-gray-500 ml-2">(Deadline: {e.deadline_date})</span>}
                </div>
              )}
              {e.overdue_by_days !== undefined && (
                <div className="mt-2 px-3 py-2 bg-red-100 rounded-lg">
                  <span className="text-sm font-medium text-red-800">OVERDUE by </span>
                  <span className="text-lg font-bold text-red-700">{e.overdue_by_days} days</span>
                </div>
              )}
            </div>
          ))}

          {/* Disclaimer */}
          <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-500">
            <p className="font-medium mb-1">Disclaimer</p>
            <p>This calculator provides legal information based on statutory provisions. It is NOT legal advice.
            Consult a qualified lawyer before taking legal action. Bail eligibility depends on multiple factors
            beyond what this calculator considers, including the specific facts of the case, the accused's
            criminal history, and the presiding judge's discretion.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white border rounded-lg p-3 text-center">
      <div className="text-xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
