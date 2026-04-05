import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (path) =>
    location.pathname === path
      ? 'bg-primary-700 text-white'
      : 'text-primary-100 hover:bg-primary-600 hover:text-white';

  const links = [
    { path: '/', label: 'Home' },
    { path: '/fir-assistant', label: 'FIR Assistant' },
    { path: '/bail-calculator', label: 'Bail Calculator' },
    { path: '/case-explainer', label: 'Case Explainer' },
    { path: '/draft', label: 'Draft Documents' },
    { path: '/explain-document', label: 'Explain Order' },
    { path: '/section-mapper', label: 'IPC/BNS Mapper' },
    { path: '/rights', label: 'Know Rights' },
    { path: '/cases', label: 'Cases' },
    { path: '/search', label: 'Search' },
  ];

  return (
    <nav className="bg-primary-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span className="text-white font-bold text-xl">Nyaya</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex space-x-0.5">
            {links.map(l => (
              <Link key={l.path} to={l.path}
                className={`px-2.5 py-2 rounded-md text-xs font-medium whitespace-nowrap ${isActive(l.path)}`}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden pb-3 space-y-1">
            {links.map(l => (
              <Link key={l.path} to={l.path} onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive(l.path)}`}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
