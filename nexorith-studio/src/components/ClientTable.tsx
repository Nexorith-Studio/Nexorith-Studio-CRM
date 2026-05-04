import React from 'react';
import { MoreVertical, Download, Filter } from 'lucide-react';
import { Client } from '../types';
import { useQuery } from '@tanstack/react-query';
import { clientService } from '../lib/services';

export const ClientTable = () => {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getClients
  });

  if (isLoading) {
    return <div className="glass rounded-xl h-64 animate-pulse" />;
  }

  return (
    <div className="glass rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">Active Clients ({clients.length})</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-3 text-[11px] font-medium text-white/40 uppercase tracking-widest">Client Name</th>
              <th className="px-6 py-3 text-[11px] font-medium text-white/40 uppercase tracking-widest">Status</th>
              <th className="px-6 py-3 text-[11px] font-medium text-white/40 uppercase tracking-widest">Team Member</th>
            </tr>
          </thead>
          <tbody className="text-[12px]">
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors">
                <td className="px-6 py-3.5 font-medium text-white/90">{client.name}</td>
                <td className="px-6 py-3.5">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                    client.status === 'Active' ? 'bg-green-500/10 text-green-400' :
                    client.status === 'Onboarding' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-white/5 text-white/40'
                  }`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-white/50">{client.teamMember}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-white/20 font-bold uppercase tracking-widest">No clients yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
