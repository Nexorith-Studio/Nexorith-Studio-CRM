import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Calendar, Target, History, File as FileIcon, ExternalLink, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LeadStatus, Lead } from '../types';
import { leadsService, teamService } from '../lib/services';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { AuditLog } from './AuditLog';
import { FileUpload } from './FileUpload';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStatus?: LeadStatus;
  initialData?: Lead | null;
}

export const LeadModal = ({ isOpen, onClose, initialStatus = 'New Lead', initialData = null }: LeadModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'audit' | 'docs'>('details');
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    value: '',
    status: initialStatus,
    followUpDate: '',
  });

  const [documents, setDocuments] = useState<{ name: string; url: string; uploadedAt: string }[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        company: initialData.company || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        value: initialData.value || '',
        status: initialData.status || initialStatus,
        followUpDate: initialData.followUpDate || '',
      });
      setDocuments(initialData.documents || []);
    } else {
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        value: '',
        status: initialStatus,
        followUpDate: '',
      });
      setDocuments([]);
    }
  }, [initialData, initialStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      if (initialData) {
        await leadsService.updateLead(initialData.id, { ...formData, documents });
      } else {
        await leadsService.addLead({
          ...formData,
          documents,
          assignedTo: user.uid,
          notes: []
        });
        
        await teamService.sendNotification({
          title: 'New Lead Added',
          message: `${formData.name} from ${formData.company} has been added to the pipeline.`,
          type: 'success',
          target: 'global'
        });
      }

      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onClose();
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Failed to save lead. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (url: string, name: string) => {
    const newDoc = { name, url, uploadedAt: new Date().toISOString() };
    const updatedDocs = [...documents, newDoc];
    setDocuments(updatedDocs);
    // If in edit mode, save immediately
    if (initialData) {
      leadsService.updateLead(initialData.id, { documents: updatedDocs });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  };

  const removeDocument = (index: number) => {
    const updatedDocs = documents.filter((_, i) => i !== index);
    setDocuments(updatedDocs);
    if (initialData) {
      leadsService.updateLead(initialData.id, { documents: updatedDocs });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#0A0A0F] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02] flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex bg-white/5 rounded-lg p-1">
                  <button 
                    onClick={() => setActiveTab('details')}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${activeTab === 'details' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'text-white/40 hover:text-white'}`}
                  >
                    Details
                  </button>
                  <button 
                    onClick={() => setActiveTab('docs')}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${activeTab === 'docs' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'text-white/40 hover:text-white'}`}
                  >
                    Vault
                  </button>
                  {initialData && (
                    <button 
                      onClick={() => setActiveTab('audit')}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${activeTab === 'audit' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'text-white/40 hover:text-white'}`}
                    >
                      Audit
                    </button>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-tight">{initialData ? 'Update Entity' : 'New Acquisition'}</h3>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {activeTab === 'details' ? (
                <form id="lead-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Contact Name</label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Company</label>
                      <input
                        required
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
                        placeholder="Acme Inc"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Est. Value</label>
                      <input
                        type="text"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
                        placeholder="$5,000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Current Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all appearance-none cursor-pointer"
                      >
                        <option value="New Lead" className="bg-dark-bg">New Lead</option>
                        <option value="Contacted" className="bg-dark-bg">Contacted</option>
                        <option value="Proposal Sent" className="bg-dark-bg">Proposal Sent</option>
                        <option value="Closed Won" className="bg-dark-bg">Closed Won</option>
                        <option value="Closed Lost" className="bg-dark-bg">Closed Lost</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <Calendar className="w-3 h-3" /> Next Follow-up
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-purple transition-all"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 h-12 rounded-xl text-white/40 font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] h-12 bg-brand-purple rounded-xl text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-purple/20 hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : initialData ? 'Save Changes' : 'Acquire Lead'}
                    </button>
                  </div>
                </form>
              ) : activeTab === 'docs' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <FileUpload 
                    path={`leads/${initialData?.id || 'temp'}/docs`}
                    onUploadComplete={handleFileUpload}
                  />

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] ml-1">Secured Files</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {documents.length === 0 ? (
                        <div className="p-12 text-center text-white/5 italic text-sm border border-dashed border-white/5 rounded-2xl">
                          No sensitive documents in vault.
                        </div>
                      ) : (
                        documents.map((doc, idx) => (
                          <div key={idx} className="glass p-4 rounded-xl border border-white/5 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                <FileIcon className="w-4 h-4 text-brand-blue" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white max-w-[200px] truncate">{doc.name}</p>
                                <p className="text-[9px] text-white/30 uppercase tracking-tighter">
                                  Encrypted {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a 
                                href={doc.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-2 text-white/20 hover:text-brand-purple transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button 
                                onClick={() => removeDocument(idx)}
                                className="p-2 text-white/20 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <AuditLog entityId={initialData?.id} title={`History: ${initialData?.company}`} />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
