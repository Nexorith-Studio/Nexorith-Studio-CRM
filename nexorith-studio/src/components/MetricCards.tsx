import React from 'react';
import { TrendingUp, Users, Wallet, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { leadsService, clientService } from '../lib/services';

export const MetricCards = () => {
  const { data: leads = [] } = useQuery({ queryKey: ['leads'], queryFn: () => leadsService.getLeads() });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientService.getClients });

  const totalRevenue = leads
    .filter(l => l.status === 'Closed Won')
    .reduce((acc, lead) => acc + parseInt(lead.value?.replace(/[^0-9]/g, '') || '0'), 0);

  const conversionRate = leads.length > 0 
    ? ((leads.filter(l => l.status === 'Closed Won').length / leads.length) * 100).toFixed(1)
    : '0';

  const stats = [
    { 
      label: 'Total Leads', 
      value: leads.length.toString(), 
      change: '+100%', 
      trend: 'up', 
      color: 'from-purple-500/20' 
    },
    { 
      label: 'Active Clients', 
      value: clients.length.toString(), 
      change: '+100%', 
      trend: 'up', 
      color: 'from-blue-500/20' 
    },
    { 
      label: 'Total Revenue', 
      value: `$${(totalRevenue / 1000).toFixed(1)}k`, 
      change: '+100%', 
      trend: 'up', 
      color: 'from-green-500/20' 
    },
    { 
      label: 'Conversion Rate', 
      value: `${conversionRate}%`, 
      change: 'stable', 
      trend: 'up', 
      color: 'from-orange-500/20' 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass rounded-xl p-4 relative overflow-hidden group border border-white/5 bg-white/[0.02]"
        >
          <div className="flex flex-col relative z-10">
            <span className="text-[11px] uppercase tracking-[0.05em] text-white/50 mb-2 font-semibold">{stat.label}</span>
            <div className="flex items-end gap-3">
              <h3 className="text-2xl font-bold text-white tracking-tight leading-none">{stat.value}</h3>
              <span className={`text-[11px] font-bold mb-0.5 ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {stat.label === 'Conversion Rate' ? 'stable' : '↑ 100%'}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
