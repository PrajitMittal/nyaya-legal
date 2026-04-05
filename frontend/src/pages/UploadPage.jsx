import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PDFUploader from '../components/PDFUploader';
import FIRForm from '../components/FIRForm';
import { uploadFIR, createFIRManual } from '../api';

export default function UploadPage() {
  const [tab, setTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleUpload = async (file) => {
    setLoading(true);
    setError('');
    try {
      const res = await uploadFIR(file);
      navigate(`/case/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManual = async (data) => {
    setLoading(true);
    setError('');
    try {
      const res = await createFIRManual(data);
      navigate(`/case/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Upload / Enter FIR</h1>

      {/* Tab Switcher */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setTab('upload')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
            tab === 'upload' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Upload PDF
        </button>
        <button
          onClick={() => setTab('manual')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
            tab === 'manual' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Manual Entry
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {tab === 'upload' ? (
        <div>
          <p className="text-gray-600 mb-4">
            Upload an FIR PDF document. The system will automatically extract key details like
            FIR number, IPC sections, parties, and incident description.
          </p>
          <PDFUploader onUpload={handleUpload} loading={loading} />
        </div>
      ) : (
        <div>
          <p className="text-gray-600 mb-4">
            Manually enter FIR details. Fill in as many fields as possible for better analysis results.
          </p>
          <FIRForm onSubmit={handleManual} loading={loading} />
        </div>
      )}
    </div>
  );
}
