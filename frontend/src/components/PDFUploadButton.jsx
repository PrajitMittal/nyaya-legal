import { useState, useRef, useId } from 'react';
import axios from 'axios';

export default function PDFUploadButton({ onTextExtracted, label = 'Upload PDF', className = '' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const inputId = useId();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are accepted');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('File too large (max 4MB). Try a smaller PDF.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/api/tools/extract-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      if (res.data.error) {
        setError(res.data.error);
      } else if (res.data.text) {
        onTextExtracted(res.data.text);
      } else {
        setError('No text could be extracted from this PDF');
      }
    } catch (err) {
      const status = err.response?.status;
      let msg = 'Failed to extract text from PDF';
      if (status === 413) {
        msg = 'File too large for server. Try a smaller PDF (under 4MB).';
      } else if (typeof err.response?.data === 'string') {
        msg = err.response.data.slice(0, 200);
      } else if (err.response?.data?.error) {
        msg = String(err.response.data.error);
      } else if (err.response?.data?.detail) {
        msg = String(err.response.data.detail);
      } else if (err.message) {
        msg = String(err.message);
      }
      setError(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        onChange={handleUpload}
        className="hidden"
        id={inputId}
      />
      <label
        htmlFor={inputId}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed text-sm font-medium transition-all cursor-pointer ${
          uploading
            ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-wait'
            : 'border-gray-300 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'
        }`}
      >
        {uploading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Extracting text...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {label}
          </>
        )}
      </label>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
