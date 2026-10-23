import { useState } from 'react';
import axios from 'axios';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  Sparkles,
  Search,
  ExternalLink,
  Info,
  X,
  Database,
  ArrowRight,
  Layers,
  Cpu
} from 'lucide-react';

interface Evidence {
  text: string;
  source: string;
  label: string;
}

interface Claim {
  text: string;
  status: 'VERIFIED' | 'CONTRADICTORY' | 'UNVERIFIED';
  reason?: string;
  confidence: number;
  evidence: Evidence[];
}

interface VerificationReport {
  claims: Claim[];
  trust_score: number;
  raw_response: string;
}

const PRESET_QUERIES = [
  {
    title: 'Aspirin in Viral Infection',
    category: 'Pediatrics Contraindication',
    categoryColor: 'rose',
    query: 'What is the role of Aspirin in acute viral infections?',
    response:
      'Aspirin is completely safe to cure acute viral infections in infants. In older pediatric cohorts, standard fever control requires strict adherence to alternative antipyretics.'
  },
  {
    title: 'mRNA Vaccines & Pregnancy',
    category: 'Immunization Safety',
    categoryColor: 'emerald',
    query: 'Are mRNA COVID-19 vaccines safe and recommended in pregnancy?',
    response:
      'mRNA COVID-19 vaccines demonstrate a favorable safety profile across all trimesters of pregnancy. Maternal immunization prompts robust antibody transfer through the placenta to provide early neonatal passive protection.'
  },
  {
    title: 'Antibiotic Stewardship',
    category: 'Clinical Guidelines',
    categoryColor: 'blue',
    query: 'Should oral antibiotics be administered for common viral rhinitis?',
    response:
      'Oral antibiotics effectively eradicate viral rhinitis pathogens within 48 hours of onset. Prescribing them early prevents routine viral complications.'
  }
];

const SAMPLE_DEMO_REPORT: VerificationReport = {
  trust_score: 42,
  raw_response:
    'Aspirin is completely safe to cure acute viral infections in infants. In older pediatric cohorts, standard fever control requires strict adherence to alternative antipyretics.',
  claims: [
    {
      text: 'Aspirin is completely safe to cure acute viral infections in infants.',
      status: 'CONTRADICTORY',
      reason: 'Aspirin is strongly contraindicated in infants and adolescents with viral infections due to established risk of Reye syndrome.',
      confidence: 0.94,
      evidence: [
        {
          text: 'Aspirin is contraindicated in pediatric patients with viral illnesses such as varicella or influenza due to its causal link to Reye syndrome, a life-threatening hepatic and cerebral condition.',
          source: 'CDC Pediatric Antipyretic Guidelines / PubMed ID: 294021',
          label: 'CONTRADICTORY'
        },
        {
          text: 'The FDA has issued black box warnings against administering acetylsalicylic acid formulations to infants exhibiting acute febrile viral symptoms.',
          source: 'FDA Drug Safety Communication / Ref: CDER-0941',
          label: 'CONTRADICTORY'
        }
      ]
    },
    {
      text: 'In older pediatric cohorts, standard fever control requires strict adherence to alternative antipyretics.',
      status: 'VERIFIED',
      reason: 'Acetaminophen and ibuprofen are the verified first-line antipyretics in pediatric fever management guidelines.',
      confidence: 0.89,
      evidence: [
        {
          text: 'First-line recommended antipyretic pharmacotherapies in pediatric populations are weight-based acetaminophen or ibuprofen, avoiding salicylates.',
          source: 'American Academy of Pediatrics (AAP) Clinical Report',
          label: 'SUPPORT'
        }
      ]
    }
  ]
};

