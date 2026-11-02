import { useState } from 'react';
import axios from 'axios';
import { ShieldCheck } from 'lucide-react';

export default function LandingPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        // Call backend login API
        const response = await axios.post('http://localhost:8000/api/auth/login/', { username, password });
        if (response.data.success) {
          onLoginSuccess();
        } else {
          setError(response.data.message || 'Login failed');
        }
      } else {
        // Call backend register API
        const response = await axios.post('http://localhost:8000/api/auth/register/', { username, password });
        if (response.data.success) {
          alert('Registration successful. Please login.');
          setIsLogin(true);
          setUsername('');
          setPassword('');
        } else {
          setError(response.data.message || 'Registration failed');
        }
      }
    } catch {
      setError('Server error. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-midnight-900 via-indigo-900 to-indigo-800 text-slate-200 p-6">
      <div className="max-w-md w-full bg-black/70 backdrop-blur-md border border-indigo-800 rounded-3xl p-8 shadow-lg shadow-neon-indigo">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-0.5 shadow-lg shadow-neon-cyan mb-3 flex items-center justify-center">
            <div className="w-full h-full bg-midnight-900 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            <span>HealthVerify</span>
            <span className="text-[10px] tracking-wider uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full font-semibold">
              Clinical AI
            </span>
          </h1>
          <p className="text-xs text-indigo-300 mt-1">Explainable Healthcare AI Verification Engine</p>
        </div>

        <h2 className="text-2xl font-bold mb-5 text-center text-slate-100">
          {isLogin ? 'Login' : 'Create Account'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col text-sm font-semibold">
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 p-2 rounded-md bg-black/40 border border-indigo-700 text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </label>
          <label className="flex flex-col text-sm font-semibold">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 p-2 rounded-md bg-black/40 border border-indigo-700 text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </label>
          {error && <div className="text-rose-400 text-sm font-semibold">{error}</div>}
          <button
            type="submit"
            className="mt-4 bg-gradient-to-r from-cyan-600 via-cyan-700 to-cyan-800 hover:from-cyan-700 hover:via-cyan-800 hover:to-cyan-900 text-white font-semibold py-3 rounded-full shadow-lg shadow-cyan-800/60 hover:shadow-xl transition-all duration-200"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <div className="mt-6 text-center text-indigo-300 text-sm">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                }}
                className="underline hover:text-indigo-400"
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError(null);
                }}
                className="underline hover:text-indigo-400"
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
