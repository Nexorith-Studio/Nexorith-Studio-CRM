import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { LeadsPipeline } from '../components/LeadsPipeline';
import { LeadModal } from '../components/LeadModal';
import { Lead } from '../types';

export const LeadsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterType, setFilterType] = useState<'my' | 'all'>('all');

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLead(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Leads Pipeline</h1>
          <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-bold mt-1">Manage and track your potential clients</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setFilterType('my')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${filterType === 'my' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'text-white/40 hover:text-white'}`}
            >
              My Leads
            </button>
            <button 
              onClick={() => setFilterType('all')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${filterType === 'all' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'text-white/40 hover:text-white'}`}
            >
              Team Leads
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-purple rounded-xl text-[10px] font-bold text-white uppercase tracking-widest shadow-lg shadow-brand-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Launch Lead
          </button>
        </div>
      </header>
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
        <LeadsPipeline 
          filterType={filterType} 
          onAddLead={(status) => setIsModalOpen(true)} 
          onEditLead={handleEditLead}
        />
      </div>

      <LeadModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        initialData={selectedLead}
      />
    </div>
  );
};