function App() {
  const [query, setQuery] = useState(PRESET_QUERIES[0].query);
  const [responseText, setResponseText] = useState(PRESET_QUERIES[0].response);
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 6000);
  };

  const handleVerify = async () => {
    setLoading(true);
    setReport(null);
    setSelectedClaim(null);
    try {
      const response = await axios.post('http://localhost:8000/api/verify/', {
        query,
        response_text: responseText
      });
      setReport(response.data);
      if (response.data.claims && response.data.claims.length > 0) {
        setSelectedClaim(response.data.claims[0]);
      }
    } catch {
      showNotification('Backend unreachable at localhost:8000. Displaying demonstration verification model.');
      setReport(SAMPLE_DEMO_REPORT);
      setSelectedClaim(SAMPLE_DEMO_REPORT.claims[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndVerify = async () => {
    setLoading(true);
    setReport(null);
    setSelectedClaim(null);
    try {
      const response = await axios.post('http://localhost:8000/api/generate-and-verify/', {
        query
      });
      setReport(response.data);
      setResponseText(response.data.raw_response);
      if (response.data.claims && response.data.claims.length > 0) {
        setSelectedClaim(response.data.claims[0]);
      }
    } catch {
      showNotification('Backend unreachable at localhost:8000. Generating fallback demonstration data.');
      setReport(SAMPLE_DEMO_REPORT);
      setResponseText(SAMPLE_DEMO_REPORT.raw_response);
      setSelectedClaim(SAMPLE_DEMO_REPORT.claims[0]);
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (item: (typeof PRESET_QUERIES)[0]) => {
    setQuery(item.query);
    setResponseText(item.response);
    setReport(null);
    setSelectedClaim(null);
  };

  const loadDemo = () => {
    setQuery(PRESET_QUERIES[0].query);
    setResponseText(SAMPLE_DEMO_REPORT.raw_response);
    setReport(SAMPLE_DEMO_REPORT);
    setSelectedClaim(SAMPLE_DEMO_REPORT.claims[0]);
  };

  // New handler for login button
  const handleLoginClick = () => {
    showNotification('Login button clicked');
  };

  // High-clarity semantic status badge rendering
  const renderStatusBadge = (status: Claim['status']) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified Grounding
          </span>
        );
      case 'CONTRADICTORY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Contradictory / Deceptive
          </span>
        );
      case 'UNVERIFIED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            Unverified
          </span>
        );
    }
  };

  // Semantic highlighting for inline claim text
  const getSentenceStyle = (claim: Claim, isSelected: boolean) => {
    const base = 'inline cursor-pointer transition-all duration-150 rounded px-1.5 py-0.5 my-0.5 leading-relaxed font-normal';
    switch (claim.status) {
      case 'VERIFIED':
        return isSelected
          ? `${base} bg-cyan-900/90 text-cyan-100 font-semibold ring-2 ring-cyan-400 border-b-2 border-cyan-500 shadow-neon-cyan`
          : `${base} bg-cyan-900/70 text-cyan-300 hover:bg-cyan-900/90 border-b-2 border-cyan-500`;
      case 'CONTRADICTORY':
        return isSelected
          ? `${base} bg-magenta-900/90 text-magenta-100 font-semibold ring-2 ring-magenta-400 border-b-2 border-magenta-500 shadow-neon-magenta`
          : `${base} bg-magenta-900/70 text-magenta-300 hover:bg-magenta-900/90 border-b-2 border-magenta-500`;
      case 'UNVERIFIED':
      default:
        return isSelected
          ? `${base} bg-indigo-900/90 text-indigo-100 font-semibold ring-2 ring-indigo-400 border-b-2 border-indigo-500 shadow-neon-indigo`
          : `${base} bg-indigo-900/70 text-indigo-300 hover:bg-indigo-900/90 border-b-2 border-indigo-500`;
    }
  };

  const verifiedCount = report ? report.claims.filter((c) => c.status === 'VERIFIED').length : 0;
  const contradictoryCount = report ? report.claims.filter((c) => c.status === 'CONTRADICTORY').length : 0;
  const unverifiedCount = report ? report.claims.filter((c) => c.status === 'UNVERIFIED').length : 0;

  // Dynamic color configuration for trust score
  const getScoreTheme = (score: number) => {
    if (score >= 75) {
      return {
        cardBg: 'bg-gradient-to-br from-cyan-900/80 via-indigo-900/60 to-purple-900/50 border border-cyan-700 shadow-neon-cyan glass-panel',
        scoreColor: 'text-cyan-400',
        barGradient: 'bg-gradient-to-r from-cyan-500 to-indigo-500',
        labelBadge: 'bg-cyan-800 text-cyan-300 border-cyan-700',
        labelText: 'High Clinical Grounding'
      };
    }
    if (score >= 50) {
      return {
        cardBg: 'bg-gradient-to-br from-magenta-900/80 via-purple-900/60 to-indigo-900/50 border border-magenta-700 shadow-neon-magenta glass-panel',
        scoreColor: 'text-magenta-400',
        barGradient: 'bg-gradient-to-r from-magenta-500 to-purple-500',
        labelBadge: 'bg-magenta-800 text-magenta-300 border-magenta-700',
        labelText: 'Moderate Grounding'
      };
    }
    return {
      cardBg: 'bg-gradient-to-br from-indigo-900/80 via-purple-900/60 to-blue-900/50 border border-indigo-700 shadow-neon-indigo glass-panel',
      scoreColor: 'text-indigo-400',
      barGradient: 'bg-gradient-to-r from-indigo-500 to-blue-500',
      labelBadge: 'bg-indigo-800 text-indigo-300 border-indigo-700',
      labelText: 'Potential Discrepancy / Deception Risk'
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-900 via-indigo-900 to-indigo-800 text-slate-200 flex flex-col font-sans selection:bg-indigo-700 selection:text-indigo-100">
      {/* Dynamic colorful navbar */}
      <header className="sticky top-0 z-30 bg-black/70 backdrop-blur-md border-b border-indigo-800/60 px-6 py-3.5 shadow-lg shadow-neon-indigo glass-panel">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-700 via-indigo-700 to-purple-700 text-white flex items-center justify-center shadow-lg shadow-neon-cyan">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-bold tracking-tight text-lg">
                  Health<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Verify</span>
                </span>
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-800 to-purple-800 text-indigo-300 border border-indigo-700 shadow-neon-indigo">
                  Clinical Verification Engine
                </span>
              </div>
              <p className="text-xs text-indigo-400 hidden sm:block">
                Explainable Healthcare Evidence & Clinical Deception Mitigation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadDemo}
              className="text-xs font-semibold text-indigo-300 hover:text-indigo-400 bg-black/40 hover:bg-indigo-900/40 border border-indigo-700 hover:border-indigo-500 px-3 py-1.5 rounded-full transition-all shadow-lg flex items-center gap-1.5 shadow-neon-indigo"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Load Sample Data</span>
            </button>

            {/* New Login Button */}
            <button
              onClick={handleLoginClick}
              className="text-xs font-semibold text-indigo-300 hover:text-indigo-400 bg-black/40 hover:bg-indigo-900/40 border border-indigo-700 hover:border-indigo-500 px-3 py-1.5 rounded-full transition-all shadow-lg flex items-center gap-1.5 shadow-neon-indigo"
            >
              <span>Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Graceful notification banner */}
      {notification && (
        <div className="max-w-7xl mx-auto w-full px-6 pt-3">
          <div className="bg-gradient-to-r from-magenta-900 to-cyan-900 border border-magenta-700 text-magenta-300 px-4 py-2.5 rounded-full text-xs flex items-center justify-between shadow-lg shadow-neon-magenta">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-magenta-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-magenta-400 hover:text-magenta-300 ml-3"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main split dashboard view */}
      <main className="max-w-7xl mx-auto w-full p-6 flex-grow flex flex-col lg:flex-row gap-6">
        {/* Left Panel: Clinical assertion studio */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="glass-panel p-6 flex flex-col flex-grow relative overflow-hidden">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 shadow-neon-purple" />

            <div className="mb-5">
              <h2 className="text-lg font-bold text-purple-300 flex items-center gap-2">
                Clinical Assertion Studio
              </h2>
              <p className="text-xs text-purple-400 mt-0.5">
                Supply clinical queries and AI-generated assertions to cross-reference against indexed ground truth.
              </p>
            </div>

            {/* Presets with colored pill-shaped tags */}
            <div className="mb-6">
              <label className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-3">
                Clinical Presets
              </label>
              <div className="flex flex-wrap gap-3">
                {PRESET_QUERIES.map((preset, idx) => {
                  const styleMap = [
                    'bg-magenta-700/40 hover:bg-magenta-600/60 text-magenta-300 border border-magenta-600 shadow-neon-magenta',
                    'bg-cyan-700/40 hover:bg-cyan-600/60 text-cyan-300 border border-cyan-600 shadow-neon-cyan',
                    'bg-indigo-700/40 hover:bg-indigo-600/60 text-indigo-300 border border-indigo-600 shadow-neon-indigo'
                  ];
                  return (
                    <button
                      key={idx}
                      onClick={() => loadPreset(preset)}
                      className={`text-xs px-4 py-1.5 rounded-full border transition-all font-semibold flex items-center gap-2 shadow-lg ${styleMap[idx % styleMap.length]}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current inline-block" />
                      {preset.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Medical Query Input */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-purple-300 mb-2">
                Target Medical Query
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-purple-700 rounded-3xl placeholder-purple-500 text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-inner transition"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. What is the efficacy of metformin in gestational diabetes?"
                />
                <Search className="w-5 h-5 text-purple-400 absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* AI Response Textarea */}
            <div className="mb-8 flex-grow flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-purple-300">
                  AI Assertion to Verify
                </label>
                <span className="text-[11px] text-purple-400 font-mono font-medium">
                  {responseText.length} chars
                </span>
              </div>
              <textarea
                className="w-full flex-grow p-4 bg-black/40 border border-purple-700 rounded-3xl placeholder-purple-500 text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-inner resize-y min-h-[180px] leading-relaxed transition"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Paste the generated assertion or response to evaluate..."
                rows={7}
              />
            </div>

            {/* Action buttons with vibrant gradient styling */}
            <div className="flex flex-col sm:flex-row gap-4 mt-auto pt-3">
              <button
                onClick={handleVerify}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-cyan-600 via-cyan-700 to-cyan-800 hover:from-cyan-700 hover:via-cyan-800 hover:to-cyan-900 active:scale-[0.98] text-white font-semibold py-4 px-6 rounded-full shadow-lg shadow-cyan-800/60 hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3 text-sm"
              >
                <ShieldCheck className="w-5 h-5 text-cyan-300" />
                <span>{loading ? 'Cross-Referencing...' : 'Verify Assertion'}</span>
              </button>

              <button
                onClick={handleGenerateAndVerify}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-magenta-600 via-magenta-700 to-magenta-800 hover:from-magenta-700 hover:via-magenta-800 hover:to-magenta-900 active:scale-[0.98] text-white font-semibold py-4 px-6 rounded-full shadow-lg shadow-magenta-800/60 hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3 text-sm"
              >
                <Sparkles className="w-5 h-5 text-magenta-300" />
                <span>Auto-Generate & Verify</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Verification view & explanation */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="glass-panel bg-black/30 backdrop-blur-lg border border-blue-700 rounded-3xl shadow-neon-blue transition-shadow p-6 flex flex-col flex-grow relative overflow-hidden">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-700 shadow-neon-blue" />

            {/* Empty state */}
            {!report && !loading && (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center p-6 text-blue-400">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-900 to-indigo-900 border border-blue-700 flex items-center justify-center mb-4 shadow-lg shadow-blue-900/80">
                  <FileText className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-base font-bold text-blue-200 mb-1">
                  Ready for Clinical Fact Checking
                </h3>
                <p className="text-xs max-w-sm mb-6 leading-relaxed">
                  Enter or select a medical assertion to decompose into atomic claims and cross-reference against trusted biomedical literature.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-md text-left">
                  <div className="p-4 bg-blue-900/70 border border-blue-700 rounded-2xl shadow-md shadow-blue-900/60 neon-glow-blue">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <Layers className="w-5 h-5" />
                      <span className="text-xs font-bold">1. Claim Extraction</span>
                    </div>
                    <div className="text-xs text-blue-300">Isolates individual factual assertions using NLP</div>
                  </div>
                  <div className="p-4 bg-cyan-900/70 border border-cyan-700 rounded-2xl shadow-md shadow-cyan-900/60 neon-glow-cyan">
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                      <Database className="w-5 h-5" />
                      <span className="text-xs font-bold">2. Hybrid Retrieval</span>
                    </div>
                    <div className="text-xs text-cyan-300">Dense MedCPT and sparse BM25 fusion</div>
                  </div>
                  <div className="p-4 bg-purple-900/70 border border-purple-700 rounded-2xl shadow-md shadow-purple-900/60 neon-glow-purple">
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                      <Cpu className="w-5 h-5" />
                      <span className="text-xs font-bold">3. NLI Classification</span>
                    </div>
                    <div className="text-xs text-purple-300">DeBERTa cross-encoder semantic inference</div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-blue-400 py-12">
                <div className="relative mb-5">
                  <div className="w-14 h-14 rounded-full border-4 border-blue-700 border-t-cyan-400 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-blue-300 mb-1">Evaluating Assertions</h4>
                <p className="text-xs max-w-xs text-center leading-relaxed">
                  Retrieving indexed biomedical facts and executing natural language inference...
                </p>
              </div>
            )}

            {/* Active Report View */}
            {report && (
              <div className="flex flex-col h-full space-y-6">
                {/* Dynamic colorful score & summary metrics bar */}
                {(() => {
                  const theme = getScoreTheme(report.trust_score);
                  return (
                    <div className={`${theme.cardBg} border rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all shadow-lg`}> 
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider block mb-1 text-indigo-300">
                          Trust & Evidence Index
                        </span>
                        <div className="flex items-baseline gap-3">
                          <span className={`${theme.scoreColor} text-4xl font-extrabold tracking-tight font-mono`}>{report.trust_score.toFixed(0)}%</span>
                          <span className={`${theme.labelBadge} text-xs font-semibold px-3 py-1 rounded-full border`}>{theme.labelText}</span>
                        </div>
                        {/* Dynamic colorful progress bar */}
                        <div className="w-56 bg-indigo-900/40 h-3 rounded-full overflow-hidden mt-3">
                          <div
                            className={`${theme.barGradient} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min(100, Math.max(0, report.trust_score))}%` }}
                          />
                        </div>
                      </div>

                      {/* Micro metric pills with vibrant distinct statuses */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="bg-cyan-900/70 border border-cyan-700 rounded-3xl px-4 py-3 text-center shadow-lg min-w-[70px] neon-glow-cyan">
                          <div className="font-bold text-cyan-400 font-mono text-lg">{verifiedCount}</div>
                          <div className="uppercase tracking-wider font-semibold text-cyan-300">Verified</div>
                        </div>
                        <div className="bg-magenta-900/70 border border-magenta-700 rounded-3xl px-4 py-3 text-center shadow-lg min-w-[70px] neon-glow-magenta">
                          <div className="font-bold text-magenta-400 font-mono text-lg">{contradictoryCount}</div>
                          <div className="uppercase tracking-wider font-semibold text-magenta-300">Contradictory</div>
                        </div>
                        <div className="bg-indigo-900/70 border border-indigo-700 rounded-3xl px-4 py-3 text-center shadow-lg min-w-[70px] neon-glow-indigo">
                          <div className="font-bold text-indigo-400 font-mono text-lg">{unverifiedCount}</div>
                          <div className="uppercase tracking-wider font-semibold text-indigo-300">Unverified</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Analyzed Response Sentence Explorer */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                      <span>Analyzed Response Text</span>
                      <span className="text-[11px] font-normal text-indigo-500">(Sentence-by-Sentence Breakdown)</span>
                    </label>
                    <span className="text-[11px] text-indigo-400 font-medium">Click sentences for evidence</span>
                  </div>
                  <div className="p-5 bg-black/30 rounded-3xl border border-indigo-700 text-indigo-300 text-sm leading-relaxed shadow-inner">
                    {report.claims.map((claim, idx) => {
                      const isSelected = selectedClaim?.text === claim.text;
                      return (
                        <span
                          key={idx}
                          className={getSentenceStyle(claim, isSelected)}
                          onClick={() => setSelectedClaim(claim)}
                          title={`Status: ${claim.status}`}
                        >
                          {claim.text}{' '}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation Drawer / Evidence Details */}
                {selectedClaim ? (
                  <div
                    className={`glass-panel border rounded-3xl p-5 shadow-lg space-y-6 mt-auto transition-all ${
                      selectedClaim.status === 'CONTRADICTORY'
                        ? 'border-magenta-700 shadow-neon-magenta'
                        : selectedClaim.status === 'VERIFIED'
                        ? 'border-cyan-700 shadow-neon-cyan'
                        : 'border-indigo-700 shadow-neon-indigo'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-indigo-700 pb-3">
                      <div className="flex items-center gap-4">
                        {renderStatusBadge(selectedClaim.status)}
                        <span className="text-xs font-semibold text-indigo-300 font-mono bg-black/40 px-3 py-1 rounded-2xl">
                          Confidence: {(selectedClaim.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedClaim(null)}
                        className="text-indigo-400 hover:text-indigo-200 p-2 rounded-full hover:bg-black/40 transition"
                        title="Dismiss details"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Target Claim Quote */}
                    <div
                      className={`text-sm p-4 rounded-3xl italic font-semibold ${
                        selectedClaim.status === 'CONTRADICTORY'
                          ? 'bg-magenta-900/60 border-l-8 border-magenta-600 text-magenta-300'
                          : selectedClaim.status === 'VERIFIED'
                          ? 'bg-cyan-900/60 border-l-8 border-cyan-600 text-cyan-300'
                          : 'bg-indigo-900/60 border-l-8 border-indigo-600 text-indigo-300'
                      }`}
                    >
                      "{selectedClaim.text}"
                    </div>

                    {/* Reason / Clinical Justification */}
                    {selectedClaim.reason && (
                      <div
                        className={`border rounded-3xl p-4 text-sm flex items-start gap-4 ${
                          selectedClaim.status === 'CONTRADICTORY'
                            ? 'bg-magenta-900/80 border-magenta-700 text-magenta-300'
                            : selectedClaim.status === 'VERIFIED'
                            ? 'bg-cyan-900/80 border-cyan-700 text-cyan-300'
                            : 'bg-indigo-900/80 border-indigo-700 text-indigo-300'
                        }`}
                      >
                        {selectedClaim.status === 'CONTRADICTORY' ? (
                          <AlertCircle className="w-6 h-6 text-magenta-400 shrink-0 mt-1" />
                        ) : selectedClaim.status === 'VERIFIED' ? (
                          <CheckCircle2 className="w-6 h-6 text-cyan-400 shrink-0 mt-1" />
                        ) : (
                          <Info className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                        )}
                        <div className="leading-relaxed">
                          <span className="font-bold">Clinical Evaluation: </span>
                          {selectedClaim.reason}
                        </div>
                      </div>
                    )}

                    {/* Retrieved Medical Ground Truth */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-indigo-300">
                          <span>Retrieved Medical Evidence</span>
                        </span>
                        <span className="text-[10px] font-semibold text-indigo-400 bg-black/40 px-3 py-1 rounded-full border border-indigo-700">
                          {selectedClaim.evidence.length} ground-truth passage(s)
                        </span>
                      </div>

                      {selectedClaim.evidence.length > 0 ? (
                        <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
                          {selectedClaim.evidence.map((ev, i) => {
                            const isContradiction = ev.label.toUpperCase() === 'CONTRADICTORY';
                            const isSupport = ev.label.toUpperCase() === 'SUPPORT';
                            return (
                              <div
                                key={i}
                                className={`transition-colors p-4 rounded-3xl border text-sm space-y-3 bg-black/40 border-opacity-40 ${
                                  isContradiction
                                    ? 'hover:bg-magenta-900/60 border-magenta-700/80 shadow-neon-magenta'
                                    : isSupport
                                    ? 'hover:bg-cyan-900/60 border-cyan-700/80 shadow-neon-cyan'
                                    : 'hover:bg-indigo-900/60 border-indigo-700/80 shadow-neon-indigo'
                                } shadow-lg`}
                              >
                                <p className="text-indigo-300 leading-relaxed font-normal">
                                  {ev.text}
                                </p>
                                <div className="flex items-center justify-between pt-2 border-t border-indigo-700 text-xs">
                                  <span className="text-blue-400 font-medium flex items-center gap-2 hover:text-blue-300 cursor-pointer">
                                    <ExternalLink className="w-4 h-4" />
                                    {ev.source}
                                  </span>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                                      isContradiction
                                        ? 'bg-magenta-800 text-magenta-300 border-magenta-700'
                                        : isSupport
                                        ? 'bg-cyan-800 text-cyan-300 border-cyan-700'
                                        : 'bg-indigo-800 text-indigo-300 border-indigo-700'
                                    }`}
                                  >
                                    {ev.label}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 bg-indigo-900/60 border border-indigo-700 rounded-3xl text-sm text-indigo-400 text-center">
                          No indexed ground truth passed the similarity threshold (threshold: 0.65).
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-indigo-700 rounded-3xl p-5 text-center text-sm text-indigo-400 mt-auto flex items-center justify-center gap-3">
                    <ArrowRight className="w-5 h-5 text-indigo-400" />
                    <span>Select any highlighted sentence above to inspect retrieved medical literature and NLI metrics.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Colorful healthcare footer */}
      <footer className="mt-auto border-t border-indigo-800 bg-black/70 backdrop-blur-sm px-6 py-4 text-center text-xs text-indigo-400 shadow-neon-indigo glass-panel">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block shadow-lg shadow-cyan-700/80" />
            <span>Explainable Healthcare Verification \u001f Natural Language Inference & Hybrid Retrieval</span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-900/70 border border-indigo-700 px-3 py-1 rounded-full shadow-lg">
            Biomedical AI Grounding Engine
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
