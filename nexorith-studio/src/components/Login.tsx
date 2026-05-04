import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { LogIn, Lock, Mail, Users } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled in Firebase. Please enable it in the console.');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSeedAdmin = async () => {
    setLoading(true);
    try {
      // This is for demonstration/initial setup
      const res = await createUserWithEmailAndPassword(auth, 'admin@nexorith.com', '12345678');
      await setDoc(doc(db, 'users', res.user.uid), {
        uid: res.user.uid,
        email: 'admin@nexorith.com',
        role: 'Admin',
        displayName: 'System Admin',
        avatar: 'Admin',
        createdAt: new Date().toISOString()
      });
      alert('Admin account seeded successfully! You can now login.');
    } catch (err: any) {
      setError(err.message || 'Failed to seed admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/20 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-blue/20 blur-[150px] rounded-full animate-pulse decoration-brand-blue" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md p-8 rounded-3xl relative z-10 border border-white/10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-purple to-brand-blue rounded-2xl flex items-center justify-center shadow-lg shadow-brand-purple/20 mb-4">
             <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Nexorith Studio</h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to manage your studio</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple/50 transition-all font-medium"
                placeholder="admin@nexorith.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple/50 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs font-medium bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-brand-purple text-white rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">Development Tools</p>
          <button 
            onClick={handleSeedAdmin}
            className="text-[11px] font-bold text-brand-blue hover:text-brand-purple transition-all flex items-center gap-2 group"
          >
             <Users className="w-3 h-3 group-hover:animate-bounce" />
             Initialize Admin Account (First time only)
          </button>
        </div>
      </motion.div>
    </div>
  );
};
