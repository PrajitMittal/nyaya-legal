import { useState, useRef, useId } from 'react';
import axios from 'axios';

/**
 * Load pdf.js from CDN on demand (avoids bundling 40MB pdfjs-dist in node_modules).
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
 * Load Tesseract.js from CDN for client-side OCR (no API needed, works offline-ish).
 */
let tesseractPromise = null;
function loadTesseract() {
  if (tesseractPromise) return tesseractPromise;
  tesseractPromise = new Promise((resolve, reject) => {
    if (window.Tesseract) { resolve(window.Tesseract); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.onload = () => resolve(window.Tesseract);
    script.onerror = () => reject(new Error('Failed to load OCR engine'));
    document.head.appendChild(script);
  });
  return tesseractPromise;
}

/**
 * Extracts text client-side using pdf.js. No upload, no size limit.
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
 * For scanned PDFs: render pages to images and run Tesseract.js OCR in browser.
 * No API call needed — runs entirely client-side.
 */
async function extractTextViaBrowserOCR(file, onProgress) {
  const pdfjsLib = await loadPdfJs();
  const Tesseract = await loadTesseract();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const maxPages = Math.min(pdf.numPages, 8);
  const allText = [];

  for (let i = 1; i <= maxPages; i++) {
    onProgress?.(`OCR: Processing page ${i} of ${maxPages}...`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    const { data } = await Tesseract.recognize(canvas, 'eng+hin', {
      logger: () => {},
    });
    if (data.text?.trim()) {
      allText.push(data.text.trim());
    }
  }

  return allText.join('\n\n').trim();
}

/**
 * Fallback: send page images to backend Gemini vision API for OCR.
 */
async function extractTextViaAI(file) {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const maxPages = Math.min(pdf.numPages, 5);
  const images = [];

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    // Lower resolution + quality to avoid request size limits
    const viewport = page.getViewport({ scale: 1.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
    images.push(dataUrl);
  }

  const res = await axios.post('/api/tools/ocr-pdf', { images }, { timeout: 90000 });
  if (res.data.error) throw new Error(res.data.error);
  return res.data.text || '';
}

export default function PDFUploadButton({ onTextExtracted, label = 'Upload PDF', className = '' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualText, setManualText] = useState('');
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
    setShowManualEntry(false);
    setStatus('Extracting text...');
    try {
      // Step 1: Try client-side text extraction (fast, no upload)
      let text = '';
      try {
        text = await extractTextClientSide(file);
      } catch (err) {
        console.warn('Client-side PDF extraction failed:', err.message);
      }

      // Step 2: If little/no text, try browser-based OCR (Tesseract.js)
      if (text.length < 50) {
        setStatus('Scanned PDF detected — running OCR (this may take a minute)...');
        try {
          text = await extractTextViaBrowserOCR(file, setStatus);
        } catch (err) {
          console.warn('Browser OCR failed:', err.message);
        }
      }

      // Step 3: If still no text, try AI-powered OCR as last resort
      if (text.length < 50) {
        setStatus('Trying AI-powered OCR...');
        try {
          text = await extractTextViaAI(file);
        } catch (err) {
          console.warn('AI OCR failed:', err.message);
        }
      }

      if (text && text.length >= 10) {
        onTextExtracted(text);
        setError('');
      } else {
        setError('');
        setShowManualEntry(true);
      }
    } catch (err) {
      setError('Failed to process PDF: ' + (err.message || 'Unknown error'));
      setShowManualEntry(true);
    } finally {
      setUploading(false);
      setStatus('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleManualSubmit = () => {
    if (manualText.trim().length >= 10) {
      onTextExtracted(manualText.trim());
      setShowManualEntry(false);
      setManualText('');
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

      {/* Friendly fallback for scanned/image PDFs */}
      {showManualEntry && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-amber-500 text-lg">&#9888;</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                This PDF appears to be a scanned image
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Scanned documents (photos/images of papers) are harder to read automatically.
                Many Indian court documents are scanned copies — this is completely normal.
              </p>
            </div>
          </div>
          <div className="space-y-2 mt-3">
            <p className="text-xs font-medium text-gray-700">You can:</p>
            <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
              <li>Type or paste the key text from the document below</li>
              <li>Take a clearer photo and use Google Lens to copy text</li>
              <li>Try a digitally-signed PDF if available (from eCourts or NSTEP)</li>
            </ul>
          </div>
          <div className="mt-3">
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              rows={4}
              placeholder="Type or paste the text from your document here..."
              className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
            <button
              onClick={handleManualSubmit}
              disabled={manualText.trim().length < 10}
              className="mt-2 w-full bg-amber-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition"
            >
              Use This Text
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
