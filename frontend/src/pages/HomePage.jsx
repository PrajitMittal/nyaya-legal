import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { listFIRs } from '../api';

const MODULES = [
  {
    title: 'FIR Filing Assistant',
    desc: 'Describe what happened in plain language. Get applicable IPC sections, know if police MUST file your FIR, and generate a draft complaint.',
    path: '/fir-assistant',
    gradient: 'from-amber-600 to-orange-500',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    tag: 'Citizens',
    key: 'fir-assistant',
  },
  {
    title: 'Bail Calculator',
    desc: 'Check if an undertrial qualifies for Default Bail, Section 436A release, or bailable offense provisions. Pure statutory logic.',
    path: '/bail-calculator',
    gradient: 'from-green-600 to-emerald-500',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5 5 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    tag: 'Citizens + Lawyers',
    key: 'bail-calculator',
  },
  {
    title: 'Case Explainer',
    desc: 'Enter your case number and get a plain language explanation of where your case stands, what happened, and what comes next.',
    path: '/case-explainer',
    gradient: 'from-indigo-600 to-blue-500',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    tag: 'Citizens',
    key: 'case-explainer',
  },
  {
    title: 'Document Drafter',
    desc: 'Generate court-ready legal documents — bail applications, complaints to Magistrate (156(3)), SP complaints, NHRC complaints, and more.',
    path: '/draft',
    gradient: 'from-slate-600 to-gray-500',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    tag: 'Lawyers',
    key: 'document-drafter',
  },
  {
    title: 'Explain Court Order',
    desc: 'Paste any court order, bail order, or legal document and get a plain language explanation with key takeaways and next steps.',
    path: '/explain-document',
    gradient: 'from-rose-600 to-pink-500',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    tag: 'Citizens',
    key: 'explain-court-order',
  },
  {
    title: 'IPC/BNS Mapper',
    desc: 'Map between old IPC sections and new BNS (2024) sections. Essential during the transition period. Full reference table included.',
    path: '/section-mapper',
    gradient: 'from-teal-600 to-cyan-500',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    tag: 'Lawyers + Police',
    key: 'section-mapper',
  },
  {
    title: 'Know Your Rights',
    desc: 'Your constitutional and legal rights during arrest, FIR filing, bail, and police searches. Know them BEFORE you need them.',
    path: '/rights',
    gradient: 'from-purple-600 to-violet-500',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    tag: 'Citizens',
    key: 'know-rights',
  },
  {
    title: 'AI Case Analysis',
    desc: 'Upload an FIR and get AI-powered analysis — conviction rates, investigation steps, bail assessment, defense strategies, and precedents.',
    path: '/upload',
    gradient: 'from-blue-700 to-primary-600',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    tag: 'All Users',
    key: 'ai-case-analysis',
  },
];

const STATS = [
  { value: '50M+', label: 'Cases Pending in India', color: 'text-red-600' },
  { value: '75.8%', label: 'Prisoners are Undertrials', color: 'text-amber-600' },
  { value: '61%', label: 'Hearings are Adjournments', color: 'text-orange-600' },
  { value: '24,879', label: 'In Jail Despite Having Bail', color: 'text-red-700' },
];

const PERSONAS = [
  {
    name: 'Ravi - Shop Owner',
    problem: 'His shop was burgled. Police refused to file FIR saying "yeh FIR ka case nahi hai."',
    solution: 'Nyaya told him his rights, generated a draft FIR, and showed how to escalate to SP/Magistrate.',
    tool: 'FIR Assistant',
  },
  {
    name: 'Priya - Undertrial\'s Wife',
    problem: 'Her husband has been in jail 14 months for a Section 323 case (max sentence: 1 year).',
    solution: 'Bail Calculator showed he qualifies for mandatory release under Section 436A. Generated the application.',
    tool: 'Bail Calculator',
  },
  {
    name: 'Adv. Meera - Legal Aid Lawyer',
    problem: 'Has 200 undertrial clients. Doesn\'t know which ones qualify for bail.',
    solution: 'Uses Bail Calculator + Document Drafter to identify eligible clients and batch-generate applications.',
    tool: 'Document Drafter',
  },
];

