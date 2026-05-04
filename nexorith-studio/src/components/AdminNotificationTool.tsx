import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Send, Loader2, BellPlus, Users, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { teamService } from '../lib/services';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

export const AdminNotificationTool = () => {
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    target: 'global'
  });

  const { data: team = [] } = useQuery({
    queryKey: ['team'],
    queryFn: teamService.getTeam,
    enabled: isOpen && isAdmin
  });

  if (!isAdmin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await teamService.sendNotification(formData);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        setFormData({ title: '', message: '', type: 'info', target: 'global' });
      }, 2000);
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[90]">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="w-14 h-14 bg-brand-purple rounded-full flex items-center justify-center text-white shadow-2xl shadow-brand-purple/40 group overflow-hidden"
      >
        <BellPlus className="w-6 h-6 animate-pulse" />
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      </motion.button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass max-w-md w-full p-8 rounded-3xl border border-white/10 shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center">
                    <Send className="w-5 h-5 text-brand-purple" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">Send Global Update</h4>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Admin Notification Tool</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Title</label>
                    <input 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="E.g. System Maintenance"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Message</label>
                    <textarea 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all min-h-[100px] resize-none"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="What's happening?"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Type</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['info', 'success', 'warning', 'error'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormData({...formData, type: t as any})}
                          className={`py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                            formData.type === t 
                              ? 'bg-brand-purple border-brand-purple text-white' 
                              : 'bg-white/5 border-white/5 text-white/40'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Recipients</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all appearance-none cursor-pointer"
                      value={formData.target}
                      onChange={(e) => setFormData({...formData, target: e.target.value})}
                    >
                      <option value="global" className="bg-dark-bg text-white">Broadcast to All</option>
                      <optgroup label="Direct Message" className="bg-dark-bg text-white/60 text-[10px] uppercase font-bold">
                        {team.map((member: any) => (
                          <option key={member.uid || member.id} value={member.uid || member.id} className="bg-dark-bg text-white">
                            {member.displayName} ({member.role})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 h-12 rounded-xl text-white/40 font-bold text-sm hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={loading || success}
                      className="flex-[2] h-12 bg-brand-purple rounded-xl text-white font-bold text-sm shadow-lg shadow-brand-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? 'Sent!' : 'Send Alert'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
