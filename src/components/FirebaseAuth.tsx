import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, User as UserIcon, Cpu, AlertTriangle } from 'lucide-react';

interface FirebaseAuthProps {
  onAuthSuccess: (user: User) => void;
  logo?: string | null;
}

const FirebaseAuth: React.FC<FirebaseAuthProps> = ({ onAuthSuccess, logo }) => {
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
        // Initialize user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          username: email.split('@')[0],
          full_name: '',
          avatar_url: null,
          message_count: 0,
          created_at: Date.now()
        });
        onAuthSuccess(userCredential.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mc-panel-dark border-4 border-black p-8 relative"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 mc-panel bg-[#ff6666] mb-4 flex items-center justify-center overflow-hidden">
              {logo ? (
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Cpu size={32} className="text-[#252535]" />
              )}
            </div>
            <h1 className="font-display text-2xl tracking-tight text-[#e0e0e0] pixel-text">
              WILDSTAR
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 mt-2 font-mono">
              {isLogin ? 'Access Protocol' : 'New Identity'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-widest opacity-40">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={14} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border-2 border-[#333333] p-2 pl-10 text-xs font-mono text-white focus:outline-none focus:border-[#ff3232]"
                  placeholder="builder@wildstar.io"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-widest opacity-40">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={14} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border-2 border-[#333333] p-2 pl-10 text-xs font-mono text-white focus:outline-none focus:border-[#ff3232]"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border-2 border-red-500/50 p-2 flex items-start gap-2"
                >
                  <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-mono text-red-400 leading-tight">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full mc-button mc-button-purple py-3 text-xs font-display tracking-widest mt-4"
            >
              {isLoading ? 'PROCESSING...' : (isLogin ? 'INITIALIZE' : 'REGISTER')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
            >
              {isLogin ? "Don't have an identity? Create one" : "Already have an identity? Access"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FirebaseAuth;
