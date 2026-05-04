import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Calendar, Target, User, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { taskService, teamService, leadsService, clientService } from '../lib/services';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TaskPriority, TaskStatus } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export const TaskModal = ({ isOpen, onClose, initialData }: TaskModalProps) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: (initialData?.priority as TaskPriority) || 'medium',
    status: (initialData?.status as TaskStatus) || 'todo',
    assignedTo: initialData?.assignedTo || '',
    relatedTo: initialData?.relatedTo || 'lead',
    relatedId: initialData?.relatedId || '',
    dueDate: initialData?.dueDate || ''
  });

  const { data: team = [] } = useQuery({
    queryKey: ['team'],
    queryFn: teamService.getTeam
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsService.getLeads()
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getClients()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData?.id) {
        await taskService.updateTask(initialData.id, formData);
      } else {
        await taskService.createTask(formData);
      }
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative flex flex-col max-h-[90vh]"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-purple via-brand-blue to-brand-purple z-10 flex-shrink-0" />
          
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-brand-purple" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">{initialData ? 'Edit Mission' : 'Plan New Mission'}</h4>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Task Management</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Task Title</label>
                <input 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="E.g. Finalize Brand Identity"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Description</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all min-h-[100px] resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="What needs to be done?"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1 flex items-center gap-2">
                  <User className="w-3 h-3" /> Assignee
                </label>
                <select 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all appearance-none cursor-pointer"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                >
                  <option value="" className="bg-dark-bg">Select Member</option>
                  {team.map((m: any) => (
                    <option key={m.uid} value={m.uid} className="bg-dark-bg">{m.displayName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Due Date
                </label>
                <input 
                  type="datetime-local"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Project Link</label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all appearance-none cursor-pointer"
                    value={formData.relatedTo}
                    onChange={(e) => setFormData({...formData, relatedTo: e.target.value as any})}
                  >
                    <option value="lead" className="bg-dark-bg">Lead</option>
                    <option value="client" className="bg-dark-bg">Client</option>
                  </select>
                  <select 
                    required
                    className="flex-[2] bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all appearance-none cursor-pointer"
                    value={formData.relatedId}
                    onChange={(e) => setFormData({...formData, relatedId: e.target.value})}
                  >
                    <option value="" className="bg-dark-bg">Select Entity</option>
                    {formData.relatedTo === 'lead' ? (
                      leads.map((l: any) => <option key={l.id} value={l.id} className="bg-dark-bg">{l.company}</option>)
                    ) : (
                      clients.map((c: any) => <option key={c.id} value={c.id} className="bg-dark-bg">{c.name}</option>)
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-1.5 ml-1">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {['low', 'medium', 'high'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({...formData, priority: p as any})}
                      className={`py-2 px-3 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                        formData.priority === p 
                          ? 'bg-brand-purple border-brand-purple text-white shadow-lg shadow-brand-purple/20' 
                          : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 flex gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 h-12 rounded-xl text-white/40 font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all text-center"
              >
                Cancel
              </button>
              <button 
                disabled={loading}
                className="flex-[2] h-12 bg-brand-purple rounded-xl text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : initialData ? 'Update Mission' : 'Launch Task'}
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
