import React from 'react';
import { ClientTable } from '../components/ClientTable';

export const ClientsPage = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Clients</h1>
          <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-bold mt-1">Manage your active client base</p>
        </div>
      </header>
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
        <ClientTable />
      </div>
    </div>
  );
};
