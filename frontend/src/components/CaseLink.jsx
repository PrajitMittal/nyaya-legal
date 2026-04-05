import { useState } from 'react';
import CasePreviewPanel from './CasePreviewPanel';

/**
 * Makes a case citation clickable — opens a slide-over panel with case details.
 * Usage: <CaseLink name="Rasiklal v. Kishore (2009)" />
 * Or wrap text: <CaseLink name="State v. Balchand">the Balchand case</CaseLink>
 */
export default function CaseLink({ name, children }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-indigo-600 hover:text-indigo-800 underline decoration-dotted underline-offset-2 cursor-pointer font-medium transition inline"
        title={`View: ${name}`}
      >
        {children || name}
      </button>
      {open && (
        <CasePreviewPanel
          caseName={name}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
