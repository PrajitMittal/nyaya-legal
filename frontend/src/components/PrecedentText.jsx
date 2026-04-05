import { useState } from 'react';
import CasePreviewPanel from './CasePreviewPanel';

/**
 * Renders text with case citations made clickable.
 * Detects patterns like "Name v. Name (Year)" and wraps them in clickable links.
 */
const CASE_PATTERN = /([A-Z][A-Za-z\s\.]+?\s+v[s]?\.?\s+[A-Z][A-Za-z\s\.]+?\s*\(\d{4}\))/g;

export default function PrecedentText({ text, className = '' }) {
  const [selectedCase, setSelectedCase] = useState(null);

  if (!text) return null;

  const parts = [];
  let lastIndex = 0;
  let match;
  const regex = new RegExp(CASE_PATTERN);

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    // Add the case citation
    parts.push({ type: 'case', content: match[1].trim() });
    lastIndex = regex.lastIndex;
  }
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  // If no cases found, return plain text
  if (parts.length <= 1 && parts[0]?.type === 'text') {
    return <span className={className}>{text}</span>;
  }

  return (
    <>
      <span className={className}>
        {parts.map((part, i) =>
          part.type === 'case' ? (
            <button
              key={i}
              onClick={() => setSelectedCase(part.content)}
              className="text-indigo-600 hover:text-indigo-800 underline decoration-dotted underline-offset-2 cursor-pointer font-medium transition"
              title={`View: ${part.content}`}
            >
              {part.content}
            </button>
          ) : (
            <span key={i}>{part.content}</span>
          )
        )}
      </span>
      {selectedCase && (
        <CasePreviewPanel
          caseName={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </>
  );
}
