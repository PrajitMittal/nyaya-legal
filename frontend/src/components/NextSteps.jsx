import { Link } from 'react-router-dom';

export default function NextSteps({ steps = [] }) {
  const visible = steps.filter((s) => s.show !== false);
  if (visible.length === 0) return null;

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">What to do next</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.map((step, i) => (
          <Link
            key={i}
            to={step.path}
            className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-800 group-hover:text-indigo-700 transition-colors">
                {step.label}
              </span>
              {step.desc && <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>}
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
