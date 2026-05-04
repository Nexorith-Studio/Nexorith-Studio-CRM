import React, { useState } from 'react';
import { User, Bell, Shield, Palette, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { updatePassword } from 'firebase/auth';

export const SettingsPage = () => {
  const { profile, user } = useAuth();
  const [name, setName] = useState(profile?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('Profile');
  
  // Security state
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    setSuccess(false);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: name,
        updatedAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user || !passwords.new) return;
    if (passwords.new !== passwords.confirm) {
      alert("Passwords do not match");
      return;
    }
    
    setLoading(true);
    try {
      await updatePassword(user, passwords.new);
      setSuccess(true);
      setPasswords({ new: '', confirm: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Update password error:', error);
      if (error.code === 'auth/requires-recent-login') {
        alert('Security Re-auth Required: Please logout and login again to change your password.');
      } else {
        alert('Password update failed: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-bold mt-1">Manage your account and preferences</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-1">
          {[
            { label: 'Profile', icon: User },
            { label: 'Notifications', icon: Bell },
            { label: 'Security', icon: Shield },
            { label: 'Appearance', icon: Palette },
          ].map((item) => (
            <button 
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-sm font-medium ${
                activeTab === item.label 
                  ? 'bg-brand-purple/10 text-brand-purple border border-brand-purple/20' 
                  : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
              {activeTab === item.label && <motion.div layoutId="setting-active" className="w-1.5 h-1.5 rounded-full bg-brand-purple" />}
            </button>
          ))}
        </aside>

        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'Profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass rounded-2xl border border-white/5 bg-white/[0.02] p-8"
              >
                <h3 className="text-lg font-bold text-white mb-6">Profile Information</h3>
                
                <div className="space-y-4 max-w-md">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-purple/20 to-brand-blue/20 border border-white/10 flex items-center justify-center overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name || user?.email}`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest tracking-tighter">Profile Avatar</p>
                      <span className="text-[10px] text-brand-purple font-medium">Auto-generated from name</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Display Name</label>
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Email Address</label>
                    <input 
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-white/40 cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-4 flex items-center gap-4">
                    <button 
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      className="px-6 py-3 bg-brand-purple rounded-xl text-sm font-bold text-white shadow-lg shadow-brand-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Changes
                    </button>
                    {success && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-green-400 text-xs font-bold"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Saved Successfully
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Security' && (
              <motion.div 
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass rounded-2xl border border-white/5 bg-white/[0.02] p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-brand-purple" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Security Settings</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Password & Protection</p>
                  </div>
                </div>
                
                <div className="space-y-4 max-w-md">
                  <div className="bg-brand-purple/5 border border-brand-purple/10 rounded-xl p-4 mb-6">
                    <p className="text-[11px] text-brand-purple font-medium leading-relaxed">
                      For your protection, changing your password may require a recent login session. If the request fails, please logout and login again.
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">New Password</label>
                    <input 
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Confirm New Password</label>
                    <input 
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="pt-4 flex items-center gap-4">
                    <button 
                      onClick={handleUpdatePassword}
                      disabled={loading || !passwords.new}
                      className="px-6 py-3 bg-brand-purple rounded-xl text-sm font-bold text-white shadow-lg shadow-brand-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Update Password
                    </button>
                    {success && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-green-400 text-xs font-bold"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Updated Successfully
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab !== 'Profile' && activeTab !== 'Security' && (
              <motion.div 
                key="other"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-64 flex items-center justify-center text-white/20 uppercase tracking-widest font-bold text-[10px]"
              >
                Module Coming Soon
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
