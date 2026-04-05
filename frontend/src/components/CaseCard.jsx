import { Link } from 'react-router-dom';

export default function CaseCard({ fir }) {
  return (
    <Link
      to={`/case/${fir.id}`}
      className="block bg-white rounded-xl shadow-sm border p-5 hover:border-primary-300 hover:shadow-md transition"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-semibold text-lg">FIR #{fir.fir_number || 'N/A'}</span>
          <span className="ml-3 text-sm text-gray-500">{fir.date_filed || 'No date'}</span>
        </div>
        <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs rounded-full font-medium">
          {fir.offense_category || 'Uncategorized'}
        </span>
      </div>
      <div className="text-sm text-gray-500 mb-2">
        {fir.police_station && <span>{fir.police_station}</span>}
        {fir.district && <span> &middot; {fir.district}</span>}
        {fir.state && <span> &middot; {fir.state}</span>}
      </div>
      <p className="text-gray-600 text-sm line-clamp-2 mb-2">{fir.description || 'No description'}</p>
      <div className="flex items-center gap-3 text-xs">
        {fir.ipc_sections && (
          <span className="text-gray-500">
            <span className="font-medium">Sections:</span> {fir.ipc_sections}
          </span>
        )}
        {fir.complainant_name && (
          <span className="text-gray-500">
            <span className="font-medium">Complainant:</span> {fir.complainant_name}
          </span>
        )}
        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${fir.source === 'upload' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
          {fir.source === 'upload' ? 'PDF Upload' : 'Manual Entry'}
        </span>
      </div>
    </Link>
  );
}
