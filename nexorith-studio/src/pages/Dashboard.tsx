import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MetricCards } from '../components/MetricCards';
import { LeadsPipeline } from '../components/LeadsPipeline';
import { ClientTable } from '../components/ClientTable';
import { TeamCollaboration } from '../components/TeamCollaboration';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { LeadModal } from '../components/LeadModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import { PermissionGate } from '../components/PermissionGate';

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white tracking-tight"
          >
            Welcome, {profile?.displayName || user?.email?.split('@')[0]}
          </motion.h1>
          <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-bold mt-1">
            Nexorith Studio Performance • {profile?.role || 'User'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-xs font-bold text-white/70 hover:bg-white/10 transition-all">
            Export Data
          </button>
          <PermissionGate permission="manage_leads">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-brand-purple rounded-lg text-xs font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              New Lead
            </button>
          </PermissionGate>
        </div>
      </header>

      <MetricCards />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Leads Pipeline</h2>
              <button 
                onClick={() => navigate('/leads')}
                className="text-[10px] font-bold text-white/30 hover:text-brand-purple transition-colors uppercase tracking-widest"
              >
                Full Pipeline →
              </button>
            </div>
            <LeadsPipeline onAddLead={() => setIsModalOpen(true)} />
          </section>
          
          <ClientTable />
        </div>

        <div className="space-y-6">
          <TeamCollaboration />
          <ActivityTimeline />
        </div>
      </div>

      <LeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