// Role-based module ordering: keys listed first appear at top, rest follow in original order
const ROLE_MODULE_ORDER = {
  citizen: ['fir-assistant', 'bail-calculator', 'know-rights'],
  lawyer: ['document-drafter', 'section-mapper', 'ai-case-analysis'],
  police: ['ai-case-analysis', 'section-mapper', 'bail-calculator'],
};

// Role-based hero CTA buttons
const ROLE_CTAS = {
  citizen: [
    { label: 'File an FIR', path: '/fir-assistant', style: 'bg-white text-primary-800 hover:bg-primary-50 shadow-lg shadow-black/20' },
    { label: 'Check Bail Eligibility', path: '/bail-calculator', style: 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-black/20' },
    { label: 'Know Your Rights', path: '/rights', style: 'border-2 border-white/30 text-white hover:bg-white/10' },
  ],
  lawyer: [
    { label: 'Draft a Document', path: '/draft', style: 'bg-white text-primary-800 hover:bg-primary-50 shadow-lg shadow-black/20' },
    { label: 'IPC/BNS Mapper', path: '/section-mapper', style: 'bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-black/20' },
    { label: 'AI Case Analysis', path: '/upload', style: 'border-2 border-white/30 text-white hover:bg-white/10' },
  ],
  police: [
    { label: 'AI Case Analysis', path: '/upload', style: 'bg-white text-primary-800 hover:bg-primary-50 shadow-lg shadow-black/20' },
    { label: 'IPC/BNS Mapper', path: '/section-mapper', style: 'bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-black/20' },
    { label: 'Check Bail Eligibility', path: '/bail-calculator', style: 'border-2 border-white/30 text-white hover:bg-white/10' },
  ],
  general: [
    { label: 'File an FIR', path: '/fir-assistant', style: 'bg-white text-primary-800 hover:bg-primary-50 shadow-lg shadow-black/20' },
    { label: 'Check Bail Eligibility', path: '/bail-calculator', style: 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-black/20' },
    { label: 'Know Your Rights', path: '/rights', style: 'border-2 border-white/30 text-white hover:bg-white/10' },
  ],
};

const ROLE_LABELS = {
  citizen: 'Citizen',
  lawyer: 'Lawyer',
  police: 'Police',
  general: 'Explorer',
};

function getOrderedModules(role) {
  const priorityKeys = ROLE_MODULE_ORDER[role];
  if (!priorityKeys) return MODULES;
  const priority = MODULES.filter((m) => priorityKeys.includes(m.key));
  const rest = MODULES.filter((m) => !priorityKeys.includes(m.key));
  // Maintain the order specified in priorityKeys
  const sorted = priorityKeys.map((k) => MODULES.find((m) => m.key === k)).filter(Boolean);
  return [...sorted, ...rest];
}

// Role selection screen component
function RoleSelection({ onSelect }) {
  const roles = [
    {
      id: 'citizen',
      label: 'Citizen',
      description: 'I need help with an FIR, bail, understanding my case, or knowing my rights',
      gradient: 'from-blue-500 to-blue-700',
      hoverGradient: 'from-blue-600 to-blue-800',
      ring: 'ring-blue-400',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      id: 'lawyer',
      label: 'Lawyer',
      description: 'I need legal research, document drafting, case analysis, or section mapping',
      gradient: 'from-indigo-500 to-indigo-700',
      hoverGradient: 'from-indigo-600 to-indigo-800',
      ring: 'ring-indigo-400',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'police',
      label: 'Police',
      description: 'I need investigation tools, chargesheet tracking, case management, or FIR analysis',
      gradient: 'from-slate-500 to-slate-700',
      hoverGradient: 'from-slate-600 to-slate-800',
      ring: 'ring-slate-400',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary-900 to-indigo-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-5 py-2 text-sm text-white/80 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            AI-Powered Legal Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">Nyaya</span>
          </h1>
          <p className="text-lg text-primary-200 max-w-xl mx-auto">
            Select your role to get a personalized experience
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className={`group relative bg-gradient-to-br ${r.gradient} rounded-2xl p-6 text-white text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/30 focus:outline-none focus:ring-4 ${r.ring} focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer`}
            >
              {/* Subtle shimmer overlay on hover */}
              <div className="absolute inset-0 rounded-2xl bg-white/0 group-hover:bg-white/5 transition-all duration-300"></div>
              <div className="relative">
                <div className="bg-white/15 backdrop-blur w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-white/25 transition-colors duration-300">
                  {r.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2">{r.label}</h3>
                <p className="text-white/75 text-sm leading-relaxed">{r.description}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                  Get Started
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Skip link */}
        <div className="text-center">
          <button
            onClick={() => onSelect('general')}
            className="text-white/50 hover:text-white/80 text-sm transition-colors duration-200 underline underline-offset-4 decoration-white/20 hover:decoration-white/50 cursor-pointer"
          >
            Skip — I'll explore on my own
          </button>
        </div>
      </div>
    </div>
  );
}

// Role badge component
function RoleBadge({ role, onChangeRole }) {
  const colors = {
    citizen: 'bg-blue-100 text-blue-800 border-blue-200',
    lawyer: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    police: 'bg-slate-100 text-slate-800 border-slate-200',
    general: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <div className="flex items-center justify-end max-w-7xl mx-auto px-4 pt-4 -mb-4">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${colors[role] || colors.general}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
        {ROLE_LABELS[role] || 'Explorer'}
        <button
          onClick={onChangeRole}
          className="ml-1 text-xs opacity-60 hover:opacity-100 transition-opacity underline underline-offset-2 cursor-pointer"
        >
          Change
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState({ total: 0, recent: [] });
  const [role, setRole] = useState(localStorage.getItem('nyaya_role') || 'general');

  useEffect(() => {
    listFIRs().then((res) => {
      setStats({ total: res.data.length, recent: res.data.slice(0, 3) });
    }).catch(() => {});
  }, []);

  const handleSelectRole = (selectedRole) => {
    localStorage.setItem('nyaya_role', selectedRole);
    setRole(selectedRole);
  };

  const handleChangeRole = () => {
    localStorage.removeItem('nyaya_role');
    setRole(null);
  };

  // Show role selection if no role is chosen
  if (!role) {
    return <RoleSelection onSelect={handleSelectRole} />;
  }

  const orderedModules = getOrderedModules(role);
  const ctas = ROLE_CTAS[role] || ROLE_CTAS.general;

  return (
    <div>
      {/* Role Badge */}
      <RoleBadge role={role} onChangeRole={handleChangeRole} />

      {/* Hero Section - Full Width */}
      <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              AI-Powered Legal Intelligence for India
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Justice should not require
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200"> a law degree</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-200 mb-8 leading-relaxed">
              Nyaya arms citizens with legal knowledge, helps lawyers work 10x faster, and gives police the tools to meet deadlines.
              From FIR filing to bail applications to case tracking — everything the Indian justice system needs, powered by AI.
            </p>
            <div className="flex flex-wrap gap-4">
              {ctas.map((cta, i) => (
                <Link key={i} to={cta.path} className={`${cta.style} px-8 py-3.5 rounded-xl font-semibold transition`}>
                  {cta.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Crisis Stats Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">India's Justice Crisis in Numbers</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <div key={i} className="text-center md:text-left">
                <div className={`text-2xl md:text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">8 Modules. One Platform.</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Every tool a citizen, lawyer, or police officer needs — from the moment an FIR is filed to the final judgment.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {orderedModules.map((m, i) => (
            <Link
              key={i}
              to={m.path}
              className="group bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className={`bg-gradient-to-br ${m.gradient} p-5 text-white`}>
                <div className="flex items-center justify-between">
                  {m.icon}
                  <span className="text-xs bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">{m.tag}</span>
                </div>
                <h3 className="text-lg font-bold mt-3">{m.title}</h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 leading-relaxed">{m.desc}</p>
                <div className="mt-4 text-sm font-semibold text-primary-600 group-hover:text-primary-700 flex items-center gap-1">
                  Open Tool
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* User Stories */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Built for Real People, Real Problems</h2>
            <p className="text-gray-400 text-lg">Every feature exists because someone in India needed it yesterday.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PERSONAS.map((p, i) => (
              <div key={i} className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="text-sm font-semibold text-amber-400 mb-3">{p.name}</div>
                <div className="mb-4">
                  <div className="text-xs text-red-400 font-medium uppercase tracking-wider mb-1">The Problem</div>
                  <p className="text-gray-300 text-sm">{p.problem}</p>
                </div>
                <div className="mb-4">
                  <div className="text-xs text-green-400 font-medium uppercase tracking-wider mb-1">How Nyaya Helped</div>
                  <p className="text-gray-300 text-sm">{p.solution}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-primary-600/20 text-primary-300 text-xs px-3 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {p.tool}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">No API Keys. No Signup. Just Works.</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Bail calculations, FIR assistance, section mapping, and rights information — all powered by pure statutory logic and a comprehensive IPC/BNS database. Zero external dependencies.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Describe Your Situation', desc: 'Tell us what happened in plain language. Our AI identifies applicable laws, sections, and your legal rights.', color: 'bg-amber-500' },
            { step: '02', title: 'Get Instant Legal Intelligence', desc: 'Bail eligibility, draft documents, section mappings, case timelines — all calculated in real-time with statutory precision.', color: 'bg-green-500' },
            { step: '03', title: 'Take Informed Action', desc: 'Armed with knowledge, rights cards, and legal documents — walk into any police station or courtroom prepared.', color: 'bg-blue-500' },
          ].map((f) => (
            <div key={f.step} className="relative">
              <div className={`${f.color} text-white w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg mb-4`}>
                {f.step}
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-900">{f.title}</h3>
              <p className="text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Cases */}
      {stats.recent.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent FIRs in Archive</h2>
            <Link to="/cases" className="text-primary-600 hover:text-primary-700 text-sm font-semibold">
              View All ({stats.total}) &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.recent.map((fir) => (
              <Link
                key={fir.id}
                to={`/case/${fir.id}`}
                className="bg-white rounded-xl border hover:border-primary-300 hover:shadow-md transition p-5"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-bold text-gray-800">FIR #{fir.fir_number || 'N/A'}</span>
                  <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full font-medium">
                    {fir.offense_category || 'Uncategorized'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">{fir.police_station}, {fir.district}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{fir.description}</p>
                <div className="text-xs text-gray-400 mt-3">IPC: {fir.ipc_sections || 'N/A'}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-primary-800 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            24,879 people are in jail right now despite having bail.
          </h2>
          <p className="text-primary-200 text-lg mb-6 max-w-xl mx-auto">
            Information is power. Nyaya puts that power in your hands.
          </p>
          <Link to="/bail-calculator" className="inline-flex items-center gap-2 bg-white text-primary-800 px-8 py-3.5 rounded-xl font-semibold hover:bg-primary-50 transition shadow-lg">
            Check Bail Eligibility Now
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Disclaimer Footer */}
      <div className="bg-gray-100 border-t">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-xs text-gray-500 text-center">
            <strong>Disclaimer:</strong> Nyaya provides legal information, NOT legal advice. Always consult a qualified lawyer before taking legal action.
            Bail eligibility calculations are based on statutory provisions and may not account for all case-specific factors.
            This platform is a tool to empower citizens with knowledge — it does not replace professional legal counsel.
          </p>
        </div>
      </div>
    </div>
  );
}
