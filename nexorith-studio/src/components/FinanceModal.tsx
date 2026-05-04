import React, { useState } from 'react';
import { X, Loader2, DollarSign, Tag, Calendar, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { financeService } from '../lib/financeService';

interface FinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FinanceModal: React.FC<FinanceModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await financeService.addTransaction({
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date)
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass max-w-md w-full p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative flex flex-col max-h-[90vh]"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-purple via-brand-blue to-brand-purple z-10" />
          
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-brand-purple" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Record Finance</h2>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">New Transaction</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex bg-white/5 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                    formData.type === 'income' ? 'bg-brand-purple text-white' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                    formData.type === 'expense' ? 'bg-red-500/80 text-white' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Expense
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Category</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all appearance-none"
                  >
                    <option value="" disabled className="bg-dark-bg">Select Category</option>
                    {formData.type === 'income' ? (
                      <>
                        <option value="Project Payment" className="bg-dark-bg">Project Payment</option>
                        <option value="Consulting" className="bg-dark-bg">Consulting</option>
                        <option value="Retainer" className="bg-dark-bg">Retainer</option>
                        <option value="Other" className="bg-dark-bg">Other</option>
                      </>
                    ) : (
                      <>
                        <option value="Software/SaaS" className="bg-dark-bg">Software/SaaS</option>
                        <option value="Marketing" className="bg-dark-bg">Marketing</option>
                        <option value="Freelancers" className="bg-dark-bg">Freelancers</option>
                        <option value="Office" className="bg-dark-bg">Office</option>
                        <option value="Other" className="bg-dark-bg">Other</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      required
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Description</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-4 h-4 text-white/20" />
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter details..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all min-h-[100px] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/5 text-white/60 text-xs font-bold hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] px-6 py-3 rounded-xl bg-brand-purple text-white text-xs font-bold hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
