import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;
import {
  ShieldCheck,
  Info,
  X,
  Database,
  Settings as SettingsIcon
} from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import SettingsPage from './SettingsPage';

// New stateless presentation components with explicit typing
interface DashboardContentProps {}

const DashboardContent: React.FC<DashboardContentProps> = () => {
  return (
    <div>
      {/* TODO: Replace with actual dashboard content */}
      <h2 className="text-xl font-semibold text-indigo-200 mb-4">Dashboard Content</h2>
      <p className="text-indigo-300">This is the actual dashboard content area.</p>
    </div>
  );
};

interface VerificationViewProps {}

const VerificationView: React.FC<VerificationViewProps> = () => {
  return (
    <div>
      {/* TODO: Replace with actual verification view content */}
      <h2 className="text-xl font-semibold text-blue-300 mb-4">Verification View</h2>
      <p className="text-blue-400">This is the actual verification view area.</p>
    </div>
  );
};

// Error boundary wrapper for dashboard content rendering
interface ErrorBoundaryProps {
  children: ReactNode;
  componentName: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Structured logging with contextual metadata
    console.error(`[Dashboard][${this.props.componentName}] Rendering error:`, {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      task_id: 'BTS-125410',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-500 font-semibold">
          Error loading {this.props.componentName}. Please try again later.
        </div>
      );
    }
    return this.props.children;
  }
}

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [notification, setNotification] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-900 via-indigo-900 to-indigo-800 text-slate-200 flex flex-col font-sans selection:bg-indigo-700 selection:text-indigo-100">
      {/* Dynamic colorful navbar */}
      <header className="sticky top-0 z-30 bg-black/70 backdrop-blur-md border-b border-indigo-800/60 px-6 py-3.5 shadow-lg shadow-neon-indigo glass-panel flex items-center justify-between">
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
            onClick={() => navigate('/settings')}
            title="Settings"
            aria-label="Settings"
            className="p-2 rounded-full hover:bg-indigo-700/50 transition-colors"
          >
            <SettingsIcon className="w-6 h-6 text-indigo-300 hover:text-indigo-400" />
          </button>

          <button
            onClick={() => {}}
            className="text-xs font-semibold text-indigo-300 hover:text-indigo-400 bg-black/40 hover:bg-indigo-900/40 border border-indigo-700 hover:border-indigo-500 px-3 py-1.5 rounded-full transition-all shadow-lg flex items-center gap-1.5 shadow-neon-indigo"
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Load Sample Data</span>
          </button>

          {onLogout ? (
            <button
              onClick={onLogout}
              className="text-xs font-semibold text-indigo-300 hover:text-indigo-400 bg-black/40 hover:bg-indigo-900/40 border border-indigo-700 hover:border-indigo-500 px-3 py-1.5 rounded-full transition-all shadow-lg flex items-center gap-1.5 shadow-neon-indigo"
            >
              Logout
            </button>
          ) : (
            <></>
          )}
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

            {/* Replace placeholder with actual dashboard content */}
            <ErrorBoundary componentName="DashboardContent">
              <DashboardContent />
            </ErrorBoundary>
          </div>
        </div>

        {/* Right Panel: Verification view & explanation */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="glass-panel bg-black/30 backdrop-blur-lg border border-blue-700 rounded-3xl shadow-neon-blue transition-shadow p-6 flex flex-col flex-grow relative overflow-hidden">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-700 shadow-neon-blue" />

            {/* Replace placeholder with actual verification view */}
            <ErrorBoundary componentName="VerificationView">
              <VerificationView />
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Theme state: 'light', 'dark', 'system'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'system';
    }
    return 'system';
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/auth/session/', { timeout: 3000 });
        setIsAuthenticated(response.data.authenticated);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // Apply theme globally and persist
  useEffect(() => {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8000/api/auth/logout/');
    } catch {
      // ignore errors
    }
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-midnight-900 via-indigo-900 to-indigo-800 text-slate-200">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-700 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage onLoginSuccess={handleLoginSuccess} />
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated ? <SettingsPage currentTheme={theme} setTheme={setTheme} /> : <Navigate to="/" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
