import { useEffect, useState } from 'react';
import { listFIRs } from '../api';
import CaseCard from '../components/CaseCard';

export default function CaseListPage() {
  const [firs, setFirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    listFIRs().then((res) => {
      setFirs(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = filter
    ? firs.filter((f) => {
        const text = `${f.fir_number} ${f.ipc_sections} ${f.offense_category} ${f.district} ${f.description}`.toLowerCase();
        return text.includes(filter.toLowerCase());
      })
    : firs;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All FIRs</h1>
        <span className="text-gray-500 text-sm">{filtered.length} case{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <input
        type="text"
        placeholder="Filter by FIR number, IPC section, category, district..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full border rounded-lg px-4 py-3 mb-6 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {firs.length === 0 ? 'No FIRs in the system yet. Upload or enter one!' : 'No matching cases found.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fir) => <CaseCard key={fir.id} fir={fir} />)}
        </div>
      )}
    </div>
  );
}
