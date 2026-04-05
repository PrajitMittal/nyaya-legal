import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

const NAV_GROUPS = [
  {
    label: 'Help Now',
    items: [
      { path: '/fir-assistant', label: 'FIR Assistant', desc: 'File a complaint' },
      { path: '/bail-calculator', label: 'Bail Calculator', desc: 'Check bail eligibility' },
      { path: '/rights', label: 'Know Your Rights', desc: 'Rights during arrest, FIR, bail' },
    ],
  },
  {
    label: 'My Case',
    items: [
      { path: '/case-explainer', label: 'Case Explainer', desc: 'Understand your case status' },
      { path: '/explain-document', label: 'Explain Court Order', desc: 'Plain language explanation' },
      { path: '/cases', label: 'My Cases', desc: 'Saved FIR archive' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { path: '/draft', label: 'Document Drafter', desc: 'Generate legal documents' },
      { path: '/section-mapper', label: 'IPC/BNS Mapper', desc: 'Old to new section mapping' },
      { path: '/upload', label: 'AI Case Analysis', desc: 'Upload FIR for AI analysis' },
      { path: '/search', label: 'Search Cases', desc: 'Search Indian Kanoon' },
    ],
  },
];

export default function Navbar() {
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState(null);
  const [mobileSheet, setMobileSheet] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdowns on route change
  useEffect(() => {
    setOpenGroup(null);
    setMobileSheet(null);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (path) => location.pathname === path;

  const toggleGroup = (label) => {
    setOpenGroup(openGroup === label ? null : label);
  };

  // Check if current page belongs to a group
  const activeGroup = NAV_GROUPS.find((g) =>
    g.items.some((item) => isActive(item.path))
  );

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="bg-primary-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              <span className="text-white font-bold text-xl">Nyaya</span>
            </Link>

            {/* Desktop grouped nav */}
            <div className="hidden md:flex items-center gap-1" ref={dropdownRef}>
              {NAV_GROUPS.map((group) => (
                <div key={group.label} className="relative">
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition-colors ${
                      activeGroup?.label === group.label
                        ? 'bg-primary-700 text-white'
                        : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                    }`}
                  >
                    {group.label}
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${openGroup === group.label ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {openGroup === group.label && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      {group.items.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`block px-4 py-2.5 transition-colors ${
                            isActive(item.path)
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="text-sm font-medium">{item.label}</div>
                          <div className="text-xs text-gray-400">{item.desc}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile: hidden on desktop */}
            <div className="md:hidden" />
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="grid grid-cols-4 h-16">
          {NAV_GROUPS.map((group, i) => {
            const icons = [
              // Help Now
              <svg key="help" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>,
              // My Case
              <svg key="case" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>,
              // Tools
              <svg key="tools" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>,
            ];

            const isGroupActive = group.items.some((item) => isActive(item.path));

            return (
              <button
                key={group.label}
                onClick={() => setMobileSheet(mobileSheet === group.label ? null : group.label)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isGroupActive || mobileSheet === group.label
                    ? 'text-primary-600'
                    : 'text-gray-500'
                }`}
              >
                {icons[i]}
                <span className="text-[10px] font-medium">{group.label}</span>
              </button>
            );
          })}

          {/* Home button */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isActive('/') ? 'text-primary-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] font-medium">Home</span>
          </Link>
        </div>

        {/* Mobile slide-up sheet */}
        {mobileSheet && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setMobileSheet(null)}
            />
            <div className="fixed bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-2xl border-t z-50 p-4 pb-6">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                {mobileSheet}
              </h3>
              <div className="space-y-1">
                {NAV_GROUPS.find((g) => g.label === mobileSheet)?.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSheet(null)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-gray-400">{item.desc}</div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Spacer for mobile bottom bar */}
      <div className="md:hidden h-16" />
    </>
  );
}
