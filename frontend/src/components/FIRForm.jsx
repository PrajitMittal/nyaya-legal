import { useState } from 'react';

const OFFENSE_CATEGORIES = [
  'Murder', 'Attempted Murder', 'Cheating / Fraud', 'Theft', 'Robbery',
  'Sexual Assault', 'Dowry Death', 'Cruelty by Husband / Relatives',
  'Criminal Intimidation', 'Forgery', 'Criminal Conspiracy', 'Other',
];

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
];

export default function FIRForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    fir_number: '', police_station: '', district: '', state: '',
    date_filed: '', complainant_name: '', accused_name: '',
    ipc_sections: '', description: '', offense_category: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (!data.date_filed) delete data.date_filed;
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">FIR Number</label>
          <input name="fir_number" value={form.fir_number} onChange={handleChange}
            placeholder="e.g. 0142/2024" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Filed</label>
          <input name="date_filed" type="date" value={form.date_filed} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Police Station</label>
          <input name="police_station" value={form.police_station} onChange={handleChange}
            placeholder="e.g. Saket PS" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
          <input name="district" value={form.district} onChange={handleChange}
            placeholder="e.g. South Delhi" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <select name="state" value={form.state} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            <option value="">Select State</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Offense Category</label>
          <select name="offense_category" value={form.offense_category} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            <option value="">Select Category</option>
            {OFFENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Complainant Name</label>
          <input name="complainant_name" value={form.complainant_name} onChange={handleChange}
            placeholder="Full name" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Accused Name</label>
          <input name="accused_name" value={form.accused_name} onChange={handleChange}
            placeholder="Full name(s)" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">IPC / BNS Sections</label>
        <input name="ipc_sections" value={form.ipc_sections} onChange={handleChange}
          placeholder="e.g. 302, 201, 34" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
        <p className="text-xs text-gray-400 mt-1">Comma-separated section numbers (IPC or BNS)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description / Brief Facts</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={5}
          placeholder="Describe the incident in detail..."
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition">
        {loading ? 'Submitting...' : 'Submit FIR'}
      </button>
    </form>
  );
}
