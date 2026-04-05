import { useState, useRef, useId } from 'react';
import axios from 'axios';

/**
 * Load pdf.js from CDN on demand (avoids bundling 40MB pdfjs-dist in node_modules
 * which was pushing Vercel's serverless function over the 250MB limit).
 */
let pdfjsPromise = null;
function loadPdfJs() {
  if (pdfjsPromise) return pdfjsPromise;
  pdfjsPromise = import(
    /* @vite-ignore */
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs'
  ).then((mod) => {
    mod.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
    return mod;
  });
  return pdfjsPromise;
}

/**
 * Extracts text client-side using pdf.js from CDN. No upload, no size limit.
 */
async function extractTextClientSide(file) {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(' ');
    pages.push(text);
  }
  return pages.join('\n\n').trim();
}

/**
 * For scanned PDFs: render pages to images and send to Gemini vision API for OCR.
 */
async function extractTextViaAI(file) {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const maxPages = Math.min(pdf.numPages, 5);
  const images = [];

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    images.push(dataUrl);
  }

  const res = await axios.post('/api/tools/ocr-pdf', { images }, { timeout: 60000 });
  if (res.data.error) throw new Error(res.data.error);
  return res.data.text || '';
}

export default function PDFUploadButton({ onTextExtracted, label = 'Upload PDF', className = '' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const fileRef = useRef();
  const inputId = useId();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are accepted');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large (max 50MB).');
      return;
    }
    setUploading(true);
    setError('');
    setStatus('Extracting text...');
    try {
      // Step 1: Try client-side text extraction (fast, no upload)
      let text = '';
      try {
        text = await extractTextClientSide(file);
      } catch (err) {
        console.warn('Client-side PDF extraction failed:', err.message);
      }

      // Step 2: If little/no text found, try AI OCR for scanned PDFs
      if (text.length < 50) {
        setStatus('Scanned PDF detected — running AI OCR...');
        try {
          text = await extractTextViaAI(file);
        } catch (err) {
          console.warn('AI OCR failed:', err.message);
          if (text.length < 10) {
            setError('Could not extract text. The PDF may be a scanned image. AI OCR also failed: ' + (err.message || 'Unknown error'));
            return;
          }
        }
      }

      if (text && text.length >= 10) {
        onTextExtracted(text);
      } else {
        setError('No text could be extracted from this PDF.');
      }
    } catch (err) {
      setError('Failed to process PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
      setStatus('');
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
            {status || 'Processing...'}
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
