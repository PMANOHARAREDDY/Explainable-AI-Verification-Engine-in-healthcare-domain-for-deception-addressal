import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SettingsPageProps {
  currentTheme: string;
  setTheme: (theme: string) => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'zh', label: 'Chinese' },
];

export default function SettingsPage({ currentTheme, setTheme }: SettingsPageProps) {
  const navigate = useNavigate();

  // Tab state
  const [selectedTab, setSelectedTab] = useState('profile');

  // Profile state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('en');

  // Load user profile and preferences on mount
  useEffect(() => {
    // Simulate fetching user profile and preferences
    // TODO: Replace with real API calls
    const fetchProfile = async () => {
      try {
        const resp = await fetch('http://localhost:8000/api/user/profile', { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          setUsername(data.username || '');
          setLanguage(data.language || 'en');
          setTheme(data.theme || 'system');
        }
      } catch (e) {
        // ignore errors
      }
    };
    fetchProfile();
  }, [setTheme]);

  // Save profile updates
  const saveProfile = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/user/profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, language, theme: currentTheme }),
      });
      if (resp.ok) {
        alert('Profile updated successfully');
        setPassword(''); // clear password field
      } else {
        alert('Failed to update profile');
      }
    } catch (e) {
      alert('Error updating profile');
    }
  };

  // Handle theme change
  const onThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
  };

  // Handle language change
  const onLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  // Request data export
  const requestDataExport = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/user/data-export', {
        method: 'POST',
        credentials: 'include',
      });
      if (resp.ok) {
        alert('Data export request submitted. You will receive an email shortly.');
      } else {
        alert('Failed to submit data export request.');
      }
    } catch (e) {
      alert('Error submitting data export request.');
    }
  };

  // Request account deletion
  const requestAccountDeletion = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    try {
      const resp = await fetch('http://localhost:8000/api/user/delete-account', {
        method: 'POST',
        credentials: 'include',
      });
      if (resp.ok) {
        alert('Account deletion request submitted. You will be logged out.');
        // Redirect to landing page or logout
        navigate('/');
      } else {
        alert('Failed to submit account deletion request.');
      }
    } catch (e) {
      alert('Error submitting account deletion request.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-900 via-indigo-900 to-indigo-800 text-slate-200 flex flex-col font-sans selection:bg-indigo-700 selection:text-indigo-100">
      <header className="sticky top-0 z-30 bg-black/70 backdrop-blur-md border-b border-indigo-800/60 px-6 py-3.5 shadow-lg shadow-neon-indigo glass-panel flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-indigo-300 hover:text-indigo-400 font-semibold text-sm flex items-center gap-2"
          aria-label="Back to Dashboard"
        >
          1; Back to Dashboard
        </button>
        <h1 className="text-lg font-bold text-indigo-300">User Settings</h1>
        <div />
      </header>

      <main className="max-w-5xl mx-auto p-6 flex flex-col md:flex-row gap-6">
        {/* Sidebar navigation */}
        <nav className="w-full md:w-48 bg-black/30 backdrop-blur-lg border border-indigo-700 rounded-3xl shadow-neon-indigo p-4 flex flex-col gap-4">
          <button
            className={`text-indigo-300 font-semibold text-left ${selectedTab === 'profile' ? 'underline' : 'hover:text-indigo-400'}`}
            onClick={() => setSelectedTab('profile')}
            aria-current={selectedTab === 'profile' ? 'page' : undefined}
          >
            Profile
          </button>
          <button
            className={`text-indigo-300 font-semibold text-left ${selectedTab === 'appearance' ? 'underline' : 'hover:text-indigo-400'}`}
            onClick={() => setSelectedTab('appearance')}
            aria-current={selectedTab === 'appearance' ? 'page' : undefined}
          >
            Appearance
          </button>
          <button
            className={`text-indigo-300 font-semibold text-left ${selectedTab === 'preferences' ? 'underline' : 'hover:text-indigo-400'}`}
            onClick={() => setSelectedTab('preferences')}
            aria-current={selectedTab === 'preferences' ? 'page' : undefined}
          >
            Preferences
          </button>
          <button
            className={`text-indigo-300 font-semibold text-left ${selectedTab === 'privacy' ? 'underline' : 'hover:text-indigo-400'}`}
            onClick={() => setSelectedTab('privacy')}
            aria-current={selectedTab === 'privacy' ? 'page' : undefined}
          >
            Privacy & Legal
          </button>
        </nav>

        {/* Content area */}
        <section className="flex-grow bg-black/30 backdrop-blur-lg border border-indigo-700 rounded-3xl shadow-neon-indigo p-6">
          {selectedTab === 'profile' && (
            <>
              <h2 className="text-indigo-300 font-semibold text-lg mb-4">Profile Management</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveProfile();
                }}
                className="flex flex-col gap-4 max-w-md"
              >
                <label className="flex flex-col text-sm text-indigo-300">
                  Username
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 p-2 rounded bg-black/50 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </label>

                <label className="flex flex-col text-sm text-indigo-300">
                  New Password
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 p-2 rounded bg-black/50 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Leave blank to keep current password"
                  />
                </label>

                <button
                  type="submit"
                  className="self-start bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-semibold py-2 px-6 rounded-full shadow-lg transition-all"
                >
                  Save Profile
                </button>
              </form>
            </>
          )}

          {selectedTab === 'appearance' && (
            <>
              <h2 className="text-indigo-300 font-semibold text-lg mb-4">Appearance / Theme Settings</h2>
              <label className="flex flex-col text-sm text-indigo-300 max-w-xs">
                Select Theme
                <select
                  value={currentTheme}
                  onChange={onThemeChange}
                  className="mt-1 p-2 rounded bg-black/50 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                  <option value="system">System Default</option>
                </select>
              </label>
            </>
          )}

          {selectedTab === 'preferences' && (
            <>
              <h2 className="text-indigo-300 font-semibold text-lg mb-4">Language & Localization</h2>
              <label className="flex flex-col text-sm text-indigo-300 max-w-xs">
                Preferred Language
                <select
                  value={language}
                  onChange={onLanguageChange}
                  className="mt-1 p-2 rounded bg-black/50 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {selectedTab === 'privacy' && (
            <>
              <h2 className="text-indigo-300 font-semibold text-lg mb-4">Privacy & Legal</h2>
              <div className="flex flex-col gap-4 max-w-md">
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 hover:text-indigo-400 underline"
                >
                  Privacy Policy
                </a>
                <a
                  href="/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 hover:text-indigo-400 underline"
                >
                  Terms of Service
                </a>

                <button
                  onClick={requestDataExport}
                  className="bg-gradient-to-r from-cyan-600 to-indigo-700 hover:from-cyan-700 hover:to-indigo-800 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition-all"
                >
                  Request Data Export
                </button>

                <button
                  onClick={requestAccountDeletion}
                  className="bg-gradient-to-r from-rose-600 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition-all"
                >
                  Delete Account
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
