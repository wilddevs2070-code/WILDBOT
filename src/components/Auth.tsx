import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const Snowfall = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="snowflake"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${Math.random() * 5 + 5}s, ${Math.random() * 2 + 2}s`,
            opacity: Math.random() * 0.5 + 0.3,
            fontSize: `${Math.random() * 15 + 10}px`
          }}
        >
          {['❄', '❅', '❆'][Math.floor(Math.random() * 3)]}
        </div>
      ))}
    </div>
  );
};

interface AuthProps {
  onAuthSuccess: (user: any) => void;
  logo?: string | null;
}

export default function Auth({ onAuthSuccess, logo }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden mc-dirt scanlines">
      <Snowfall />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="inline-flex items-center justify-center w-24 h-24 mc-panel mb-6 overflow-hidden bg-[#151525]/80 group">
            {logo && logo !== "" ? (
              <img src={logo} alt="WILDSTAR Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <Cpu size={48} className="text-[#ff6666] animate-pulse" />
            )}
          </div>
          <h1 className="text-5xl font-display text-white pixel-text mb-3 tracking-tighter">
            WILDSTAR
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-0.5 w-8 bg-[#ff6666]/30" />
            <p className="text-[#ff6666] text-[10px] font-display uppercase tracking-[0.3em] pixel-text">
              Ice Protocol
            </p>
            <div className="h-0.5 w-8 bg-[#ff6666]/30" />
          </div>
        </div>

        <div className="mc-panel p-8 bg-[#151525]/95 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500 delay-200">
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={cn(
                "mc-button flex-1 py-3",
                isLogin ? "mc-button-green" : "opacity-70"
              )}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={cn(
                "mc-button flex-1 py-3",
                !isLogin ? "mc-button-green" : "opacity-70"
              )}
            >
              Join
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-display text-white/40 uppercase tracking-widest ml-1">Builder ID</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff6666]/40 group-focus-within:text-[#ff6666] transition-colors" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mc-input pl-12"
                  placeholder="steve@craft.com"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-display text-white/40 uppercase tracking-widest ml-1">Access Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff6666]/40 group-focus-within:text-[#ff6666] transition-colors" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mc-input pl-12"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="mc-panel bg-[#AA0000] border-[#FF5555] text-white text-[10px] py-3 px-4 font-display uppercase tracking-wider animate-in shake duration-300">
                <span className="text-[#FFFF55] mr-2">[!]</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mc-button mc-button-blue py-5 text-sm flex items-center justify-center gap-3 group"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-white animate-bounce shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]" />
                  <div className="w-4 h-4 bg-white animate-bounce [animation-delay:0.2s] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]" />
                  <span className="font-display">Connecting...</span>
                </div>
              ) : (
                <>
                  <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                  <span className="font-display">{isLogin ? 'Enter World' : 'Create Character'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-500">
          <p className="text-white/20 text-[8px] font-display uppercase tracking-[0.5em]">
            Wildstar_Ice_System_v2.0.0
          </p>
          <div className="flex gap-6">
            <div className="w-2 h-2 bg-[#ff6666] animate-pulse" />
            <div className="w-2 h-2 bg-[#ff5555] animate-pulse [animation-delay:0.3s]" />
            <div className="w-2 h-2 bg-[#e0e0e0] animate-pulse [animation-delay:0.6s]" />
          </div>
        </div>
      </div>
    </div>
  );
}
