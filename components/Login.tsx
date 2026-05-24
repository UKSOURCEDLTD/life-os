import React, { useState } from 'react';
import { User } from '../types';
import { registerUser, authenticateUser } from '../utils/auth';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Artificial slight delay for "Real" feeling
    setTimeout(() => {
      if (mode === 'register') {
        if (!name || !email || !password) {
          setError("All fields are required.");
          setIsLoading(false);
          return;
        }
        const result = registerUser(name, email, password);
        if (typeof result === 'string') {
          setError(result);
        } else {
          onLogin(result);
        }
      } else {
        if (!email || !password) {
          setError("Email and password are required.");
          setIsLoading(false);
          return;
        }
        const result = authenticateUser(email, password);
        if (typeof result === 'string') {
          setError(result);
        } else {
          onLogin(result);
        }
      }
      setIsLoading(false);
    }, 800);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        id: 'google_user_123',
        name: 'Alex Stack',
        email: 'alex.performance@gmail.com',
        photoUrl: 'https://ui-avatars.com/api/?name=Alex+Stack&background=6366f1&color=fff',
        createdAt: new Date().toISOString()
      });
      setIsLoading(false);
    }, 1200);
  };

  const handleGuestLogin = () => {
    onLogin({
      id: 'guest_user_999',
      name: 'Guest User',
      email: 'guest@habitstack.io',
      isGuest: true,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-[500] bg-zinc-950 flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
      </div>

      <div className="w-full max-w-md relative animate-in fade-in slide-in-from-bottom-10 duration-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-2xl shadow-indigo-500/20 rotate-3 transition-transform hover:rotate-0">
             <svg className="w-10 h-10 text-zinc-950" fill="currentColor" viewBox="0 0 24 24">
               <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
             </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">Life OS</h1>
          <p className="text-zinc-600 font-bold uppercase tracking-[0.3em] text-[8px]">Personal Operating System</p>
        </div>

        <div className="glass p-8 sm:p-10 rounded-[2.5rem] border border-zinc-800/50 shadow-3xl">
          <div className="flex gap-4 mb-8 border-b border-zinc-800 pb-2">
            <button 
              onClick={() => setMode('login')}
              className={`pb-2 text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'text-white border-b-2 border-indigo-500' : 'text-zinc-600'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setMode('register')}
              className={`pb-2 text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'register' ? 'text-white border-b-2 border-indigo-500' : 'text-zinc-600'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase p-3 rounded-xl animate-in shake duration-300">
                {error}
              </div>
            )}
            
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-600 uppercase ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-black text-zinc-600 uppercase ml-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                placeholder="alex@stack.io"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-zinc-600 uppercase ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 active:scale-95 transition-all shadow-xl shadow-indigo-500/10 disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                mode === 'login' ? 'Establish Connection' : 'Register Protocol'
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
            <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest"><span className="bg-zinc-950 px-4 text-zinc-700">OAuth Alternative</span></div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white text-zinc-950 px-6 py-3 rounded-xl font-bold text-xs transition-all active:scale-[0.98] hover:shadow-xl disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54(c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button 
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full text-zinc-600 hover:text-zinc-400 py-2 font-black text-[8px] uppercase tracking-widest transition-colors disabled:opacity-30"
            >
              Anonymous Access
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
           <p className="text-[8px] font-black uppercase tracking-widest text-zinc-800 leading-relaxed">
             Persistence active in local environment<br />
             Multi-Account Support Enabled
           </p>
        </div>
      </div>
    </div>
  );
};

export default Login;