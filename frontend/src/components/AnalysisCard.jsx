export default function AnalysisCard({ analysis }) {
  if (!analysis || !analysis.ai_analysis) return null;
  const ai = analysis.ai_analysis;

  if (ai.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h3 className="text-red-700 font-semibold">Analysis Error</h3>
        <p className="text-red-600 text-sm mt-1">{ai.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Conviction Rate"
          value={analysis.conviction_rate ? `${analysis.conviction_rate}%` : 'N/A'}
          color="blue"
        />
        <MetricCard
          label="Bail Likelihood"
          value={analysis.bail_likelihood || 'N/A'}
          color={analysis.bail_likelihood === 'High' ? 'green' : analysis.bail_likelihood === 'Low' ? 'red' : 'amber'}
        />
        <MetricCard
          label="Expected Duration"
          value={analysis.expected_duration || 'N/A'}
          color="purple"
        />
      </div>

      {/* Case Summary */}
      {ai.case_summary && (
        <Section title="Case Summary">
          <p className="text-gray-700">{ai.case_summary}</p>
        </Section>
      )}

      {/* Sections Analysis */}
      {ai.sections_analysis?.length > 0 && (
        <Section title="IPC Sections Analysis">
          <div className="space-y-2">
            {ai.sections_analysis.map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 flex flex-wrap gap-3 items-center">
                <span className="font-mono font-bold text-primary-700">Sec {s.section}</span>
                <span className="text-sm text-gray-700">{s.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">{s.max_punishment}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.bailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {s.bailable ? 'Bailable' : 'Non-Bailable'}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Investigation Steps */}
      {ai.investigation_steps?.length > 0 && (
        <Section title="Recommended Investigation Steps">
          <ol className="list-decimal list-inside space-y-1.5">
            {ai.investigation_steps.map((step, i) => (
              <li key={i} className="text-gray-700 text-sm">{step}</li>
            ))}
          </ol>
        </Section>
      )}

      {/* Timeline */}
      {ai.expected_proceedings_timeline?.length > 0 && (
        <Section title="Expected Proceedings Timeline">
          <div className="relative">
            {ai.expected_proceedings_timeline.map((t, i) => (
              <div key={i} className="flex items-start mb-3 last:mb-0">
                <div className="flex flex-col items-center mr-3">
                  <div className="w-3 h-3 bg-primary-500 rounded-full" />
                  {i < ai.expected_proceedings_timeline.length - 1 && (
                    <div className="w-0.5 h-8 bg-primary-200" />
                  )}
                </div>
                <div>
                  <span className="font-medium text-sm">{t.stage}</span>
                  <span className="text-gray-500 text-xs ml-2">{t.typical_duration}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Bail Assessment */}
      {ai.bail_assessment && (
        <Section title="Bail Assessment">
          <p className="text-gray-700 text-sm mb-2">{ai.bail_assessment.reasoning}</p>
          {ai.bail_assessment.conditions?.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-500 mb-1">Likely Conditions:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                {ai.bail_assessment.conditions.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
          {ai.bail_assessment.relevant_precedents?.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-500 mb-1">Relevant Precedents:</p>
              <ul className="list-disc list-inside text-sm text-primary-700 space-y-0.5">
                {ai.bail_assessment.relevant_precedents.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* Strategies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ai.defense_strategies?.length > 0 && (
          <Section title="Defense Strategies" className="bg-blue-50 border-blue-200">
            <ul className="space-y-1.5">
              {ai.defense_strategies.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">&#9679;</span> {s}
                </li>
              ))}
            </ul>
          </Section>
        )}
        {ai.prosecution_strategies?.length > 0 && (
          <Section title="Prosecution Strategies" className="bg-red-50 border-red-200">
            <ul className="space-y-1.5">
              {ai.prosecution_strategies.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">&#9679;</span> {s}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      {/* Key Evidence */}
      {ai.key_evidence_required?.length > 0 && (
        <Section title="Key Evidence Required">
          <div className="flex flex-wrap gap-2">
            {ai.key_evidence_required.map((e, i) => (
              <span key={i} className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-medium">
                {e}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Similar Case Analysis */}
      {ai.similar_case_analysis?.length > 0 && (
        <Section title="Similar Case Analysis">
          <div className="space-y-3">
            {ai.similar_case_analysis.map((c, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm">{c.case_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.outcome === 'Convicted' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {c.outcome}
                  </span>
                </div>
                <p className="text-gray-600 text-xs mt-1">{c.key_factor}</p>
                <p className="text-primary-600 text-xs mt-1">{c.relevance}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Recommendations */}
      {ai.recommendations?.length > 0 && (
        <Section title="Recommendations" className="bg-legal-50 border-green-200">
          <ol className="list-decimal list-inside space-y-1.5">
            {ai.recommendations.map((r, i) => (
              <li key={i} className="text-gray-700 text-sm">{r}</li>
            ))}
          </ol>
        </Section>
      )}

      {/* Risk Assessment */}
      {ai.risk_assessment && (
        <Section title="Risk Assessment">
          <p className="text-gray-700 text-sm">{ai.risk_assessment}</p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children, className = '' }) {
  return (
    <div className={`bg-white border rounded-xl p-5 ${className}`}>
      <h3 className="font-semibold text-lg mb-3 text-gray-800">{title}</h3>
      {children}
    </div>
  );
}

function MetricCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <div className={`border rounded-xl p-4 ${colors[color] || colors.blue}`}>
      <div className="text-sm font-medium opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
