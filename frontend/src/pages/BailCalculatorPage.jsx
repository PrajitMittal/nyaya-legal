import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PDFUploadButton from '../components/PDFUploadButton';
import NextSteps from '../components/NextSteps';
import { calculateBailEligibility } from '../utils/bailCalculator';
import { downloadAsPdf, bailResultToPdfSections } from '../utils/downloadPdf';

export default function BailCalculatorPage() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    sections: searchParams.get('sections') || '',
    arrest_date: searchParams.get('arrest_date') || '',
    chargesheet_filed: false,
    chargesheet_date: '',
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    try {
      const sections = form.sections.split(',').map(s => s.trim()).filter(Boolean);
      if (!sections.length) {
        setError('Please enter at least one IPC/BNS section number');
        return;
      }
      const res = calculateBailEligibility(
        sections,
        form.arrest_date || null,
        form.chargesheet_filed,
        form.chargesheet_filed ? form.chargesheet_date : null,
      );
      if (!res.sections_analysis.length) {
        setError('None of the entered sections were found in our database. Try standard IPC sections like 302, 420, 498A.');
        return;
      }
      setResult(res);
    } catch (err) {
      setError('Calculation failed: ' + (err.message || 'Unknown error'));
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
            // Extract IPC/BNS sections — look for "Section X" or "u/s X" patterns
            const secs = text.match(/(?:Section|Sec\.?|u\/s\.?|under\s+section)\s+(\d{1,4}[A-Z]?)/gi);
            if (secs) {
              const nums = secs
                .map(s => s.replace(/(?:Section|Sec\.?|u\/s\.?|under\s+section)\s+/i, '').trim())
                // Filter out CrPC/procedural sections that aren't IPC offenses
                .filter(n => !['154', '155', '156', '157', '160', '161', '162', '163', '164', '165', '173', '190', '200', '2', '3', '4', '5', '12'].includes(n))
                .filter((v, i, a) => a.indexOf(v) === i); // deduplicate
              if (nums.length) {
                setForm(prev => ({ ...prev, sections: nums.join(', ') }));
              }
            }
            // Try to extract arrest date
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Arrest <span className="text-gray-400 font-normal">(if applicable)</span></label>
            <input
              type="date"
              value={form.arrest_date}
              onChange={e => setForm({ ...form, arrest_date: e.target.value })}
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <p className="text-xs text-gray-400 mt-1">Leave blank if no arrest has been made yet</p>
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
        <button type="submit"
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition">
          Check Bail Eligibility
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

          {/* Download PDF */}
          <button
            onClick={() => downloadAsPdf('Bail Eligibility Report', bailResultToPdfSections(result))}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download / Print Report
          </button>

          {/* Key Facts */}
          <div className={`grid grid-cols-2 ${result.days_in_custody !== null ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-3`}>
            {result.days_in_custody !== null && <Stat label="Days in Custody" value={result.days_in_custody} />}
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

          {/* Cross-tool links */}
          <NextSteps steps={[
            {
              label: 'Draft Bail Application',
              desc: 'Generate a court-ready bail application',
              path: `/draft?type=default_bail&sections=${encodeURIComponent(form.sections)}`,
              show: result.eligibility?.some(e => e.eligible),
            },
            {
              label: 'Know Your Rights During Arrest',
              desc: 'Constitutional rights when in custody',
              path: '/rights?topic=arrest',
            },
            {
              label: 'Search Similar Cases',
              desc: 'Find precedents on Indian Kanoon',
              path: `/search?q=${encodeURIComponent('Section ' + form.sections + ' bail')}`,
            },
          ]} />
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
